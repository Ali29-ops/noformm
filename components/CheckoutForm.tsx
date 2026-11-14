"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { placeOrderAction, quoteAction, type Quote } from "@/app/shop-actions";
import { formatMoney } from "@/lib/money";
import { governorates } from "@/lib/egypt";
import type { AddressRow, PaymentMethod } from "@/lib/db/schema";

type CheckoutDefaults = {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
};

export type CheckoutLine = {
  slug: string;
  name: string;
  quantity: number;
  lineTotal: number;
  image: string;
  color?: string;
  colorLabel?: string;
  material?: string;
  materialLabel?: string;
};

type PaymentOptions = { bankTransfer: boolean; card: boolean };

export function CheckoutForm({
  defaults,
  addresses,
  lines,
  payments,
  initialQuote,
}: {
  defaults?: CheckoutDefaults;
  addresses: AddressRow[];
  lines: CheckoutLine[];
  payments: PaymentOptions;
  initialQuote: Quote;
}) {
  const t = useTranslations("shop");
  const contact = useTranslations("contact");
  const account = useTranslations("account");
  const locale = useLocale();
  const router = useRouter();
  const signedIn = Boolean(defaults?.email);

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [addressId, setAddressId] = useState<string>(defaultAddress?.id ?? "new");
  const selected = useMemo(() => addresses.find((a) => a.id === addressId), [addresses, addressId]);

  const firstMethod: PaymentMethod = payments.bankTransfer ? "bank_transfer" : "card";
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(firstMethod);
  const [governorate, setGovernorate] = useState(defaultAddress?.governorate ?? "");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const [quote, setQuote] = useState<Quote>(initialQuote);
  const [quoting, startQuote] = useTransition();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (selected) setGovernorate(selected.governorate);
  }, [selected]);

  useEffect(() => {
    startQuote(async () => {
      const next = await quoteAction({ governorate, coupon });
      setQuote(next);
    });
  }, [governorate, coupon]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    if (selected) {
      data.set("name", selected.name);
      data.set("phone", selected.phone);
      data.set("phone2", selected.phone2);
      data.set("governorate", selected.governorate);
      data.set("city", selected.city);
      data.set("area", selected.area);
      data.set("street", selected.street);
      data.set("building", selected.building);
      data.set("floor", selected.floor);
      data.set("apartment", selected.apartment);
      data.set("landmark", selected.landmark);
    }
    data.set("paymentMethod", paymentMethod);
    data.set("coupon", coupon);
    try {
      const result = await placeOrderAction(data);
      window.dispatchEvent(new Event("nf-cart"));
      router.push(`/orders/${result.id}?t=${result.token}&placed=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place the order.");
      setPending(false);
    }
  }

  const money = (value: number) => formatMoney(value, quote.currency, locale);
  const showAddressFields = !selected;

  return (
    <form onSubmit={onSubmit} className="grid gap-16 md:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="max-w-xl space-y-12">
        {signedIn ? null : (
          <p className="text-sm text-hardwood">
            <Link href="/signin?next=/checkout" className="draw-underline">
              {account("signIn")}
            </Link>
          </p>
        )}

        <fieldset className="space-y-6">
          <legend className="label">{t("contactSection")}</legend>
          <label className="block">
            <span className="label">{contact("email")}</span>
            <input name="email" type="email" required autoComplete="email" defaultValue={defaults?.email} className="mt-2" />
          </label>
          {showAddressFields ? (
            <>
              <label className="block">
                <span className="label">{contact("name")}</span>
                <input name="name" required autoComplete="name" defaultValue={defaults?.name} className="mt-2" />
              </label>
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="label">{t("phone")}</span>
                  <input name="phone" required autoComplete="tel" inputMode="tel" defaultValue={defaults?.phone} className="mt-2" />
                </label>
                <label className="block">
                  <span className="label">
                    {t("phone2")} · {contact("optional")}
                  </span>
                  <input name="phone2" autoComplete="tel" inputMode="tel" className="mt-2" />
                </label>
              </div>
            </>
          ) : null}
        </fieldset>

        <fieldset className="space-y-6">
          <legend className="label">{t("deliverySection")}</legend>
          {addresses.length > 0 ? (
            <div className="space-y-3">
              {addresses.map((address) => (
                <label key={address.id} className="flex cursor-pointer items-start gap-3 border border-hardwood/25 p-4">
                  <input
                    type="radio"
                    name="addressChoice"
                    value={address.id}
                    checked={addressId === address.id}
                    onChange={() => setAddressId(address.id)}
                    className="mt-1 h-4 w-4"
                  />
                  <span className="text-sm leading-relaxed">
                    <span className="block font-serif text-lg">{address.label || address.name}</span>
                    {address.street}
                    {address.building ? `, ${address.building}` : ""} · {address.city} ·{" "}
                    {governorates.find((g) => g.id === address.governorate)?.[locale === "ar" ? "ar" : "en"] ?? address.governorate}
                    <span className="block text-hardwood">{address.phone}</span>
                  </span>
                </label>
              ))}
              <label className="flex cursor-pointer items-center gap-3 border border-hardwood/25 p-4">
                <input
                  type="radio"
                  name="addressChoice"
                  value="new"
                  checked={addressId === "new"}
                  onChange={() => {
                    setAddressId("new");
                    setGovernorate("");
                  }}
                  className="h-4 w-4"
                />
                <span className="text-sm">{t("newAddress")}</span>
              </label>
            </div>
          ) : null}

          {showAddressFields ? (
            <div className="space-y-6">
              <label className="block">
                <span className="label">{t("governorate")}</span>
                <select
                  name="governorate"
                  required
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="mt-2"
                >
                  <option value="">{t("choose")}</option>
                  {governorates.map((g) => (
                    <option key={g.id} value={g.id}>
                      {locale === "ar" ? g.ar : g.en}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="label">{t("city")}</span>
                  <input name="city" required autoComplete="address-level2" defaultValue={defaults?.city} className="mt-2" />
                </label>
                <label className="block">
                  <span className="label">
                    {t("area")} · {contact("optional")}
                  </span>
                  <input name="area" autoComplete="address-level3" className="mt-2" />
                </label>
              </div>
              <label className="block">
                <span className="label">{t("street")}</span>
                <input name="street" required autoComplete="address-line1" className="mt-2" />
              </label>
              <div className="grid gap-6 sm:grid-cols-3">
                <label className="block">
                  <span className="label">{t("building")}</span>
                  <input name="building" className="mt-2" />
                </label>
                <label className="block">
                  <span className="label">{t("floor")}</span>
                  <input name="floor" className="mt-2" />
                </label>
                <label className="block">
                  <span className="label">{t("apartment")}</span>
                  <input name="apartment" className="mt-2" />
                </label>
              </div>
              <label className="block">
                <span className="label">
                  {t("landmark")} · {contact("optional")}
                </span>
                <input name="landmark" className="mt-2" />
              </label>
              {signedIn ? (
                <label className="flex items-center gap-3 text-sm">
                  <input type="checkbox" name="saveAddress" className="h-4 w-4" defaultChecked />
                  {t("saveAddress")}
                </label>
              ) : null}
            </div>
          ) : null}

          <label className="block">
            <span className="label">
              {t("notes")} · {contact("optional")}
            </span>
            <textarea name="notes" rows={3} className="mt-2 resize-none" />
          </label>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="label">{t("paymentSection")}</legend>
          <div className="border-l-2 border-hardwood/30 ps-4 text-sm leading-relaxed text-hardwood">
            <p>
              {t("depositExplainer", {
                percent: quote.depositPercent,
                deposit: money(quote.depositAmount),
              })}
            </p>
            <p className="mt-1">
              {quote.balanceOnDelivery
                ? t("balanceOnDelivery", { balance: money(quote.balanceAmount) })
                : t("balanceBeforeShipping", { balance: money(quote.balanceAmount) })}
            </p>
            <p className="mt-1">{t("noCod")}</p>
          </div>
          <p className="label pt-3">{t("depositMethod")}</p>
          {payments.bankTransfer ? (
            <PaymentOption
              value="bank_transfer"
              current={paymentMethod}
              onChange={setPaymentMethod}
              title={t("bankTransfer")}
              hint={t("bankTransferHint")}
            />
          ) : null}
          <PaymentOption
            value="card"
            current={paymentMethod}
            onChange={setPaymentMethod}
            title={t("card")}
            hint={payments.card ? t("cardHint") : t("cardSoon")}
            disabled={!payments.card}
          />
        </fieldset>

        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input type="checkbox" name="acceptTerms" required className="mt-1 h-4 w-4" />
          <span>
            {t("acceptTerms")}{" "}
            <Link href="/terms" className="draw-underline" target="_blank">
              →
            </Link>
          </span>
        </label>

        {error ? <p className="text-sm text-burgundy">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full border border-charcoal px-6 py-4 font-sans text-[11px] uppercase tracking-label disabled:opacity-40 sm:w-auto"
        >
          {pending ? "…" : t("place")}
        </button>
      </div>

      <aside className="md:sticky md:top-32 md:self-start">
        <p className="label">{t("summary")}</p>
        <ul className="mt-6 space-y-4">
          {lines.map((line) => (
            <li key={`${line.slug}::${line.color ?? ""}::${line.material ?? ""}`} className="flex justify-between gap-4 border-b border-hardwood/20 py-3 text-sm">
              <span>
                {line.name}
                {line.materialLabel || line.colorLabel ? (
                  <span className="text-hardwood">
                    {" "}
                    · {[line.materialLabel, line.colorLabel].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
                <span className="text-hardwood"> × {line.quantity}</span>
              </span>
              <span>{money(line.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex gap-2">
          <input
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder={t("coupon")}
            className="min-w-0 flex-1"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setCoupon(couponInput.trim())}
            className="border border-charcoal px-4 font-sans text-[11px] uppercase tracking-label"
          >
            {t("apply")}
          </button>
        </div>
        {coupon && quote.couponError ? <p className="mt-2 text-sm text-burgundy">{t("couponInvalid")}</p> : null}
        {coupon && quote.couponCode ? (
          <p className="mt-2 text-sm text-sage">
            {quote.couponCode} · {t("couponApplied")}
          </p>
        ) : null}

        <dl className={`mt-8 space-y-2 text-sm transition-opacity ${quoting ? "opacity-50" : ""}`}>
          <Row label={t("subtotal")} value={money(quote.subtotal)} />
          {quote.discount > 0 ? <Row label={t("discount")} value={`− ${money(quote.discount)}`} /> : null}
          <Row
            label={t("delivery")}
            value={
              quote.shippingFee > 0
                ? money(quote.shippingFee)
                : quote.freeShipping
                  ? t("free")
                  : t("deliveryQuote")
            }
          />
          {quote.tax > 0 ? <Row label={t("tax")} value={money(quote.tax)} /> : null}
        </dl>
        <p className="mt-6 flex justify-between border-t border-hardwood/25 pt-4 font-serif text-2xl">
          <span>{t("total")}</span>
          <span>{money(quote.total)}</span>
        </p>
        <dl className={`mt-6 space-y-2 border-t border-hardwood/25 pt-4 text-sm transition-opacity ${quoting ? "opacity-50" : ""}`}>
          <div className="flex justify-between gap-4 font-serif text-lg">
            <dt>{t("depositNow", { percent: quote.depositPercent })}</dt>
            <dd>{money(quote.depositAmount)}</dd>
          </div>
          <Row
            label={quote.balanceOnDelivery ? t("balanceLaterDelivery") : t("balanceLaterShipping")}
            value={money(quote.balanceAmount)}
          />
        </dl>
      </aside>
    </form>
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

function PaymentOption({
  value,
  current,
  onChange,
  title,
  hint,
  disabled,
}: {
  value: PaymentMethod;
  current: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  title: string;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 border p-4 ${
        disabled ? "cursor-not-allowed border-hardwood/15 text-hardwood/60" : "cursor-pointer border-hardwood/25"
      } ${current === value ? "bg-charcoal/5" : ""}`}
    >
      <input
        type="radio"
        name="paymentChoice"
        value={value}
        checked={current === value}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="mt-1 h-4 w-4"
      />
      <span>
        <span className="block font-serif text-lg">{title}</span>
        {hint ? <span className="block text-sm text-hardwood">{hint}</span> : null}
      </span>
    </label>
  );
}
