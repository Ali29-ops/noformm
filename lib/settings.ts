import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { settings as settingsTable } from "./db/schema";

export type StoreSettings = {
  currency: string;
  currencyLocaleEn: string;
  currencyLocaleAr: string;
  taxRate: number; // percent, e.g. 14 for Egyptian VAT
  pricesIncludeTax: boolean;
  shippingDefaultFee: number;
  freeShippingOver: number; // 0 = never
  depositPercent: number; // share of the total required to confirm an order (50 = half)
  depositHoldHours: number; // how long a pending order waits for its deposit before expiring; 0 = never
  balanceOnDelivery: boolean; // remaining balance collected in cash on delivery (else before shipping)
  bankTransferEnabled: boolean;
  bankTransferInstructionsEn: string;
  bankTransferInstructionsAr: string;
  cardReservationMinutes: number;
  studioName: string;
  studioEmail: string;
  orderNotifyEmail: string;
  studioPhone: string;
  whatsapp: string;
  instagram: string;
  studioAddressEn: string;
  studioAddressAr: string;
  siteUrl: string;
  lowStockThreshold: number;
  returnsWindowDays: number;
};

export const defaultSettings: StoreSettings = {
  currency: "EGP",
  currencyLocaleEn: "en-EG",
  currencyLocaleAr: "ar-EG",
  taxRate: 0,
  pricesIncludeTax: true,
  shippingDefaultFee: 0,
  freeShippingOver: 0,
  depositPercent: 50,
  depositHoldHours: 48,
  balanceOnDelivery: true,
  bankTransferEnabled: true,
  bankTransferInstructionsEn:
    "Transfer the deposit to the studio account below (bank transfer or InstaPay) and reply to your confirmation email with the receipt.",
  bankTransferInstructionsAr:
    "حوّل قيمة العربون إلى حساب الاستوديو أدناه (تحويل بنكي أو إنستاباي) وأرسل صورة الإيصال ردّاً على بريد التأكيد.",
  cardReservationMinutes: 30,
  studioName: "NO FORM",
  studioEmail: "studio@noform.design",
  orderNotifyEmail: "studio@noform.design",
  studioPhone: "",
  whatsapp: "",
  instagram: "",
  studioAddressEn: "Cairo, Egypt",
  studioAddressAr: "القاهرة، مصر",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  lowStockThreshold: 2,
  returnsWindowDays: 14,
};

export async function getSettings(): Promise<StoreSettings> {
  const db = await getDb();
  const rows = await db.select().from(settingsTable);
  const merged: Record<string, unknown> = { ...defaultSettings };
  for (const row of rows) {
    if (row.key in defaultSettings) merged[row.key] = row.value;
  }
  return merged as StoreSettings;
}

export async function saveSettings(patch: Partial<StoreSettings>) {
  const db = await getDb();
  const updatedAt = new Date().toISOString();
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in defaultSettings) || value === undefined) continue;
    await db
      .insert(settingsTable)
      .values({ key, value, updatedAt })
      .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt } });
  }
}

export async function getSettingValue<K extends keyof StoreSettings>(key: K): Promise<StoreSettings[K]> {
  const db = await getDb();
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
  return (row ? (row.value as StoreSettings[K]) : defaultSettings[key]);
}

export function cardPaymentsConfigured() {
  return Boolean(process.env.PAYMOB_API_KEY && process.env.PAYMOB_INTEGRATION_ID);
}

export function shippingApiConfigured() {
  return Boolean(process.env.BOSTA_API_KEY);
}

export function toWhatsAppDigits(raw: string): string {
  let digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length >= 10) digits = `20${digits.slice(1)}`;
  return digits;
}

export function studioWhatsAppDigits(settings: StoreSettings): string {
  return toWhatsAppDigits(settings.whatsapp || settings.studioPhone);
}
