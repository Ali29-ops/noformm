import type { MetadataRoute } from "next";
import { collectionEnterHref, collectionIds } from "@/lib/catalog";
import { getAllProducts } from "@/lib/repo/products";
import { getSettings } from "@/lib/settings";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSettings();
  const base = settings.siteUrl.replace(/\/$/, "");
  const products = await getAllProducts();
  const statics = ["", "/collections", "/products", "/about", "/styling", "/designer", "/privacy", "/terms", "/shipping-returns", "/orders/lookup"];
  const entries: MetadataRoute.Sitemap = [];

  const withLocales = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) => {
    for (const locale of routing.locales) {
      entries.push({
        url: `${base}/${locale}${path}`,
        priority,
        changeFrequency,
        alternates: {
          languages: Object.fromEntries(routing.locales.map((l) => [l, `${base}/${l}${path}`])),
        },
      });
    }
  };

  for (const path of statics) withLocales(path, path === "" ? 1 : 0.5, "monthly");
  for (const id of collectionIds) withLocales(collectionEnterHref(id), 0.8, "weekly");
  for (const product of products) {
    withLocales(`/collections/${product.collection}/${product.slug}`, 0.7, "weekly");
  }
  return entries;
}
