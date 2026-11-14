import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { peekPasswordReset } from "@/lib/repo/sessions";
import { PasswordResetForms } from "@/components/PasswordResetForms";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("account");
  const valid = token ? await peekPasswordReset(token) : null;
  return (
    <div className="px-6 pb-28 pt-32 md:px-12 md:pt-40">
      <div className="mx-auto max-w-3xl">
        <p className="label">NO FORM</p>
        <h1 className="editorial-title mt-6">{t("resetTitle")}</h1>
        <p className="mt-6 max-w-lg text-lg text-hardwood">{t("resetLede")}</p>
        <div className="mt-16">
          {valid && token ? (
            <PasswordResetForms mode="reset" token={token} />
          ) : (
            <div>
              <p className="text-burgundy">{t("resetInvalid")}</p>
              <Link href="/forgot-password" className="mt-6 inline-block draw-underline text-[11px] uppercase tracking-label">
                {t("forgotTitle")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
