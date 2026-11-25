import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { getDb, type Db } from "../db";
import {
  orderEvents,
  orderItems,
  orderPayments,
  orders,
  products,
  type OrderEventRow,
  type OrderItemRow,
  type OrderPaymentRow,
  type OrderRow,
  type OrderStatus,
  type PaymentKind,
  type PaymentMethod,
  type PaymentRecordMethod,
  type ShippingAddress,
} from "../db/schema";
import { nowIso, orderId as newOrderId, secretToken } from "../ids";
import { roundMoney } from "../money";
import { productCopy } from "../product-copy";
import { sizeLabel, sizesFor } from "../product-sizes";
import { colorName, materialName, resolveColors, resolveMaterials } from "../product-options";
import { computeTotals, shippingFeeFor } from "../pricing";
import { getSettings } from "../settings";
import { evaluateCoupon, getCouponByCode, incrementCouponUse } from "./coupons";
import { getProductsBySlugs } from "./products";

export type Order = OrderRow & { items: OrderItemRow[] };
export type OrderWithEvents = Order & { events: OrderEventRow[]; payments: OrderPaymentRow[] };

/** Money still owed on an order. */
export function balanceDue(order: Pick<OrderRow, "total" | "amountPaid">) {
  return roundMoney(Math.max(0, order.total - order.amountPaid));
}

/** Deposit still owed before the order can be confirmed. */
export function depositDue(order: Pick<OrderRow, "depositAmount" | "amountPaid">) {
  return roundMoney(Math.max(0, order.depositAmount - order.amountPaid));
}

/** What remains once the deposit is in — the figure to show as “balance on delivery”. */
export function balanceAfterDeposit(order: Pick<OrderRow, "total" | "depositAmount" | "amountPaid">) {
  return roundMoney(Math.max(0, order.total - Math.max(order.amountPaid, order.depositAmount)));
}

export function depositCovered(order: Pick<OrderRow, "depositAmount" | "amountPaid">) {
  return order.amountPaid + 0.005 >= order.depositAmount;
}

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export class StockError extends Error {
  slug: string;
  constructor(slug: string, name: string) {
    super(`Not enough pieces of ${name} in studio.`);
    this.slug = slug;
  }
}

async function reserveStock(tx: Tx, lines: { slug: string; quantity: number; name: string; madeToOrder: boolean }[]) {
  for (const line of lines) {
    if (line.madeToOrder) continue;
    const result = await tx
      .update(products)
      .set({ reserved: sql`${products.reserved} + ${line.quantity}` })
      .where(
        and(
          eq(products.slug, line.slug),
          sql`${products.onHand} - ${products.reserved} >= ${line.quantity}`,
        ),
      );
    if (result.rowsAffected === 0) throw new StockError(line.slug, line.name);
  }
}

async function commitStock(tx: Tx, items: OrderItemRow[]) {
  for (const item of items) {
    await tx
      .update(products)
      .set({
        onHand: sql`max(0, ${products.onHand} - ${item.quantity})`,
        reserved: sql`max(0, ${products.reserved} - ${item.quantity})`,
      })
      .where(and(eq(products.slug, item.productSlug), eq(products.madeToOrder, false)));
  }
}

async function releaseStock(tx: Tx, items: OrderItemRow[]) {
  for (const item of items) {
    await tx
      .update(products)
      .set({ reserved: sql`max(0, ${products.reserved} - ${item.quantity})` })
      .where(and(eq(products.slug, item.productSlug), eq(products.madeToOrder, false)));
  }
}

async function restock(tx: Tx, items: OrderItemRow[]) {
  for (const item of items) {
    await tx
      .update(products)
      .set({ onHand: sql`${products.onHand} + ${item.quantity}` })
      .where(and(eq(products.slug, item.productSlug), eq(products.madeToOrder, false)));
  }
}

async function addEvent(
  tx: Tx | Db,
  orderId: string,
  type: string,
  actor: OrderEventRow["actor"],
  message = "",
  data?: Record<string, unknown>,
) {
  await tx.insert(orderEvents).values({ orderId, type, actor, message, data });
}

async function attachItems(db: Db, rows: OrderRow[]): Promise<Order[]> {
  if (rows.length === 0) return [];
  const items = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, rows.map((r) => r.id)));
  return rows.map((row) => ({ ...row, items: items.filter((i) => i.orderId === row.id) }));
}

