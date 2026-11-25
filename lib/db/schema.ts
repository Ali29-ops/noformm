import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export type ProductSwatch = {
  id: string;
  hex: string;
  en: string;
  ar: string;
  image?: string;
  productImage?: string;
};

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;

export const products = sqliteTable(
  "products",
  {
    slug: text("slug").primaryKey(),
    collection: text("collection").notNull(),
    source: text("source", { enum: ["catalog", "custom"] }).notNull().default("custom"),
    sku: text("sku"),
    name: text("name"),
    nameAr: text("name_ar"),
    description: text("description"),
    descriptionAr: text("description_ar"),
    materials: text("materials", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    materialsAr: text("materials_ar", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    colorSwatches: text("color_swatches", { mode: "json" }).$type<ProductSwatch[] | "none">().notNull().default(sql`'[]'`),
    materialSwatches: text("material_swatches", { mode: "json" }).$type<ProductSwatch[] | "none">().notNull().default(sql`'[]'`),
    images: text("images", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    price: real("price").notNull().default(0),
    compareAtPrice: real("compare_at_price"),
    onHand: integer("on_hand").notNull().default(0),
    reserved: integer("reserved").notNull().default(0),
    readyToShip: integer("ready_to_ship", { mode: "boolean" }).notNull().default(false),
    madeToOrder: integer("made_to_order", { mode: "boolean" }).notNull().default(false),
    leadTimeDays: integer("lead_time_days"),
    widthCm: real("width_cm"),
    depthCm: real("depth_cm"),
    heightCm: real("height_cm"),
    weightKg: real("weight_kg"),
    care: text("care"),
    careAr: text("care_ar"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    floorX: real("floor_x"),
    floorY: real("floor_y"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => [index("products_collection_idx").on(t.collection)],
);

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().default(""),
  city: text("city").notNull().default(""),
  locale: text("locale").notNull().default("en"),
  passwordHash: text("password_hash").notNull(),
  salt: text("salt").notNull(),
  hashScheme: text("hash_scheme", { enum: ["scrypt", "legacy-sha256"] }).notNull().default("scrypt"),
  marketingOptIn: integer("marketing_opt_in", { mode: "boolean" }).notNull().default(false),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull().default(now),
  updatedAt: text("updated_at").notNull().default(now),
  lastLoginAt: text("last_login_at"),
});

export const addresses = sqliteTable(
  "addresses",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull(),
    label: text("label").notNull().default(""),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    phone2: text("phone2").notNull().default(""),
    country: text("country").notNull().default("EG"),
    governorate: text("governorate").notNull(),
    city: text("city").notNull(),
    area: text("area").notNull().default(""),
    street: text("street").notNull(),
    building: text("building").notNull().default(""),
    floor: text("floor").notNull().default(""),
    apartment: text("apartment").notNull().default(""),
    landmark: text("landmark").notNull().default(""),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("addresses_customer_idx").on(t.customerId)],
);

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    publicToken: text("public_token").notNull(),
    customerId: text("customer_id"),
    locale: text("locale").notNull().default("en"),
    currency: text("currency").notNull().default("EGP"),
    status: text("status", {
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
    })
      .notNull()
      .default("pending"),
    // unpaid → deposit_paid (order confirmed) → paid (balance settled)
    paymentStatus: text("payment_status", {
      enum: ["unpaid", "deposit_paid", "paid", "failed", "refunded", "partially_refunded"],
    })
      .notNull()
      .default("unpaid"),
    // How the deposit is paid. The balance is collected on delivery (cash) or by the same method.
    paymentMethod: text("payment_method", { enum: ["bank_transfer", "card"] })
      .notNull()
      .default("bank_transfer"),
    depositPercent: real("deposit_percent").notNull().default(50),
    depositAmount: real("deposit_amount").notNull().default(0),
    amountPaid: real("amount_paid").notNull().default(0),
    stockState: text("stock_state", { enum: ["reserved", "committed", "released"] })
      .notNull()
      .default("reserved"),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),
    shippingAddress: text("shipping_address", { mode: "json" }).$type<ShippingAddress>().notNull(),
    notes: text("notes").notNull().default(""),
    subtotal: real("subtotal").notNull(),
    shippingFee: real("shipping_fee").notNull().default(0),
    discount: real("discount").notNull().default(0),
    tax: real("tax").notNull().default(0),
    total: real("total").notNull(),
    couponCode: text("coupon_code"),
    paymentProvider: text("payment_provider"),
    providerOrderId: text("provider_order_id"),
    providerTransactionId: text("provider_transaction_id"),
    shippingProvider: text("shipping_provider"),
    trackingNumber: text("tracking_number"),
    trackingUrl: text("tracking_url"),
    adminNotes: text("admin_notes").notNull().default(""),
    cancelReason: text("cancel_reason"),
    expiresAt: text("expires_at"),
    paidAt: text("paid_at"),
    confirmedAt: text("confirmed_at"),
    shippedAt: text("shipped_at"),
    deliveredAt: text("delivered_at"),
    cancelledAt: text("cancelled_at"),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => [
    index("orders_customer_idx").on(t.customerId),
    index("orders_email_idx").on(t.customerEmail),
    index("orders_status_idx").on(t.status),
    index("orders_created_idx").on(t.createdAt),
  ],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: text("order_id").notNull(),
    productSlug: text("product_slug").notNull(),
    name: text("name").notNull(),
    nameAr: text("name_ar").notNull().default(""),
    collection: text("collection").notNull(),
    image: text("image").notNull().default(""),
    quantity: integer("quantity").notNull(),
    unitPrice: real("unit_price").notNull(),
    lineTotal: real("line_total").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const orderPayments = sqliteTable(
  "order_payments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: text("order_id").notNull(),
    kind: text("kind", { enum: ["deposit", "balance", "refund"] }).notNull(),
    method: text("method", { enum: ["bank_transfer", "instapay", "card", "cash"] }).notNull(),
    amount: real("amount").notNull(),
    reference: text("reference").notNull().default(""),
    note: text("note").notNull().default(""),
    recordedBy: text("recorded_by").notNull().default(""),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("order_payments_order_idx").on(t.orderId)],
);

export const orderEvents = sqliteTable(
  "order_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: text("order_id").notNull(),
    type: text("type").notNull(),
    message: text("message").notNull().default(""),
    actor: text("actor", { enum: ["customer", "admin", "system", "webhook"] }).notNull(),
    data: text("data", { mode: "json" }).$type<Record<string, unknown>>(),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("order_events_order_idx").on(t.orderId)],
);

