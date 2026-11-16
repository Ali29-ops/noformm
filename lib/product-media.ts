import { mkdir, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const allowedExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function mediaDir(slug: string) {
  return path.join(process.cwd(), "public", "catalog", "custom", slug);
}

function safeExt(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpeg") return ".jpg";
  return allowedExt.has(ext) ? ext : ".jpg";
}

export function collectImageFiles(formData: FormData) {
  return formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

export function collectImageUrls(raw: string) {
  return raw
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter((item) => item.startsWith("/") || item.startsWith("http://") || item.startsWith("https://"));
}

export function nextImageIndex(existing: string[], slug: string) {
  let max = 0;
  const pattern = new RegExp(`/catalog/custom/${slug}/(\\d+)`);
  for (const src of existing) {
    const match = src.match(pattern);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return max + 1;
}

export async function saveUploadedImages(slug: string, files: File[], start = 1) {
  if (files.length === 0) return [] as string[];
  const dir = mediaDir(slug);
  await mkdir(dir, { recursive: true });
  const paths: string[] = [];
  let n = start;
  for (const file of files) {
    const ext = safeExt(file.name);
    const filename = `${String(n).padStart(2, "0")}${ext}`;
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
    paths.push(`/catalog/custom/${slug}/${filename}`);
    n += 1;
  }
  return paths;
}

export async function saveSwatchImage(slug: string, id: string, file: File) {
  const dir = path.join(mediaDir(slug), "swatches");
  await mkdir(dir, { recursive: true });
  const filename = `${id}${safeExt(file.name)}`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return `/catalog/custom/${slug}/swatches/${filename}`;
}

export async function removeOwnedImage(src: string, slug: string) {
  if (!src.startsWith(`/catalog/custom/${slug}/`)) return;
  const filename = path.basename(src);
  if (!filename || filename === "." || filename === "..") return;
  await unlink(path.join(mediaDir(slug), filename)).catch(() => undefined);
}

export async function removeProductMedia(slug: string) {
  await rm(mediaDir(slug), { recursive: true, force: true });
}
