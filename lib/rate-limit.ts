import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };

type RlGlobal = typeof globalThis & { __noformRl?: Map<string, Bucket> };
const g = globalThis as RlGlobal;
const buckets = (g.__noformRl ??= new Map<string, Bucket>());

export async function clientIp() {
  const h = await headers();
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}

/**
 * Simple in-memory sliding window. Suitable for a single Node instance;
 * swap for Redis/Upstash when running multiple instances.
 */
export async function rateLimit(scope: string, limit: number, windowSeconds: number) {
  const ip = await clientIp();
  const key = `${scope}:${ip}`;
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    throw new Error("Too many attempts. Please wait a moment and try again.");
  }
}
