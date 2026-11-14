import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCartLines, quoteAction } from "@/app/shop-actions";
import { getProductsBySlugs } from "@/lib/repo/products";
import { listAddresses } from "@/lib/repo/customers";
import { productCopy } from "@/lib/product-copy";
import { colorName, materialName, resolveColors, resolveMaterials } from "@/lib/product-options";
import { CheckoutForm, type CheckoutLine } from "@/components/CheckoutForm";
import { RecordCheckout } from "@/components/RecordIntent";
import { readCustomerSession } from "@/lib/customer-auth";
import { cardPaymentsConfigured, getSettings } from "@/lib/settings";
import type { Locale } from "@/i18n/routing";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("shop");
  const lines = await getCartLines();
  if (lines.length === 0) {
    redirect({ href: "/cart", locale: locale as Locale });
  }
  const [products, session, settings] = await Promise.all([
    getProductsBySlugs(lines.map((l) => l.slug)),
    readCustomerSession(),
    getSettings(),
  ]);
  const addresses = session ? await listAddresses(session.id) : [];
  const rows: CheckoutLine[] = lines.flatMap((line) => {
    const product = products.find((p) => p.slug === line.slug);
    if (!product) return [];
    return [
      {
        slug: line.slug,
        name: productCopy(product, locale).name,
        color: line.color,
        colorLabel: colorName(line.color, locale, resolveColors(product)),
        material: line.material,
        materialLabel: materialName(line.material, locale, resolveMaterials(product)),
        quantity: line.quantity,
        lineTotal: product.price * line.quantity,
        image: product.images[0] ?? "",
      },
    ];
  });
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const initialQuote = await quoteAction({
    governorate: defaultAddress?.governorate ?? "",
    coupon: "",
  });

  return (
    <div className="px-6 pb-28 pt-32 md:px-12 md:pt-40">
      <div className="mx-auto max-w-5xl">
        <p className="label">NO FORM</p>
        <h1 className="editorial-title mt-6">{t("checkoutTitle")}</h1>
        <p className="mt-6 max-w-lg text-lg text-hardwood">{t("checkoutLede", { percent: settings.depositPercent })}</p>
        <RecordCheckout slugs={rows.map((row) => row.slug)} />
        <div className="mt-16">
          <CheckoutForm
            defaults={
              session
                ? { name: session.name, email: session.email, phone: session.phone, city: session.city }
                : undefined
            }
            addresses={addresses}
            lines={rows}
            payments={{
              bankTransfer: settings.bankTransferEnabled,
              card: cardPaymentsConfigured(),
            }}
            initialQuote={initialQuote}
          />
        </div>
      </div>
    </div>
  );
}
