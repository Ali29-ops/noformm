import { getTranslations, setRequestLocale } from "next-intl/server";
import { PasswordResetForms } from "@/components/PasswordResetForms";
import type { Locale } from "@/i18n/routing";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("account");
  return (
    <div className="px-6 pb-28 pt-32 md:px-12 md:pt-40">
      <div className="mx-auto max-w-3xl">
        <p className="label">NO FORM</p>
        <h1 className="editorial-title mt-6">{t("forgotTitle")}</h1>
        <p className="mt-6 max-w-lg text-lg text-hardwood">{t("forgotLede")}</p>
        <div className="mt-16">
          <PasswordResetForms mode="request" />
        </div>
      </div>
    </div>
  );
}
