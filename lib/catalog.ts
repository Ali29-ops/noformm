import images from "./images.json";

export const collectionIds = ["sphere", "retro", "tiles", "fringes"] as const;
export type CollectionId = (typeof collectionIds)[number];

export type ProductId =
  | "sphere-bench"
  | "lounge-chair"
  | "commode"
  | "folded-pouf"
  | "sphere-ottoman"
  | "orbit-coffee-table"
  | "coffee-table-iii"
  | "lobe-coffee-table"
  | "wave-coffee-table"
  | "stem-side-table"
  | "tiled-bench"
  | "tiled-coffee-table"
  | "tiled-pouf"
  | "backgammon-table"
  | "fringes-pouf"
  | "steel-lounge-chair";

export type Product = {
  slug: ProductId;
  collection: CollectionId;
  images: readonly string[];
};

export type CampaignSceneId = "at-home" | "by-the-pool" | "in-the-field" | "at-the-sea";

export type MaterialCaptionKey =
  | "field"
  | "studio"
  | "weave"
  | "leather"
  | "linen"
  | "grain"
  | "labyrinth"
  | "pigment";

const img = (key: keyof typeof images.products) =>
  images.products[key] as readonly string[];

export const products: Product[] = [
  { slug: "sphere-bench", collection: "sphere", images: img("sphere/sphere-bench") },
  { slug: "lounge-chair", collection: "sphere", images: img("sphere/lounge-chair") },
  { slug: "commode", collection: "sphere", images: img("sphere/commode") },
  { slug: "folded-pouf", collection: "sphere", images: img("sphere/folded-pouf") },
  { slug: "sphere-ottoman", collection: "sphere", images: img("sphere/sphere-ottoman") },
  { slug: "orbit-coffee-table", collection: "sphere", images: img("sphere/orbit-coffee-table") },
  { slug: "coffee-table-iii", collection: "sphere", images: img("sphere/coffee-table-iii") },
  { slug: "lobe-coffee-table", collection: "sphere", images: img("sphere/lobe-coffee-table") },
  { slug: "wave-coffee-table", collection: "sphere", images: img("sphere/wave-coffee-table") },
  { slug: "stem-side-table", collection: "sphere", images: img("sphere/stem-side-table") },
  { slug: "tiled-bench", collection: "tiles", images: img("tiles/tiled-bench") },
  { slug: "tiled-coffee-table", collection: "tiles", images: img("tiles/tiled-coffee-table") },
  { slug: "tiled-pouf", collection: "tiles", images: img("tiles/tiled-pouf") },
  { slug: "backgammon-table", collection: "tiles", images: img("tiles/backgammon-table") },
  { slug: "fringes-pouf", collection: "fringes", images: img("fringes/fringes-pouf") },
  { slug: "steel-lounge-chair", collection: "retro", images: img("retro/steel-lounge-chair") },
];

export const collectionHero: Record<CollectionId, string> = {
  sphere: "/catalog/sphere/room.jpg",
  retro: "/catalog/retro/steel-lounge-chair/09.jpg",
  tiles: "/catalog/tiles/room.jpg",
  fringes: "/catalog/fringes/fringes-pouf/11.jpg",
};

export function collectionEnterHref(id: CollectionId) {
  return `/products?collection=${id}`;
}

export type FloorPin = {
  slug: string;
  x: number;
  y: number;
  label?: string;
};

export const collectionFloor: Record<
  CollectionId,
  { src: string; pins: readonly FloorPin[] }
> = {
  sphere: {
        src: "/catalog/sphere/room.jpg",
    pins: [
      { slug: "lounge-chair", x: 16, y: 44 },
      { slug: "folded-pouf", x: 38, y: 38 },
      { slug: "commode", x: 52, y: 32 },
      { slug: "coffee-table-iii", x: 32, y: 56 },
      { slug: "lobe-coffee-table", x: 46, y: 48 },
      { slug: "sphere-ottoman", x: 44, y: 68 },
      { slug: "stem-side-table", x: 52, y: 64 },
      { slug: "wave-coffee-table", x: 68, y: 62 },
      { slug: "sphere-bench", x: 78, y: 42 },
      { slug: "orbit-coffee-table", x: 28, y: 28 },
    ],
  },
  retro: {
    src: "/catalog/retro/steel-lounge-chair/09.jpg",
    pins: [{ slug: "steel-lounge-chair", x: 50, y: 52 }],
  },
  tiles: {
    src: "/catalog/tiles/room.jpg",
    pins: [
      { slug: "tiled-pouf", x: 17, y: 48 },
      { slug: "tiled-coffee-table", x: 30, y: 70 },
      { slug: "tiled-bench", x: 58, y: 22 },
      { slug: "backgammon-table", x: 50, y: 54 },
    ],
  },
  fringes: {
    src: "/catalog/fringes/fringes-pouf/11.jpg",
    pins: [{ slug: "fringes-pouf", x: 45, y: 42 }],
  },
};

