import type { OrderRow } from "../db/schema";
import type { GovernorateId } from "../egypt";

const DEFAULT_URL = "https://app.bosta.co/api/v2";

/** Bosta's own city codes for each checkout governorate. */
const cityCodes: Record<GovernorateId, string> = {
  cairo: "EG-01",
  giza: "EG-25",
  alexandria: "EG-02",
  qalyubia: "EG-06",
  sharqia: "EG-10",
  dakahlia: "EG-05",
  beheira: "EG-04",
  gharbia: "EG-07",
  monufia: "EG-09",
  "kafr-el-sheikh": "EG-08",
  damietta: "EG-14",
  "port-said": "EG-13",
  ismailia: "EG-11",
  suez: "EG-12",
  "north-sinai": "EG-27",
  "south-sinai": "EG-26",
  matrouh: "EG-28",
  faiyum: "EG-15",
  "beni-suef": "EG-16",
  minya: "EG-19",
  asyut: "EG-17",
  sohag: "EG-18",
  qena: "EG-20",
  luxor: "EG-22",
  aswan: "EG-21",
  "red-sea": "EG-23",
  "new-valley": "EG-24",
};

export const bostaSizes = ["SMALL", "MEDIUM", "LARGE"] as const;
export type BostaSize = (typeof bostaSizes)[number];

/** Bosta caps cash on delivery per shipment. */
export const BOSTA_MAX_COD = 30000;

export class BostaError extends Error {}

type Envelope<T> = { success?: boolean; message?: string; data?: T; errorCode?: number };

async function bosta<T>(path: string, init: RequestInit & { revalidate?: number } = {}): Promise<T> {
  const key = process.env.BOSTA_API_KEY;
  if (!key) throw new BostaError("Bosta is not connected. Set BOSTA_API_KEY.");
  const base = (process.env.BOSTA_API_URL || DEFAULT_URL).replace(/\/$/, "");
  const { revalidate, ...rest } = init;
  const res = await fetch(`${base}${path}`, {
    ...rest,
    headers: { Authorization: key, "Content-Type": "application/json", ...rest.headers },
    ...(revalidate ? { next: { revalidate } } : { cache: "no-store" as const }),
  });
  const body = (await res.json().catch(() => ({}))) as Envelope<T>;
  if (!res.ok || body.success === false) {
    throw new BostaError(`Bosta: ${body.message || res.statusText || "request failed"} (${res.status})`);
  }
  return body.data as T;
}

type BostaCity = { _id: string; name: string; code: string; dropOffAvailability: boolean };

export type BostaDistrict = {
  zoneId: string;
  zoneName: string;
  zoneOtherName?: string;
  districtId: string;
  districtName: string;
  districtOtherName?: string;
  dropOffAvailability: boolean;
};

async function cityFor(governorate: string) {
  const code = cityCodes[governorate as GovernorateId];
  if (!code) throw new BostaError(`No Bosta city for governorate “${governorate}”.`);
  const data = await bosta<{ list: BostaCity[] }>("/cities", { revalidate: 86400 });
  const city = data.list.find((c) => c.code === code);
  if (!city) throw new BostaError(`Bosta has no city ${code}.`);
  if (!city.dropOffAvailability) throw new BostaError(`Bosta does not deliver to ${city.name}.`);
  return city;
}

export async function getBostaDistricts(governorate: string) {
  const city = await cityFor(governorate);
  const list = await bosta<BostaDistrict[]>(`/cities/${city._id}/districts`, { revalidate: 86400 });
  return list.filter((d) => d.dropOffAvailability);
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/\b(el|al)[\s-]?/g, "")
    .replace(/^ال/, "")
    .replace(/[^\p{L}\p{N}]/gu, "");

/** Best guess at the Bosta district for a free-text area / city. */
export function matchDistrict(districts: BostaDistrict[], ...hints: (string | undefined)[]) {
  for (const hint of hints) {
    const h = norm(hint ?? "");
    if (h.length < 3) continue;
    const names = (d: BostaDistrict) => [d.districtName, d.districtOtherName ?? ""].map(norm);
    const zones = (d: BostaDistrict) => [d.zoneName, d.zoneOtherName ?? ""].map(norm);
    const hit =
      districts.find((d) => names(d).includes(h)) ??
      districts.find((d) => zones(d).includes(h)) ??
      districts.find((d) => [...names(d), ...zones(d)].some((n) => n.length >= 3 && (n.includes(h) || h.includes(n))));
    if (hit) return hit;
  }
  for (const hint of hints) {
    const words = (hint ?? "").split(/[\s,\-]+/).map(norm).filter((w) => w.length >= 4);
    if (words.length === 0) continue;
    const hit = districts.find((d) =>
      [d.districtName, d.districtOtherName ?? "", d.zoneName, d.zoneOtherName ?? ""].some((n) => words.some((w) => norm(n).includes(w))),
    );
    if (hit) return hit;
  }
  return undefined;
}

