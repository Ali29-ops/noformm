import { productFacts, type SwatchOption } from "./product-facts";

export type { SwatchOption };

export const productColors: Record<string, readonly SwatchOption[]> = Object.fromEntries(
  Object.entries(productFacts).map(([slug, facts]) => [slug, facts.colors]),
);

export const productMaterials: Record<string, readonly SwatchOption[]> = Object.fromEntries(
  Object.entries(productFacts).map(([slug, facts]) => [slug, facts.materials]),
);

export type SwatchSource = {
  slug: string;
  colorSwatches?: readonly SwatchOption[] | "none" | null;
  materialSwatches?: readonly SwatchOption[] | "none" | null;
};

export function colorsFor(slug: string) {
  return productColors[slug] ?? [];
}

export function materialsFor(slug: string) {
  return productMaterials[slug] ?? [];
}

export function resolveColors(product: SwatchSource): SwatchOption[] {
  // An empty legacy array inherits the studio defaults. "none" records an explicit removal.
  if (product.colorSwatches === "none") return [];
  if (product.colorSwatches?.length) return [...product.colorSwatches];
  return [...(productColors[product.slug] ?? [])];
}

export function resolveMaterials(product: SwatchSource): SwatchOption[] {
  if (product.materialSwatches === "none") return [];
  if (product.materialSwatches?.length) return [...product.materialSwatches];
  return [...(productMaterials[product.slug] ?? [])];
}

function nameFrom(options: readonly SwatchOption[], id: string | undefined, locale: string) {
  if (!id) return "";
  const match = options.find((item) => item.id === id);
  if (!match) return "";
  return locale === "ar" ? match.ar : match.en;
}

function nameIn(sets: Record<string, readonly SwatchOption[]>, id: string | undefined, locale: string) {
  if (!id) return "";
  for (const options of Object.values(sets)) {
    const match = nameFrom(options, id, locale);
    if (match) return match;
  }
  return id;
}

export function colorName(id: string | undefined, locale: string, extras: readonly SwatchOption[] = []) {
  return nameFrom(extras, id, locale) || nameIn(productColors, id, locale);
}

export function materialName(id: string | undefined, locale: string, extras: readonly SwatchOption[] = []) {
  return nameFrom(extras, id, locale) || nameIn(productMaterials, id, locale);
}

export function materialLegendKey(slug: string) {
  if (slug === "fringes-pouf") return "tassels";
  if (slug === "tiled-bench" || slug === "wave-coffee-table" || slug === "lobe-coffee-table" || slug === "sphere-bench") return "wood";
  if (slug === "folded-pouf" || slug === "lounge-chair") return "leather";
  if (slug === "steel-lounge-chair") return "steel";
  if (slug === "backgammon-table") return "pvc";
  if (slug === "tiled-coffee-table" || slug === "commode" || slug === "stem-side-table") return "veneer";
  return "materials";
}

export function colorLegendKey(slug: string) {
  if (
    slug === "fringes-pouf" ||
    slug === "steel-lounge-chair" ||
    slug === "folded-pouf" ||
    slug === "sphere-ottoman" ||
    slug === "commode" ||
    slug === "sphere-bench"
  ) {
    return "fabric";
  }
  if (slug === "backgammon-table") return "veneer";
  if (slug === "lounge-chair") return "wood";
  return "color";
}

export function lineKey(slug: string, color?: string, material?: string) {
  return [slug, color ?? "", material ?? ""].join("::");
}

const HEX = /^#([0-9a-fA-F]{6})$/;

function uniqueId(value: string, used: Set<string>) {
  let base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  if (!base) base = "option";
  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

export function parseSwatches(raw: string): SwatchOption[] {
  if (!raw.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Colour or material options are invalid.");
  }
  if (!Array.isArray(parsed)) throw new Error("Colour or material options are invalid.");
  const used = new Set<string>();
  const out: SwatchOption[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const row = item as {
      id?: unknown;
      hex?: unknown;
      en?: unknown;
      ar?: unknown;
      image?: unknown;
      productImage?: unknown;
    };
    const en = String(row.en ?? "").trim();
    const ar = String(row.ar ?? "").trim();
    const hexRaw = String(row.hex ?? "").trim();
    if (!en && !ar && !hexRaw) continue;
    if (!en) throw new Error("Each colour or material needs an English name.");
    const hex = hexRaw.startsWith("#") ? hexRaw : `#${hexRaw}`;
    if (!HEX.test(hex)) throw new Error(`“${en}” needs a valid hex colour, like #8b5a2b.`);
    const given = String(row.id ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-|-$/g, "");
    const image = String(row.image ?? "").trim();
    const productImage = String(row.productImage ?? "").trim();
    const publicPath = (value: string) =>
      value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://");
    out.push({
      id: given && !used.has(given) ? (used.add(given), given) : uniqueId(en, used),
      hex: hex.toLowerCase(),
      en,
      ar: ar || en,
      ...(publicPath(image) ? { image } : {}),
      ...(publicPath(productImage) ? { productImage } : {}),
    });
  }
  return out;
}
