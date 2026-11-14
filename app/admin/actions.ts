"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  adminLogin,
  adminLogout,
  changeAdminPassword,
  createAdmin,
  deleteAdmin,
  requireAdmin,
  updateAdminProfile,
} from "@/lib/admin-auth";
import { collectionIds, type CollectionId } from "@/lib/catalog";
import {
  createProduct,
  deleteProduct,
  getProductBySlug,
  setOnHand,
  slugify,
  updateProduct,
  type ProductInput,
} from "@/lib/repo/products";
import {
  addOrderNote,
  getOrder,
  markPaymentFailed,
  recordPayment,
  transitionOrder,
  updateOrderMeta,
} from "@/lib/repo/orders";
import { updateEnquiry } from "@/lib/repo/enquiries";
import { createCoupon, deleteCoupon, updateCoupon } from "@/lib/repo/coupons";
import { updateCustomerProfile } from "@/lib/repo/customers";
import { getSettings, saveSettings, type StoreSettings } from "@/lib/settings";
import {
  bostaSizes,
  bostaTrackingUrl,
  createBostaDelivery,
  getBostaDelivery,
  type BostaSize,
} from "@/lib/shipping/bosta";
import { applyBostaState } from "@/lib/shipping/bosta-sync";
import { attemptDelivery } from "@/lib/email/send";
import { notifyOrderPlaced, notifyOrderStatus, notifyPaymentReceived } from "@/lib/email/notify";
import { audit } from "@/lib/repo/audit";
import { getDb } from "@/lib/db";
import { shippingRates, type OrderStatus, type PaymentKind, type PaymentRecordMethod } from "@/lib/db/schema";
import { governorateIds } from "@/lib/egypt";
import { parseSwatches } from "@/lib/product-options";
import { rateLimit } from "@/lib/rate-limit";
import {
  collectImageFiles,
  collectImageUrls,
  nextImageIndex,
  removeOwnedImage,
  removeProductMedia,
  saveUploadedImages,
} from "@/lib/product-media";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function num(formData: FormData, key: string): number | null {
  const raw = str(formData, key);
  if (raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function bool(formData: FormData, key: string) {
  const v = formData.get(key);
  return v === "on" || v === "true" || v === "1";
}

function list(raw: string) {
  return raw
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function refreshCatalog(collection: string, extra?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  for (const locale of ["en", "ar"]) {
    revalidatePath(`/${locale}/collections`);
    revalidatePath(`/${locale}/collections/${collection}`);
    if (extra && extra !== collection) revalidatePath(`/${locale}/collections/${extra}`);
  }
}

function refreshOrders(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/sales");
  revalidatePath("/admin/customers");
  if (id) revalidatePath(`/admin/orders/${id}`);
}

/* ---------------- auth ---------------- */

export async function loginAction(formData: FormData) {
  await rateLimit("admin-login", 8, 300);
  const email = str(formData, "email");
  const password = String(formData.get("password") ?? "");
  const user = await adminLogin(email, password);
  if (!user) redirect("/admin/login?error=1");
  await audit(user.email, "login", "admin", user.id);
  redirect("/admin");
}

export async function logoutAction() {
  await adminLogout();
  redirect("/admin/login");
}

export async function changeAdminPasswordAction(formData: FormData) {
  const admin = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "");
  if (next.length < 10) throw new Error("Use at least 10 characters.");
  await changeAdminPassword(admin.id, current, next);
  await audit(admin.email, "password.change", "admin", admin.id);
  return { ok: true as const };
}

export async function updateAdminProfileAction(formData: FormData) {
  const admin = await requireAdmin();
  await updateAdminProfile(admin.id, { name: str(formData, "name"), email: str(formData, "email") });
  await audit(admin.email, "profile.update", "admin", admin.id);
  revalidatePath("/admin/settings");
  return { ok: true as const };
}

export async function createAdminAction(formData: FormData) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") throw new Error("Only owners can add team members.");
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) throw new Error("Use at least 10 characters.");
  await createAdmin({
    name: str(formData, "name"),
    email: str(formData, "email"),
    password,
    role: str(formData, "role") === "owner" ? "owner" : "staff",
  });
  await audit(admin.email, "admin.create", "admin", str(formData, "email"));
  revalidatePath("/admin/settings");
  return { ok: true as const };
}

