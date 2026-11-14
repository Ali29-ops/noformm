"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { collectionIds, type CollectionId } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";

export type CatalogQuery = {
  collection: string;
  q: string;
  avail: string;
  sort: string;
  min: string;
  max: string;
};

export type CatalogItem = {
  slug: string;
  collection: CollectionId;
  name: string;
  description: string;
  image: string | null;
  price: number;
  compareAtPrice: number | null;
  available: number;
  madeToOrder: boolean;
};

type SortKey = "featured" | "price-asc" | "price-desc" | "name";
type AvailKey = "" | "in-stock" | "made-to-order" | "sold-out";

function parseList(value: string | null) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ProductCatalog({
  items,
  currency,
  locale,
  query,
}: {
  items: CatalogItem[];
  currency: string;
  locale: string;
  query: CatalogQuery;
}) {
  const t = useTranslations("productsPage");
  const tc = useTranslations("collections");
  const common = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();

  const selected = parseList(query.collection).filter((id): id is CollectionId =>
    collectionIds.includes(id as CollectionId),
  );
  const q = query.q;
  const avail = (query.avail || "") as AvailKey;
  const sort = (query.sort || "featured") as SortKey;
  const min = query.min;
  const max = query.max;

  function replace(next: URLSearchParams) {
    const query = Object.fromEntries(next.entries());
    router.replace({ pathname, query }, { scroll: false });
  }

  function setParam(key: string, value: string) {
    const next = new URLSearchParams();
    if (query.collection) next.set("collection", query.collection);
    if (query.q) next.set("q", query.q);
    if (query.avail) next.set("avail", query.avail);
    if (query.sort) next.set("sort", query.sort);
    if (query.min) next.set("min", query.min);
    if (query.max) next.set("max", query.max);
    if (!value) next.delete(key);
    else next.set(key, value);
    replace(next);
  }

  function toggleCollection(id: CollectionId) {
    const next = new URLSearchParams();
    if (query.q) next.set("q", query.q);
    if (query.avail) next.set("avail", query.avail);
    if (query.sort) next.set("sort", query.sort);
    if (query.min) next.set("min", query.min);
    if (query.max) next.set("max", query.max);
    const current = new Set(selected);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    const value = collectionIds.filter((item) => current.has(item)).join(",");
    if (value) next.set("collection", value);
    else next.delete("collection");
    replace(next);
  }

  function clear() {
    router.replace({ pathname }, { scroll: false });
  }

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const minPrice = min ? Number(min) : null;
    const maxPrice = max ? Number(max) : null;

    const list = items.filter((item) => {
      if (selected.length && !selected.includes(item.collection)) return false;
      if (query) {
        const hay = `${item.name} ${item.description} ${item.collection}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      if (avail === "in-stock" && (item.madeToOrder || item.available < 1)) return false;
      if (avail === "made-to-order" && !item.madeToOrder) return false;
      if (avail === "sold-out" && (item.madeToOrder || item.available > 0)) return false;
      if (minPrice !== null && !Number.isNaN(minPrice) && item.price < minPrice) return false;
      if (maxPrice !== null && !Number.isNaN(maxPrice) && item.price > maxPrice) return false;
      return true;
    });

    const collator = new Intl.Collator(locale === "ar" ? "ar" : "en", { sensitivity: "base" });
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "name") list.sort((a, b) => collator.compare(a.name, b.name));
    return list;
  }, [items, selected, q, avail, sort, min, max, locale]);

  const hasFilters = Boolean(q || selected.length || avail || min || max || (sort && sort !== "featured"));

  const chip =
    "shrink-0 border px-2.5 py-1 font-sans text-[10px] uppercase tracking-label transition-colors";
  const field = "min-w-0 py-1.5 text-sm";

  return (
    <div>
      <form
        className="flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-hardwood/20 py-2.5"
        onSubmit={(event) => event.preventDefault()}
      >
        <input
          type="search"
          value={q}
          onChange={(event) => setParam("q", event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("search")}
          className={`${field} w-52 shrink-0`}
        />
        <div className="flex flex-wrap gap-1" role="group" aria-label={t("collection")}>
          {collectionIds.map((id) => {
            const on = selected.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleCollection(id)}
                aria-pressed={on}
                className={`${chip} ${
                  on ? "border-charcoal bg-charcoal text-ivory" : "border-hardwood/40 text-hardwood"
                }`}
              >
                {tc(`${id}.name`)}
              </button>
            );
          })}
        </div>
        <select
          value={avail}
          onChange={(event) => setParam("avail", event.target.value)}
          aria-label={t("availability")}
          className={`${field} w-36 shrink-0`}
        >
          <option value="">{t("all")}</option>
          <option value="in-stock">{t("inStock")}</option>
          <option value="made-to-order">{t("madeToOrder")}</option>
          <option value="sold-out">{t("soldOut")}</option>
        </select>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={min}
          onChange={(event) => setParam("min", event.target.value)}
          placeholder={t("minPrice")}
          aria-label={t("minPrice")}
          className={`${field} w-20 shrink-0`}
        />
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={max}
          onChange={(event) => setParam("max", event.target.value)}
          placeholder={t("maxPrice")}
          aria-label={t("maxPrice")}
          className={`${field} w-20 shrink-0`}
        />
        <select
          value={sort}
          onChange={(event) => setParam("sort", event.target.value)}
          aria-label={t("sort")}
          className={`${field} w-44 shrink-0`}
        >
          <option value="featured">{t("featured")}</option>
          <option value="price-asc">{t("priceAsc")}</option>
          <option value="price-desc">{t("priceDesc")}</option>
          <option value="name">{t("name")}</option>
        </select>
        <p className="ms-auto label">{t("results", { count: filtered.length })}</p>
        {hasFilters ? (
          <button type="button" onClick={clear} className="draw-underline shrink-0 text-[10px] uppercase tracking-label">
            {t("clear")}
          </button>
        ) : null}
      </form>

      {filtered.length === 0 ? (
        <p className="py-10 font-serif text-2xl text-hardwood">{t("empty")}</p>
      ) : (
        <ul className="grid gap-x-6 gap-y-12 pt-8 pb-28 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const status = item.madeToOrder
              ? t("madeToOrder")
              : item.available < 1
                ? common("soldOut")
                : t("inStock");
            return (
              <li key={item.slug}>
                <Link href={`/collections/${item.collection}/${item.slug}`} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-charcoal">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover img-zoom"
                      />
                    ) : null}
                  </div>
                  <p className="label mt-5">{tc(`${item.collection}.name`)}</p>
                  <h2 className="mt-2 font-serif text-2xl leading-snug md:text-3xl">{item.name}</h2>
                  <p className="mt-3 flex items-baseline gap-3 font-serif text-lg">
                    {formatMoney(item.price, currency, locale)}
                    {item.compareAtPrice && item.compareAtPrice > item.price ? (
                      <span className="text-base text-hardwood line-through">
                        {formatMoney(item.compareAtPrice, currency, locale)}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-hardwood">{status}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
