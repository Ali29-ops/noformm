import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import type { LiveProduct } from "./repo/products";

type Copy = { name: string; description: string; materials: string[] };
type ProductMessages = Record<string, Partial<Copy>>;

const messages: Record<string, ProductMessages> = {
  en: en.products as ProductMessages,
  ar: ar.products as ProductMessages,
};

export function productCopy(
  product: Pick<
    LiveProduct,
    "slug" | "name" | "nameAr" | "description" | "descriptionAr" | "materials" | "materialsAr"
  >,
  locale: string,
): Copy {
  const base = messages[locale]?.[product.slug] ?? {};
  const fallback = messages.en[product.slug] ?? {};
  const ar = locale === "ar";
  const name =
    (ar ? product.nameAr || product.name : product.name) ||
    base.name ||
    fallback.name ||
    product.slug;
  const description =
    (ar ? product.descriptionAr || product.description : product.description) ||
    base.description ||
    fallback.description ||
    "";
  const override = ar
    ? product.materialsAr.length > 0
      ? product.materialsAr
      : product.materials
    : product.materials;
  const materials = override.length > 0 ? override : base.materials ?? fallback.materials ?? [];
  return { name, description, materials };
}

export function collectionName(collection: string, locale: string) {
  const table = (locale === "ar" ? ar : en).collections as Record<string, { name: string }>;
  return table[collection]?.name ?? collection;
}
