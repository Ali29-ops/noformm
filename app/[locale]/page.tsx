import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  collectionEnterHref,
  homeManifestoFilm,
  homeSphereCarousel,
  homeTickerFilm,
  homeTilesCarousel,
  materialStrip,
} from "@/lib/catalog";
import { ImageCarousel } from "@/components/ImageCarousel";
import { RevealObject } from "@/components/RevealObject";
import { Ticker } from "@/components/Ticker";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as "en" | "ar");
  const t = await getTranslations("home");
  const tc = await getTranslations("collections");
  const productsT = await getTranslations("products");
  const common = await getTranslations("common");
  const tilesKeywords = tc.raw("tiles.keywords") as string[];
  const sphereKeywords = tc.raw("sphere.keywords") as string[];

  return (
    <>
      <section className="relative h-svh min-h-[640px] overflow-hidden bg-charcoal">
        <video
          className="manifesto-film pointer-events-none absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        >
          <source src={homeManifestoFilm} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-charcoal/50" />
        <div className="relative z-10 flex h-full items-center justify-center px-6 text-center md:px-12">
          <div className="max-w-4xl">
            <p className="editorial-title text-ivory">{t("manifestoA")}</p>
            <p className="editorial-title mt-4 text-ivory/80">{t("manifestoB")}</p>
          </div>
        </div>
      </section>

      <section className="grid items-center gap-12 px-6 py-20 md:grid-cols-12 md:gap-12 md:px-16 md:py-28">
        <div className="md:col-span-4">
          <p className="label">{tc("tiles.mood")}</p>
          <h2 className="mt-4 font-serif text-5xl md:text-6xl">{tc("tiles.name")}</h2>
          <p className="mt-8 text-lg leading-relaxed text-hardwood">{tc("tiles.lede")}</p>
          <p className="mt-6 max-w-sm leading-relaxed text-hardwood/90">{tc("tiles.manifesto")}</p>
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
            {tilesKeywords.map((word) => (
              <li key={word} className="label">
                {word}
              </li>
            ))}
          </ul>
          <Link
            href={collectionEnterHref("tiles")}
            className="mt-10 inline-block draw-underline font-sans text-[11px] uppercase tracking-label"
          >
            {common("enter")}
          </Link>
        </div>
        <RevealObject className="min-w-0 w-full max-w-[calc(26rem*2+0.5rem)] justify-self-center md:col-span-8 md:justify-self-end">
          <ImageCarousel
            slides={homeTilesCarousel.map((slide) => ({
              src: slide.src,
              caption: productsT(`${slide.slug}.name`),
            }))}
          />
        </RevealObject>
      </section>

      <section className="grid items-center gap-12 px-6 py-20 md:grid-cols-12 md:gap-12 md:px-16 md:py-28">
        <RevealObject className="min-w-0 w-full max-w-[calc(26rem*2+0.5rem)] justify-self-center md:col-span-8 md:justify-self-start">
          <ImageCarousel
            slides={homeSphereCarousel.map((slide) => ({
              src: slide.src,
              caption: productsT(`${slide.slug}.name`),
            }))}
          />
        </RevealObject>
        <div className="md:col-span-4">
          <p className="label">{tc("sphere.mood")}</p>
          <h2 className="mt-4 font-serif text-5xl md:text-6xl">{tc("sphere.name")}</h2>
          <p className="mt-8 text-lg leading-relaxed text-hardwood">{tc("sphere.lede")}</p>
          <p className="mt-6 max-w-sm leading-relaxed text-hardwood/90">{tc("sphere.manifesto")}</p>
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
            {sphereKeywords.map((word) => (
              <li key={word} className="label">
                {word}
              </li>
            ))}
          </ul>
          <Link
            href={collectionEnterHref("sphere")}
            className="mt-10 inline-block draw-underline font-sans text-[11px] uppercase tracking-label"
          >
            {common("enter")}
          </Link>
        </div>
      </section>

      <Ticker phrase={t("tagline")} src={homeTickerFilm} />

      <section className="px-6 py-20 md:px-16 md:py-28">
        <p className="label">{t("materialsKicker")}</p>
        <h2 className="mt-4 font-serif text-5xl md:text-6xl">{t("materialsTitle")}</h2>
        <RevealObject className="mt-12 min-w-0 w-full">
          <ImageCarousel
            visible="auto"
            slides={materialStrip.map((item) => ({
              src: item.src,
              caption: t(`captions.${item.captionKey}`),
            }))}
          />
        </RevealObject>
      </section>
    </>
  );
}
