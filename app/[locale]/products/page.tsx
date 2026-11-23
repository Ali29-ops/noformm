import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductCatalog, type CatalogItem, type CatalogQuery } from "@/components/ProductCatalog";
import { getLiveProducts } from "@/lib/live-catalog";
import { productCopy } from "@/lib/product-copy";
import { getSettings } from "@/lib/settings";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "productsPage" });
  return {
    title: t("metaTitle"),
    description: t("lede"),
  };
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const raw = await searchParams;
  const query: CatalogQuery = {
    collection: one(raw.collection),
    q: one(raw.q),
    avail: one(raw.avail),
    sort: one(raw.sort),
    min: one(raw.min),
    max: one(raw.max),
  };
  setRequestLocale(locale as Locale);
  const [t, products, settings] = await Promise.all([
    getTranslations("productsPage"),
    getLiveProducts(),
    getSettings(),
  ]);

  const items: CatalogItem[] = products.map((product) => {
    const copy = productCopy(product, locale);
    return {
      slug: product.slug,
      collection: product.collection,
      name: copy.name,
      description: copy.description,
      image: product.images[0] ?? null,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      available: product.available,
      madeToOrder: product.madeToOrder,
      readyToShip: product.readyToShip && !product.madeToOrder && product.available > 0,
    };
  });

  return (
    <div className="pt-28">
      <header className="px-6 pb-5 md:px-12 md:pb-6">
        <p className="label">{t("kicker")}</p>
        <h1
          className={`mt-3 max-w-4xl font-serif text-3xl md:text-4xl ${
            locale === "ar"
              ? "leading-[1.35] tracking-normal md:leading-[1.35]"
              : "leading-tight tracking-tight"
          }`}
        >
          {t("title")}
        </h1>
      </header>
      <div className="px-6 md:px-12">
        <ProductCatalog items={items} currency={settings.currency} locale={locale} query={query} />
      </div>
    </div>
  );
}