export async function listOrders(filter: { status?: OrderStatus | "open"; limit?: number } = {}) {
  const db = await getDb();
  let where;
  if (filter.status === "open") {
    where = inArray(orders.status, ["pending", "confirmed", "processing", "shipped"]);
  } else if (filter.status) {
    where = eq(orders.status, filter.status);
  }
  const rows = await db
    .select()
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(filter.limit ?? 500);
  return attachItems(db, rows);
}

export async function getOrder(id: string): Promise<OrderWithEvents | null> {
  const db = await getDb();
  const [row] = await db.select().from(orders).where(eq(orders.id, id));
  if (!row) return null;
  const [withItems] = await attachItems(db, [row]);
  const [events, payments] = await Promise.all([
    db
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.orderId, id))
      .orderBy(desc(orderEvents.createdAt), desc(orderEvents.id)),
    db.select().from(orderPayments).where(eq(orderPayments.orderId, id)).orderBy(orderPayments.createdAt, orderPayments.id),
  ]);
  return { ...withItems, events, payments };
}

export async function getOrderForCustomer(id: string, access: { token?: string; customerId?: string; email?: string }) {
  const order = await getOrder(id.trim().toUpperCase());
  if (!order) return null;
  if (access.token && access.token === order.publicToken) return order;
  if (access.customerId && order.customerId === access.customerId) return order;
  if (access.email && order.customerEmail === access.email.trim().toLowerCase()) return order;
  return null;
}

export async function getOrdersByCustomer(customerId: string, email: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(orders)
    .where(
      sql`${orders.customerId} = ${customerId} OR ${orders.customerEmail} = ${email.trim().toLowerCase()}`,
    )
    .orderBy(desc(orders.createdAt));
  return attachItems(db, rows);
}

/** Attach guest orders placed with this email to a newly created account. */
export async function claimGuestOrders(customerId: string, email: string) {
  const db = await getDb();
  await db
    .update(orders)
    .set({ customerId, updatedAt: nowIso() })
    .where(sql`${orders.customerId} IS NULL AND ${orders.customerEmail} = ${email.trim().toLowerCase()}`);
}

export async function getOrderCounts() {
  const db = await getDb();
  const rows = await db
    .select({ status: orders.status, paymentStatus: orders.paymentStatus, count: sql<number>`count(*)`, total: sql<number>`sum(${orders.total})` })
    .from(orders)
    .groupBy(orders.status, orders.paymentStatus);
  return rows;
}

