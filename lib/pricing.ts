import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { shippingRates } from "./db/schema";
import { roundMoney } from "./money";
import type { StoreSettings } from "./settings";

export type Totals = {
  subtotal: number;
  shippingFee: number;
  discount: number;
  tax: number;
  total: number;
  freeShipping: boolean;
  depositPercent: number;
  /** Amount that must be paid to confirm the order. */
  depositAmount: number;
  /** Remaining amount, collected on delivery or before shipping. */
  balanceAmount: number;
};

export async function shippingFeeFor(governorate: string, settings: StoreSettings) {
  const db = await getDb();
  const [rate] = await db.select().from(shippingRates).where(eq(shippingRates.governorate, governorate));
  if (rate && rate.active && rate.fee > 0) return rate.fee;
  return settings.shippingDefaultFee;
}

export function depositFor(total: number, depositPercent: number) {
  const percent = Math.min(100, Math.max(0, depositPercent));
  return roundMoney((total * percent) / 100);
}

export function computeTotals(input: {
  subtotal: number;
  shippingFee: number;
  discount: number;
  settings: StoreSettings;
}): Totals {
  const { settings } = input;
  const subtotal = roundMoney(input.subtotal);
  const discount = roundMoney(Math.min(subtotal, input.discount));
  const discounted = subtotal - discount;
  const freeShipping = settings.freeShippingOver > 0 && discounted >= settings.freeShippingOver;
  const shippingFee = freeShipping ? 0 : roundMoney(input.shippingFee);
  const tax =
    settings.taxRate > 0 && !settings.pricesIncludeTax
      ? roundMoney((discounted * settings.taxRate) / 100)
      : 0;
  const total = roundMoney(discounted + shippingFee + tax);
  const depositPercent = Math.min(100, Math.max(0, settings.depositPercent));
  const depositAmount = depositFor(total, depositPercent);
  const balanceAmount = roundMoney(total - depositAmount);
  return { subtotal, shippingFee, discount, tax, total, freeShipping, depositPercent, depositAmount, balanceAmount };
}
