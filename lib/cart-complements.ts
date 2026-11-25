import { sizesFor } from "./product-sizes";
import type { CollectionId } from "./catalog";
import type { LiveProduct } from "./repo/products";

function pieceKind(slug: string) {
  if (slug.includes("chair")) return "seat";
  if (slug.includes("pouf") || slug.includes("ottoman")) return "pouf";
  if (slug.includes("bench")) return "bench";
  if (slug.includes("table") || slug.includes("console")) return "table";
  if (slug.includes("commode")) return "storage";
  return "other";
}

export function pickComplements(cartSlugs: string[], catalog: LiveProduct[], limit = 5) {
  const held = new Set(cartSlugs);
  const inCart = catalog.filter((item) => held.has(item.slug));
  if (inCart.length === 0) return [] as LiveProduct[];

  const cartKinds = new Set(inCart.map((item) => pieceKind(item.slug)));
  const cartCollections = inCart.map((item) => item.collection);
  const primary = cartCollections[0] as CollectionId;

  return catalog
    .filter((item) => !held.has(item.slug) && item.available > 0 && !sizesFor(item.slug).length)
    .map((item) => {
      let score = 0;
      if (item.collection === primary) score += 6;
      else if (cartCollections.includes(item.collection)) score += 3;
      if (!cartKinds.has(pieceKind(item.slug))) score += 4;
      score += 1 / (1 + item.price / 80_000);
      return { item, score };
    })
    .sort((a, b) => b.score - a.score || a.item.sortOrder - b.item.sortOrder)
    .slice(0, limit)
    .map((entry) => entry.item);
}
