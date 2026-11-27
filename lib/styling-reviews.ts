import { randomUUID } from "node:crypto";
import { like } from "drizzle-orm";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import { getDb, type Db } from "./db";
import { productPhotos, settings } from "./db/schema";

export type Review = {
  id: string;
  image: string;
  position: number;
  order: number;
  visible: boolean;
  rating: number;
  en: { quote: string; name: string; alt: string };
  ar: { quote: string; name: string; alt: string };
};

export type ReviewHeading = {
  en: { title: string; note: string };
  ar: { title: string; note: string };
};

const prefix = "styling.reviews.";
const defaultHeading: ReviewHeading = {
  en: { title: en.styling.reviewsTitle, note: en.styling.reviewsNote },
  ar: { title: ar.styling.reviewsTitle, note: ar.styling.reviewsNote },
};
const media = [
  ["tiled-bench-entry", "benchEntry", 72],
  ["tiled-bench-home", "benchHome", 42],
  ["tiled-pouf-box", "pouf", 50],
  ["totem-table-box", "totem", 50],
] as const;

const defaults: Review[] = media.map(([id, alt, position], index) => ({
  id,
  image: `/styling/reviews/${id}.jpg`,
  position,
  order: (index + 1) * 10,
  visible: true,
  rating: 5,
  en: { ...en.styling.reviews[index], alt: en.styling.clientPhotos[alt] },
  ar: { ...ar.styling.reviews[index], alt: ar.styling.clientPhotos[alt] },
}));

export async function getStylingReviews() {
  const db = await getDb();
  const rows = await db.select().from(settings).where(like(settings.key, `${prefix}%`));
  const reviews = new Map(defaults.map((review) => [review.id, review]));
  let heading = defaultHeading;
  for (const row of rows) {
    if (row.key === `${prefix}heading`) heading = row.value as ReviewHeading;
    else if (row.key.startsWith(`${prefix}item.`)) {
      const review = row.value as Review;
      reviews.set(review.id, review);
    }
  }
  return { heading, reviews: [...reviews.values()].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)) };
}

export async function saveStylingReview(value: Review | ReviewHeading, photo?: File) {
  const db = await getDb();
  const key = `${prefix}${"id" in value ? `item.${value.id}` : "heading"}`;
  const updatedAt = new Date().toISOString();
  const save = (writer: Pick<Db, "insert">, entry: Review | ReviewHeading) =>
    writer.insert(settings).values({ key, value: entry, updatedAt })
      .onConflictDoUpdate({ target: settings.key, set: { value: entry, updatedAt } });

  if (!photo || !("id" in value)) {
    await save(db, value);
    return;
  }

  const id = randomUUID();
  const bytes = Buffer.from(await photo.arrayBuffer());
  await db.transaction(async (tx) => {
    await tx.insert(productPhotos).values({ id, contentType: photo.type, bytes, uploadedAt: Date.now() });
    await save(tx, { ...value, image: `/api/review-photos/${id}` });
  });
}
