import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const reviewPhotoDirectory = path.join(process.cwd(), "data", "review-photos");
export const reviewPhotoTypes: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export async function saveReviewPhoto(file: File) {
  const ext = Object.keys(reviewPhotoTypes).find((key) => reviewPhotoTypes[key] === file.type);
  if (!ext || file.size > 10 * 1024 * 1024) throw new Error("Choose a JPEG, PNG, WebP or AVIF photo under 10 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.${ext}`;
  await mkdir(reviewPhotoDirectory, { recursive: true });
  await writeFile(path.join(reviewPhotoDirectory, filename), bytes);
  return `/api/review-photos/${filename}`;
}
