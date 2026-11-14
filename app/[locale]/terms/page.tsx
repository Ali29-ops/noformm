import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/LegalPage";
import type { Locale } from "@/i18n/routing";

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <LegalPage locale={locale} section="terms" />;
}
