import { readFile } from "node:fs/promises";
import path from "node:path";
import { reviewPhotoDirectory, reviewPhotoTypes } from "@/lib/review-photos";

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const match = /^[a-f0-9-]{36}\.(jpg|png|webp|avif)$/.exec(file);
  if (!match) return new Response(null, { status: 404 });
  try {
    const bytes = await readFile(path.join(reviewPhotoDirectory, file));
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": reviewPhotoTypes[match[1]],
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Response(null, { status: 404 });
    throw error;
  }
}
