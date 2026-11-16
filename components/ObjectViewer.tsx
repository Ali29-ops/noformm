"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

export function ObjectViewer({
  images,
  name,
}: {
  images: readonly string[];
  name: string;
}) {
  const t = useTranslations("showroom");
  const picture = useTranslations("product");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);

  const close = useCallback(() => setOpen(false), []);
  const prev = useCallback(
    () => setIndex((i) => (i + images.length - 1) % images.length),
    [images.length],
  );
  const next = useCallback(
    () => setIndex((i) => (i + 1) % images.length),
    [images.length],
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
    if (touchX.current === null || images.length < 2) return;
    const delta = event.clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta > 0) prev();
    else next();
  }

  if (images.length === 0) return null;

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
              src={images[index]}
              alt={name}
              fill
              priority
              className="object-cover fade-in"
              sizes="(max-width: 768px) 100vw, 55vw"
            />
          </button>
        </div>
        {images.length > 1 ? (
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
              {index + 1} {t("of")} {images.length}
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
                src={images[index]}
                alt={name}
                fill
                className="object-contain fade-in"
                sizes="100vw"
                priority
              />
            </div>
            {images.length > 1 && (
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
            {index + 1} {t("of")} {images.length}
          </p>
        </div>,
        document.body,
      )}
    </>
  );
}