/** Bosta wants a local Egyptian mobile: 01xxxxxxxxx. */
export function bostaPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0020")) return `0${digits.slice(4)}`;
  if (digits.startsWith("20") && digits.length === 12) return `0${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith("1")) return `0${digits}`;
  return digits;
}

export function bostaTrackingUrl(trackingNumber: string) {
  return `https://bosta.co/tracking-shipments?shipment-number=${encodeURIComponent(trackingNumber)}`;
}

export type CreatedDelivery = { _id: string; trackingNumber: string; state?: { code: number; value: string } };

export async function createBostaDelivery(
  order: OrderRow & { items: { quantity: number; name: string }[] },
  input: { districtId: string; size: BostaSize; cod: number; notes?: string; allowToOpenPackage: boolean; webhookUrl?: string },
) {
  const a = order.shippingAddress;
  const city = await cityFor(a.governorate);
  const [firstName, ...rest] = a.name.trim().split(/\s+/);
  const firstLine = [a.street, a.building && `Bldg ${a.building}`].filter(Boolean).join(", ");
  if (firstLine.length <= 5) throw new BostaError("The street address is too short for Bosta (more than 5 characters).");
  if (input.cod < 0 || input.cod > BOSTA_MAX_COD) {
    throw new BostaError(`Cash on delivery must be between 0 and ${BOSTA_MAX_COD} EGP for one Bosta shipment.`);
  }
  const phone = bostaPhone(order.customerPhone || a.phone);
  if (!/^01\d{9}$/.test(phone)) {
    throw new BostaError(`“${order.customerPhone || a.phone}” is not an Egyptian mobile Bosta accepts (01xxxxxxxxx). Fix the customer phone under Details.`);
  }
  const itemsCount = order.items.reduce((n, i) => n + i.quantity, 0);
  return bosta<CreatedDelivery>("/deliveries?apiVersion=1", {
    method: "POST",
    body: JSON.stringify({
      type: 10,
      businessReference: order.id,
      cod: input.cod,
      allowToOpenPackage: input.allowToOpenPackage,
      notes: [input.notes, a.landmark && `Landmark: ${a.landmark}`].filter(Boolean).join(" · ") || undefined,
      receiver: {
        firstName: firstName || a.name,
        lastName: rest.join(" ") || firstName || a.name,
        phone,
        ...(a.phone2 ? { secondPhone: bostaPhone(a.phone2) } : {}),
        email: order.customerEmail,
      },
      dropOffAddress: {
        city: city.code,
        districtId: input.districtId,
        firstLine,
        secondLine: [a.area, a.city].filter(Boolean).join(", ") || undefined,
        buildingNumber: a.building || undefined,
        floor: a.floor || undefined,
        apartment: a.apartment || undefined,
      },
      specs: {
        size: input.size,
        packageDetails: {
          itemsCount,
          description: order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ").slice(0, 200),
        },
      },
      ...(input.webhookUrl ? { webhookUrl: input.webhookUrl } : {}),
    }),
  });
}

export async function getBostaDelivery(trackingNumber: string) {
  return bosta<{ _id: string; trackingNumber: string; state?: { code: number; value: string }; cod?: number }>(
    `/deliveries/business/${encodeURIComponent(trackingNumber)}`,
  );
}

/** Airway bill for printing, as PDF bytes. */
export async function getBostaLabel(trackingNumber: string) {
  const data = await bosta<string | { data?: string }>(`/deliveries/mass-awb?trackingNumbers=${encodeURIComponent(trackingNumber)}`);
  const b64 = typeof data === "string" ? data : data?.data;
  if (!b64) throw new BostaError("Bosta returned no label.");
  return Buffer.from(b64, "base64");
}

export const BOSTA_DELIVERED = 45;

/** Human labels for Bosta's numeric delivery states. */
export const bostaStates: Record<number, string> = {
  10: "Pickup requested",
  11: "Waiting for route",
  20: "Route assigned",
  21: "Picked up from the studio",
  22: "Picking up",
  24: "Received at Bosta warehouse",
  25: "Fulfilled",
  30: "In transit between hubs",
  40: "Picking up from warehouse",
  41: "Out for delivery",
  45: "Delivered",
  46: "Returned to the studio",
  47: "Delivery exception",
  48: "Terminated",
  49: "Cancelled",
  60: "Returned to stock",
  100: "Lost",
  101: "Damaged",
  102: "Under investigation",
  103: "Awaiting your action",
  105: "On hold",
};