export async function deleteAdminAction(formData: FormData) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") throw new Error("Only owners can remove team members.");
  const id = str(formData, "id");
  await deleteAdmin(id, admin.id);
  await audit(admin.email, "admin.delete", "admin", id);
  revalidatePath("/admin/settings");
}

/* ---------------- products ---------------- */

function readProductInput(formData: FormData, images: string[]): ProductInput {
  const collection = str(formData, "collection") as CollectionId;
  if (!collectionIds.includes(collection)) throw new Error("Choose a collection.");
  return {
    collection,
    name: str(formData, "name"),
    nameAr: str(formData, "nameAr"),
    description: str(formData, "description"),
    descriptionAr: str(formData, "descriptionAr"),
    materials: list(str(formData, "materials")),
    materialsAr: list(str(formData, "materialsAr")),
    colorSwatches: parseSwatches(str(formData, "colorSwatches")),
    materialSwatches: parseSwatches(str(formData, "materialSwatches")),
    images,
    sku: str(formData, "sku"),
    price: num(formData, "price") ?? 0,
    compareAtPrice: num(formData, "compareAtPrice"),
    onHand: num(formData, "onHand") ?? 0,
    madeToOrder: bool(formData, "madeToOrder"),
    leadTimeDays: num(formData, "leadTimeDays"),
    widthCm: num(formData, "widthCm"),
    depthCm: num(formData, "depthCm"),
    heightCm: num(formData, "heightCm"),
    weightKg: num(formData, "weightKg"),
    care: str(formData, "care"),
    careAr: str(formData, "careAr"),
    active: bool(formData, "active"),
    floorX: num(formData, "floorX"),
    floorY: num(formData, "floorY"),
    sortOrder: num(formData, "sortOrder") ?? 0,
  };
}

export async function updateOnHandAction(formData: FormData) {
  const admin = await requireAdmin();
  const slug = str(formData, "slug");
  const onHand = num(formData, "onHand") ?? 0;
  await setOnHand(slug, onHand);
  await audit(admin.email, "stock.set", "product", slug, { onHand });
  revalidatePath("/admin");
  revalidatePath("/admin/products");
}

export async function addProductAction(formData: FormData) {
  const admin = await requireAdmin();
  const name = str(formData, "name");
  if (!name) throw new Error("Name is required.");
  const slug = slugify(name);
  if (await getProductBySlug(slug, { includeInactive: true })) {
    throw new Error("A product with this name already exists.");
  }
  const urls = collectImageUrls(str(formData, "imageUrls"));
  const uploaded = await saveUploadedImages(slug, collectImageFiles(formData), nextImageIndex(urls, slug));
  const input = readProductInput(formData, [...uploaded, ...urls]);
  await createProduct(slug, input);
  await audit(admin.email, "product.create", "product", slug);
  refreshCatalog(input.collection);
  redirect("/admin/products");
}

export async function updateProductAction(formData: FormData) {
  const admin = await requireAdmin();
  const slug = str(formData, "slug");
  const current = await getProductBySlug(slug, { includeInactive: true });
  if (!current) throw new Error("Product not found.");
  const kept = formData
    .getAll("keep")
    .map((value) => String(value))
    .filter((src) => current.images.includes(src));
  for (const src of current.images) {
    if (!kept.includes(src)) await removeOwnedImage(src, slug);
  }
  const urls = collectImageUrls(str(formData, "imageUrls"));
  const uploaded = await saveUploadedImages(slug, collectImageFiles(formData), nextImageIndex([...kept, ...urls], slug));
  const input = readProductInput(formData, [...kept, ...uploaded, ...urls]);
  await updateProduct(slug, input);
  await audit(admin.email, "product.update", "product", slug, { price: input.price, onHand: input.onHand, active: input.active });
  refreshCatalog(input.collection, current.collection);
  for (const locale of ["en", "ar"]) revalidatePath(`/${locale}/collections/${input.collection}/${slug}`);
  redirect("/admin/products");
}

