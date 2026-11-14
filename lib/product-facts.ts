export type SwatchOption = {
  id: string;
  hex: string;
  en: string;
  ar: string;
};

export type ProductDims = {
  width?: number;
  depth?: number;
  height?: number;
  diameter?: number;
};

export type ProductFacts = ProductDims & {
  colors: SwatchOption[];
  materials: SwatchOption[];
};

export const studioColors: SwatchOption[] = [
  { id: "olive", hex: "#3d4a32", en: "Olive", ar: "زيتوني" },
  { id: "ivory", hex: "#e8e0d4", en: "Ivory", ar: "عاجي" },
  { id: "charcoal", hex: "#2c2c2a", en: "Charcoal", ar: "فحمي" },
  { id: "cognac", hex: "#8b5340", en: "Cognac", ar: "كونياك" },
  { id: "sand", hex: "#c4a574", en: "Sand", ar: "رملي" },
];

export const woodTones: SwatchOption[] = [
  { id: "beech", hex: "#c4a36a", en: "Beech", ar: "زان" },
  { id: "walnut", hex: "#6b4423", en: "Walnut", ar: "جوز" },
  { id: "ebonized", hex: "#2c2c2a", en: "Ebonized", ar: "أسود" },
];

export const tileColors: SwatchOption[] = [
  { id: "coral", hex: "#c46a5a", en: "Coral", ar: "مرجاني" },
  { id: "ivory", hex: "#e8e0d4", en: "Ivory", ar: "عاجي" },
  { id: "teal", hex: "#3d6b6b", en: "Teal", ar: "تركوازي" },
  { id: "charcoal", hex: "#2c2c2a", en: "Charcoal", ar: "فحمي" },
  { id: "sand", hex: "#c4a574", en: "Sand", ar: "رملي" },
];

export const steelColors: SwatchOption[] = [
  { id: "orange", hex: "#c45c28", en: "Orange", ar: "برتقالي" },
  { id: "ivory", hex: "#e8e0d4", en: "Ivory", ar: "عاجي" },
  { id: "charcoal", hex: "#2c2c2a", en: "Charcoal", ar: "فحمي" },
  { id: "sage", hex: "#6b7a5a", en: "Sage", ar: "مريمي" },
];

const wood: SwatchOption = { id: "wood", hex: "#8b5a2b", en: "Wood", ar: "خشب" };
const beechWood: SwatchOption = { id: "beech-wood", hex: "#c4a36a", en: "Beech wood", ar: "خشب الزان" };
const elastic: SwatchOption = {
  id: "elastic-band",
  hex: "#d4c4a8",
  en: "Durable elastic band",
  ar: "شريط مطاطي متين",
};
const luxuryUpholstery: SwatchOption = {
  id: "luxury-upholstery",
  hex: "#8b6f5a",
  en: "Luxurious upholstery",
  ar: "تنجيد فاخر",
};
const leatherUpholstery: SwatchOption = {
  id: "leather-upholstery",
  hex: "#6b4e3d",
  en: "Luxurious leather upholstery",
  ar: "تنجيد جلدي فاخر",
};
const upholstery: SwatchOption = { id: "upholstery", hex: "#8b7a68", en: "Upholstery", ar: "تنجيد" };
const glass: SwatchOption = { id: "glass", hex: "#c5d5d8", en: "Glass", ar: "زجاج" };
const mosaic: SwatchOption = { id: "mosaic", hex: "#8a6b5a", en: "Mosaic", ar: "فسيفساء" };
const foam: SwatchOption = {
  id: "high-density-foam",
  hex: "#d8cfc4",
  en: "High-density foam",
  ar: "إسفنج عالي الكثافة",
};
const premiumTiles: SwatchOption = { id: "premium-tiles", hex: "#b85c45", en: "Premium tiles", ar: "بلاط فاخر" };
const steel: SwatchOption = { id: "steel", hex: "#6d7278", en: "Steel", ar: "فولاذ" };
const pvcLeather: SwatchOption = {
  id: "pvc-leather",
  hex: "#2c2c2a",
  en: "Premium PVC leather finish",
  ar: "تشطيب جلد PVC فاخر",
};
const italianVeneer: SwatchOption = {
  id: "italian-veneer",
  hex: "#9a6b3d",
  en: "Italian wood veneer",
  ar: "قشرة خشب إيطالية",
};

export const productFacts: Record<string, ProductFacts> = {
  "folded-pouf": {
    width: 40,
    depth: 40,
    height: 48,
    colors: studioColors,
    materials: [wood, elastic, luxuryUpholstery],
  },
  "sphere-ottoman": {
    width: 50,
    depth: 50,
    height: 45,
    colors: studioColors,
    materials: [wood, elastic, leatherUpholstery],
  },
  "wave-coffee-table": {
    width: 140,
    depth: 75,
    height: 40,
    colors: woodTones,
    materials: [glass, beechWood],
  },
  "orbit-coffee-table": {
    width: 132,
    depth: 124,
    height: 47,
    colors: woodTones,
    materials: [beechWood],
  },
  "coffee-table-iii": {
    width: 120,
    depth: 30,
    height: 90,
    colors: woodTones,
    materials: [beechWood],
  },
  "lounge-chair": {
    width: 70,
    depth: 97,
    height: 85,
    colors: studioColors,
    materials: [wood, elastic, leatherUpholstery],
  },
  "lobe-coffee-table": {
    width: 95,
    depth: 138,
    height: 40,
    colors: tileColors,
    materials: [mosaic, upholstery],
  },
  "sphere-bench": {
    width: 190,
    depth: 40,
    height: 48,
    colors: studioColors,
    materials: [beechWood, foam, luxuryUpholstery],
  },
  commode: {
    width: 45,
    depth: 45,
    height: 50,
    colors: studioColors,
    materials: [upholstery, beechWood],
  },
  "tiled-coffee-table": {
    width: 88,
    depth: 88,
    height: 35,
    colors: tileColors,
    materials: [premiumTiles, wood],
  },
  "steel-lounge-chair": {
    width: 60,
    depth: 65,
    height: 28,
    colors: steelColors,
    materials: [steel, upholstery],
  },
  "tiled-bench": {
    width: 192,
    depth: 55,
    height: 45,
    colors: tileColors,
    materials: [premiumTiles, upholstery, wood],
  },
  "fringes-pouf": {
    diameter: 50,
    height: 45,
    colors: studioColors,
    materials: [upholstery],
  },
  "tiled-pouf": {
    width: 55,
    depth: 55,
    height: 45,
    colors: tileColors,
    materials: [mosaic, upholstery],
  },
  "backgammon-table": {
    width: 61,
    depth: 61,
    height: 74,
    colors: studioColors,
    materials: [pvcLeather, italianVeneer],
  },
};

export function dimsFor(product: {
  slug: string;
  widthCm?: number | null;
  depthCm?: number | null;
  heightCm?: number | null;
}) {
  const facts = productFacts[product.slug];
  return {
    width: product.widthCm ?? facts?.width ?? null,
    depth: product.depthCm ?? facts?.depth ?? null,
    height: product.heightCm ?? facts?.height ?? null,
    diameter: facts?.diameter ?? null,
  };
}
