import type { Metadata } from "next";
import Image from "next/image";
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
  const paragraphs = t.raw("paragraphs") as string[];
  const whatsapp = studioWhatsAppDigits(settings);
  const talkHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(t("whatsappText"))}`
    : `https://wa.me/?text=${encodeURIComponent(t("whatsappText"))}`;

  return (
    <div className="px-6 pb-28 pt-32 md:px-12 md:pt-40">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <div className="flex items-center gap-4">
            <p className="label shrink-0">{t("kicker")}</p>
            <span className="h-px w-28 bg-charcoal/30" aria-hidden />
          </div>
          <h1 className="mt-8 font-serif text-5xl leading-[1.05] md:text-7xl">{t("title")}</h1>
          <div className="mt-8 max-w-xl space-y-5 text-lg leading-relaxed text-hardwood">
            {paragraphs.map((paragraph, index) => (
              <p key={paragraph.slice(0, 24)} className={index === 0 ? "font-serif text-xl italic leading-snug text-charcoal md:text-2xl" : undefined}>
                {paragraph}
              </p>
            ))}
          </div>
          <a
            href={talkHref}
            className="mt-10 inline-flex min-h-11 items-center justify-center gap-3 bg-charcoal px-6 font-sans text-[11px] uppercase tracking-label text-ivory"
            target="_blank"
            rel="noreferrer"
          >
            {t("talk")} <span aria-hidden>→</span>
          </a>
        </div>
        <div className="relative min-h-[28rem] md:min-h-[38rem]">
          <Image
            src="/designer/zeina.png"
            alt={t("title")}
            fill
            priority
            unoptimized
            sizes="(min-width: 768px) 42vw, 100vw"
            className="object-cover object-[center_20%]"
          />
        </div>
      </div>
      <div className="mx-auto mt-24 max-w-3xl">
        <p className="label">{t("write")}</p>
        <div className="mt-8">
          <Suspense>
            <ContactForm submitLabel={t("send")} placeholder={t("placeholder")} intent={t("intent")} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