export type CreateOrderInput = {
  locale: string;
  customerId?: string | null;
  customer: { name: string; email: string; phone: string };
  address: ShippingAddress;
  notes: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  lines: { slug: string; quantity: number; color?: string; material?: string; size?: string }[];
};

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const db = await getDb();
  const settings = await getSettings();
  const catalog = await getProductsBySlugs(input.lines.map((l) => l.slug));

  const lines = input.lines.map((line) => {
    const product = catalog.find((p) => p.slug === line.slug);
    if (!product || !product.active) throw new Error(`Piece ${line.slug} is no longer available.`);
    if (line.size && !sizesFor(line.slug).some((option) => option.id === line.size)) {
      throw new Error("Choose a valid size.");
    }
    const quantity = Math.max(1, Math.floor(line.quantity));
    const en = productCopy(product, "en");
    const ar = productCopy(product, "ar");
    const extrasEn = [
      sizeLabel(line.slug, line.size, "en"),
      materialName(line.material, "en", resolveMaterials(product)),
      colorName(line.color, "en", resolveColors(product)),
    ].filter(Boolean);
    const extrasAr = [
      sizeLabel(line.slug, line.size, "ar"),
      materialName(line.material, "ar", resolveMaterials(product)),
      colorName(line.color, "ar", resolveColors(product)),
    ].filter(Boolean);
    return {
      product,
      quantity,
      name: extrasEn.length ? `${en.name} · ${extrasEn.join(" · ")}` : en.name,
      nameAr: extrasAr.length ? `${ar.name} · ${extrasAr.join(" · ")}` : ar.name,
      unitPrice: product.price,
      lineTotal: Math.round(product.price * quantity * 100) / 100,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);

  let discount = 0;
  let couponCode: string | null = null;
  if (input.couponCode?.trim()) {
    const check = evaluateCoupon(await getCouponByCode(input.couponCode), subtotal);
    if (!check.ok) throw new Error(`Coupon cannot be applied (${check.reason.replace("_", " ")}).`);
    discount = check.discount;
    couponCode = check.coupon.code;
  }

  if (input.paymentMethod === "bank_transfer" && !settings.bankTransferEnabled)
    throw new Error("Bank transfer is not available.");

  const shippingFee = await shippingFeeFor(input.address.governorate, settings);
  const totals = computeTotals({ subtotal, shippingFee, discount, settings });

  const id = newOrderId();
  // Pieces are held while the deposit is awaited: a short window for card, a longer one for transfers.
  let expiresAt: string | null = null;
  if (input.paymentMethod === "card") {
    expiresAt = new Date(Date.now() + settings.cardReservationMinutes * 60_000).toISOString();
  } else if (settings.depositHoldHours > 0) {
    expiresAt = new Date(Date.now() + settings.depositHoldHours * 3_600_000).toISOString();
  }

  await db.transaction(async (tx) => {
    await reserveStock(
      tx,
      lines.map((l) => ({
        slug: l.product.slug,
        quantity: l.quantity,
        name: l.name,
        madeToOrder: l.product.madeToOrder,
      })),
    );
    await tx.insert(orders).values({
      id,
      publicToken: secretToken(18),
      customerId: input.customerId ?? null,
      locale: input.locale,
      currency: settings.currency,
      status: "pending",
      paymentStatus: "unpaid",
      paymentMethod: input.paymentMethod,
      depositPercent: totals.depositPercent,
      depositAmount: totals.depositAmount,
      amountPaid: 0,
      stockState: "reserved",
      customerName: input.customer.name,
      customerEmail: input.customer.email.trim().toLowerCase(),
      customerPhone: input.customer.phone,
      shippingAddress: input.address,
      notes: input.notes,
      subtotal: totals.subtotal,
      shippingFee: totals.shippingFee,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total,
      couponCode,
      expiresAt,
    });
    for (const l of lines) {
      await tx.insert(orderItems).values({
        orderId: id,
        productSlug: l.product.slug,
        name: l.name,
        nameAr: l.nameAr,
        collection: l.product.collection,
        image: l.product.images[0] ?? "",
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        lineTotal: l.lineTotal,
      });
    }
    await addEvent(tx, id, "placed", "customer", `Order placed · deposit ${totals.depositAmount} via ${input.paymentMethod}`);
  });
  if (couponCode) await incrementCouponUse(couponCode);

  return (await getOrder(id))!;
}

export const statusFlow: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return statusFlow[from].includes(to);
}

async function ensureCommitted(tx: Tx, order: Order) {
  if (order.stockState !== "reserved") return;
  await commitStock(tx, order.items);
  await tx.update(orders).set({ stockState: "committed" }).where(eq(orders.id, order.id));
}

export class DepositRequiredError extends Error {
  constructor(order: Pick<OrderRow, "depositAmount" | "amountPaid" | "currency">) {
    super(
      `The deposit has not been received. ${depositDue(order)} ${order.currency} is still due before this order can be confirmed.`,
    );
  }
}

