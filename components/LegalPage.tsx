import { getTranslations } from "next-intl/server";
import { getSettings } from "@/lib/settings";

const UPDATED = "2026-09-13";

export async function LegalPage({
  locale,
  section,
}: {
  locale: string;
  section: "privacy" | "terms" | "shipping";
}) {
  const t = await getTranslations(`legal.${section}`);
  const settings = await getSettings();
  const sections = t.raw("sections") as { title: string; body: string }[];
  const updated = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "long" }).format(
    new Date(UPDATED),
  );
  const vars: Record<string, string> = {
    days: String(settings.returnsWindowDays),
    depositPercent: String(settings.depositPercent),
    balancePercent: String(100 - settings.depositPercent),
    depositHoldHours: String(settings.depositHoldHours || 48),
  };
  const fill = (body: string) => body.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);

  return (
    <div className="px-6 pb-28 pt-32 md:px-12 md:pt-40">
      <div className="mx-auto max-w-3xl">
        <p className="label">NO FORM</p>
        <h1 className="editorial-title mt-6">{t("title")}</h1>
        <p className="mt-4 text-sm text-hardwood">
          {t("updated")} · {updated}
        </p>
        <div className="mt-16 space-y-12">
          {sections.map((item) => (
            <section key={item.title}>
              <h2 className="font-serif text-3xl">{item.title}</h2>
              <p className="mt-4 text-lg leading-relaxed text-hardwood">
                {fill(item.body)}
              </p>
            </section>
          ))}
          <section>
            <p className="text-hardwood">
              {settings.studioName} ·{" "}
              <a href={`mailto:${settings.studioEmail}`} className="draw-underline">
                {settings.studioEmail}
              </a>
              {settings.studioPhone ? ` · ${settings.studioPhone}` : ""}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
