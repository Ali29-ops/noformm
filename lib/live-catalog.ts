import { collectionIds, getAdjacentCollection, type CollectionId } from "./catalog";
import { getAllProducts, getProductBySlug, type LiveProduct } from "./repo/products";

export type { LiveProduct };

export async function getLiveProducts(): Promise<LiveProduct[]> {
  return getAllProducts();
}

export async function getLiveProductsByCollection(id: CollectionId) {
  const all = await getLiveProducts();
  return all.filter((product) => product.collection === id);
}

export async function getLiveProduct(collection: string, slug: string) {
  const product = await getProductBySlug(slug);
  if (!product || product.collection !== collection) return undefined;
  return product;
}

export async function getLiveAdjacent(product: LiveProduct) {
  const list = await getLiveProductsByCollection(product.collection);
  const i = list.findIndex((item) => item.slug === product.slug);
  return {
    prev: list[(i + list.length - 1) % list.length],
    next: list[(i + 1) % list.length],
    index: i,
    total: list.length,
  };
}

export function liveCollectionNeighbors(id: CollectionId) {
  return getAdjacentCollection(id);
}

export async function getCatalogBoard() {
  return getAllProducts({ includeInactive: true });
}

export { collectionIds };
