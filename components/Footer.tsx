import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { getSettings, studioWhatsAppDigits } from "@/lib/settings";

export async function Footer() {
  const [t, tc, settings, locale] = await Promise.all([
    getTranslations("footer"),
    getTranslations("common"),
    getSettings(),
    getLocale(),
  ]);
  const whatsapp = studioWhatsAppDigits(settings);

  return (
    <footer className="border-t border-hardwood/25 px-6 py-16 md:px-12">
      <div className="mx-auto grid max-w-editorial gap-12 md:grid-cols-[1fr_auto_auto] md:gap-24">
        <div className="space-y-6">
          <Logo variant="secondary" />
          <p className="max-w-sm font-serif text-xl leading-snug text-charcoal md:text-2xl">{t("line")}</p>
          <p className="text-sm text-hardwood">{locale === "ar" ? settings.studioAddressAr : settings.studioAddressEn}</p>
        </div>
        <div className="flex flex-col gap-3 text-sm tracking-wide text-hardwood">
          <p className="label text-charcoal">{t("studio")}</p>
          <a href={`mailto:${settings.studioEmail}`} className="draw-underline w-fit">
            {settings.studioEmail || tc("email")}
          </a>
          {settings.studioPhone ? (
            <a href={`tel:${settings.studioPhone.replace(/\s+/g, "")}`} className="draw-underline w-fit">
              {settings.studioPhone}
            </a>
          ) : null}
          {whatsapp ? (
            <a href={`https://wa.me/${whatsapp}`} className="draw-underline w-fit" target="_blank" rel="noreferrer">
              {t("whatsapp")}
            </a>
          ) : null}
          {settings.instagram ? (
            <a
              href={`https://instagram.com/${settings.instagram.replace(/^@/, "")}`}
              className="draw-underline w-fit"
              target="_blank"
              rel="noreferrer"
            >
              {t("instagram")}
            </a>
          ) : null}
          <Link href="/products" className="draw-underline w-fit">
            {t("allProducts")}
          </Link>
          <Link href="/collections" className="draw-underline w-fit">
            {t("showroom")}
          </Link>
          <Link href="/styling" className="draw-underline w-fit">
            {t("styling")}
          </Link>
          <Link href="/designer" className="draw-underline w-fit">
            {t("designer")}
          </Link>
          <Link href="/orders/lookup" className="draw-underline w-fit">
            {t("trackOrder")}
          </Link>
        </div>
        <div className="flex flex-col gap-3 text-sm tracking-wide text-hardwood">
          <p className="label text-charcoal">{t("legal")}</p>
          <Link href="/shipping-returns" className="draw-underline w-fit">
            {t("shipping")}
          </Link>
          <Link href="/terms" className="draw-underline w-fit">
            {t("terms")}
          </Link>
          <Link href="/privacy" className="draw-underline w-fit">
            {t("privacy")}
          </Link>
        </div>
      </div>
      <p className="mx-auto mt-16 max-w-editorial text-[11px] uppercase tracking-label text-hardwood">
        © {new Date().getFullYear()} {t("rights")}
      </p>
    </footer>
  );
}
