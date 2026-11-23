"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

export function ObjectViewer({
  images,
  name,
  featured = null,
}: {
  images: readonly string[];
  name: string;
  /** Full product photo for the selected swatch. Replaces the gallery while set. */
  featured?: string | null;
}) {
  const t = useTranslations("showroom");
  const picture = useTranslations("product");
  const frames = useMemo(() => {
    if (featured) return [featured];
    return images;
  }, [featured, images]);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    setIndex(0);
  }, [featured]);

  const close = useCallback(() => setOpen(false), []);
  const prev = useCallback(
    () => setIndex((i) => (i + frames.length - 1) % frames.length),
    [frames.length],
  );
  const next = useCallback(
    () => setIndex((i) => (i + 1) % frames.length),
    [frames.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") prev();
      if (event.key === "ArrowRight") next();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, prev, next]);

  function onPointerDown(event: PointerEvent) {
    touchX.current = event.clientX;
  }

  function onPointerUp(event: PointerEvent) {
    if (touchX.current === null || frames.length < 2) return;
    const delta = event.clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta > 0) prev();
    else next();
  }

  if (frames.length === 0) return null;
  const safeIndex = index % frames.length;

  return (
    <>
      <div className="relative">
        <div
          className="object-stage group relative aspect-[4/5] w-full overflow-hidden bg-[#1c1a18]"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="absolute inset-0 border-0 bg-transparent p-0"
            aria-label={`${t("observe")} — ${name}`}
          >
            <Image
              key={frames[safeIndex]}
              src={frames[safeIndex]}
              unoptimized={!frames[safeIndex].startsWith("/") || frames[safeIndex].startsWith("//")}
              alt={name}
              fill
              priority
              className="object-cover fade-in"
              sizes="(max-width: 768px) 100vw, 55vw"
            />
          </button>
        </div>
        {frames.length > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute start-3 top-1/2 z-10 -translate-y-1/2 bg-charcoal/55 px-3 py-2 font-sans text-[11px] uppercase tracking-label text-ivory hover:bg-charcoal/80"
              aria-label={picture("previousPicture")}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute end-3 top-1/2 z-10 -translate-y-1/2 bg-charcoal/55 px-3 py-2 font-sans text-[11px] uppercase tracking-label text-ivory hover:bg-charcoal/80"
              aria-label={picture("nextPicture")}
            >
              ›
            </button>
            <p className="label mt-4 text-center text-ivory/55">
              {safeIndex + 1} {t("of")} {frames.length}
            </p>
          </>
        ) : null}
      </div>

      {open &&
        createPortal(
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-charcoal text-ivory"
          role="dialog"
          aria-modal="true"
          aria-label={name}
        >
          <div className="flex items-center justify-between px-6 py-5 md:px-12">
            <p className="label text-ivory/70">{name}</p>
            <button
              type="button"
              onClick={close}
              className="border border-ivory px-4 py-2 font-sans text-[11px] uppercase tracking-label"
            >
              × {t("close")}
            </button>
          </div>
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-6 pb-10 md:px-16"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            <div className="relative h-full w-full max-w-5xl">
              <Image
                key={frames[safeIndex]}
                src={frames[safeIndex]}
                unoptimized={!frames[safeIndex].startsWith("/") || frames[safeIndex].startsWith("//")}
                alt={name}
                fill
                className="object-contain fade-in"
                sizes="100vw"
                priority
              />
            </div>
            {frames.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute start-4 top-1/2 -translate-y-1/2 font-sans text-[11px] uppercase tracking-label text-ivory/70 hover:text-ivory"
                >
                  {picture("previousPicture")}
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute end-4 top-1/2 -translate-y-1/2 font-sans text-[11px] uppercase tracking-label text-ivory/70 hover:text-ivory"
                >
                  {picture("nextPicture")}
                </button>
              </>
            )}
          </div>
          <p className="label pb-6 text-center text-ivory/55">
            {safeIndex + 1} {t("of")} {frames.length}
          </p>
        </div>,
        document.body,
      )}
    </>
  );
}
