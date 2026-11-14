import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCartLines } from "@/app/shop-actions";
import { formatMoney } from "@/lib/money";
import { getAllProducts, getProductsBySlugs } from "@/lib/repo/products";
import { productCopy } from "@/lib/product-copy";
import { colorName, materialName, resolveColors, resolveMaterials } from "@/lib/product-options";
import { pickComplements } from "@/lib/cart-complements";
import { getSettings } from "@/lib/settings";
import { CartEditor } from "@/components/CartEditor";
import { CartComplements } from "@/components/CartComplements";
import type { Locale } from "@/i18n/routing";

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("shop");
  const lines = await getCartLines();
  const [products, catalog, settings] = await Promise.all([
    getProductsBySlugs(lines.map((l) => l.slug)),
    getAllProducts(),
    getSettings(),
  ]);

  const rows = lines.flatMap((line) => {
    const product = products.find((item) => item.slug === line.slug);
    if (!product) return [];
    return [
      {
        ...line,
        name: productCopy(product, locale).name,
        color: line.color,
        colorLabel: colorName(line.color, locale, resolveColors(product)),
        material: line.material,
        materialLabel: materialName(line.material, locale, resolveMaterials(product)),
        collection: product.collection,
        image: product.images[0] ?? "",
        price: product.price,
        priceLabel: formatMoney(product.price, settings.currency, locale),
        max: Math.min(product.available, 20),
      },
    ];
  });
  const total = rows.reduce((sum, row) => sum + row.price * row.quantity, 0);
  const complements = pickComplements(
    lines.map((line) => line.slug),
    catalog,
  ).map((product) => {
    const colors = resolveColors(product);
    const materials = resolveMaterials(product);
    return {
      slug: product.slug,
      collection: product.collection,
      name: productCopy(product, locale).name,
      image: product.images[0] ?? "",
      priceLabel: formatMoney(product.price, settings.currency, locale),
      colors,
      materials,
    };
  });

  return (
    <div className="px-6 pb-28 pt-32 md:px-12 md:pt-40">
      <div className="mx-auto max-w-3xl">
        <p className="label">NO FORM</p>
        <h1 className="editorial-title mt-6">{t("cartTitle")}</h1>
        <p className="mt-6 max-w-lg text-lg text-hardwood">{t("cartLede")}</p>
        {rows.length === 0 ? (
          <div className="mt-16">
            <p className="font-serif text-2xl">{t("empty")}</p>
            <Link href="/collections" className="mt-8 inline-block draw-underline text-[11px] uppercase tracking-label">
              {t("continue")}
            </Link>
          </div>
        ) : (
          <div className="mt-16">
            <CartEditor
              rows={rows}
              totalLabel={t("subtotal")}
              total={formatMoney(total, settings.currency, locale)}
              removeLabel={t("remove")}
              currency={settings.currency}
            />
            <CartComplements
              items={complements}
              checkoutLabel={t("checkout")}
              checkoutLede={t("checkoutLede", { percent: settings.depositPercent })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
