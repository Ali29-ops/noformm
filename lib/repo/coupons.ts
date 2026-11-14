import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import { coupons, type CouponRow } from "../db/schema";
import { prefixedId } from "../ids";
import { roundMoney } from "../money";

export function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export async function listCoupons() {
  const db = await getDb();
  return db.select().from(coupons).orderBy(desc(coupons.createdAt));
}

export async function getCouponByCode(code: string) {
  const db = await getDb();
  const [row] = await db.select().from(coupons).where(eq(coupons.code, normalizeCode(code)));
  return row ?? null;
}

export type CouponCheck =
  | { ok: true; coupon: CouponRow; discount: number }
  | { ok: false; reason: "not_found" | "inactive" | "expired" | "not_started" | "exhausted" | "min_subtotal" };

export function evaluateCoupon(coupon: CouponRow | null, subtotal: number, now = new Date()): CouponCheck {
  if (!coupon) return { ok: false, reason: "not_found" };
  if (!coupon.active) return { ok: false, reason: "inactive" };
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return { ok: false, reason: "not_started" };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) return { ok: false, reason: "expired" };
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return { ok: false, reason: "exhausted" };
  if (subtotal < coupon.minSubtotal) return { ok: false, reason: "min_subtotal" };
  const raw = coupon.type === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
  return { ok: true, coupon, discount: roundMoney(Math.min(subtotal, Math.max(0, raw))) };
}

export async function checkCoupon(code: string, subtotal: number) {
  return evaluateCoupon(await getCouponByCode(code), subtotal);
}

export type CouponInput = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal: number;
  maxUses: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  active: boolean;
  note: string;
};

export async function createCoupon(input: CouponInput) {
  const db = await getDb();
  const code = normalizeCode(input.code);
  if (!code) throw new Error("Code is required.");
  if (await getCouponByCode(code)) throw new Error("A coupon with this code already exists.");
  if (input.type === "percent" && (input.value <= 0 || input.value > 100)) {
    throw new Error("Percent must be between 1 and 100.");
  }
  await db.insert(coupons).values({ ...input, id: prefixedId("CP"), code });
}

export async function updateCoupon(id: string, input: Partial<CouponInput>) {
  const db = await getDb();
  const set = { ...input };
  if (set.code !== undefined) set.code = normalizeCode(set.code);
  await db.update(coupons).set(set).where(eq(coupons.id, id));
}

export async function deleteCoupon(id: string) {
  const db = await getDb();
  await db.delete(coupons).where(eq(coupons.id, id));
}

export async function incrementCouponUse(code: string) {
  const db = await getDb();
  await db
    .update(coupons)
    .set({ usedCount: sql`${coupons.usedCount} + 1` })
    .where(eq(coupons.code, normalizeCode(code)));
}
