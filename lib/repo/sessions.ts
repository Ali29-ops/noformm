import { and, eq, lt } from "drizzle-orm";
import { getDb } from "../db";
import { passwordResets, sessions } from "../db/schema";
import { nowIso, secretToken } from "../ids";
import { sha256 } from "../password";

export type SessionKind = "customer" | "admin";

export async function createSession(kind: SessionKind, subjectId: string, ttlSeconds: number, userAgent = "") {
  const db = await getDb();
  const token = secretToken(32);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  await db.insert(sessions).values({ tokenHash: sha256(token), kind, subjectId, expiresAt, userAgent });
  return { token, expiresAt };
}

export async function resolveSession(kind: SessionKind, token: string | undefined) {
  if (!token) return null;
  const db = await getDb();
  const [row] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.tokenHash, sha256(token)), eq(sessions.kind, kind)));
  if (!row) return null;
  if (row.expiresAt < nowIso()) {
    await db.delete(sessions).where(eq(sessions.tokenHash, row.tokenHash));
    return null;
  }
  return row;
}

export async function destroySession(token: string | undefined) {
  if (!token) return;
  const db = await getDb();
  await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
}

export async function destroySubjectSessions(kind: SessionKind, subjectId: string) {
  const db = await getDb();
  await db.delete(sessions).where(and(eq(sessions.kind, kind), eq(sessions.subjectId, subjectId)));
}

export async function purgeExpiredSessions() {
  const db = await getDb();
  await db.delete(sessions).where(lt(sessions.expiresAt, nowIso()));
  await db.delete(passwordResets).where(lt(passwordResets.expiresAt, nowIso()));
}

export async function createPasswordReset(customerId: string, ttlMinutes = 60) {
  const db = await getDb();
  const token = secretToken(32);
  await db.insert(passwordResets).values({
    tokenHash: sha256(token),
    customerId,
    expiresAt: new Date(Date.now() + ttlMinutes * 60_000).toISOString(),
  });
  return token;
}

export async function consumePasswordReset(token: string) {
  const db = await getDb();
  const [row] = await db.select().from(passwordResets).where(eq(passwordResets.tokenHash, sha256(token)));
  if (!row || row.usedAt || row.expiresAt < nowIso()) return null;
  await db.update(passwordResets).set({ usedAt: nowIso() }).where(eq(passwordResets.tokenHash, row.tokenHash));
  return row.customerId;
}

export async function peekPasswordReset(token: string) {
  const db = await getDb();
  const [row] = await db.select().from(passwordResets).where(eq(passwordResets.tokenHash, sha256(token)));
  if (!row || row.usedAt || row.expiresAt < nowIso()) return null;
  return row.customerId;
}
