import { getTranslations, setRequestLocale } from "next-intl/server";
import { OrderLookupForm } from "@/components/OrderLookupForm";
import type { Locale } from "@/i18n/routing";

export default async function OrderLookupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("order");
  return (
    <div className="px-6 pb-28 pt-32 md:px-12 md:pt-40">
      <div className="mx-auto max-w-3xl">
        <p className="label">NO FORM</p>
        <h1 className="editorial-title mt-6">{t("lookupTitle")}</h1>
        <p className="mt-6 max-w-lg text-lg text-hardwood">{t("lookupLede")}</p>
        <div className="mt-16">
          <OrderLookupForm />
        </div>
      </div>
    </div>
  );
}
