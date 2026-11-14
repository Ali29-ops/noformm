import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { readCustomerSession } from "@/lib/customer-auth";
import { balanceAfterDeposit, depositDue, getOrderForCustomer } from "@/lib/repo/orders";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { governorateName } from "@/lib/egypt";
import { OrderStatusSteps } from "@/components/OrderStatusSteps";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ t?: string; placed?: string }>;
}) {
  const { locale, id } = await params;
  const { t: token, placed } = await searchParams;
  setRequestLocale(locale as Locale);
  const session = await readCustomerSession();
  const order = await getOrderForCustomer(id, { token, customerId: session?.id });
  if (!order) notFound();

  const [t, shop, settings] = await Promise.all([getTranslations("order"), getTranslations("shop"), getSettings()]);
  const money = (v: number) => formatMoney(v, order.currency, locale);
  const a = order.shippingAddress;
  const balance = balanceAfterDeposit(order);
  const depositOutstanding = depositDue(order);
  const awaitingDeposit = order.status === "pending" && depositOutstanding > 0;
  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <div className="px-6 pb-28 pt-32 md:px-12 md:pt-40">
      <div className="mx-auto max-w-4xl">
        <p className="label">
          {t("title")} · {order.id}
        </p>
        {placed ? (
          <>
            <h1 className="editorial-title mt-6">{shop("placed")}</h1>
            <p className="mt-6 max-w-lg text-lg text-hardwood">{shop("placedLede")}</p>
          </>
        ) : (
          <h1 className="editorial-title mt-6">{t("thanks")}</h1>
        )}

        <div className="mt-12">
          <OrderStatusSteps status={order.status} />
        </div>

        <div className="mt-16 grid gap-12 md:grid-cols-2">
          <section>
            <p className="label">{t("items")}</p>
            <ul className="mt-6 divide-y divide-hardwood/20 border-y border-hardwood/20">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-5 py-4">
                  {item.image ? (
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-charcoal">
                      <Image src={item.image} alt="" fill className="object-cover" sizes="64px" />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-xl">{locale === "ar" && item.nameAr ? item.nameAr : item.name}</p>
                    <p className="text-sm text-hardwood">
                      {money(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-serif text-lg">{money(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-6 space-y-2 text-sm">
              <Row label={shop("subtotal")} value={money(order.subtotal)} />
              {order.discount > 0 ? (
                <Row label={`${shop("discount")}${order.couponCode ? ` · ${order.couponCode}` : ""}`} value={`− ${money(order.discount)}`} />
              ) : null}
              <Row label={shop("delivery")} value={order.shippingFee === 0 ? shop("deliveryQuote") : money(order.shippingFee)} />
              {order.tax > 0 ? <Row label={shop("tax")} value={money(order.tax)} /> : null}
            </dl>
            <p className="mt-4 flex justify-between border-t border-hardwood/25 pt-4 font-serif text-2xl">
              <span>{shop("total")}</span>
              <span>{money(order.total)}</span>
            </p>
          </section>

          <section className="space-y-10">
            <div>
              <p className="label">{t("status")}</p>
              <p className="mt-3 font-serif text-2xl">{t(`statuses.${order.status}`)}</p>
              <p className="mt-1 text-sm text-hardwood">
                {t("placedAt")} {dateFmt.format(new Date(order.createdAt))}
              </p>
            </div>
            <div>
              <p className="label">{t("payment")}</p>
              <p className="mt-3 font-serif text-2xl">{t(`payments.${order.paymentStatus}`)}</p>
              <p className="mt-1 text-sm text-hardwood">{t(`methods.${order.paymentMethod}`)}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <Row label={t("depositDue", { percent: order.depositPercent })} value={money(order.depositAmount)} />
                {order.amountPaid > 0 ? <Row label={t("paidSoFar")} value={money(order.amountPaid)} /> : null}
                {balance > 0 ? (
                  <Row
                    label={`${t("balanceDue")} · ${settings.balanceOnDelivery ? t("balanceDueOnDelivery") : t("balanceDueBeforeShipping")}`}
                    value={money(balance)}
                  />
                ) : null}
              </dl>
              {awaitingDeposit ? (
                <div className="mt-4 border border-hardwood/25 p-4 text-sm leading-relaxed">
                  <p className="label mb-2">{t("bankInstructions")}</p>
                  <p className="mb-2 font-serif text-lg">{money(depositOutstanding)}</p>
                  {order.paymentMethod === "bank_transfer"
                    ? locale === "ar"
                      ? settings.bankTransferInstructionsAr
                      : settings.bankTransferInstructionsEn
                    : null}
                  {order.expiresAt && settings.depositHoldHours > 0 ? (
                    <p className="mt-2 text-hardwood">{t("depositHold", { hours: settings.depositHoldHours })}</p>
                  ) : null}
                </div>
              ) : null}
              {order.paymentStatus === "deposit_paid" ? <p className="mt-3 text-sm text-sage">{t("depositReceivedNote")}</p> : null}
              {order.paymentStatus === "paid" ? <p className="mt-3 text-sm text-sage">{t("settledNote")}</p> : null}
            </div>
            {order.trackingNumber ? (
              <div>
                <p className="label">{t("tracking")}</p>
                <p className="mt-3 font-serif text-xl">
                  {order.trackingUrl ? (
                    <a href={order.trackingUrl} className="draw-underline" target="_blank" rel="noreferrer">
                      {order.trackingNumber}
                    </a>
                  ) : (
                    order.trackingNumber
                  )}
                  {order.shippingProvider ? <span className="text-hardwood"> · {order.shippingProvider}</span> : null}
                </p>
              </div>
            ) : null}
            <div>
              <p className="label">{t("address")}</p>
              <p className="mt-3 text-sm leading-relaxed">
                {a.name}
                <br />
                {a.phone}
                {a.phone2 ? ` · ${a.phone2}` : ""}
                <br />
                {[a.street, a.building, a.floor && `${shop("floor")} ${a.floor}`, a.apartment && `${shop("apartment")} ${a.apartment}`]
                  .filter(Boolean)
                  .join(", ")}
                <br />
                {[a.area, a.city, governorateName(a.governorate, locale)].filter(Boolean).join(", ")}
                {a.landmark ? (
                  <>
                    <br />
                    <span className="text-hardwood">{a.landmark}</span>
                  </>
                ) : null}
              </p>
            </div>
            {order.notes ? (
              <div>
                <p className="label">{t("notes")}</p>
                <p className="mt-3 text-sm text-hardwood">{order.notes}</p>
              </div>
            ) : null}
          </section>
        </div>

        <p className="mt-16 text-sm text-hardwood">
          {t("help")}{" "}
          <a href={`mailto:${settings.studioEmail}?subject=${order.id}`} className="draw-underline">
            {settings.studioEmail}
          </a>
        </p>
        <Link href="/collections" className="mt-10 inline-block draw-underline text-[11px] uppercase tracking-label">
          {shop("continue")}
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-hardwood">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
