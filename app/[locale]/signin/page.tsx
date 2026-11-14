import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { readCustomerSession } from "@/lib/customer-auth";
import { AuthForms } from "@/components/AuthForms";
import type { Locale } from "@/i18n/routing";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const { next } = await searchParams;
  setRequestLocale(locale as Locale);
  const session = await readCustomerSession();
  if (session) {
    redirect({ href: next?.startsWith("/") ? next : "/account", locale: locale as Locale });
  }
  const t = await getTranslations("account");

  return (
    <div className="px-6 pb-28 pt-32 md:px-12 md:pt-40">
      <div className="mx-auto max-w-3xl">
        <p className="label">NO FORM</p>
        <h1 className="editorial-title mt-6">{t("title")}</h1>
        <p className="mt-6 max-w-lg text-lg text-hardwood">{t("lede")}</p>
        <div className="mt-16">
          <AuthForms next={next?.startsWith("/") ? next : undefined} />
        </div>
      </div>
    </div>
  );
}
