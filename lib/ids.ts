import { randomBytes } from "node:crypto";

function block(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export function orderId() {
  return `NF-${Date.now().toString(36).toUpperCase()}-${block(4)}`;
}

export function prefixedId(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${block(4)}`;
}

export function secretToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function nowIso() {
  return new Date().toISOString();
}