export const enquiries = sqliteTable("enquiries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  collection: text("collection").notNull().default(""),
  piece: text("piece").notNull().default(""),
  message: text("message").notNull(),
  locale: text("locale").notNull().default("en"),
  status: text("status", { enum: ["new", "replied", "closed"] }).notNull().default("new"),
  adminNotes: text("admin_notes").notNull().default(""),
  repliedAt: text("replied_at"),
  createdAt: text("created_at").notNull().default(now),
  updatedAt: text("updated_at").notNull().default(now),
});

export const coupons = sqliteTable("coupons", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type", { enum: ["percent", "fixed"] }).notNull(),
  value: real("value").notNull(),
  minSubtotal: real("min_subtotal").notNull().default(0),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  startsAt: text("starts_at"),
  expiresAt: text("expires_at"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default(now),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).$type<unknown>().notNull(),
  updatedAt: text("updated_at").notNull().default(now),
});

export const shippingRates = sqliteTable("shipping_rates", {
  governorate: text("governorate").primaryKey(),
  fee: real("fee").notNull(),
  etaDays: text("eta_days").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const emails = sqliteTable(
  "emails",
  {
    id: text("id").primaryKey(),
    to: text("to").notNull(),
    subject: text("subject").notNull(),
    html: text("html").notNull(),
    text: text("text").notNull().default(""),
    template: text("template").notNull().default(""),
    status: text("status", { enum: ["queued", "sent", "failed", "logged"] }).notNull(),
    providerId: text("provider_id"),
    error: text("error"),
    attempts: integer("attempts").notNull().default(0),
    relatedType: text("related_type"),
    relatedId: text("related_id"),
    createdAt: text("created_at").notNull().default(now),
    sentAt: text("sent_at"),
  },
  (t) => [index("emails_created_idx").on(t.createdAt)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    kind: text("kind", { enum: ["customer", "admin"] }).notNull(),
    subjectId: text("subject_id").notNull(),
    expiresAt: text("expires_at").notNull(),
    userAgent: text("user_agent").notNull().default(""),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("sessions_subject_idx").on(t.subjectId)],
);

export const passwordResets = sqliteTable("password_resets", {
  tokenHash: text("token_hash").primaryKey(),
  customerId: text("customer_id").notNull(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at").notNull().default(now),
});

export const adminUsers = sqliteTable("admin_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  salt: text("salt").notNull(),
  role: text("role", { enum: ["owner", "staff"] }).notNull().default("owner"),
  createdAt: text("created_at").notNull().default(now),
  lastLoginAt: text("last_login_at"),
});

export const shopEvents = sqliteTable(
  "shop_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind", { enum: ["view", "add", "remove", "checkout"] }).notNull(),
    slug: text("slug").notNull(),
    visitor: text("visitor").notNull(),
    customerId: text("customer_id"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("shop_events_kind_idx").on(t.kind, t.createdAt), index("shop_events_slug_idx").on(t.slug)],
);

export const openCarts = sqliteTable("open_carts", {
  visitor: text("visitor").primaryKey(),
  customerId: text("customer_id"),
  lines: text("lines", { mode: "json" }).$type<CartLineJson[]>().notNull(),
  updatedAt: text("updated_at").notNull().default(now),
});

export type CartLineJson = { slug: string; quantity: number; color?: string; material?: string; size?: string };

export const auditLog = sqliteTable(
  "audit_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull().default(""),
    data: text("data", { mode: "json" }).$type<Record<string, unknown>>(),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

export type ShippingAddress = {
  name: string;
  phone: string;
  phone2?: string;
  country: string;
  governorate: string;
  city: string;
  area?: string;
  street: string;
  building?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
};

export type ProductRow = typeof products.$inferSelect;
export type CustomerRow = typeof customers.$inferSelect;
export type AddressRow = typeof addresses.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type OrderEventRow = typeof orderEvents.$inferSelect;
export type OrderPaymentRow = typeof orderPayments.$inferSelect;
export type PaymentKind = OrderPaymentRow["kind"];
export type PaymentRecordMethod = OrderPaymentRow["method"];
export type EnquiryRow = typeof enquiries.$inferSelect;
export type CouponRow = typeof coupons.$inferSelect;
export type EmailRow = typeof emails.$inferSelect;
export type AdminUserRow = typeof adminUsers.$inferSelect;
export type AuditRow = typeof auditLog.$inferSelect;
export type ShopEventRow = typeof shopEvents.$inferSelect;
export type OpenCartRow = typeof openCarts.$inferSelect;
export type ShippingRateRow = typeof shippingRates.$inferSelect;

export type OrderStatus = OrderRow["status"];
export type PaymentStatus = OrderRow["paymentStatus"];
export type PaymentMethod = OrderRow["paymentMethod"];