export async function deleteProductAction(formData: FormData) {
  const admin = await requireAdmin();
  const slug = str(formData, "slug");
  const product = await getProductBySlug(slug, { includeInactive: true });
  if (!product) throw new Error("Product not found.");
  await deleteProduct(slug);
  await removeProductMedia(slug);
  await audit(admin.email, "product.delete", "product", slug);
  refreshCatalog(product.collection);
  redirect("/admin/products");
}

export async function toggleProductActiveAction(formData: FormData) {
  const admin = await requireAdmin();
  const slug = str(formData, "slug");
  const active = bool(formData, "active");
  const product = await updateProduct(slug, { active });
  await audit(admin.email, active ? "product.activate" : "product.deactivate", "product", slug);
  refreshCatalog(product.collection);
}

/* ---------------- orders ---------------- */

export async function orderTransitionAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const to = str(formData, "to") as OrderStatus;
  const order = await transitionOrder(id, to, "admin", {
    reason: str(formData, "reason") || undefined,
    trackingNumber: formData.has("trackingNumber") ? str(formData, "trackingNumber") : undefined,
    trackingUrl: formData.has("trackingUrl") ? str(formData, "trackingUrl") : undefined,
    shippingProvider: formData.has("shippingProvider") ? str(formData, "shippingProvider") : undefined,
    collectBalance: to === "delivered" ? bool(formData, "collectBalance") : undefined,
    recordedBy: admin.email,
    message: `${admin.name} moved the order to ${to}`,
  });
  await audit(admin.email, `order.${to}`, "order", id);
  if (bool(formData, "notify") || !formData.has("notify")) await notifyOrderStatus(order);
  refreshOrders(id);
}

/** Record a deposit, balance, or refund against an order. */
export async function orderPaymentAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const kind = str(formData, "kind") as PaymentKind;
  const method = (str(formData, "method") || "bank_transfer") as PaymentRecordMethod;
  const amount = num(formData, "amount");
  if (amount === null) throw new Error("Enter the amount received.");
  const result = await recordPayment(
    id,
    {
      kind,
      method,
      amount,
      reference: str(formData, "reference"),
      note: str(formData, "note"),
      recordedBy: admin.email,
    },
    "admin",
  );
  await audit(admin.email, `order.payment.${kind}`, "order", id, { amount, method });
  if (kind !== "refund") {
    await notifyPaymentReceived(result.order, { kind, amount, confirmed: result.confirmed, settled: result.settled });
  }
  refreshOrders(id);
}

export async function orderPaymentFailedAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  await markPaymentFailed(id, "admin", `${admin.name} marked the payment as failed`);
  await audit(admin.email, "order.payment.failed", "order", id);
  refreshOrders(id);
}

export async function orderMetaAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  await updateOrderMeta(id, {
    adminNotes: str(formData, "adminNotes"),
    trackingNumber: str(formData, "trackingNumber") || null,
    trackingUrl: str(formData, "trackingUrl") || null,
    shippingProvider: str(formData, "shippingProvider") || null,
    customerPhone: str(formData, "customerPhone") || undefined,
  });
  await audit(admin.email, "order.update", "order", id);
  refreshOrders(id);
}

export async function createBostaShipmentAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const order = await getOrder(id);
  if (!order) throw new Error("Order not found.");
  if (order.shippingProvider === "Bosta" && order.trackingNumber) {
    throw new Error(`This order already has Bosta shipment ${order.trackingNumber}.`);
  }
  const districtId = str(formData, "districtId");
  if (!districtId) throw new Error("Choose the Bosta district for this address.");
  const size = str(formData, "size") as BostaSize;
  const cod = num(formData, "cod") ?? 0;
  const { siteUrl } = await getSettings();
  const webhookUrl = siteUrl.startsWith("https://") ? `${siteUrl.replace(/\/$/, "")}/api/webhooks/bosta` : undefined;

  const delivery = await createBostaDelivery(order, {
    districtId,
    size: bostaSizes.includes(size) ? size : "LARGE",
    cod,
    notes: str(formData, "notes"),
    allowToOpenPackage: bool(formData, "allowToOpenPackage"),
    webhookUrl,
  });
  const shipped = await transitionOrder(id, "shipped", "admin", {
    shippingProvider: "Bosta",
    trackingNumber: delivery.trackingNumber,
    trackingUrl: bostaTrackingUrl(delivery.trackingNumber),
    recordedBy: admin.email,
    message: `${admin.name} created Bosta shipment ${delivery.trackingNumber} · COD ${cod} ${order.currency}`,
  });
  await audit(admin.email, "order.bosta.create", "order", id, { trackingNumber: delivery.trackingNumber, deliveryId: delivery._id, cod });
  if (bool(formData, "notify")) await notifyOrderStatus(shipped);
  refreshOrders(id);
}

