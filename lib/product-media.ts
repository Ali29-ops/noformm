import { rm, unlink } from "node:fs/promises";
import path from "node:path";

function mediaDir(slug: string) {
  return path.join(process.cwd(), "public", "catalog", "custom", slug);
}

export function collectImageUrls(raw: string) {
  return raw
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter((item) => item.startsWith("/") || item.startsWith("http://") || item.startsWith("https://"));
}

export async function removeOwnedImage(src: string, slug: string) {
  if (!src.startsWith(`/catalog/custom/${slug}/`)) return;
  const filename = path.basename(src);
  if (!filename || filename === "." || filename === "..") return;
  await unlink(path.join(mediaDir(slug), filename)).catch(() => undefined);
}

export async function removeProductMedia(slug: string) {
  if (process.env.VERCEL) return;
  await rm(mediaDir(slug), { recursive: true, force: true });
}