export async function transitionOrder(
  id: string,
  to: OrderStatus,
  actor: OrderEventRow["actor"],
  extra: {
    message?: string;
    reason?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    shippingProvider?: string;
    /** When delivering: record the remaining balance as collected in cash. */
    collectBalance?: boolean;
    recordedBy?: string;
  } = {},
) {
  const db = await getDb();
  const order = await getOrder(id);
  if (!order) throw new Error("Order not found.");
  if (order.status === to) return order;
  if (!canTransition(order.status, to)) {
    throw new Error(`Cannot move an order from ${order.status} to ${to}.`);
  }
  // Nothing moves forward from "pending" without the deposit.
  if (order.status === "pending" && to !== "cancelled" && !depositCovered(order)) {
    throw new DepositRequiredError(order);
  }
  const at = nowIso();
  await db.transaction(async (tx) => {
    const patch: Partial<OrderRow> = { status: to, updatedAt: at };
    if (to === "confirmed") {
      patch.confirmedAt = at;
      patch.expiresAt = null;
      await ensureCommitted(tx, order);
    }
    if (to === "processing" || to === "shipped") {
      await ensureCommitted(tx, order);
    }
    if (to === "shipped") {
      patch.shippedAt = at;
      if (extra.trackingNumber !== undefined) patch.trackingNumber = extra.trackingNumber || null;
      if (extra.trackingUrl !== undefined) patch.trackingUrl = extra.trackingUrl || null;
      if (extra.shippingProvider !== undefined) patch.shippingProvider = extra.shippingProvider || null;
    }
    if (to === "delivered") {
      patch.deliveredAt = at;
      const due = balanceDue(order);
      if (extra.collectBalance && due > 0) {
        await tx.insert(orderPayments).values({
          orderId: id,
          kind: "balance",
          method: "cash",
          amount: due,
          note: "Collected on delivery",
          recordedBy: extra.recordedBy ?? "",
        });
        patch.amountPaid = roundMoney(order.amountPaid + due);
        patch.paymentStatus = "paid";
        patch.paidAt = at;
        await addEvent(tx, id, "payment:balance", actor, `Balance ${due} collected in cash on delivery`, { amount: due, method: "cash" });
      }
    }
    if (to === "cancelled") {
      patch.cancelledAt = at;
      patch.cancelReason = extra.reason ?? null;
      patch.expiresAt = null;
      if (order.stockState === "reserved") {
        await releaseStock(tx, order.items);
        patch.stockState = "released";
      } else if (order.stockState === "committed") {
        await restock(tx, order.items);
        patch.stockState = "released";
      }
    }
    await tx.update(orders).set(patch).where(eq(orders.id, id));
    await addEvent(tx, id, `status:${to}`, actor, extra.message ?? extra.reason ?? "", {
      from: order.status,
      to,
      ...(extra.trackingNumber ? { trackingNumber: extra.trackingNumber } : {}),
    });
  });
  return (await getOrder(id))!;
}

export type RecordPaymentInput = {
  kind: PaymentKind;
  method: PaymentRecordMethod;
  amount: number;
  reference?: string;
  note?: string;
  recordedBy?: string;
  provider?: string;
  providerOrderId?: string;
  providerTransactionId?: string;
};

export type RecordPaymentResult = {
  order: OrderWithEvents;
  /** True when this payment completed the deposit and moved the order from pending to confirmed. */
  confirmed: boolean;
  /** True when this payment settled the full total. */
  settled: boolean;
};

/**
 * Record money received (or refunded) against an order.
 * - A payment that covers the deposit confirms a pending order and commits stock.
 * - A payment that covers the total marks the order paid.
 * This is also the entry point for the Paymob webhook once card payments go live.
 */
