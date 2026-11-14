import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import {
  Instrument_Serif,
  Outfit,
  Reem_Kufi,
  IBM_Plex_Sans_Arabic,
} from "next/font/google";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { readCustomerSession } from "@/lib/customer-auth";
import { getNavCatalog } from "@/lib/nav-catalog";
import { RoomRail } from "@/components/RoomRail";
import { ShowroomLight } from "@/components/ShowroomLight";
import "../globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

const reemKufi = Reem_Kufi({
  subsets: ["arabic", "latin"],
  variable: "--font-kufi",
  display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-arabic",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "en" | "ar", namespace: "meta" });
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://noform.design").replace(/\/$/, "");
  return {
    metadataBase: new URL(base),
    title: {
      default: t("title"),
      template: "%s — NO FORM",
    },
    description: t("description"),
    alternates: {
      canonical: `${base}/${locale}`,
      languages: { en: `${base}/en`, ar: `${base}/ar` },
    },
    openGraph: {
      siteName: "NO FORM",
      title: t("title"),
      description: t("description"),
      locale: locale === "ar" ? "ar_EG" : "en_US",
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale as "en" | "ar");
  const [messages, session, catalog] = await Promise.all([
    getMessages(),
    readCustomerSession(),
    getNavCatalog(locale),
  ]);
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${outfit.variable} ${instrument.variable} ${reemKufi.variable} ${plexArabic.variable}`}
    >
      <body className="min-h-screen bg-ivory font-sans text-charcoal antialiased">
        <NextIntlClientProvider messages={messages}>
          <ShowroomLight />
          <Header signedIn={Boolean(session)} catalog={catalog} />
          <RoomRail />
          <main>{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
