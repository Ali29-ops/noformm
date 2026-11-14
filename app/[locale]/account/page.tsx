import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { readCustomerSession } from "@/lib/customer-auth";
import { getOrdersByCustomer } from "@/lib/repo/orders";
import { listAddresses } from "@/lib/repo/customers";
import { formatMoney } from "@/lib/money";
import { signOutAction } from "@/app/auth-actions";
import { AccountPanels } from "@/components/AccountPanels";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const session = await readCustomerSession();
  if (!session) {
    return redirect({ href: "/signin", locale: locale as Locale });
  }
  const [t, ot, orders, addresses] = await Promise.all([
    getTranslations("account"),
    getTranslations("order"),
    getOrdersByCustomer(session.id, session.email),
    listAddresses(session.id),
  ]);
  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium" });

  return (
    <div className="px-6 pb-28 pt-32 md:px-12 md:pt-40">
      <div className="mx-auto max-w-4xl">
        <p className="label">NO FORM</p>
        <h1 className="editorial-title mt-6">{t("accountTitle")}</h1>
        <p className="mt-6 font-serif text-3xl">{session.name}</p>
        <p className="mt-2 text-hardwood">{session.email}</p>
        <form action={signOutAction} className="mt-8">
          <button type="submit" className="draw-underline font-sans text-[11px] uppercase tracking-label">
            {t("signOut")}
          </button>
        </form>

        <section className="mt-16">
          <h2 className="font-serif text-3xl">{t("orders")}</h2>
          {orders.length === 0 ? (
            <p className="mt-6 text-hardwood">{t("noOrders")}</p>
          ) : (
            <ul className="mt-8 divide-y divide-hardwood/20 border-y border-hardwood/20">
              {orders.map((order) => (
                <li key={order.id} className="grid gap-3 py-6 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="label">
                      {order.id} · {ot(`statuses.${order.status}`)} · {ot(`payments.${order.paymentStatus}`)}
                    </p>
                    <p className="mt-2 text-sm text-hardwood">{dateFmt.format(new Date(order.createdAt))}</p>
                    <p className="mt-2 text-sm">
                      {order.items
                        .map((item) => `${locale === "ar" && item.nameAr ? item.nameAr : item.name} × ${item.quantity}`)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 md:flex-col md:items-end md:gap-2">
                    <p className="font-serif text-xl">{formatMoney(order.total, order.currency, locale)}</p>
                    <Link href={`/orders/${order.id}`} className="draw-underline font-sans text-[11px] uppercase tracking-label">
                      {t("view")}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <AccountPanels
          profile={{ name: session.name, phone: session.phone, city: session.city }}
          addresses={addresses}
        />
      </div>
    </div>
  );
}