export async function recordPayment(id: string, input: RecordPaymentInput, actor: OrderEventRow["actor"]): Promise<RecordPaymentResult> {
  const db = await getDb();
  const order = await getOrder(id);
  if (!order) throw new Error("Order not found.");
  if (order.status === "cancelled" && input.kind !== "refund") throw new Error("This order is cancelled.");
  const amount = roundMoney(Math.abs(input.amount));
  if (amount <= 0) throw new Error("Enter an amount greater than zero.");
  if (input.kind !== "refund" && amount > balanceDue(order) + 0.005) {
    throw new Error(`Only ${balanceDue(order)} ${order.currency} is still due on this order.`);
  }
  if (input.kind === "refund" && amount > order.amountPaid + 0.005) {
    throw new Error(`Only ${order.amountPaid} ${order.currency} has been paid on this order.`);
  }

  const at = nowIso();
  let confirmed = false;
  let settled = false;
  await db.transaction(async (tx) => {
    await tx.insert(orderPayments).values({
      orderId: id,
      kind: input.kind,
      method: input.method,
      amount: input.kind === "refund" ? -amount : amount,
      reference: input.reference ?? "",
      note: input.note ?? "",
      recordedBy: input.recordedBy ?? "",
    });

    const amountPaid = roundMoney(input.kind === "refund" ? order.amountPaid - amount : order.amountPaid + amount);
    const patch: Partial<OrderRow> = { amountPaid, updatedAt: at };
    if (input.provider !== undefined) patch.paymentProvider = input.provider;
    if (input.providerOrderId !== undefined) patch.providerOrderId = input.providerOrderId;
    if (input.providerTransactionId !== undefined) patch.providerTransactionId = input.providerTransactionId;

    if (input.kind === "refund") {
      patch.paymentStatus = amountPaid <= 0.005 ? "refunded" : "partially_refunded";
    } else {
      const next = { ...order, amountPaid };
      if (balanceDue(next) <= 0.005) {
        patch.paymentStatus = "paid";
        patch.paidAt = at;
        settled = true;
      } else if (depositCovered(next)) {
        patch.paymentStatus = "deposit_paid";
      }
      if (order.status === "pending" && depositCovered(next)) {
        patch.status = "confirmed";
        patch.confirmedAt = at;
        patch.expiresAt = null;
        await ensureCommitted(tx, order);
        confirmed = true;
      }
    }

    await tx.update(orders).set(patch).where(eq(orders.id, id));
    await addEvent(
      tx,
      id,
      `payment:${input.kind}`,
      actor,
      `${input.kind === "refund" ? "Refunded" : input.kind === "deposit" ? "Deposit received" : "Balance received"} · ${amount} ${order.currency} · ${input.method}${
        input.reference ? ` · ${input.reference}` : ""
      }`,
      { amount, method: input.method, reference: input.reference ?? "", paymentStatus: patch.paymentStatus },
    );
    if (confirmed) {
      await addEvent(tx, id, "status:confirmed", "system", "Deposit covered — order confirmed", { from: "pending", to: "confirmed" });
    }
  });
  return { order: (await getOrder(id))!, confirmed, settled };
}

/** Mark a card attempt as failed. Pending card orders are cancelled and their stock released. */
export async function markPaymentFailed(id: string, actor: OrderEventRow["actor"], message = "") {
  const db = await getDb();
  const order = await getOrder(id);
  if (!order) throw new Error("Order not found.");
  const at = nowIso();
  await db.transaction(async (tx) => {
    const patch: Partial<OrderRow> = { updatedAt: at };
    if (order.amountPaid <= 0.005) patch.paymentStatus = "failed";
    if (order.status === "pending" && order.paymentMethod === "card" && order.amountPaid <= 0.005) {
      patch.status = "cancelled";
      patch.cancelledAt = at;
      patch.cancelReason = "Payment failed";
      patch.expiresAt = null;
      if (order.stockState === "reserved") {
        await releaseStock(tx, order.items);
        patch.stockState = "released";
      }
    }
    await tx.update(orders).set(patch).where(eq(orders.id, id));
    await addEvent(tx, id, "payment:failed", actor, message, { from: order.paymentStatus, to: "failed" });
  });
  return (await getOrder(id))!;
}

export async function updateOrderMeta(
  id: string,
  patch: Partial<Pick<OrderRow, "adminNotes" | "trackingNumber" | "trackingUrl" | "shippingProvider" | "customerPhone" | "notes">> & {
    shippingAddress?: ShippingAddress;
  },
  actor: OrderEventRow["actor"] = "admin",
) {
  const db = await getDb();
  await db
    .update(orders)
    .set({ ...patch, updatedAt: nowIso() })
    .where(eq(orders.id, id));
  await addEvent(db, id, "updated", actor, "Order details updated", patch as Record<string, unknown>);
  return (await getOrder(id))!;
}

export async function addOrderNote(id: string, message: string, actor: OrderEventRow["actor"] = "admin") {
  const db = await getDb();
  await addEvent(db, id, "note", actor, message);
}

export async function expireStaleOrders() {
  const db = await getDb();
  const stale = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.status, "pending"),
        eq(orders.paymentStatus, "unpaid"),
        sql`${orders.expiresAt} IS NOT NULL`,
        lt(orders.expiresAt, nowIso()),
      ),
    );
  for (const row of stale) {
    await transitionOrder(row.id, "cancelled", "system", { reason: "Deposit was not received in time" });
  }
  return stale.length;
}

export async function recentEvents(limit = 50) {
  const db = await getDb();
  return db.select().from(orderEvents).orderBy(desc(orderEvents.createdAt), desc(orderEvents.id)).limit(limit);
}
