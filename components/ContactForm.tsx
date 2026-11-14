"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { collectionIds, getProductsByCollection, type CollectionId } from "@/lib/catalog";
import { submitEnquiryAction } from "@/app/shop-actions";

export function ContactForm({
  submitLabel,
  placeholder,
  intent,
}: {
  submitLabel?: string;
  placeholder?: string;
  intent?: string;
} = {}) {
  const t = useTranslations("contact");
  const shop = useTranslations("shop");
  const collectionsT = useTranslations("collections");
  const productsT = useTranslations("products");
  const searchParams = useSearchParams();
  const initialCollection = searchParams.get("collection") ?? "";
  const initialPiece = searchParams.get("piece") ?? "";

  const [collection, setCollection] = useState(initialCollection);
  const [piece, setPiece] = useState(initialPiece);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const pieces = useMemo(() => {
    if (!collectionIds.includes(collection as CollectionId)) return [];
    return getProductsByCollection(collection as CollectionId);
  }, [collection]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const data = new FormData(event.currentTarget);
      if (intent) {
        const message = String(data.get("message") ?? "").trim();
        data.set("message", `${intent}\n\n${message}`);
      }
      await submitEnquiryAction(data);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return <p className="font-serif text-3xl md:text-4xl">{t("sent")}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="relative max-w-xl space-y-10">
      <label className="block">
        <span className="label">{t("name")}</span>
        <input name="name" required autoComplete="name" className="mt-2" />
      </label>
      <label className="block">
        <span className="label">{t("email")}</span>
        <input name="email" type="email" required autoComplete="email" className="mt-2" />
      </label>
      <label className="block">
        <span className="label">{shop("phone")}</span>
        <input name="phone" required autoComplete="tel" inputMode="tel" className="mt-2" />
      </label>
      <label className="block">
        <span className="label">
          {t("collection")} · {t("optional")}
        </span>
        <select
          name="collection"
          className="mt-2"
          value={collection}
          onChange={(e) => {
            setCollection(e.target.value);
            setPiece("");
          }}
        >
          <option value="">{t("any")}</option>
          {collectionIds.map((id) => (
            <option key={id} value={id}>
              {collectionsT(`${id}.name`)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">
          {t("piece")} · {t("optional")}
        </span>
        <select
          name="piece"
          className="mt-2"
          value={piece}
          onChange={(e) => setPiece(e.target.value)}
          disabled={pieces.length === 0}
        >
          <option value="">{t("any")}</option>
          {pieces.map((item) => (
            <option key={item.slug} value={item.slug}>
              {productsT(`${item.slug}.name`)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">{t("message")}</span>
        <textarea
          name="message"
          required
          rows={5}
          placeholder={placeholder ?? t("placeholder")}
          className="mt-2 resize-none"
        />
      </label>
      {/* Honeypot — hidden from humans, filled by bots. */}
      <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {error ? <p className="text-sm text-burgundy">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="draw-underline font-sans text-[11px] uppercase tracking-label disabled:opacity-40"
      >
        {pending ? "…" : submitLabel ?? t("send")}
      </button>
    </form>
  );
}
