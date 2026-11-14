import { collectionEnterHref, collectionIds, type CollectionId } from "./catalog";
import { getLiveProducts } from "./live-catalog";
import { collectionName, productCopy } from "./product-copy";

export type NavProduct = {
  slug: string;
  name: string;
  href: string;
  image: string | null;
};

export type NavColumn = {
  id: CollectionId;
  name: string;
  href: string;
  products: NavProduct[];
};

export type NavCatalog = {
  columns: NavColumn[];
};

export async function getNavCatalog(locale: string): Promise<NavCatalog> {
  const products = await getLiveProducts();
  const columns = collectionIds.map((id) => ({
    id,
    name: collectionName(id, locale),
    href: collectionEnterHref(id),
    products: products
      .filter((product) => product.collection === id)
      .map((product) => ({
        slug: product.slug,
        name: productCopy(product, locale).name,
        href: `/collections/${product.collection}/${product.slug}`,
        image: product.images[0] ?? null,
      })),
  }));

  return { columns };
}
