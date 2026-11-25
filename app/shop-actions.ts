"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { CART_COOKIE, parseCart, sameLine, type CartLine } from "@/lib/cart";
import { sizesFor } from "@/lib/product-sizes";
import { resolveColors, resolveMaterials } from "@/lib/product-options";
import { readCustomerSession } from "@/lib/customer-auth";
import { getProductBySlug, getProductsBySlugs } from "@/lib/repo/products";
import { createOrder, getOrderForCustomer, StockError } from "@/lib/repo/orders";
import { addEnquiry } from "@/lib/repo/enquiries";
import { checkCoupon } from "@/lib/repo/coupons";
import { addAddress, listAddresses } from "@/lib/repo/customers";
import { notifyEnquiry, notifyOrderPlaced } from "@/lib/email/notify";
import { getSettings, cardPaymentsConfigured } from "@/lib/settings";
import { computeTotals, shippingFeeFor } from "@/lib/pricing";
import { rateLimit } from "@/lib/rate-limit";
import { checkoutSchema, enquirySchema, firstIssue, formToObject } from "@/lib/validation";
import { recordShopEvent, saveOpenCart } from "@/lib/demand";

async function writeCart(lines: CartLine[]) {
  const jar = await cookies();
  jar.set(CART_COOKIE, JSON.stringify(lines), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  await saveOpenCart(lines);
}

export async function getCartLines() {
  const jar = await cookies();
  return parseCart(jar.get(CART_COOKIE)?.value);
}

export async function addToCartAction(slug: string, collection: string, color?: string, material?: string, size?: string) {
  const product = await getProductBySlug(slug);
  if (!product || product.collection !== collection) throw new Error("Product not found.");
  if (product.available < 1) throw new Error("This piece is no longer available.");
  const colorOptions = resolveColors(product);
  const materialOptions = resolveMaterials(product);
  const chosenColor = color?.trim() || undefined;
  const chosenMaterial = material?.trim() || undefined;
  const sizes = sizesFor(slug);
  if ((sizes.length || size) && !sizes.some((option) => option.id === size)) {
    throw new Error("Choose a size.");
  }
  if (colorOptions.length && (!chosenColor || !colorOptions.some((item) => item.id === chosenColor))) {
    throw new Error("Choose a colour.");
  }
  if (materialOptions.length && (!chosenMaterial || !materialOptions.some((item) => item.id === chosenMaterial))) {
    throw new Error("Choose a material.");
  }
  const lines = await getCartLines();
  const existing = lines.find((line) => sameLine(line, slug, chosenColor, chosenMaterial, size));
  const quantity = (existing?.quantity ?? 0) + 1;
  const heldQuantity = lines.filter((line) => line.slug === slug).reduce((sum, line) => sum + line.quantity, 0);
  if ((sizes.length ? heldQuantity + 1 : quantity) > product.available) throw new Error("Not enough pieces in studio.");
  const next = existing
    ? lines.map((line) => (sameLine(line, slug, chosenColor, chosenMaterial, size) ? { ...line, quantity } : line))
    : [...lines, { slug, quantity: 1, color: chosenColor, material: chosenMaterial, size }];
  await writeCart(next);
  await recordShopEvent("add", slug);
  revalidatePath("/", "layout");
  return { ok: true as const, count: next.reduce((sum, line) => sum + line.quantity, 0) };
}

export async function setCartQtyAction(slug: string, quantity: number, color?: string, material?: string, size?: string) {
  const product = await getProductBySlug(slug);
  const nextQty = Math.max(0, Math.floor(quantity));
  if (product && nextQty > product.available) throw new Error("Not enough pieces in studio.");
  const current = await getCartLines();
  if (product && sizesFor(slug).length && nextQty > 0) {
    const otherQuantity = current
      .filter((line) => line.slug === slug && !sameLine(line, slug, color, material, size))
      .reduce((sum, line) => sum + line.quantity, 0);
    if (otherQuantity + nextQty > product.available) throw new Error("Not enough pieces in studio.");
  }
  const before = current.find((line) => sameLine(line, slug, color, material, size))?.quantity ?? 0;
  const lines = current
    .map((line) => (sameLine(line, slug, color, material, size) ? { ...line, quantity: nextQty } : line))
    .filter((line) => line.quantity > 0);
  await writeCart(lines);
  if (before > 0 && nextQty === 0) await recordShopEvent("remove", slug);
  revalidatePath("/", "layout");
}

export async function clearCartAction() {
  await writeCart([]);
  revalidatePath("/", "layout");
}

export type Quote = {
  subtotal: number;
  shippingFee: number;
  discount: number;
  tax: number;
  total: number;
  freeShipping: boolean;
  depositPercent: number;
  depositAmount: number;
  balanceAmount: number;
  balanceOnDelivery: boolean;
  currency: string;
  couponError?: string;
  couponCode?: string;
};

export async function quoteAction(input: { governorate: string; coupon: string }): Promise<Quote> {
  const lines = await getCartLines();
  const products = await getProductsBySlugs(lines.map((l) => l.slug));
  const subtotal = lines.reduce((sum, line) => {
    const product = products.find((p) => p.slug === line.slug);
    return sum + (product?.price ?? 0) * line.quantity;
  }, 0);
  const settings = await getSettings();
  let discount = 0;
  let couponError: string | undefined;
  let couponCode: string | undefined;
  if (input.coupon.trim()) {
    const check = await checkCoupon(input.coupon, subtotal);
    if (check.ok) {
      discount = check.discount;
      couponCode = check.coupon.code;
    } else {
      couponError = check.reason;
    }
  }
  const shippingFee = input.governorate ? await shippingFeeFor(input.governorate, settings) : settings.shippingDefaultFee;
  const totals = computeTotals({ subtotal, shippingFee, discount, settings });
  return { ...totals, balanceOnDelivery: settings.balanceOnDelivery, currency: settings.currency, couponError, couponCode };
}

export async function placeOrderAction(formData: FormData) {
  await rateLimit("checkout", 10, 60);
  const lines = await getCartLines();
  if (lines.length === 0) throw new Error("Your cart is empty.");

  const raw = formToObject(formData);
  raw.acceptTerms = formData.get("acceptTerms") === "on" || formData.get("acceptTerms") === "true";
  raw.saveAddress = formData.get("saveAddress") === "on";
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));
  const data = parsed.data;

  if (data.paymentMethod === "card" && !cardPaymentsConfigured()) {
    throw new Error("Card payments are not available yet. Choose another payment method.");
  }

  const session = await readCustomerSession();
  const locale = await getLocale();

  const address = {
    name: data.name,
    phone: data.phone,
    phone2: data.phone2,
    country: data.country || "EG",
    governorate: data.governorate,
    city: data.city,
    area: data.area,
    street: data.street,
    building: data.building,
    floor: data.floor,
    apartment: data.apartment,
    landmark: data.landmark,
  };

  let order;
  try {
    order = await createOrder({
      locale,
      customerId: session?.id ?? null,
      customer: { name: data.name, email: data.email, phone: data.phone },
      address,
      notes: data.notes,
      paymentMethod: data.paymentMethod,
      couponCode: data.coupon,
      lines,
    });
  } catch (error) {
    if (error instanceof StockError) {
      // Drop the unavailable line so the customer can continue.
      const product = await getProductBySlug(error.slug);
      const available = product?.available ?? 0;
      const next = lines
        .map((line) => (line.slug === error.slug ? { ...line, quantity: Math.min(line.quantity, available) } : line))
        .filter((line) => line.quantity > 0);
      await writeCart(next);
      revalidatePath("/", "layout");
    }
    throw error;
  }

  if (session && data.saveAddress) {
    const existing = await listAddresses(session.id);
    const duplicate = existing.some(
      (a) => a.street === address.street && a.city === address.city && a.governorate === address.governorate,
    );
    if (!duplicate) await addAddress(session.id, { ...address, label: "", isDefault: existing.length === 0 });
  }

  await notifyOrderPlaced(order);
  await writeCart([]);
  revalidatePath("/", "layout");
  return { id: order.id, token: order.publicToken };
}

