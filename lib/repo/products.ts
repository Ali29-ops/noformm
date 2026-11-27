import { and, asc, eq, sql } from "drizzle-orm";
import { getDb, type Db } from "../db";
import { products, type ProductRow } from "../db/schema";
import { collectionIds, type CollectionId } from "../catalog";
import { publishProductPhotos } from "./product-photos";

export type LiveProduct = Omit<ProductRow, "collection"> & {
  collection: CollectionId;
  custom: boolean;
  available: number;
};

export function toLive(row: ProductRow): LiveProduct {
  const collection = (collectionIds.includes(row.collection as CollectionId)
    ? row.collection
    : "sphere") as CollectionId;
  return {
    ...row,
    collection,
    custom: row.source === "custom",
    available: row.madeToOrder ? Number.MAX_SAFE_INTEGER : Math.max(0, row.onHand - row.reserved),
  };
}

export async function getAllProducts(options: { includeInactive?: boolean } = {}) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(products)
    .where(options.includeInactive ? undefined : eq(products.active, true))
    .orderBy(asc(products.sortOrder), asc(products.createdAt));
  return rows.map(toLive);
}

export async function getProductBySlug(slug: string, options: { includeInactive?: boolean } = {}) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(products)
    .where(
      options.includeInactive
        ? eq(products.slug, slug)
        : and(eq(products.slug, slug), eq(products.active, true)),
    );
  return row ? toLive(row) : null;
}

export async function getProductsBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [] as LiveProduct[];
  const all = await getAllProducts({ includeInactive: true });
  const set = new Set(slugs);
  return all.filter((p) => set.has(p.slug));
}

export type ProductInput = {
  collection: CollectionId;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  materials: string[];
  materialsAr: string[];
  colorSwatches: { id: string; hex: string; en: string; ar: string; image?: string; productImage?: string }[];
  materialSwatches: { id: string; hex: string; en: string; ar: string; image?: string; productImage?: string }[];
  images: string[];
  sku: string;
  price: number;
  compareAtPrice: number | null;
  onHand: number;
  madeToOrder: boolean;
  readyToShip?: boolean;
  leadTimeDays: number | null;
  widthCm: number | null;
  depthCm: number | null;
  heightCm: number | null;
  weightKg: number | null;
  care: string;
  careAr: string;
  active: boolean;
  floorX?: number | null;
  floorY?: number | null;
  sortOrder: number;
};

function clean(input: Partial<ProductInput>) {
  const out: Partial<typeof products.$inferInsert> = {};
  if (input.collection !== undefined) out.collection = input.collection;
  if (input.name !== undefined) out.name = input.name.trim() || null;
  if (input.nameAr !== undefined) out.nameAr = input.nameAr.trim() || null;
  if (input.description !== undefined) out.description = input.description.trim() || null;
  if (input.descriptionAr !== undefined) out.descriptionAr = input.descriptionAr.trim() || null;
  if (input.materials !== undefined) out.materials = input.materials.filter(Boolean);
  if (input.materialsAr !== undefined) out.materialsAr = input.materialsAr.filter(Boolean);
  if (input.colorSwatches !== undefined) out.colorSwatches = input.colorSwatches.length ? input.colorSwatches : "none";
  if (input.materialSwatches !== undefined) out.materialSwatches = input.materialSwatches.length ? input.materialSwatches : "none";
  if (input.images !== undefined) out.images = input.images;
  if (input.sku !== undefined) out.sku = input.sku.trim() || null;
  if (input.price !== undefined) out.price = Math.max(0, Math.round(input.price * 100) / 100);
  if (input.compareAtPrice !== undefined)
    out.compareAtPrice = input.compareAtPrice && input.compareAtPrice > 0 ? input.compareAtPrice : null;
  if (input.onHand !== undefined) out.onHand = Math.max(0, Math.floor(input.onHand));
  if (input.readyToShip !== undefined) out.readyToShip = input.readyToShip;
  if (input.madeToOrder !== undefined) out.madeToOrder = input.madeToOrder;
  if (input.leadTimeDays !== undefined) out.leadTimeDays = input.leadTimeDays;
  if (input.widthCm !== undefined) out.widthCm = input.widthCm;
  if (input.depthCm !== undefined) out.depthCm = input.depthCm;
  if (input.heightCm !== undefined) out.heightCm = input.heightCm;
  if (input.weightKg !== undefined) out.weightKg = input.weightKg;
  if (input.care !== undefined) out.care = input.care.trim() || null;
  if (input.careAr !== undefined) out.careAr = input.careAr.trim() || null;
  if (input.active !== undefined) out.active = input.active;
  if (input.floorX !== undefined) out.floorX = input.floorX;
  if (input.floorY !== undefined) out.floorY = input.floorY;
  if (input.sortOrder !== undefined) out.sortOrder = input.sortOrder;
  return out;
}

type ProductPhotoDrafts = { uploaderId: string; ids: string[] };

export async function createProduct(slug: string, input: ProductInput, photos?: ProductPhotoDrafts) {
  const db = await getDb();
  const existing = await getProductBySlug(slug, { includeInactive: true });
  if (existing) throw new Error("A product with this name already exists.");
  const values = { slug, source: "custom" as const, ...clean(input), collection: input.collection };
  if (photos?.ids.length) {
    await db.transaction(async (tx) => {
      await publishProductPhotos(tx, photos.uploaderId, photos.ids);
      await tx.insert(products).values(values);
    });
  } else {
    await db.insert(products).values(values);
  }
  return (await getProductBySlug(slug, { includeInactive: true }))!;
}

export async function updateProduct(slug: string, input: Partial<ProductInput>, photos?: ProductPhotoDrafts) {
  const db = await getDb();
  const update = async (writer: Pick<Db, "update">) => {
    const result = await writer.update(products)
      .set({ ...clean(input), updatedAt: new Date().toISOString() })
      .where(eq(products.slug, slug));
    if (result.rowsAffected === 0) throw new Error("Product not found.");
  };
  if (photos?.ids.length) {
    await db.transaction(async (tx) => {
      await publishProductPhotos(tx, photos.uploaderId, photos.ids);
      await update(tx);
    });
  } else {
    await update(db);
  }
  return (await getProductBySlug(slug, { includeInactive: true }))!;
}

export async function deleteProduct(slug: string) {
  const db = await getDb();
  const [row] = await db.select().from(products).where(eq(products.slug, slug));
  if (!row) throw new Error("Product not found.");
  if (row.source === "catalog") throw new Error("Catalog pieces cannot be deleted. Deactivate them instead.");
  await db.delete(products).where(eq(products.slug, slug));
}

export async function setOnHand(slug: string, onHand: number) {
  const db = await getDb();
  await db
    .update(products)
    .set({ onHand: Math.max(0, Math.floor(onHand)), updatedAt: new Date().toISOString() })
    .where(eq(products.slug, slug));
}

export async function lowStockProducts(threshold: number) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.active, true),
        eq(products.madeToOrder, false),
        sql`${products.onHand} - ${products.reserved} <= ${threshold}`,
      ),
    )
    .orderBy(asc(products.onHand));
  return rows.map(toLive);
}

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return slug || `piece-${Date.now().toString(36)}`;
}
