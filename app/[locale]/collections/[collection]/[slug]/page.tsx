import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { FloorSides } from "@/components/FloorStage";
import { ObjectViewer } from "@/components/ObjectViewer";
import { WalkNav } from "@/components/WalkNav";
import { AddToCartButton } from "@/components/AddToCartButton";
import { RecordView } from "@/components/RecordIntent";
import { collectionEnterHref, collectionFloor, getAdjacentCollection, products, type CollectionId } from "@/lib/catalog";
import { dimsFor } from "@/lib/product-facts";
import { resolveColors, resolveMaterials } from "@/lib/product-options";
import { getLiveAdjacent, getLiveProduct } from "@/lib/live-catalog";
import { productCopy } from "@/lib/product-copy";
import { formatMoney } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return products.map((product) => ({
    collection: product.collection,
    slug: product.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; collection: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, collection, slug } = await params;
  const product = await getLiveProduct(collection, slug);
  if (!product) return {};
  const copy = productCopy(product, locale);
  const settings = await getSettings();
  return {
    title: copy.name,
    description: copy.description,
    alternates: {
      canonical: `${settings.siteUrl}/${locale}/collections/${collection}/${slug}`,
      languages: {
        en: `${settings.siteUrl}/en/collections/${collection}/${slug}`,
        ar: `${settings.siteUrl}/ar/collections/${collection}/${slug}`,
      },
    },
    openGraph: {
      title: copy.name,
      description: copy.description,
      images: product.images[0] ? [{ url: product.images[0] }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; collection: string; slug: string }>;
}) {
  const { locale, collection, slug } = await params;
  setRequestLocale(locale as Locale);
  const product = await getLiveProduct(collection, slug);
  if (!product) notFound();

  const [collectionsT, common, showroom, pt, shop, settings, walk] = await Promise.all([
    getTranslations("collections"),
    getTranslations("common"),
    getTranslations("showroom"),
    getTranslations("product"),
    getTranslations("shop"),
    getSettings(),
    getLiveAdjacent(product),
  ]);
  const copy = productCopy(product, locale);
  const { prev, next } = getAdjacentCollection(product.collection);
  const floor = collectionFloor[product.collection];
  const prevName = productCopy(walk.prev, locale).name;
  const nextName = productCopy(walk.next, locale).name;
  const care = locale === "ar" ? product.careAr || product.care : product.care;
  const dims = dimsFor(product);
  const hasDims = dims.width != null || dims.depth != null || dims.height != null || dims.diameter != null;
  const availability = product.madeToOrder
    ? pt("madeToOrder")
    : product.available < 1
      ? common("soldOut")
      : product.available <= settings.lowStockThreshold
        ? pt("lowStock", { count: product.available })
        : pt("inStock");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: copy.name,
    description: copy.description,
    image: product.images,
    sku: product.sku ?? product.slug,
    brand: { "@type": "Brand", name: "NO FORM" },
    offers: {
      "@type": "Offer",
      priceCurrency: settings.currency,
      price: product.price,
      availability:
        product.madeToOrder
          ? "https://schema.org/PreOrder"
          : product.available > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
      url: `${settings.siteUrl}/${locale}/collections/${collection}/${slug}`,
    },
  };

  return (
    <div
      data-floor-stage
      data-world={product.collection}
      className="relative min-h-svh overflow-hidden bg-charcoal text-ivory"
    >
      <RecordView slug={product.slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.22]">
        <Image src={floor.src} alt="" fill className="object-cover" sizes="100vw" />
      </div>
      <div className="absolute inset-0 bg-charcoal/70" aria-hidden />

      <FloorSides
        prev={{ id: prev, name: collectionsT(`${prev as CollectionId}.name`) }}
        next={{ id: next, name: collectionsT(`${next as CollectionId}.name`) }}
      />

      <div className="relative z-10 mx-auto grid min-h-svh max-w-editorial gap-10 px-6 pb-28 pt-28 md:grid-cols-8 md:items-center md:gap-16 md:px-20 md:pb-16">
        <aside className="order-2 md:sticky md:top-28 md:order-1 md:col-span-3 md:self-start">
          <p className="label text-ivory/60">
            <Link href={collectionEnterHref(product.collection)} className="draw-underline">
              {collectionsT(`${product.collection}.name`)}
            </Link>
            <span className="mx-3 text-ivory/30">/</span>
            {walk.index + 1} {showroom("of")} {walk.total}
          </p>
          <h1 className="mt-5 font-serif text-5xl leading-tight md:text-6xl">{copy.name}</h1>
          <p className="mt-8 text-lg leading-relaxed text-ivory/75">{copy.description}</p>
          <p className="mt-8 flex items-baseline gap-4 font-serif text-2xl">
            {formatMoney(product.price, settings.currency, locale)}
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <span className="text-lg text-ivory/45 line-through">
                {formatMoney(product.compareAtPrice, settings.currency, locale)}
              </span>
            ) : null}
          </p>
          <p className="label mt-2 text-ivory/55">{availability}</p>

          {resolveMaterials(product).length === 0 && copy.materials.length > 0 ? (
            <div className="mt-10">
              <p className="label text-ivory/55">{common("materials")}</p>
              <ul className="mt-4 space-y-2">
                {copy.materials.map((item) => (
                  <li key={item} className="border-b border-ivory/15 py-2 text-ivory/90">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {hasDims || product.weightKg || product.leadTimeDays || care || product.sku ? (
            <dl className="mt-10 space-y-3 text-sm">
              <p className="label text-ivory/55">{pt("details")}</p>
              {dims.diameter != null ? <Fact label={pt("diameter")}>{dims.diameter} cm</Fact> : null}
              {dims.width != null && dims.diameter == null ? <Fact label={pt("width")}>{dims.width} cm</Fact> : null}
              {dims.depth != null && dims.diameter == null ? <Fact label={pt("depth")}>{dims.depth} cm</Fact> : null}
              {dims.height != null ? <Fact label={pt("height")}>{dims.height} cm</Fact> : null}
              {product.weightKg ? <Fact label={pt("weight")}>{product.weightKg} kg</Fact> : null}
              {product.leadTimeDays ? (
                <Fact label={pt("leadTime")}>{pt("days", { count: product.leadTimeDays })}</Fact>
              ) : null}
              {care ? <Fact label={pt("care")}>{care}</Fact> : null}
              {product.sku ? <Fact label={pt("sku")}>{product.sku}</Fact> : null}
            </dl>
          ) : null}

          <AddToCartButton
            slug={product.slug}
            collection={product.collection}
            available={product.available}
            label={common("addToCart")}
            soldOut={common("soldOut")}
            colors={resolveColors(product)}
            materials={resolveMaterials(product)}
            locale={locale}
          />
          <p className="mt-6 text-sm text-ivory/55">
            {pt("delivery", { days: settings.returnsWindowDays })}{" "}
            <Link href="/shipping-returns" className="draw-underline">
              {pt("deliveryLink")}
            </Link>
          </p>
          <Link
            href={`/designer?collection=${product.collection}&piece=${product.slug}`}
            className="mt-8 inline-block draw-underline font-sans text-[11px] uppercase tracking-label"
          >
            {common("enquire")}
          </Link>
          <span className="sr-only">{shop("quantity")}</span>
        </aside>

        <div className="order-1 md:order-2 md:col-span-5">
          {product.images.length > 0 ? (
            <ObjectViewer images={product.images} name={copy.name} />
          ) : (
            <div className="object-stage relative aspect-[4/5] bg-[#1c1a18]" />
          )}
        </div>
      </div>

      <div className="relative z-10 text-ivory">
        <WalkNav
          prev={{ collection: walk.prev.collection, slug: walk.prev.slug, name: prevName }}
          next={{ collection: walk.next.collection, slug: walk.next.slug, name: nextName }}
          index={walk.index}
          total={walk.total}
          className="border-ivory/15"
        />
      </div>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 border-b border-ivory/15 py-2">
      <dt className="text-ivory/55">{label}</dt>
      <dd className="text-end text-ivory/90">{children}</dd>
    </div>
  );
}
