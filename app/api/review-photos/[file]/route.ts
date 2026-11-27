import { readFile } from "node:fs/promises";
import path from "node:path";
import { reviewPhotoDirectory, reviewPhotoTypes } from "@/lib/review-photos";
import { productPhotoId } from "@/lib/product-photo-upload";
import { getPublishedProductPhoto } from "@/lib/repo/product-photos";

function photoResponse(bytes: Uint8Array, contentType: string) {
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (productPhotoId.test(file)) {
    const photo = await getPublishedProductPhoto(file);
    return photo ? photoResponse(photo.bytes, photo.contentType) : new Response(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }
  const match = /^[a-f0-9-]{36}\.(jpg|png|webp|avif)$/.exec(file);
  if (!match) return new Response(null, { status: 404 });
  try {
    const bytes = await readFile(path.join(reviewPhotoDirectory, file));
    return photoResponse(bytes, reviewPhotoTypes[match[1]]);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Response(null, { status: 404 });
    throw error;
  }
}