export function getFloorIndex(id: CollectionId) {
  const i = collectionIds.indexOf(id);
  return i === 0 ? "0" : `+${i}`;
}

export const homeHero = images.campaign["at-home"];
export const homeManifestoFilm = "/catalog/home/manifesto.mp4";
export const homeTickerFilm = "/catalog/home/ticker.mp4";

export const aboutCraft = "/catalog/about/craft.jpg";
export const aboutRails = [
  "/catalog/about/rail-triangles.png",
  "/catalog/about/rail-tiles.jpg",
  "/catalog/about/rail-walnut.jpg",
  "/catalog/about/rail-azul.jpg",
] as const;
export const aboutEssence = {
  artistic: "/catalog/about/essence-artistic.jpg",
  sculptural: "/catalog/about/essence-sculptural.jpg",
  timeless: "/catalog/about/essence-timeless.jpg",
} as const;

export const homeWorlds = [
  { id: "tiles" as const, src: "/catalog/home/tiles.jpg" },
  { id: "sphere" as const, src: "/catalog/home/sphere.jpg" },
];

export const homeTilesCarousel = [
  { src: "/catalog/home/tiles/coffee-table.jpg", slug: "tiled-coffee-table" as const },
  { src: "/catalog/home/tiles/pouf.jpg", slug: "tiled-pouf" as const },
  { src: "/catalog/home/tiles/rove.jpg", slug: "backgammon-table" as const },
  { src: "/catalog/home/tiles/bench.jpg", slug: "tiled-bench" as const },
];

export const homeSphereCarousel = [
  { src: "/catalog/home/sphere/coffee-table.jpg", slug: "coffee-table-iii" as const },
  { src: "/catalog/home/sphere/orbit.jpg", slug: "orbit-coffee-table" as const },
  { src: "/catalog/home/sphere/pouf.jpg", slug: "sphere-ottoman" as const },
  { src: "/catalog/home/sphere/bench.jpg", slug: "sphere-bench" as const },
];

export const sphereMixed = img("sphere/mixed");

export const campaignScenes: {
  id: CampaignSceneId;
  src: string;
  href: "/products?collection=tiles" | "/collections/tiles/backgammon-table" | "/collections/retro/steel-lounge-chair";
}[] = [
  { id: "at-home", src: images.campaign["at-home"], href: "/products?collection=tiles" },
  {
    id: "by-the-pool",
    src: images.campaign["by-the-pool"],
    href: "/collections/tiles/backgammon-table",
  },
  {
    id: "in-the-field",
    src: images.campaign["in-the-field"],
    href: "/collections/tiles/backgammon-table",
  },
  {
    id: "at-the-sea",
    src: images.campaign["at-the-sea"],
    href: "/collections/retro/steel-lounge-chair",
  },
];

const materialCaptions: MaterialCaptionKey[] = [
  "field",
  "studio",
  "weave",
  "leather",
  "linen",
  "grain",
  "labyrinth",
  "pigment",
];

export const materialStrip = images.products.materials.map((src, index) => ({
  src,
  captionKey: materialCaptions[index],
}));

export function getCollection(id: string) {
  return collectionIds.find((c) => c === id);
}

export function getProductsByCollection(id: CollectionId) {
  return products.filter((p) => p.collection === id);
}

export function getProduct(collection: string, slug: string) {
  return products.find((p) => p.collection === collection && p.slug === slug);
}

export function getSiblings(product: Product, count = 2) {
  return getProductsByCollection(product.collection)
    .filter((p) => p.slug !== product.slug)
    .slice(0, count);
}

export function getAdjacentCollection(id: CollectionId) {
  const i = collectionIds.indexOf(id);
  return {
    prev: collectionIds[(i + collectionIds.length - 1) % collectionIds.length],
    next: collectionIds[(i + 1) % collectionIds.length],
  };
}

export function getAdjacentProduct(product: Product) {
  const list = getProductsByCollection(product.collection);
  const i = list.findIndex((p) => p.slug === product.slug);
  return {
    prev: list[(i + list.length - 1) % list.length],
    next: list[(i + 1) % list.length],
    index: i,
    total: list.length,
  };
}
