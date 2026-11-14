"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { addToCartAction } from "@/app/shop-actions";
import type { SwatchOption } from "@/lib/product-options";

function Swatches({
  legend,
  options,
  value,
  locale,
  onChange,
}: {
  legend: string;
  options: readonly SwatchOption[];
  value: string;
  locale: string;
  onChange: (id: string) => void;
}) {
  return (
    <fieldset className="mb-8">
      <legend className="label text-ivory/55">{legend}</legend>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {options.map((option) => {
          const on = value === option.id;
          const name = locale === "ar" ? option.ar : option.en;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={on}
              aria-label={name}
              title={name}
              className={`h-8 w-8 rounded-full border transition-transform ${
                on ? "scale-110 border-ivory ring-2 ring-ivory/70" : "border-ivory/35 hover:border-ivory/70"
              }`}
              style={{ backgroundColor: option.hex }}
            />
          );
        })}
      </div>
      <p className="mt-3 text-sm text-ivory/70">
        {options.find((item) => item.id === value)?.[locale === "ar" ? "ar" : "en"]}
      </p>
    </fieldset>
  );
}

export function AddToCartButton({
  slug,
  collection,
  available,
  label,
  soldOut,
  colors = [],
  materials = [],
  locale,
}: {
  slug: string;
  collection: string;
  available: number;
  label: string;
  soldOut: string;
  colors?: readonly SwatchOption[];
  materials?: readonly SwatchOption[];
  locale: string;
}) {
  const t = useTranslations("product");
  const common = useTranslations("common");
  const [color, setColor] = useState(colors[0]?.id ?? "");
  const [material, setMaterial] = useState(materials[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const empty = available < 1;

  async function onAdd() {
    if (materials.length && !material) {
      setMessage(t("chooseMaterial"));
      return;
    }
    if (colors.length && !color) {
      setMessage(t("chooseColor"));
      return;
    }
    setPending(true);
    setMessage("");
    try {
      await addToCartAction(slug, collection, color || undefined, material || undefined);
      setMessage("Added.");
      window.dispatchEvent(new Event("nf-cart"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-10">
      {materials.length > 0 ? (
        <Swatches
          legend={common("materials")}
          options={materials}
          value={material}
          locale={locale}
          onChange={setMaterial}
        />
      ) : null}
      {colors.length > 0 ? (
        <Swatches legend={t("color")} options={colors} value={color} locale={locale} onChange={setColor} />
      ) : null}
      <button
        type="button"
        onClick={onAdd}
        disabled={empty || pending}
        className="draw-underline font-sans text-[11px] uppercase tracking-label disabled:cursor-not-allowed disabled:opacity-40"
      >
        {empty ? soldOut : pending ? "…" : label}
      </button>
      {message ? <p className="mt-3 text-sm text-ivory/70">{message}</p> : null}
    </div>
  );
}
