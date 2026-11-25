"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { sizesFor } from "@/lib/product-sizes";
import { addToCartAction } from "@/app/shop-actions";
import { useMaterialView } from "@/components/ProductView";
import { colorLegendKey, materialLegendKey, type SwatchOption } from "@/lib/product-options";

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
              className={`h-11 w-11 rounded-full border bg-cover bg-center transition-transform ${
                on ? "scale-110 border-ivory ring-2 ring-ivory/70" : "border-ivory/35 hover:border-ivory/70"
              }`}
              style={
                option.image
                  ? { backgroundImage: `url(${option.image})` }
                  : { backgroundColor: option.hex }
              }
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
  const materialView = useMaterialView();
  const [color, setColor] = useState(colors[0]?.id ?? "");
  const [material, setMaterial] = useState(materials[0]?.id ?? "");
  const sizes = sizesFor(slug);
  const [size, setSize] = useState("");
  const selectedSize = sizes.find((option) => option.id === size);
  const measurements = selectedSize ? [
    [locale === "ar" ? "العرض" : "Width", selectedSize.width],
    [locale === "ar" ? "ارتفاع الظهر" : "Back height", selectedSize.backHeight],
    [locale === "ar" ? "ارتفاع المقعد" : "Seat height", selectedSize.seatHeight],
  ] as const : [];
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const empty = available < 1;
  const [lastSwatch, setLastSwatch] = useState<"material" | "color">("material");

  useEffect(() => {
    if (!materialView) return;
    const materialPhoto = materials.find((option) => option.id === material)?.productImage;
    const colorPhoto = colors.find((option) => option.id === color)?.productImage;
    const chosen = lastSwatch === "color" ? colorPhoto || materialPhoto : materialPhoto || colorPhoto;
    materialView.setView(chosen ?? null);
  }, [materialView, material, color, materials, colors, lastSwatch]);

  async function onAdd() {
    if (sizes.length && !size) {
      setMessage(locale === "ar" ? "اختر المقاس." : "Choose a size.");
      return;
    }
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
      await addToCartAction(slug, collection, color || undefined, material || undefined, size || undefined);
      setMessage("Added.");
      window.dispatchEvent(new Event("nf-cart"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add.");
    } finally {
      setPending(false);
    }
  }

  const materialKey = materialLegendKey(slug);

  return (
    <div className="mt-10">
      {sizes.length > 0 && (
        <fieldset className="mb-6">
          <legend className="label text-ivory/70">{locale === "ar" ? "المقاس" : "Size"}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((option) => (
              <label key={option.id} className="cursor-pointer">
                <input className="peer sr-only" type="radio" name={`size-${slug}`} value={option.id} checked={size === option.id} onChange={() => { setSize(option.id); setMessage(""); }} />
                <span className="block border border-ivory/35 px-4 py-2 text-sm peer-checked:bg-ivory peer-checked:text-charcoal peer-focus-visible:outline peer-focus-visible:outline-offset-2">
                  {locale === "ar" ? option.ar : option.en}
                </span>
              </label>
            ))}
          </div>
          <div aria-live="polite">
            {selectedSize && (
              <dl className="mt-3 space-y-1 text-sm text-ivory/80">
                {measurements.map(([name, value]) => value != null && (
                  <div key={name} className="flex gap-2">
                    <dt>{name}</dt>
                    <dd>{value} {locale === "ar" ? "سم" : "cm"}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </fieldset>
      )}
      {materials.length > 0 ? (
        <Swatches
          legend={materialKey === "materials" ? common("materials") : t(materialKey)}
          options={materials}
          value={material}
          locale={locale}
          onChange={(id) => {
            setMaterial(id);
            setLastSwatch("material");
          }}
        />
      ) : null}
      {colors.length > 0 ? (
        <Swatches
          legend={t(colorLegendKey(slug))}
          options={colors}
          value={color}
          locale={locale}
          onChange={(id) => {
            setColor(id);
            setLastSwatch("color");
          }}
        />
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