export async function submitEnquiryAction(formData: FormData) {
  await rateLimit("enquiry", 5, 60);
  const parsed = enquirySchema.safeParse(formToObject(formData));
  if (!parsed.success) throw new Error(firstIssue(parsed.error));
  if (parsed.data.website) return { ok: true as const }; // honeypot hit — pretend success
  const locale = await getLocale();
  const enquiry = await addEnquiry({ ...parsed.data, locale });
  await notifyEnquiry(enquiry);
  revalidatePath("/admin");
  revalidatePath("/admin/questionnaire");
  return { ok: true as const };
}

export async function recordViewAction(slug: string) {
  await recordShopEvent("view", slug, 30);
}

export async function recordCheckoutAction(slugs: string[]) {
  const unique = [...new Set(slugs.map((slug) => slug.trim()).filter(Boolean))].slice(0, 20);
  for (const slug of unique) await recordShopEvent("checkout", slug, 20);
}

export async function lookupOrderAction(formData: FormData) {
  await rateLimit("lookup", 10, 60);
  const id = String(formData.get("id") ?? "").trim().toUpperCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!id || !email) throw new Error("Order reference and email are required.");
  const order = await getOrderForCustomer(id, { email });
  if (!order) throw new Error("No order matches that reference and email.");
  return { id: order.id, token: order.publicToken };
}
