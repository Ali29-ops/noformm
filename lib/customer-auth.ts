import { cookies, headers } from "next/headers";
import { cache } from "react";
import type { CustomerRow } from "./db/schema";
import { createSession, destroySession, resolveSession } from "./repo/sessions";
import { getCustomerById } from "./repo/customers";

export const CUSTOMER_COOKIE = "nf_customer";
const TTL_SECONDS = 60 * 60 * 24 * 30;

export type PublicCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  locale: string;
};

export function toPublicCustomer(customer: CustomerRow): PublicCustomer {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    city: customer.city,
    locale: customer.locale,
  };
}

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export const readCustomerSession = cache(async (): Promise<PublicCustomer | null> => {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  const session = await resolveSession("customer", token);
  if (!session) return null;
  const customer = await getCustomerById(session.subjectId);
  return customer ? toPublicCustomer(customer) : null;
});

export async function writeCustomerSession(customer: Pick<CustomerRow, "id">) {
  const jar = await cookies();
  const ua = (await headers()).get("user-agent") ?? "";
  const { token } = await createSession("customer", customer.id, TTL_SECONDS, ua.slice(0, 200));
  jar.set(CUSTOMER_COOKIE, token, cookieOptions(TTL_SECONDS));
}

export async function clearCustomerSession() {
  const jar = await cookies();
  await destroySession(jar.get(CUSTOMER_COOKIE)?.value);
  jar.delete(CUSTOMER_COOKIE);
}
