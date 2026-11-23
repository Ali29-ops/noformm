export type SwatchOption = {
  id: string;
  hex: string;
  en: string;
  ar: string;
  /** Small circle shown in the swatch picker. */
  image?: string;
  /** Full product photo shown in the hero when this swatch is selected. */
  productImage?: string;
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

const poufFabrics: SwatchOption[] = [
  { id: "oasis-checkered", hex: "#d9d4cc", en: "Oasis Checkered", ar: "واحة مربعات", image: "/catalog/sphere/pouf-fabrics/oasis-checkered.png" },
  { id: "geometric-jacquard", hex: "#c4a05a", en: "Geometric Jacquard", ar: "جاكار هندسي", image: "/catalog/sphere/pouf-fabrics/geometric-jacquard.png" },
  { id: "the-hills", hex: "#c5c0b4", en: "The Hills", ar: "ذا هيلز", image: "/catalog/sphere/pouf-fabrics/the-hills.png" },
  { id: "youshi", hex: "#d8cbb8", en: "Youshi", ar: "يوشي", image: "/catalog/sphere/pouf-fabrics/youshi.png" },
  { id: "deeja", hex: "#c4b49a", en: "Deeja", ar: "ديجا", image: "/catalog/sphere/pouf-fabrics/deeja.png" },
  { id: "oran", hex: "#8aa0ae", en: "Oran", ar: "وهران", image: "/catalog/sphere/pouf-fabrics/oran.png" },
  { id: "new-london", hex: "#ddd4c4", en: "New London", ar: "نيو لندن", image: "/catalog/sphere/pouf-fabrics/new-london.png" },
  { id: "carla", hex: "#8a7568", en: "Carla", ar: "كارلا", image: "/catalog/sphere/pouf-fabrics/carla.png" },
];

const commodeVeneers: SwatchOption[] = [
  { id: "walnut", hex: "#8a5a2b", en: "Walnut veneer", ar: "قشرة جوز", image: "/catalog/sphere/commode/swatches/walnut.png" },
  { id: "oak", hex: "#d7b072", en: "Oak veneer", ar: "قشرة بلوط", image: "/catalog/sphere/commode/swatches/oak.png" },
  { id: "apple", hex: "#e6c48a", en: "Apple veneer", ar: "قشرة تفاح", image: "/catalog/sphere/commode/swatches/apple.png" },
  { id: "vavona", hex: "#a86a3a", en: "Vavona", ar: "فافونا", image: "/catalog/sphere/commode/swatches/vavona.png" },
];

const sphereWood: SwatchOption[] = [
  { id: "walnut", hex: "#6b3e1e", en: "Walnut", ar: "جوز", image: "/catalog/sphere/wood-finishes/walnut.png" },
  { id: "oak", hex: "#d7b072", en: "Oak", ar: "بلوط", image: "/catalog/sphere/wood-finishes/oak.png" },
];

function withViews(options: readonly SwatchOption[], views: Record<string, string>): SwatchOption[] {
  return options.map((option) => (views[option.id] ? { ...option, productImage: views[option.id] } : { ...option }));
}

export const productFacts: Record<string, ProductFacts> = {
  "folded-pouf": {
    width: 45,
    depth: 45,
    height: 48,
    colors: poufFabrics,
    materials: withViews(
      [
        { id: "brown", hex: "#6b4a3a", en: "Leather brown", ar: "جلد بني", image: "/catalog/sphere/folded-pouf/swatches/leather-brown.png" },
        { id: "burgundy", hex: "#5c2430", en: "Leather burgundy", ar: "جلد عنابي", image: "/catalog/sphere/folded-pouf/swatches/leather-burgundy.png" },
        { id: "mint", hex: "#b7d2c4", en: "Leather mint", ar: "جلد نعناعي", image: "/catalog/sphere/folded-pouf/swatches/leather-mint.png" },
        { id: "camel", hex: "#e0b07a", en: "Leather camel", ar: "جلد جملي", image: "/catalog/sphere/folded-pouf/swatches/leather-camel.png" },
        { id: "terracotta", hex: "#a75033", en: "Terracotta leather", ar: "جلد تراكوتا", image: "/catalog/sphere/folded-pouf/swatches/leather-terracotta.png" },
        { id: "beige", hex: "#9e887a", en: "Beige leather", ar: "جلد بيج", image: "/catalog/sphere/folded-pouf/swatches/leather-beige.png" },
      ],
      {
        brown: "/catalog/sphere/folded-pouf/views/brown.jpg",
        burgundy: "/catalog/sphere/folded-pouf/views/burgundy.jpg",
        mint: "/catalog/sphere/folded-pouf/views/mint.png",
        terracotta: "/catalog/sphere/folded-pouf/views/terracotta.png",
        beige: "/catalog/sphere/folded-pouf/views/beige.jpg",
      },
    ),
  },
  "sphere-ottoman": {
    diameter: 50,
    height: 45,
    colors: poufFabrics,
    materials: [],
  },
  "wave-coffee-table": {
    width: 140,
    depth: 75,
    height: 40,
    colors: [],
    materials: sphereWood,
  },
  "orbit-coffee-table": {
    width: 132,
    depth: 124,
    height: 47,
    colors: withViews(woodTones, {
      walnut: "/catalog/sphere/orbit-coffee-table/views/walnut.png",
    }),
    materials: [beechWood],
  },
  "coffee-table-iii": {
    width: 140,
    depth: 50,
    height: 83,
    colors: [
      { id: "sage", hex: "#7d8f62", en: "Sage", ar: "مريمي" },
      { id: "walnut", hex: "#6b4423", en: "Walnut", ar: "جوز", productImage: "/catalog/sphere/coffee-table-iii/views/walnut-bubble.png" },
      { id: "oak", hex: "#d7b072", en: "Oak", ar: "بلوط", productImage: "/catalog/sphere/coffee-table-iii/views/oak-soft-light.png" },
    ],
    materials: [beechWood],
  },
  "lounge-chair": {
    width: 70,
    depth: 97,
    height: 85,
    colors: sphereWood,
    materials: [
      { id: "brown", hex: "#6b4a3a", en: "Leather brown", ar: "جلد بني", image: "/catalog/sphere/lounge-chair/swatches/leather-brown.png", productImage: "/catalog/sphere/lounge-chair/leather-brown.png" },
      { id: "burgundy", hex: "#5c2430", en: "Leather burgundy", ar: "جلد عنابي", image: "/catalog/sphere/lounge-chair/swatches/leather-burgundy.png", productImage: "/catalog/sphere/lounge-chair/leather-burgundy.png" },
      { id: "mint", hex: "#b7d2c4", en: "Leather mint", ar: "جلد نعناعي", image: "/catalog/sphere/lounge-chair/swatches/leather-mint.png", productImage: "/catalog/sphere/lounge-chair/leather-mint.png" },
      { id: "camel", hex: "#e0b07a", en: "Leather camel", ar: "جلد جملي", image: "/catalog/sphere/lounge-chair/swatches/leather-camel.png", productImage: "/catalog/sphere/lounge-chair/leather-camel-beige.png" },
      { id: "green", hex: "#5f6b45", en: "Leather green", ar: "جلد أخضر", image: "/catalog/sphere/lounge-chair/swatches/leather-green.png" },
    ],
  },
  "lobe-coffee-table": {
    width: 140,
    depth: 90,
    height: 35,
    colors: [],
    materials: sphereWood,
  },
  "sphere-bench": {
    width: 170,
    depth: 45,
    height: 45,
    colors: [
      { id: "geometric-jacquard", hex: "#c45c28", en: "Geometric Jacquard", ar: "جاكار هندسي", image: "/catalog/sphere/sphere-bench/swatches/fabric/geometric.png" },
      { id: "new-london", hex: "#ddd4c4", en: "New London", ar: "نيو لندن", image: "/catalog/sphere/sphere-bench/swatches/fabric/new-london.png", productImage: "/catalog/sphere/sphere-bench/views/new-london.png" },
      { id: "oasis-checkered", hex: "#d9d4cc", en: "Oasis Checkered", ar: "واحة مربعات", image: "/catalog/sphere/sphere-bench/swatches/fabric/oasis-checkered.png", productImage: "/catalog/sphere/sphere-bench/views/oasis-checkered.png" },
      { id: "olive", hex: "#5c6b32", en: "Olive", ar: "زيتوني", image: "/catalog/sphere/sphere-bench/swatches/fabric/olive.png", productImage: "/catalog/sphere/sphere-bench/views/olive.png" },
      { id: "oran", hex: "#c5b56a", en: "Oran", ar: "وهران", image: "/catalog/sphere/sphere-bench/swatches/fabric/oran.png", productImage: "/catalog/sphere/sphere-bench/views/oran.png" },
      { id: "the-hills", hex: "#c5c0b4", en: "The Hills", ar: "ذا هيلز", image: "/catalog/sphere/sphere-bench/swatches/fabric/the-hills.png", productImage: "/catalog/sphere/sphere-bench/views/the-hills.png" },
      { id: "carla", hex: "#8a7568", en: "Carla", ar: "كارلا", image: "/catalog/sphere/sphere-bench/swatches/fabric/carla.png", productImage: "/catalog/sphere/sphere-bench/views/carla.png" },
      { id: "cedar-brown", hex: "#6b4e3a", en: "Cedar Brown", ar: "بني أرز", image: "/catalog/sphere/sphere-bench/swatches/fabric/cedar-brown.png", productImage: "/catalog/sphere/sphere-bench/views/cedar-brown.png" },
    ],
    materials: sphereWood,
  },
  commode: {
    width: 50,
    depth: 50,
    height: 50,
    colors: poufFabrics,
    materials: withViews(commodeVeneers, {
      apple: "/catalog/sphere/commode/views/apple.png",
      oak: "/catalog/sphere/commode/views/oak.png",
    }),
  },
  "stem-side-table": {
    width: 40,
    depth: 40,
    height: 55,
    colors: [],
    materials: withViews(commodeVeneers, {
      walnut: "/catalog/sphere/stem-side-table/views/walnut.png",
    }),
  },
  "tiled-coffee-table": {
    width: 88,
    depth: 90,
    height: 35,
    colors: [
      { id: "blue", hex: "#1d4e9c", en: "Blue tile", ar: "بلاط أزرق", image: "/catalog/tiles/tiled-coffee-table/swatches/tile-blue.png" },
      { id: "green", hex: "#1f6b4a", en: "Green tile", ar: "بلاط أخضر", image: "/catalog/tiles/tiled-coffee-table/swatches/tile-green.png" },
    ],
    materials: [
      { id: "walnut", hex: "#8a5a2b", en: "Walnut veneer", ar: "قشرة جوز", image: "/catalog/tiles/tiled-coffee-table/swatches/wood-walnut.png" },
      { id: "oak", hex: "#d7b072", en: "Oak veneer", ar: "قشرة بلوط", image: "/catalog/tiles/tiled-coffee-table/swatches/wood-oak.png" },
      { id: "apple", hex: "#e6c48a", en: "Apple veneer", ar: "قشرة تفاح", image: "/catalog/tiles/tiled-coffee-table/swatches/wood-apple.png" },
      { id: "veneer-7", hex: "#c47a3a", en: "Veneer 7", ar: "قشرة 7", image: "/catalog/tiles/tiled-coffee-table/swatches/wood-veneer-7.png" },
    ],
  },
  "steel-lounge-chair": {
    width: 65,
    depth: 76,
    height: 65,
    colors: [
      { id: "orange", hex: "#e25b2a", en: "Orange", ar: "برتقالي", image: "/catalog/retro/steel-lounge-chair/swatches/fabric-orange.png" },
      { id: "red", hex: "#d32b2b", en: "Red", ar: "أحمر", image: "/catalog/retro/steel-lounge-chair/swatches/fabric-red.png" },
      { id: "yellow", hex: "#f0c429", en: "Yellow", ar: "أصفر", image: "/catalog/retro/steel-lounge-chair/swatches/fabric-yellow.png" },
      { id: "charcoal", hex: "#3a3a3a", en: "Charcoal", ar: "فحمي", image: "/catalog/retro/steel-lounge-chair/swatches/fabric-charcoal.png" },
      { id: "lime", hex: "#b6c94a", en: "Lime", ar: "ليموني", image: "/catalog/retro/steel-lounge-chair/swatches/fabric-lime.png" },
      { id: "teal", hex: "#1f7a72", en: "Teal", ar: "تركوازي", image: "/catalog/retro/steel-lounge-chair/swatches/fabric-teal.png" },
      { id: "green", hex: "#3e8f4a", en: "Green", ar: "أخضر", image: "/catalog/retro/steel-lounge-chair/swatches/fabric-green.png" },
      { id: "turquoise", hex: "#2aa7b8", en: "Turquoise", ar: "فيروزي", image: "/catalog/retro/steel-lounge-chair/swatches/fabric-turquoise.png" },
      { id: "blue", hex: "#2f5fbf", en: "Blue", ar: "أزرق", image: "/catalog/retro/steel-lounge-chair/swatches/fabric-blue.png" },
      { id: "burgundy", hex: "#8d2438", en: "Burgundy", ar: "عنابي", image: "/catalog/retro/steel-lounge-chair/swatches/fabric-burgundy.png" },
      { id: "apple-green", hex: "#8fbf3a", en: "Apple green", ar: "أخضر تفاحي", image: "/catalog/retro/steel-lounge-chair/swatches/fabric-apple-green.png" },
      { id: "sunflower", hex: "#f0b429", en: "Sunflower", ar: "دوار الشمس", image: "/catalog/retro/steel-lounge-chair/swatches/fabric-sunflower.png" },
      { id: "grey", hex: "#8d8d8d", en: "Grey", ar: "رمادي", image: "/catalog/retro/steel-lounge-chair/swatches/fabric-grey.png" },
    ],
    materials: [
      { id: "orange", hex: "#e44d16", en: "Orange", ar: "برتقالي" },
      { id: "red", hex: "#da1b11", en: "Red", ar: "أحمر" },
      { id: "yellow", hex: "#ffbe02", en: "Yellow", ar: "أصفر" },
      { id: "charcoal", hex: "#404040", en: "Charcoal", ar: "فحمي" },
      { id: "lime", hex: "#acc141", en: "Lime", ar: "ليموني" },
      { id: "teal", hex: "#0d7470", en: "Teal", ar: "تركوازي" },
      { id: "green", hex: "#1a5a37", en: "Green", ar: "أخضر" },
      { id: "turquoise", hex: "#038ea2", en: "Turquoise", ar: "فيروزي" },
      { id: "blue", hex: "#0c3998", en: "Blue", ar: "أزرق" },
      { id: "burgundy", hex: "#861527", en: "Burgundy", ar: "عنابي" },
      { id: "apple-green", hex: "#a4b938", en: "Apple green", ar: "أخضر تفاحي" },
      { id: "sunflower", hex: "#fba905", en: "Sunflower", ar: "دوار الشمس" },
      { id: "grey", hex: "#7f7f7f", en: "Grey", ar: "رمادي" },
    ],
  },
  "tiled-bench": {
    width: 190,
    depth: 60,
    height: 40,
    colors: [
      { id: "terracotta", hex: "#d96a1e", en: "Terracotta", ar: "تيراكوتا", image: "/catalog/tiles/tiled-bench/swatches/tile-terracotta.png" },
      { id: "brown", hex: "#a86a3a", en: "Brown", ar: "بني", image: "/catalog/tiles/tiled-bench/swatches/tile-brown.png" },
      { id: "pink", hex: "#e7c4c4", en: "Pink", ar: "وردي", image: "/catalog/tiles/tiled-bench/swatches/tile-pink.png" },
      { id: "green", hex: "#3f8f28", en: "Green", ar: "أخضر", image: "/catalog/tiles/tiled-bench/swatches/tile-green.png" },
      { id: "sage", hex: "#a8b58a", en: "Sage", ar: "مريمي", image: "/catalog/tiles/tiled-bench/swatches/tile-sage.png" },
    ],
    materials: [
      { id: "walnut", hex: "#6b4423", en: "Walnut", ar: "جوز", image: "/catalog/tiles/tiled-bench/swatches/wood-walnut.png" },
      { id: "oak", hex: "#c4a36a", en: "Oak", ar: "بلوط", image: "/catalog/tiles/tiled-bench/swatches/wood-oak.png" },
    ],
  },
  "fringes-pouf": {
    diameter: 45,
    height: 45,
    colors: [
      { id: "ivory", hex: "#f3efe4", en: "Ivory", ar: "عاجي", image: "/catalog/fringes/fringes-pouf/swatches/fabric-ivory.png" },
      { id: "beige", hex: "#c4ae90", en: "Beige", ar: "بيج", image: "/catalog/fringes/fringes-pouf/swatches/fabric-beige.png" },
      { id: "brown", hex: "#6a3a28", en: "Brown", ar: "بني", image: "/catalog/fringes/fringes-pouf/swatches/fabric-brown.png" },
      { id: "olive", hex: "#6d7034", en: "Olive", ar: "زيتوني", image: "/catalog/fringes/fringes-pouf/swatches/fabric-olive.png" },
      { id: "pink", hex: "#d4899a", en: "Pink", ar: "وردي", image: "/catalog/fringes/fringes-pouf/swatches/fabric-pink.png" },
      { id: "navy", hex: "#1c2d6b", en: "Navy", ar: "كحلي", image: "/catalog/fringes/fringes-pouf/swatches/fabric-navy.png" },
      { id: "orange", hex: "#e15a22", en: "Orange", ar: "برتقالي", image: "/catalog/fringes/fringes-pouf/swatches/fabric-orange.png" },
    ],
    materials: [
      { id: "gold", hex: "#c6a15a", en: "Gold", ar: "ذهبي", image: "/catalog/fringes/fringes-pouf/swatches/tassel-gold.png" },
      { id: "plum", hex: "#5c3048", en: "Plum", ar: "برقوقي", image: "/catalog/fringes/fringes-pouf/swatches/tassel-plum.png" },
      { id: "burgundy", hex: "#8d2438", en: "Burgundy", ar: "عنابي", image: "/catalog/fringes/fringes-pouf/swatches/tassel-burgundy.png" },
      { id: "navy", hex: "#1a2744", en: "Navy", ar: "كحلي", image: "/catalog/fringes/fringes-pouf/swatches/tassel-navy.png" },
      { id: "cream", hex: "#e6d7c3", en: "Cream", ar: "كريمي", image: "/catalog/fringes/fringes-pouf/swatches/tassel-cream.png" },
      { id: "teal", hex: "#1f7c78", en: "Teal", ar: "تركوازي", image: "/catalog/fringes/fringes-pouf/swatches/tassel-teal.png" },
      { id: "brown", hex: "#5c3a22", en: "Brown", ar: "بني", image: "/catalog/fringes/fringes-pouf/swatches/tassel-brown.png" },
    ],
  },
  "tiled-pouf": {
    width: 55,
    depth: 55,
    height: 45,
    colors: tileColors,
    materials: [mosaic, upholstery],
  },
  "backgammon-table": {
    width: 62,
    depth: 62,
    height: 60,
    colors: [
      { id: "veneer-01", hex: "#7fa8a4", en: "Veneer 01", ar: "قشرة 01", image: "/catalog/tiles/backgammon-table/swatches/veneer-01.png" },
      { id: "veneer-02", hex: "#6b4423", en: "Veneer 02", ar: "قشرة 02", image: "/catalog/tiles/backgammon-table/swatches/veneer-02.png" },
      { id: "veneer-03", hex: "#c4a36a", en: "Veneer 03", ar: "قشرة 03", image: "/catalog/tiles/backgammon-table/swatches/veneer-03.png" },
      { id: "veneer-04", hex: "#d8c4a0", en: "Veneer 04", ar: "قشرة 04", image: "/catalog/tiles/backgammon-table/swatches/veneer-04.png" },
      { id: "oak", hex: "#c9a36a", en: "Oak", ar: "بلوط", image: "/catalog/tiles/backgammon-table/swatches/veneer-oak.png" },
      { id: "veneer-05", hex: "#8a6239", en: "Veneer 05", ar: "قشرة 05", image: "/catalog/tiles/backgammon-table/swatches/veneer-05.png" },
      { id: "veneer-06", hex: "#6b5a3e", en: "Veneer 06", ar: "قشرة 06", image: "/catalog/tiles/backgammon-table/swatches/veneer-06.png" },
      { id: "veneer-07", hex: "#a87858", en: "Veneer 07", ar: "قشرة 07", image: "/catalog/tiles/backgammon-table/swatches/veneer-07.png" },
      { id: "veneer-08", hex: "#9a3030", en: "Veneer 08", ar: "قشرة 08", image: "/catalog/tiles/backgammon-table/swatches/veneer-08.png" },
    ],
    materials: [
      { id: "beige", hex: "#e6d3b8", en: "PVC beige", ar: "بيج PVC", image: "/catalog/tiles/backgammon-table/swatches/pvc-beige.png" },
      { id: "brown", hex: "#6b4228", en: "PVC brown", ar: "بني PVC", image: "/catalog/tiles/backgammon-table/swatches/pvc-brown.png" },
    ],
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
