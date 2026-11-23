import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ReviewRail, type ReviewCard } from "@/components/ReviewRail";
import { getStylingReviews } from "@/lib/styling-reviews";
import type { Locale } from "@/i18n/routing";

const scenes = [
  { id: "night", src: "/styling/night-room.jpeg" },
  { id: "sitting", src: "/styling/sitting-room.jpeg" },
  { id: "terrace", src: "/styling/terrace.jpeg" },
  { id: "threshold", src: "/styling/threshold.jpeg" },
] as const;

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "styling" });
  return {
    title: t("title").replace(/\.$/, ""),
    description: t("body"),
  };
}

export default async function StylingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("styling");
  const { heading, reviews: entries } = await getStylingReviews();
  const language = locale === "ar" ? "ar" : "en";
  const reviews: ReviewCard[] = entries.filter((entry) => entry.visible).map((entry) => ({
    id: entry.id,
    quote: entry[language].quote || entry.en.quote,
    name: entry[language].name || entry.en.name,
    alt: entry[language].alt || entry.en.alt,
    image: entry.image,
    position: entry.position,
    rating: entry.rating,
  }));

  return (
    <div className="bg-ivory pb-28 text-charcoal">
      <section className="px-6 pb-12 pt-36 md:px-12 md:pb-16 md:pt-44">
        <div className="mx-auto max-w-6xl">
          <p className="label">{t("kicker")}</p>
          <div className="mt-8 grid items-end gap-10 md:grid-cols-12">
            <h1 className="font-serif text-5xl leading-[1.05] md:col-span-7 md:text-7xl">{t("title")}</h1>
            <p className="border-s border-charcoal/25 ps-6 font-serif text-xl italic leading-snug text-charcoal/80 md:col-span-4 md:col-start-9 md:text-2xl">
              {t("lede")}
            </p>
          </div>
          <p className="mt-10 max-w-3xl text-lg leading-relaxed text-hardwood">{t("body")}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 sm:grid-cols-2 md:gap-5 md:px-12">
        {scenes.map((scene, i) => (
          <a key={scene.id} href={`#${scene.id}`} id={scene.id} className="group relative block scroll-mt-28 overflow-hidden">
            <span className="relative block aspect-[4/3]">
              <Image
                src={scene.src}
                alt={t(`scenes.${scene.id}.title`)}
                fill
                priority={i < 2}
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
            </span>
            <span className="absolute start-5 top-5 text-ivory">
              <span className="block font-serif text-3xl leading-none">{String(i + 1).padStart(2, "0")}</span>
              <span className="mt-2 block font-sans text-[11px] uppercase tracking-label">{t(`scenes.${scene.id}.kicker`)}</span>
              <span className="mt-2 block h-px w-8 bg-ivory/80" />
            </span>
          </a>
        ))}
      </section>

      {reviews.length > 0 && <section className="mx-auto mt-24 max-w-6xl px-6 md:mt-32 md:px-12">
        <div className="grid items-center gap-8 md:grid-cols-12">
          <h2 className="whitespace-pre-line font-serif text-5xl leading-[1.05] md:col-span-7 md:text-6xl">
            {heading[language].title}
          </h2>
          <p className="border-s border-charcoal/25 ps-6 font-serif text-xl italic leading-snug text-charcoal/80 md:col-span-4 md:col-start-9 md:text-2xl">
            {heading[language].note}
          </p>
        </div>
        <ReviewRail reviews={reviews} previousLabel={t("previous")} nextLabel={t("next")} locale={locale} />
      </section>}
    </div>
  );
}
