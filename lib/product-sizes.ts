type SizeOption = { id: string; en: string; ar: string; width: number; backHeight: number; seatHeight: number };

const foldedPoufSizes: readonly SizeOption[] = [
  { id: "long", en: "Tall", width: 45, backHeight: 78, seatHeight: 45, ar: "طويل" },
  { id: "short", en: "Short", width: 45, backHeight: 48, seatHeight: 45, ar: "قصير" },
] as const;

export function sizesFor(slug: string) {
  return slug === "folded-pouf" ? foldedPoufSizes : [];
}

export function sizeLabel(slug: string, size: string | undefined, locale: string) {
  return sizesFor(slug).find((option) => option.id === size)?.[locale === "ar" ? "ar" : "en"] ?? "";
}
