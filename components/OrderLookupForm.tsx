"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { lookupOrderAction } from "@/app/shop-actions";

export function OrderLookupForm() {
  const t = useTranslations("order");
  const shop = useTranslations("shop");
  const contact = useTranslations("contact");
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await lookupOrderAction(new FormData(event.currentTarget));
      router.push(`/orders/${result.id}?t=${result.token}`);
    } catch {
      setError(t("notFound"));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-8">
      <label className="block">
        <span className="label">{shop("reference")}</span>
        <input name="id" required placeholder="NF-…" className="mt-2 uppercase" autoComplete="off" />
      </label>
      <label className="block">
        <span className="label">{contact("email")}</span>
        <input name="email" type="email" required autoComplete="email" className="mt-2" />
      </label>
      {error ? <p className="text-sm text-burgundy">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="border border-charcoal px-6 py-3 font-sans text-[11px] uppercase tracking-label disabled:opacity-40"
      >
        {pending ? "…" : t("find")}
      </button>
    </form>
  );
}
