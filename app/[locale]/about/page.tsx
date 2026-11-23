import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Ticker } from "@/components/Ticker";
import { aboutCraft, aboutEssence, aboutRails } from "@/lib/catalog";
import type { Locale } from "@/i18n/routing";

const pillarOrder = ["artistic", "sculptural", "timeless"] as const;

function PhotoCopySplit({
  src,
  title,
  body,
  detail,
  reverse,
  locale,
}: {
  src?: string;
  title: string;
  body: string;
  detail?: string;
  reverse?: boolean;
  locale: string;
}) {
  const copy = (
    <div className="flex flex-col justify-center px-8 py-16 md:px-16 md:py-24">
      <p className="label">{title}</p>
      <p
        className={`mt-6 max-w-md font-serif text-3xl md:text-4xl ${
          locale === "ar" ? "leading-[1.65] md:leading-[1.65]" : "leading-snug md:leading-snug"
        }`}
      >
        {body}
      </p>
      {detail ? <p className="mt-6 max-w-md text-lg leading-relaxed text-hardwood">{detail}</p> : null}
    </div>
  );

  if (!src) {
    return <section>{copy}</section>;
  }

  return (
    <section className="grid md:grid-cols-2">
      <div className={`relative min-h-[22rem] bg-charcoal md:min-h-[36rem] ${reverse ? "md:order-2" : ""}`}>
        <Image src={src} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
      </div>
      {copy}
    </section>
  );
}

function TileRail({ src }: { src: string }) {
  return (
    <div
      className="h-20 w-full md:h-24"
      style={{
        backgroundImage: `url(${src})`,
        backgroundRepeat: "repeat-x",
        backgroundSize: "auto 100%",
        backgroundPosition: "center",
      }}
      aria-hidden
    />
  );
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("about");

  return (
    <div className="pb-0">
      <section className="px-6 pb-16 pt-32 md:px-12 md:pb-20 md:pt-40">
        <div className="mx-auto max-w-2xl text-center">
          <p className="label">{t("kicker")}</p>
          <h1
            className={`mt-8 font-serif text-5xl md:text-7xl ${
              locale === "ar"
                ? "leading-[1.35] tracking-normal md:leading-[1.35]"
                : "leading-[1.05] tracking-tight md:leading-[1.05]"
            }`}
          >
            {t("storyTitle")}
          </h1>
          <p
            className={`mt-10 font-serif text-2xl md:text-3xl ${
              locale === "ar" ? "leading-[1.75] md:leading-[1.75]" : "leading-snug md:leading-snug"
            }`}
          >
            {t("lede")}
          </p>
          <p className="mt-8 text-lg leading-relaxed text-hardwood">{t("body")}</p>
        </div>
      </section>

      <TileRail src={aboutRails[0]} />

      <div className="flex flex-col">
        <PhotoCopySplit
          src={aboutCraft}
          title={t("pillars.craft.title")}
          body={t("craftLine")}
          detail={t("craftDetail")}
          locale={locale}
        />

        {pillarOrder.map((key, i) => (
          <div key={key}>
            <TileRail src={aboutRails[i + 1]} />
            <PhotoCopySplit
              src={aboutEssence[key]}
              title={t(`pillars.${key}.title`)}
              body={t(`pillars.${key}.body`)}
              reverse={i % 2 === 0}
              locale={locale}
            />
          </div>
        ))}
      </div>

      <Ticker phrase={t("close")} tone="sage" />
    </div>
  );
}
