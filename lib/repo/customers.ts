import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import { addresses, customers, orders, type AddressRow, type CustomerRow } from "../db/schema";
import { nowIso, prefixedId } from "../ids";
import { hashPassword } from "../password";

export type Customer = CustomerRow;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getCustomerById(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(customers).where(eq(customers.id, id));
  return row ?? null;
}

export async function getCustomerByEmail(email: string) {
  const db = await getDb();
  const [row] = await db.select().from(customers).where(eq(customers.email, normalizeEmail(email)));
  return row ?? null;
}

export async function createCustomer(input: {
  name: string;
  email: string;
  phone: string;
  city: string;
  password: string;
  locale: string;
}) {
  const db = await getDb();
  const email = normalizeEmail(input.email);
  if (await getCustomerByEmail(email)) throw new Error("An account with this email already exists.");
  const { salt, hash } = hashPassword(input.password);
  const id = prefixedId("CU");
  await db.insert(customers).values({
    id,
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    city: input.city.trim(),
    locale: input.locale,
    salt,
    passwordHash: hash,
    hashScheme: "scrypt",
  });
  return (await getCustomerById(id))!;
}

export async function updateCustomerProfile(
  id: string,
  patch: Partial<Pick<CustomerRow, "name" | "phone" | "city" | "locale" | "marketingOptIn" | "notes">>,
) {
  const db = await getDb();
  await db.update(customers).set({ ...patch, updatedAt: nowIso() }).where(eq(customers.id, id));
}

export async function setCustomerPassword(id: string, password: string) {
  const db = await getDb();
  const { salt, hash } = hashPassword(password);
  await db
    .update(customers)
    .set({ salt, passwordHash: hash, hashScheme: "scrypt", updatedAt: nowIso() })
    .where(eq(customers.id, id));
}

export async function touchLogin(id: string) {
  const db = await getDb();
  await db.update(customers).set({ lastLoginAt: nowIso() }).where(eq(customers.id, id));
}

export async function listCustomers() {
  const db = await getDb();
  const rows = await db
    .select({
      customer: customers,
      orderCount: sql<number>`(select count(*) from ${orders} where ${orders.customerId} = ${customers.id})`,
      spent: sql<number>`coalesce((select sum(${orders.total}) from ${orders} where ${orders.customerId} = ${customers.id} and ${orders.status} != 'cancelled'), 0)`,
    })
    .from(customers)
    .orderBy(desc(customers.createdAt));
  return rows;
}

export async function listAddresses(customerId: string): Promise<AddressRow[]> {
  const db = await getDb();
  return db
    .select()
    .from(addresses)
    .where(eq(addresses.customerId, customerId))
    .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
}

export async function getAddress(customerId: string, id: string) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.customerId, customerId), eq(addresses.id, id)));
  return row ?? null;
}

export type AddressInput = Omit<AddressRow, "id" | "customerId" | "createdAt">;

export async function addAddress(customerId: string, input: AddressInput) {
  const db = await getDb();
  const existing = await listAddresses(customerId);
  const isDefault = input.isDefault || existing.length === 0;
  if (isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.customerId, customerId));
  }
  const id = prefixedId("AD");
  await db.insert(addresses).values({ ...input, id, customerId, isDefault });
  return id;
}

export async function updateAddress(customerId: string, id: string, input: AddressInput) {
  const db = await getDb();
  if (input.isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.customerId, customerId));
  }
  await db
    .update(addresses)
    .set(input)
    .where(and(eq(addresses.customerId, customerId), eq(addresses.id, id)));
}

export async function deleteAddress(customerId: string, id: string) {
  const db = await getDb();
  await db.delete(addresses).where(and(eq(addresses.customerId, customerId), eq(addresses.id, id)));
}

export async function setDefaultAddress(customerId: string, id: string) {
  const db = await getDb();
  await db.update(addresses).set({ isDefault: false }).where(eq(addresses.customerId, customerId));
  await db
    .update(addresses)
    .set({ isDefault: true })
    .where(and(eq(addresses.customerId, customerId), eq(addresses.id, id)));
}
