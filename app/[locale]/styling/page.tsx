import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

const scenes = [
  {
    id: "night",
    src: "/styling/night-room.jpeg",
    width: 1284,
    height: 1225,
    mat: "bg-sage",
    tilt: "-rotate-2",
    print: "md:col-span-5 md:col-start-1",
    text: "md:col-span-5 md:col-start-8 md:self-center",
  },
  {
    id: "sitting",
    src: "/styling/sitting-room.jpeg",
    width: 1121,
    height: 1403,
    mat: "bg-hardwood",
    tilt: "rotate-[1.5deg]",
    print: "md:col-span-4 md:col-start-8 md:row-start-1",
    text: "md:col-span-5 md:col-start-2 md:row-start-1 md:self-end",
  },
  {
    id: "terrace",
    src: "/styling/terrace.jpeg",
    width: 1536,
    height: 1024,
    mat: "bg-charcoal",
    tilt: "-rotate-1",
    print: "md:col-span-7 md:col-start-2",
    text: "md:col-span-3 md:col-start-10 md:self-start md:pt-10",
  },
  {
    id: "threshold",
    src: "/styling/threshold.jpeg",
    width: 1341,
    height: 1173,
    mat: "bg-hardwood/30",
    tilt: "rotate-2",
    print: "md:col-span-5 md:col-start-7",
    text: "md:col-span-4 md:col-start-2 md:row-start-1 md:self-center",
  },
] as const;

const outlined = { WebkitTextStroke: "1px var(--hardwood)", color: "transparent" };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "styling" });
  return {
    title: t("title").replace(/\.$/, ""),
    description: t("lede"),
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
  const serifLead = locale === "ar" ? "leading-[1.55]" : "leading-snug";

  return (
    <div className="overflow-x-clip pb-28">
      <section className="px-6 pb-16 pt-32 md:px-12 md:pb-24 md:pt-40">
        <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="label">{t("kicker")}</p>
            <h1 className="editorial-title mt-6">{t("title")}</h1>
            <p className={`mt-10 max-w-xl font-serif text-2xl text-charcoal md:text-3xl ${serifLead}`}>{t("lede")}</p>
            <p className="mt-8 max-w-lg text-lg text-hardwood">{t("body")}</p>
          </div>

          <nav aria-label={t("index")} className="md:col-span-4 md:col-start-9">
            <p className="label">{t("index")}</p>
            <ul className="mt-5 grid grid-cols-4 gap-3">
              {scenes.map((scene, i) => (
                <li key={scene.id}>
                  <a href={`#${scene.id}`} className="group block">
                    <span className={`block p-1 ${scene.mat} transition-transform duration-500 group-hover:-translate-y-1`}>
                      <span className="relative block aspect-square overflow-hidden">
                        <Image src={scene.src} alt="" fill sizes="80px" className="object-cover" />
                      </span>
                    </span>
                    <span className="mt-2 block font-sans text-[10px] tracking-label text-hardwood">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-24 px-6 md:gap-36 md:px-12">
        {scenes.map((scene, i) => (
          <section
            key={scene.id}
            id={scene.id}
            className="grid scroll-mt-28 grid-cols-1 gap-10 md:grid-cols-12 md:gap-x-8"
          >
            <figure
              className={`${scene.print} ${scene.mat} ${scene.tilt} w-[88%] p-3 shadow-[0_30px_60px_-30px_rgba(30,32,31,0.45)] transition-transform duration-700 ease-out hover:rotate-0 hover:scale-[1.015] md:w-auto md:p-4 ${
                i % 2 ? "justify-self-end" : "justify-self-start"
              } md:justify-self-auto`}
            >
              <Image
                src={scene.src}
                alt={t(`scenes.${scene.id}.title`)}
                width={scene.width}
                height={scene.height}
                priority={i === 0}
                sizes="(min-width: 768px) 45vw, 88vw"
                className="block h-auto w-full"
              />
            </figure>

            <div className={scene.text}>
              <p className="font-serif text-[5.5rem] leading-none md:text-[8rem]" style={outlined} aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="label mt-4">{t(`scenes.${scene.id}.kicker`)}</p>
              <p className={`mt-4 font-serif text-3xl md:text-4xl ${serifLead}`}>{t(`scenes.${scene.id}.title`)}</p>
              <p className="mt-5 max-w-sm text-lg text-hardwood">{t(`scenes.${scene.id}.body`)}</p>
            </div>
          </section>
        ))}
      </div>

      <div className="mx-auto mt-32 max-w-3xl px-6 text-center md:px-12">
        <p className={`font-serif text-4xl md:text-5xl ${serifLead}`}>{t("close")}</p>
        <Link href="/collections" className="mt-10 inline-block draw-underline font-sans text-[11px] uppercase tracking-label">
          {t("continue")}
        </Link>
      </div>
    </div>
  );
}
