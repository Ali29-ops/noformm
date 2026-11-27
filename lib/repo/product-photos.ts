import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNotNull, isNull, lt } from "drizzle-orm";
import { getDb, type Db } from "../db";
import { productPhotos } from "../db/schema";
import { productPhotoAccept, productPhotoId, productPhotoMaxBytes } from "../product-photo-upload";

const draftLifetime = 24 * 60 * 60 * 1000;
const contentTypes = new Set(productPhotoAccept.split(","));

export async function stageProductPhoto(uploaderId: string, file: File) {
  if (!contentTypes.has(file.type) || !file.size || file.size > productPhotoMaxBytes) return null;
  const bytes = Buffer.from(await file.arrayBuffer());
  const db = await getDb();
  const id = randomUUID();
  const uploadedAt = Date.now();
  await db.delete(productPhotos).where(
    and(isNotNull(productPhotos.uploaderId), lt(productPhotos.uploadedAt, uploadedAt - draftLifetime)),
  );
  await db.insert(productPhotos).values({ id, contentType: file.type, bytes, uploaderId, uploadedAt });
  return id;
}

export class ProductPhotoExpiredError extends Error {}

export async function publishProductPhotos(
  tx: Parameters<Parameters<Db["transaction"]>[0]>[0],
  uploaderId: string,
  ids: string[],
) {
  if (ids.some((id) => !productPhotoId.test(id))) throw new ProductPhotoExpiredError();
  const published = await tx.update(productPhotos)
    .set({ uploaderId: null })
    .where(and(eq(productPhotos.uploaderId, uploaderId), inArray(productPhotos.id, ids)))
    .returning({ id: productPhotos.id });
  if (published.length !== ids.length) throw new ProductPhotoExpiredError();
}

export async function getPublishedProductPhoto(id: string) {
  if (!productPhotoId.test(id)) return null;
  const db = await getDb();
  const [photo] = await db.select({ bytes: productPhotos.bytes, contentType: productPhotos.contentType })
    .from(productPhotos)
    .where(and(eq(productPhotos.id, id), isNull(productPhotos.uploaderId)));
  return photo ?? null;
}