export async function syncBostaAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const order = await getOrder(id);
  if (!order?.trackingNumber) throw new Error("This order has no Bosta tracking number.");
  const delivery = await getBostaDelivery(order.trackingNumber);
  if (!delivery.state) throw new Error("Bosta returned no state for this shipment.");
  await applyBostaState(id, { ...delivery.state, trackingNumber: delivery.trackingNumber, cod: delivery.cod }, "admin");
  refreshOrders(id);
}

export async function orderNoteAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const message = str(formData, "message");
  if (!message) return;
  await addOrderNote(id, `${admin.name}: ${message}`);
  refreshOrders(id);
}

export async function resendOrderEmailAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const order = await getOrder(id);
  if (!order) throw new Error("Order not found.");
  if (order.status === "pending") await notifyOrderPlaced(order);
  else await notifyOrderStatus(order);
  await audit(admin.email, "order.email.resend", "order", id);
  revalidatePath("/admin/mail");
  refreshOrders(id);
}

/* ---------------- enquiries ---------------- */

export async function enquiryUpdateAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const status = str(formData, "status");
  await updateEnquiry(id, {
    status: ["new", "replied", "closed"].includes(status) ? (status as "new" | "replied" | "closed") : undefined,
    adminNotes: formData.has("adminNotes") ? str(formData, "adminNotes") : undefined,
  });
  await audit(admin.email, "enquiry.update", "enquiry", id, { status });
  revalidatePath("/admin");
  revalidatePath("/admin/questionnaire");
}

/* ---------------- customers ---------------- */

export async function customerNotesAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  await updateCustomerProfile(id, { notes: str(formData, "notes") });
  await audit(admin.email, "customer.notes", "customer", id);
  revalidatePath(`/admin/customers/${id}`);
}

/* ---------------- coupons ---------------- */

function readCoupon(formData: FormData) {
  const type = str(formData, "type") === "fixed" ? "fixed" : "percent";
  return {
    code: str(formData, "code"),
    type: type as "percent" | "fixed",
    value: num(formData, "value") ?? 0,
    minSubtotal: num(formData, "minSubtotal") ?? 0,
    maxUses: num(formData, "maxUses"),
    startsAt: str(formData, "startsAt") ? new Date(str(formData, "startsAt")).toISOString() : null,
    expiresAt: str(formData, "expiresAt") ? new Date(str(formData, "expiresAt")).toISOString() : null,
    active: bool(formData, "active"),
    note: str(formData, "note"),
  };
}

export async function createCouponAction(formData: FormData) {
  const admin = await requireAdmin();
  const input = readCoupon(formData);
  await createCoupon(input);
  await audit(admin.email, "coupon.create", "coupon", input.code);
  revalidatePath("/admin/coupons");
}

export async function updateCouponAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  await updateCoupon(id, readCoupon(formData));
  await audit(admin.email, "coupon.update", "coupon", id);
  revalidatePath("/admin/coupons");
}

export async function toggleCouponAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  await updateCoupon(id, { active: bool(formData, "active") });
  await audit(admin.email, "coupon.toggle", "coupon", id);
  revalidatePath("/admin/coupons");
}

export async function deleteCouponAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  await deleteCoupon(id);
  await audit(admin.email, "coupon.delete", "coupon", id);
  revalidatePath("/admin/coupons");
}

/* ---------------- settings ---------------- */

