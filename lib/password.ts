import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 };

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password.normalize("NFKC"), salt, KEY_LENGTH, SCRYPT_OPTIONS).toString("hex");
  return { salt, hash, scheme: "scrypt" as const };
}

export function verifyPassword(
  password: string,
  record: { salt: string; passwordHash: string; hashScheme?: "scrypt" | "legacy-sha256" },
) {
  const normalized = password.normalize("NFKC");
  let candidate: Buffer;
  if (record.hashScheme === "legacy-sha256") {
    candidate = createHash("sha256").update(`${record.salt}:${password}`).digest();
  } else {
    candidate = scryptSync(normalized, record.salt, KEY_LENGTH, SCRYPT_OPTIONS);
  }
  const stored = Buffer.from(record.passwordHash, "hex");
  if (stored.length !== candidate.length) return false;
  return timingSafeEqual(stored, candidate);
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
