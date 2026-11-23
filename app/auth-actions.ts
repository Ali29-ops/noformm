"use server";

import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect as redirectToAdmin } from "next/navigation";
import { adminLogin } from "@/lib/admin-auth";
import { audit } from "@/lib/repo/audit";
import { redirect } from "@/i18n/navigation";
import { clearCustomerSession, readCustomerSession, writeCustomerSession } from "@/lib/customer-auth";
import {
  addAddress,
  createCustomer,
  deleteAddress,
  getCustomerByEmail,
  getCustomerById,
  setCustomerPassword,
  setDefaultAddress,
  touchLogin,
  updateAddress,
  updateCustomerProfile,
} from "@/lib/repo/customers";
import { consumePasswordReset, createPasswordReset, destroySubjectSessions } from "@/lib/repo/sessions";
import { claimGuestOrders } from "@/lib/repo/orders";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getDb } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notifyPasswordReset, notifyWelcome } from "@/lib/email/notify";
import { allowAttempt, rateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { addressSchema, emailSchema, firstIssue, formToObject, registerSchema } from "@/lib/validation";

type Locale = "en" | "ar";

async function locale(): Promise<Locale> {
  return (await getLocale()) as Locale;
}

export async function getAccount() {
  return readCustomerSession();
}

export async function registerAction(formData: FormData) {
  if (!(await allowAttempt("register", 5, 300))) return { error: rateLimitMessage };
  const parsed = registerSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const loc = await locale();
  const customer = await createCustomer({ ...parsed.data, locale: loc });
  if (!customer) return { error: "An account with this email already exists. Try signing in." };
  await claimGuestOrders(customer.id, customer.email);
  await writeCustomerSession(customer);
  await notifyWelcome(loc, customer.email, customer.name);
  redirect({ href: "/account", locale: loc });
}

export async function signInAction(formData: FormData) {
  if (!(await allowAttempt("signin", 10, 300))) return { error: rateLimitMessage };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const admin = await adminLogin(email, password);
  if (admin) {
    await audit(admin.email, "login", "admin", admin.id);
    redirectToAdmin("/admin");
  }
  const customer = await getCustomerByEmail(email);
  if (!customer || !verifyPassword(password, customer)) {
    return { error: "Email or password is not correct." };
  }
  if (customer.hashScheme !== "scrypt") {
    // Upgrade legacy hash transparently.
    const { salt, hash } = hashPassword(password);
    const db = await getDb();
    await db
      .update(customers)
      .set({ salt, passwordHash: hash, hashScheme: "scrypt" })
      .where(eq(customers.id, customer.id));
  }
  await touchLogin(customer.id);
  await writeCustomerSession(customer);
  const next = String(formData.get("next") ?? "");
  const loc = await locale();
  redirect({ href: next.startsWith("/") && !next.startsWith("//") ? next : "/account", locale: loc });
}

export async function signOutAction() {
  await clearCustomerSession();
  redirect({ href: "/", locale: await locale() });
}

export async function requestPasswordResetAction(formData: FormData) {
  await rateLimit("reset", 5, 600);
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) throw new Error("Email looks invalid.");
  const customer = await getCustomerByEmail(email.data);
  if (customer) {
    const token = await createPasswordReset(customer.id);
    await notifyPasswordReset(await locale(), customer.email, customer.name, token);
  }
  // Always succeed to avoid leaking which emails exist.
  return { ok: true as const };
}

export async function resetPasswordAction(formData: FormData) {
  await rateLimit("reset-confirm", 10, 600);
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  const customerId = await consumePasswordReset(token);
  if (!customerId) throw new Error("This reset link is invalid or has expired.");
  await setCustomerPassword(customerId, password);
  await destroySubjectSessions("customer", customerId);
  const customer = await getCustomerById(customerId);
  if (customer) await writeCustomerSession(customer);
  redirect({ href: "/account", locale: await locale() });
}

async function requireCustomer() {
  const session = await readCustomerSession();
  if (!session) throw new Error("Please sign in.");
  return session;
}

export async function updateProfileAction(formData: FormData) {
  const session = await requireCustomer();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) throw new Error("Name is required.");
  await updateCustomerProfile(session.id, {
    name,
    phone: String(formData.get("phone") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    locale: await locale(),
  });
  revalidatePath("/[locale]/account", "page");
  return { ok: true as const };
}

export async function changePasswordAction(formData: FormData) {
  const session = await requireCustomer();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "");
  if (next.length < 8) throw new Error("Password must be at least 8 characters.");
  const customer = await getCustomerById(session.id);
  if (!customer || !verifyPassword(current, customer)) throw new Error("Current password is not correct.");
  await setCustomerPassword(session.id, next);
  return { ok: true as const };
}

export async function saveAddressAction(formData: FormData) {
  const session = await requireCustomer();
  const parsed = addressSchema.safeParse(formToObject(formData));
  if (!parsed.success) throw new Error(firstIssue(parsed.error));
  const id = String(formData.get("id") ?? "");
  const input = {
    ...parsed.data,
    label: String(formData.get("label") ?? "").trim(),
    isDefault: formData.get("isDefault") === "on",
  };
  if (id) await updateAddress(session.id, id, input);
  else await addAddress(session.id, input);
  revalidatePath("/[locale]/account", "page");
  return { ok: true as const };
}

export async function deleteAddressAction(formData: FormData) {
  const session = await requireCustomer();
  await deleteAddress(session.id, String(formData.get("id") ?? ""));
  revalidatePath("/[locale]/account", "page");
}

export async function defaultAddressAction(formData: FormData) {
  const session = await requireCustomer();
  await setDefaultAddress(session.id, String(formData.get("id") ?? ""));
  revalidatePath("/[locale]/account", "page");
}
