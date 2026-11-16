"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { addToCartAction } from "@/app/shop-actions";
import { Link, useRouter } from "@/i18n/navigation";
import { colorLegendKey, materialLegendKey, type SwatchOption } from "@/lib/product-options";

export type ComplementCard = {
  slug: string;
  collection: string;
  name: string;
  image: string;
  priceLabel: string;
  colors: SwatchOption[];
  materials: SwatchOption[];
};

function Circles({
  legend,
  options,
  value,
  locale,
  onChange,
}: {
  legend: string;
  options: SwatchOption[];
  value: string;
  locale: string;
  onChange: (id: string) => void;
}) {
  if (options.length === 0) return null;
  const selected = options.find((item) => item.id === value);
  const label = selected ? (locale === "ar" ? selected.ar : selected.en) : "";
  return (
    <fieldset className="mt-7">
      <legend className="label">{legend}</legend>
      <div className="mt-3 flex flex-wrap items-center gap-3">
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
              className={`h-11 w-11 rounded-full border bg-cover bg-center transition-transform duration-300 ${
                on ? "scale-110 border-charcoal ring-1 ring-charcoal ring-offset-2 ring-offset-ivory" : "border-hardwood/35"
              }`}
              style={option.image ? { backgroundImage: `url(${option.image})` } : { backgroundColor: option.hex }}
            />
          );
        })}
      </div>
      {label ? <p className="mt-2.5 text-sm text-hardwood">{label}</p> : null}
    </fieldset>
  );
}

export function CartComplements({
  items,
  checkoutLabel,
  checkoutLede,
}: {
  items: ComplementCard[];
  checkoutLabel: string;
  checkoutLede: string;
}) {
  const t = useTranslations("shop.completeRoom");
  const productT = useTranslations("product");
  const common = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const touchX = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);
  const [color, setColor] = useState("");
  const [material, setMaterial] = useState("");
  const [pending, setPending] = useState(false);
  const [held, setHeld] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  const count = items.length;
  const item = items[index] ?? items[0];
  const materialKey = item ? materialLegendKey(item.slug) : "materials";
  const done = item ? Boolean(held[item.slug]) : false;
  const rtl = locale === "ar";

  const checkout = useCallback(() => router.push("/checkout"), [router]);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex((i) => Math.min(count - 1, i + 1)), [count]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!item) return;
    setColor(item.colors[0]?.id ?? "");
    setMaterial(item.materials[0]?.id ?? "");
    setError("");
  }, [item?.slug]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") checkout();
      if (event.key === "ArrowLeft") (rtl ? next : prev)();
      if (event.key === "ArrowRight") (rtl ? prev : next)();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, checkout, prev, next, rtl]);

  function onPointerDown(event: PointerEvent) {
    touchX.current = event.clientX;
  }

  function onPointerUp(event: PointerEvent) {
    if (touchX.current === null || count < 2) return;
    const delta = event.clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(delta) < 48) return;
    if (delta > 0) (rtl ? next : prev)();
    else (rtl ? prev : next)();
  }

  async function add() {
    if (!item || done) return;
    if (item.colors.length && !color) {
      setError(productT("chooseColor"));
      return;
    }
    if (item.materials.length && !material) {
      setError(productT("chooseMaterial"));
      return;
    }
    setError("");
    setPending(true);
    try {
      await addToCartAction(item.slug, item.collection, color || undefined, material || undefined);
      window.dispatchEvent(new Event("nf-cart"));
      setHeld((prevHeld) => ({ ...prevHeld, [item.slug]: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the piece.");
    } finally {
      setPending(false);
    }
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  const shift = rtl ? index * 100 : -index * 100;

  return (
    <>
      <p className="mt-10 text-sm text-hardwood">{checkoutLede}</p>
      {items.length === 0 ? (
        <Link
          href="/checkout"
          className="mt-8 inline-block border border-charcoal px-6 py-3 font-sans text-[11px] uppercase tracking-label"
        >
          {checkoutLabel}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => {
            setIndex(0);
            setError("");
            setOpen(true);
          }}
          className="mt-8 inline-block border border-charcoal px-6 py-3 font-sans text-[11px] uppercase tracking-label"
        >
          {checkoutLabel}
        </button>
      )}

      {mounted && open && item
        ? createPortal(
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8">
              <button type="button" aria-label={t("skip")} onClick={checkout} className="absolute inset-0 bg-charcoal/50" />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="complete-room-title"
                className="relative z-10 grid h-[min(36rem,calc(100dvh-2rem))] w-[min(64rem,calc(100vw-2rem))] overflow-hidden bg-ivory text-charcoal md:grid-cols-2"
              >
                <div
                  className="relative h-44 shrink-0 overflow-hidden bg-[#1c1a18] sm:h-56 md:h-full"
                  onPointerDown={onPointerDown}
                  onPointerUp={onPointerUp}
                >
                  <div
                    className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ transform: `translate3d(${shift}%,0,0)` }}
                  >
                    {items.map((slide) => (
                      <div key={slide.slug} className="relative h-full w-full shrink-0">
                        {slide.image ? (
                          <Image
                            src={slide.image}
                            alt={slide.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 92vw, 32rem"
                            draggable={false}
                          />
                        ) : (
                          <div className="h-full bg-hardwood/15" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex min-h-0 flex-col overflow-y-auto px-6 py-6 sm:px-8 md:px-10 md:py-8">
                  <div className="flex items-start justify-between gap-6">
                    <p id="complete-room-title" className="font-serif text-2xl leading-snug md:text-3xl">
                      {t("title")}
                    </p>
                    <button
                      type="button"
                      onClick={checkout}
                      className="shrink-0 pt-1 font-sans text-[11px] uppercase tracking-label"
                    >
                      {t("skip")}
                    </button>
                  </div>

                  <p className="mt-10 font-serif text-2xl leading-snug md:text-3xl">{item.name}</p>
                  <p className="mt-2 text-sm text-hardwood">{item.priceLabel}</p>

                  <Circles
                    legend={productT(colorLegendKey(item.slug))}
                    options={item.colors}
                    value={color}
                    locale={locale}
                    onChange={setColor}
                  />
                  <Circles
                    legend={materialKey === "materials" ? common("materials") : productT(materialKey)}
                    options={item.materials}
                    value={material}
                    locale={locale}
                    onChange={setMaterial}
                  />

                  {error ? <p className="mt-5 text-sm text-burgundy">{error}</p> : null}

                  <button
                    type="button"
                    disabled={done || pending}
                    onClick={add}
                    className="mt-8 w-fit border border-charcoal bg-charcoal px-10 py-3 font-sans text-[11px] uppercase tracking-label text-ivory disabled:opacity-40"
                  >
                    {done ? t("held") : pending ? "…" : t("add")}
                  </button>

                  {count > 1 ? (
                    <div className="mt-auto flex items-center gap-6 pt-10">
                      <button
                        type="button"
                        onClick={rtl ? next : prev}
                        disabled={index === 0}
                        aria-label={t("prev")}
                        className="font-serif text-2xl leading-none text-charcoal disabled:text-hardwood/30"
                      >
                        ‹
                      </button>
                      <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-hardwood">
                        {pad(index + 1)} — {pad(count)}
                      </p>
                      <button
                        type="button"
                        onClick={rtl ? prev : next}
                        disabled={index === count - 1}
                        aria-label={t("next")}
                        className="font-serif text-2xl leading-none text-charcoal disabled:text-hardwood/30"
                      >
                        ›
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
