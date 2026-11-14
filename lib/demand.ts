import { and, desc, eq, gte, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { cookieOptions, readCustomerSession } from "./customer-auth";
import { getDb } from "./db";
import { customers, openCarts, products, shopEvents, type CartLineJson } from "./db/schema";
import { secretToken } from "./ids";
import type { CartLine } from "./cart-model";
import { productCopy } from "./product-copy";

const VISITOR = "nf_visitor";

export async function currentVisitor() {
  const jar = await cookies();
  const existing = jar.get(VISITOR)?.value;
  if (existing && /^[A-Za-z0-9_-]{8,80}$/.test(existing)) return existing;
  const id = secretToken(12);
  jar.set(VISITOR, id, cookieOptions(60 * 60 * 24 * 400));
  return id;
}

async function recently(kind: "view" | "add" | "remove" | "checkout", visitor: string, slug: string, minutes: number) {
  const db = await getDb();
  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  const [row] = await db
    .select({ id: shopEvents.id })
    .from(shopEvents)
    .where(and(eq(shopEvents.kind, kind), eq(shopEvents.visitor, visitor), eq(shopEvents.slug, slug), gte(shopEvents.createdAt, since)))
    .limit(1);
  return Boolean(row);
}

export async function recordShopEvent(kind: "view" | "add" | "remove" | "checkout", slug: string, cooldownMinutes = 0) {
  const clean = slug.trim();
  if (!clean) return;
  const visitor = await currentVisitor();
  if (cooldownMinutes > 0 && (await recently(kind, visitor, clean, cooldownMinutes))) return;
  const session = await readCustomerSession();
  const db = await getDb();
  await db.insert(shopEvents).values({
    kind,
    slug: clean,
    visitor,
    customerId: session?.id ?? null,
    createdAt: new Date().toISOString(),
  });
}

export async function saveOpenCart(lines: CartLine[]) {
  const visitor = await currentVisitor();
  const session = await readCustomerSession();
  const db = await getDb();
  if (lines.length === 0) {
    await db.delete(openCarts).where(eq(openCarts.visitor, visitor));
    return;
  }
  const payload: CartLineJson[] = lines.map((line) => ({
    slug: line.slug,
    quantity: line.quantity,
    color: line.color,
    material: line.material,
  }));
  await db
    .insert(openCarts)
    .values({
      visitor,
      customerId: session?.id ?? null,
      lines: payload,
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: openCarts.visitor,
      set: {
        customerId: session?.id ?? null,
        lines: payload,
        updatedAt: new Date().toISOString(),
      },
    });
}

export type PieceDemand = {
  slug: string;
  name: string;
  views: number;
  adds: number;
  removes: number;
  checkouts: number;
};

export async function demandBoard(days = 30) {
  const db = await getDb();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const counts = await db
    .select({
      slug: shopEvents.slug,
      kind: shopEvents.kind,
      n: sql<number>`count(*)`.mapWith(Number),
    })
    .from(shopEvents)
    .where(gte(shopEvents.createdAt, since))
    .groupBy(shopEvents.slug, shopEvents.kind);

  const names = await db.select({ slug: products.slug, name: products.name, nameAr: products.nameAr }).from(products);
  const nameOf = new Map(
    names.map((row) => [
      row.slug,
      productCopy({ slug: row.slug, name: row.name, nameAr: row.nameAr, description: null, descriptionAr: null, materials: [], materialsAr: [] }, "en").name,
    ]),
  );

  const bySlug = new Map<string, PieceDemand>();
  for (const row of counts) {
    const piece = bySlug.get(row.slug) ?? {
      slug: row.slug,
      name: nameOf.get(row.slug) || row.slug,
      views: 0,
      adds: 0,
      removes: 0,
      checkouts: 0,
    };
    if (row.kind === "view") piece.views = row.n;
    if (row.kind === "add") piece.adds = row.n;
    if (row.kind === "remove") piece.removes = row.n;
    if (row.kind === "checkout") piece.checkouts = row.n;
    bySlug.set(row.slug, piece);
  }
  const pieces = [...bySlug.values()];

  const carts = await db
    .select({
      visitor: openCarts.visitor,
      lines: openCarts.lines,
      updatedAt: openCarts.updatedAt,
      customerId: openCarts.customerId,
      name: customers.name,
      email: customers.email,
      locale: customers.locale,
    })
    .from(openCarts)
    .leftJoin(customers, eq(openCarts.customerId, customers.id))
    .orderBy(desc(openCarts.updatedAt))
    .limit(40);

  const priceRows = await db.select({ slug: products.slug, price: products.price }).from(products);
  const priceOf = new Map(priceRows.map((row) => [row.slug, row]));

  const open = carts.map((cart) => {
    const lines = (cart.lines ?? []).map((line) => ({
      ...line,
      name: nameOf.get(line.slug) || line.slug,
      value: (priceOf.get(line.slug)?.price ?? 0) * line.quantity,
    }));
    return {
      visitor: cart.visitor,
      customerId: cart.customerId,
      name: cart.name,
      email: cart.email,
      locale: cart.locale === "ar" ? ("ar" as const) : ("en" as const),
      updatedAt: cart.updatedAt,
      lines,
      value: lines.reduce((sum, line) => sum + line.value, 0),
    };
  });

  const checkoutSince = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const stalled = await db
    .select({ visitor: shopEvents.visitor, at: sql<string>`max(${shopEvents.createdAt})` })
    .from(shopEvents)
    .innerJoin(openCarts, eq(shopEvents.visitor, openCarts.visitor))
    .where(and(eq(shopEvents.kind, "checkout"), gte(shopEvents.createdAt, checkoutSince)))
    .groupBy(shopEvents.visitor);

  return {
    pieces,
    mostOpened: [...pieces].sort((a, b) => b.views - a.views).slice(0, 8),
    mostAdded: [...pieces].sort((a, b) => b.adds - a.adds).slice(0, 8),
    quiet: pieces
      .filter((piece) => piece.views >= 3 && piece.adds / piece.views < 0.2)
      .sort((a, b) => b.views - a.views)
      .slice(0, 8),
    open,
    stalled: stalled.length,
  };
}