export async function saveSettingsAction(formData: FormData) {
  const admin = await requireAdmin();
  const patch: Partial<StoreSettings> = {
    currency: str(formData, "currency").toUpperCase() || "EGP",
    taxRate: num(formData, "taxRate") ?? 0,
    pricesIncludeTax: bool(formData, "pricesIncludeTax"),
    shippingDefaultFee: num(formData, "shippingDefaultFee") ?? 0,
    freeShippingOver: num(formData, "freeShippingOver") ?? 0,
    depositPercent: Math.min(100, Math.max(1, num(formData, "depositPercent") ?? 50)),
    depositHoldHours: Math.max(0, num(formData, "depositHoldHours") ?? 48),
    balanceOnDelivery: bool(formData, "balanceOnDelivery"),
    bankTransferEnabled: bool(formData, "bankTransferEnabled"),
    bankTransferInstructionsEn: str(formData, "bankTransferInstructionsEn"),
    bankTransferInstructionsAr: str(formData, "bankTransferInstructionsAr"),
    cardReservationMinutes: num(formData, "cardReservationMinutes") ?? 30,
    studioName: str(formData, "studioName") || "NO FORM",
    studioEmail: str(formData, "studioEmail"),
    orderNotifyEmail: str(formData, "orderNotifyEmail"),
    studioPhone: str(formData, "studioPhone"),
    whatsapp: str(formData, "whatsapp"),
    instagram: str(formData, "instagram"),
    studioAddressEn: str(formData, "studioAddressEn"),
    studioAddressAr: str(formData, "studioAddressAr"),
    siteUrl: str(formData, "siteUrl").replace(/\/$/, "") || "http://localhost:3000",
    lowStockThreshold: num(formData, "lowStockThreshold") ?? 2,
    returnsWindowDays: num(formData, "returnsWindowDays") ?? 14,
  };
  await saveSettings(patch);
  await audit(admin.email, "settings.update", "settings");
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function saveShippingRatesAction(formData: FormData) {
  const admin = await requireAdmin();
  const db = await getDb();
  for (const governorate of governorateIds) {
    const fee = num(formData, `fee:${governorate}`) ?? 0;
    const etaDays = str(formData, `eta:${governorate}`);
    const active = bool(formData, `active:${governorate}`);
    await db
      .insert(shippingRates)
      .values({ governorate, fee, etaDays, active })
      .onConflictDoUpdate({ target: shippingRates.governorate, set: { fee, etaDays, active } });
  }
  await audit(admin.email, "shipping.rates.update", "settings");
  revalidatePath("/admin/settings");
  return { ok: true as const };
}

/* ---------------- mail ---------------- */

export async function emailOpenCartAction(formData: FormData) {
  await requireAdmin();
  const visitor = str(formData, "visitor");
  const { demandBoard } = await import("@/lib/demand");
  const { notifyCartReminder } = await import("@/lib/email/notify");
  const board = await demandBoard(30);
  const cart = board.open.find((row) => row.visitor === visitor);
  if (!cart?.email || !cart.name) {
    redirect("/admin/demand?sent=0");
  }
  await notifyCartReminder(
    cart.locale,
    cart.email,
    cart.name,
    cart.lines.map((line) => ({ name: line.name, quantity: line.quantity })),
    cart.visitor,
  );
  revalidatePath("/admin/demand");
  revalidatePath("/admin/mail");
  redirect(`/admin/demand?sent=1&visitor=${encodeURIComponent(cart.visitor)}`);
}

export async function emailAllOpenCartsAction() {
  await requireAdmin();
  const { demandBoard } = await import("@/lib/demand");
  const { notifyCartReminder } = await import("@/lib/email/notify");
  const board = await demandBoard(30);
  let sent = 0;
  for (const cart of board.open) {
    if (!cart.email || !cart.name) continue;
    await notifyCartReminder(
      cart.locale,
      cart.email,
      cart.name,
      cart.lines.map((line) => ({ name: line.name, quantity: line.quantity })),
      cart.visitor,
    );
    sent += 1;
  }
  revalidatePath("/admin/demand");
  revalidatePath("/admin/mail");
  redirect(`/admin/demand?sent=${sent}`);
}

export async function retryEmailAction(formData: FormData) {
  await requireAdmin();
  await attemptDelivery(str(formData, "id"));
  revalidatePath("/admin/mail");
}
