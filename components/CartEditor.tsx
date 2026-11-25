"use client";

import Image from "next/image";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { setCartQtyAction } from "@/app/shop-actions";
import { lineKey } from "@/lib/product-options";
import { formatMoney } from "@/lib/money";
import { useRouter } from "@/i18n/navigation";

function Chevron({ dir }: { dir: "up" | "down" }) {
  return (
    <svg width="12" height="7" viewBox="0 0 12 7" fill="none" aria-hidden className="block">
      <path
        d={dir === "up" ? "M1 6L6 1L11 6" : "M1 1L6 6L11 1"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="miter"
        strokeLinecap="butt"
      />
    </svg>
  );
}

export function CartEditor({
  rows,
  totalLabel,
  total,
  removeLabel,
  currency = "EGP",
}: {
  rows: {
    slug: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
    max: number;
    color?: string;
    colorLabel?: string;
    material?: string;
    size?: string;
    sizeLabel?: string;
    materialLabel?: string;
  }[];
  totalLabel: string;
  total: string;
  removeLabel: string;
  currency?: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("shop");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function change(slug: string, quantity: number, color?: string, material?: string, size?: string) {
    const key = lineKey(slug, color, material, size);
    setError("");
    setBusy(key);
    try {
      await setCartQtyAction(slug, quantity, color, material, size);
      window.dispatchEvent(new Event("nf-cart"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the cart.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <ul className="divide-y divide-hardwood/20 border-y border-hardwood/20">
        {rows.map((row) => (
          <li key={lineKey(row.slug, row.color, row.material, row.size)} className="flex items-center gap-6 py-6">
            {row.image ? (
              <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-charcoal">
                <Image src={row.image} alt="" fill className="object-cover" sizes="80px" />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="font-serif text-2xl">{row.name}</p>
              {row.sizeLabel || row.materialLabel || row.colorLabel ? (
                <p className="mt-1 text-sm text-hardwood">
                  {[row.sizeLabel, row.materialLabel, row.colorLabel].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              <p className="mt-1 text-sm text-hardwood">{formatMoney(row.price, currency, locale)}</p>
              <div className="mt-3 flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="min-w-[1.1rem] text-center font-serif text-lg leading-none">{row.quantity}</span>
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      aria-label={t("qtyMore")}
                      disabled={busy === lineKey(row.slug, row.color, row.material, row.size) || row.quantity >= row.max}
                      onClick={() => change(row.slug, row.quantity + 1, row.color, row.material, row.size)}
                      className="text-charcoal disabled:text-hardwood/30"
                    >
                      <Chevron dir="up" />
                    </button>
                    <button
                      type="button"
                      aria-label={t("qtyFewer")}
                      disabled={busy === lineKey(row.slug, row.color, row.material, row.size) || row.quantity <= 1}
                      onClick={() => change(row.slug, row.quantity - 1, row.color, row.material, row.size)}
                      className="text-charcoal disabled:text-hardwood/30"
                    >
                      <Chevron dir="down" />
                    </button>
                  </div>
                </div>
                <button type="button" className="label" onClick={() => change(row.slug, 0, row.color, row.material, row.size)}>
                  {removeLabel}
                </button>
              </div>
            </div>
            <p className="font-serif text-xl">{formatMoney(row.price * row.quantity, currency, locale)}</p>
          </li>
        ))}
      </ul>
      {error ? <p className="mt-4 text-sm text-burgundy">{error}</p> : null}
      <p className="mt-8 flex justify-between font-serif text-2xl">
        <span>{totalLabel}</span>
        <span>{total}</span>
      </p>
    </div>
  );
}
