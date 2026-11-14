import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { adminUsers, type AdminUserRow } from "./db/schema";
import { nowIso, prefixedId } from "./ids";
import { hashPassword, verifyPassword } from "./password";
import { createSession, destroySession, resolveSession } from "./repo/sessions";
import { cookieOptions } from "./customer-auth";

const COOKIE = "nf_admin";
const TTL_SECONDS = 60 * 60 * 24 * 7;

export function adminCookieName() {
  return COOKIE;
}

export type AdminUser = Pick<AdminUserRow, "id" | "email" | "name" | "role">;

export const readAdminSession = cache(async (): Promise<AdminUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const session = await resolveSession("admin", token);
  if (!session) return null;
  const db = await getDb();
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, session.subjectId));
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
});

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await readAdminSession();
  if (!admin) redirect("/admin/login?expired=1");
  return admin;
}

export async function adminLogin(email: string, password: string) {
  const db = await getDb();
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email.trim().toLowerCase()));
  if (!user || !verifyPassword(password, { salt: user.salt, passwordHash: user.passwordHash })) return null;
  const jar = await cookies();
  const ua = (await headers()).get("user-agent") ?? "";
  const { token } = await createSession("admin", user.id, TTL_SECONDS, ua.slice(0, 200));
  jar.set(COOKIE, token, cookieOptions(TTL_SECONDS));
  await db.update(adminUsers).set({ lastLoginAt: nowIso() }).where(eq(adminUsers.id, user.id));
  return user;
}

export async function adminLogout() {
  const jar = await cookies();
  await destroySession(jar.get(COOKIE)?.value);
  jar.delete(COOKIE);
}

export async function changeAdminPassword(id: string, current: string, next: string) {
  const db = await getDb();
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
  if (!user) throw new Error("Admin not found.");
  if (!verifyPassword(current, { salt: user.salt, passwordHash: user.passwordHash })) {
    throw new Error("Current password is not correct.");
  }
  const { salt, hash } = hashPassword(next);
  await db.update(adminUsers).set({ salt, passwordHash: hash }).where(eq(adminUsers.id, id));
}

export async function updateAdminProfile(id: string, patch: { name?: string; email?: string }) {
  const db = await getDb();
  const set: Partial<AdminUserRow> = {};
  if (patch.name) set.name = patch.name.trim();
  if (patch.email) set.email = patch.email.trim().toLowerCase();
  await db.update(adminUsers).set(set).where(eq(adminUsers.id, id));
}

export async function listAdmins() {
  const db = await getDb();
  return db.select({ id: adminUsers.id, email: adminUsers.email, name: adminUsers.name, role: adminUsers.role, lastLoginAt: adminUsers.lastLoginAt, createdAt: adminUsers.createdAt }).from(adminUsers);
}

export async function createAdmin(input: { name: string; email: string; password: string; role: "owner" | "staff" }) {
  const db = await getDb();
  const email = input.email.trim().toLowerCase();
  const [exists] = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, email));
  if (exists) throw new Error("An admin with this email already exists.");
  const { salt, hash } = hashPassword(input.password);
  await db.insert(adminUsers).values({ id: prefixedId("AD"), email, name: input.name.trim(), passwordHash: hash, salt, role: input.role });
}

export async function deleteAdmin(id: string, actingId: string) {
  if (id === actingId) throw new Error("You cannot remove your own account.");
  const db = await getDb();
  const all = await db.select({ id: adminUsers.id }).from(adminUsers);
  if (all.length <= 1) throw new Error("At least one admin must remain.");
  await db.delete(adminUsers).where(eq(adminUsers.id, id));
}
