import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/ContactForm";
import { getSettings, studioWhatsAppDigits } from "@/lib/settings";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "designer" });
  return {
    title: t("title").replace(/\.$/, ""),
    description: t("lede"),
  };
}

export default async function DesignerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const [t, settings] = await Promise.all([getTranslations("designer"), getSettings()]);
  const whatsapp = studioWhatsAppDigits(settings);
  const talkHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(t("whatsappText"))}`
    : `https://wa.me/?text=${encodeURIComponent(t("whatsappText"))}`;

  return (
    <div className="px-6 pb-28 pt-32 md:px-12 md:pt-40">
      <div className="mx-auto max-w-3xl">
        <p className="label">{t("kicker")}</p>
        <h1 className="editorial-title mt-6">{t("title")}</h1>
        <p className="mt-8 max-w-lg text-lg text-hardwood">{t("lede")}</p>
        <a
          href={talkHref}
          className="mt-10 inline-flex min-h-11 items-center justify-center border border-charcoal bg-charcoal px-6 font-sans text-[11px] uppercase tracking-label text-ivory transition-colors hover:bg-transparent hover:text-charcoal"
          target="_blank"
          rel="noreferrer"
        >
          {t("talk")}
        </a>
        <p className="label mt-16">{t("write")}</p>
        <div className="mt-8">
          <Suspense>
            <ContactForm submitLabel={t("send")} placeholder={t("placeholder")} intent={t("intent")} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
