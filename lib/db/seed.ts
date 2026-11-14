import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { products as catalogProducts } from "../catalog";
import { productFacts } from "../product-facts";
import { productColors, productMaterials } from "../product-options";
import { hashPassword } from "../password";
import { prefixedId, secretToken } from "../ids";
import { governorateIds } from "../egypt";

type Db = LibSQLDatabase<typeof schema>;

const dataDir = path.join(process.cwd(), "data");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path.join(dataDir, file), "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function flag(db: Db, key: string) {
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, key));
  return Boolean(row);
}

async function setFlag(db: Db, key: string) {
  await db
    .insert(schema.settings)
    .values({ key, value: true })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: true } });
}

type LegacyStock = Record<string, { price: number; quantity: number }>;
type LegacyProduct = {
  slug: string;
  collection: string;
  name: string;
  description: string;
  materials: string[];
  images: string[];
  createdAt: string;
};
type LegacyOrder = {
  id: string;
  createdAt: string;
  status: string;
  customerId?: string;
  customer: { name: string; email: string; phone: string; city: string; notes: string };
  items: { slug: string; name: string; collection: string; quantity: number; price: number }[];
  total: number;
};
type LegacyCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
};
type LegacyEnquiry = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  collection: string;
  piece: string;
  message: string;
};

async function importLegacyJson(db: Db) {
  if (await flag(db, "_legacy_imported")) return;
  const inventory = await readJson<LegacyStock>("inventory.json", {});
  const custom = await readJson<LegacyProduct[]>("products.json", []);
  const orders = await readJson<LegacyOrder[]>("orders.json", []);
  const customers = await readJson<LegacyCustomer[]>("customers.json", []);
  const enquiries = await readJson<LegacyEnquiry[]>("enquiries.json", []);

  for (const product of custom) {
    const stock = inventory[product.slug];
    await db
      .insert(schema.products)
      .values({
        slug: product.slug,
        collection: product.collection,
        source: "custom",
        name: product.name,
        description: product.description,
        materials: product.materials ?? [],
        images: product.images ?? [],
        price: stock?.price ?? 0,
        onHand: stock?.quantity ?? 0,
        createdAt: product.createdAt,
        updatedAt: product.createdAt,
      })
      .onConflictDoNothing();
  }

  for (const customer of customers) {
    await db
      .insert(schema.customers)
      .values({
        id: customer.id,
        name: customer.name,
        email: customer.email.toLowerCase(),
        phone: customer.phone ?? "",
        city: customer.city ?? "",
        salt: customer.salt,
        passwordHash: customer.passwordHash,
        hashScheme: "legacy-sha256",
        createdAt: customer.createdAt,
        updatedAt: customer.createdAt,
      })
      .onConflictDoNothing();
  }

  const statusMap: Record<string, { status: schema.OrderStatus; stock: "reserved" | "committed" | "released" }> = {
    placed: { status: "pending", stock: "committed" },
    confirmed: { status: "confirmed", stock: "committed" },
    fulfilled: { status: "delivered", stock: "committed" },
    cancelled: { status: "cancelled", stock: "released" },
  };

  for (const order of orders) {
    const mapped = statusMap[order.status] ?? statusMap.placed;
    await db
      .insert(schema.orders)
      .values({
        id: order.id,
        publicToken: secretToken(18),
        customerId: order.customerId ?? null,
        currency: "EGP",
        status: mapped.status,
        paymentStatus: mapped.status === "delivered" ? "paid" : "unpaid",
        paymentMethod: "bank_transfer",
        depositPercent: 50,
        depositAmount: Math.round(order.total * 50) / 100,
        amountPaid: mapped.status === "delivered" ? order.total : 0,
        stockState: mapped.stock,
        customerName: order.customer.name,
        customerEmail: order.customer.email.toLowerCase(),
        customerPhone: order.customer.phone,
        shippingAddress: {
          name: order.customer.name,
          phone: order.customer.phone,
          country: "EG",
          governorate: "",
          city: order.customer.city,
          street: "",
        },
        notes: order.customer.notes ?? "",
        subtotal: order.total,
        total: order.total,
        createdAt: order.createdAt,
        updatedAt: order.createdAt,
      })
      .onConflictDoNothing();
    for (const item of order.items) {
      await db.insert(schema.orderItems).values({
        orderId: order.id,
        productSlug: item.slug,
        name: item.name,
        collection: item.collection,
        quantity: item.quantity,
        unitPrice: item.price,
        lineTotal: item.price * item.quantity,
      });
    }
    await db.insert(schema.orderEvents).values({
      orderId: order.id,
      type: "imported",
      message: "Imported from legacy JSON store.",
      actor: "system",
      createdAt: order.createdAt,
    });
  }

  for (const enquiry of enquiries) {
    await db
      .insert(schema.enquiries)
      .values({
        id: enquiry.id,
        name: enquiry.name,
        email: enquiry.email,
        collection: enquiry.collection ?? "",
        piece: enquiry.piece ?? "",
        message: enquiry.message,
        createdAt: enquiry.createdAt,
        updatedAt: enquiry.createdAt,
      })
      .onConflictDoNothing();
  }

  await setFlag(db, "_legacy_imported");
  return inventory;
}

async function ensureCatalogProducts(db: Db, legacyInventory: LegacyStock | undefined) {
  const existing = new Set((await db.select({ slug: schema.products.slug }).from(schema.products)).map((r) => r.slug));
  const inventory = legacyInventory ?? (await readJson<LegacyStock>("inventory.json", {}));
  let order = 0;
  for (const product of catalogProducts) {
    order += 1;
    if (existing.has(product.slug)) continue;
    const stock = inventory[product.slug];
    const facts = productFacts[product.slug];
    await db.insert(schema.products).values({
      slug: product.slug,
      collection: product.collection,
      source: "catalog",
      images: [...product.images],
      colorSwatches: [...(productColors[product.slug] ?? [])],
      materialSwatches: [...(productMaterials[product.slug] ?? [])],
      widthCm: facts?.width ?? facts?.diameter ?? null,
      depthCm: facts?.depth ?? facts?.diameter ?? null,
      heightCm: facts?.height ?? null,
      price: stock?.price ?? 2800,
      onHand: stock?.quantity ?? 4,
      sortOrder: order,
    });
  }
}

async function ensureAdmin(db: Db) {
  const [any] = await db.select({ id: schema.adminUsers.id }).from(schema.adminUsers).limit(1);
  if (any) return;
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return;
  const email = (process.env.ADMIN_EMAIL ?? "studio@noform.design").toLowerCase();
  const { salt, hash } = hashPassword(password);
  await db.insert(schema.adminUsers).values({
    id: prefixedId("AD"),
    email,
    name: "Studio",
    passwordHash: hash,
    salt,
    role: "owner",
  });
}

async function ensureShippingRates(db: Db) {
  const [any] = await db.select({ g: schema.shippingRates.governorate }).from(schema.shippingRates).limit(1);
  if (any) return;
  for (const governorate of governorateIds) {
    await db.insert(schema.shippingRates).values({ governorate, fee: 0, etaDays: "" }).onConflictDoNothing();
  }
}

export async function seedDatabase(db: Db) {
  const legacy = await importLegacyJson(db);
  await ensureCatalogProducts(db, legacy);
  await ensureAdmin(db);
  await ensureShippingRates(db);
}
