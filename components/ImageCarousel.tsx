"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export type CarouselSlide = {
  src: string;
  caption: string;
};

const GAP = 8;
const AUTO_MIN = 3;
const AUTO_MAX = 8;
const AUTO_TARGET = 168;
const AUTO_INITIAL = 5;

function countThatFit(width: number) {
  if (width <= 0) return AUTO_INITIAL;
  const n = Math.floor((width + GAP) / (AUTO_TARGET + GAP));
  return Math.min(AUTO_MAX, Math.max(AUTO_MIN, n));
}

export function ImageCarousel({
  slides,
  visible = 2,
}: {
  slides: readonly CarouselSlide[];
  visible?: number | "auto";
}) {
  const showroom = useTranslations("showroom");
  const viewportRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [width, setWidth] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [autoVisible, setAutoVisible] = useState(AUTO_INITIAL);

  const visibleCount = visible === "auto" ? autoVisible : visible;
  const count = slides.length;
  const track = [
    ...slides,
    ...Array.from({ length: visibleCount }, (_, i) => slides[i % count]),
  ];
  const slideWidth = width > 0 ? (width - GAP * (visibleCount - 1)) / visibleCount : 0;
  const step = slideWidth + GAP;
  const fallbackWidth = `calc((100% - ${GAP * (visibleCount - 1)}px) / ${visibleCount})`;
  const filmstrip = visible === "auto" || visibleCount > 2;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => {
      const nextWidth = el.clientWidth;
      setWidth(nextWidth);
      if (visible === "auto") setAutoVisible(countThatFit(nextWidth));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  const go = useCallback((nextIndex: number) => {
    setAnimate(true);
    setIndex(nextIndex);
  }, []);

  const next = useCallback(() => {
    setAnimate(true);
    setIndex((i) => i + 1);
  }, []);

  const prev = useCallback(() => {
    if (index === 0) {
      setAnimate(false);
      setIndex(count);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
          setIndex(count - 1);
        });
      });
      return;
    }
    setAnimate(true);
    setIndex((i) => i - 1);
  }, [index, count]);

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(next, 2000);
    return () => window.clearInterval(id);
  }, [paused, next, count]);

  useEffect(() => {
    if (animate || index !== 0) return;
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, [animate, index]);

  const shown = index % count;
  const visibleCaptions = Array.from({ length: visibleCount }, (_, offset) => {
    return slides[(shown + offset) % count]?.caption;
  }).filter(Boolean);
  const captionText = filmstrip ? (slides[shown]?.caption ?? "") : visibleCaptions.join(" · ");

  return (
    <div
      className="flex w-full flex-col"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setPaused(false);
        }
      }}
    >
      <div ref={viewportRef} className="book-spread relative w-full overflow-hidden" dir="ltr">
        <div
          className={`flex ${animate ? "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" : ""}`}
          style={{
            gap: GAP,
            transform: `translate3d(-${index * step}px, 0, 0)`,
          }}
          onTransitionEnd={() => {
            if (index >= count) {
              setAnimate(false);
              setIndex(0);
            }
          }}
        >
          {track.map((slide, i) => (
            <div
              key={`${slide.src}-${i}`}
              className="object-stage relative aspect-[3/4] shrink-0 overflow-hidden"
              style={{ width: slideWidth || fallbackWidth }}
            >
              <Image
                src={slide.src}
                alt={i >= index && i < index + visibleCount ? slide.caption : ""}
                fill
                priority={i < visibleCount}
                className="object-cover"
                sizes={
                  filmstrip
                    ? "(max-width: 768px) 33vw, 12rem"
                    : "(max-width: 768px) 45vw, 26rem"
                }
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={prev}
          className="absolute inset-y-0 left-0 z-10 w-1/2 bg-transparent"
          aria-label={showroom("previousObject")}
        />
        <button
          type="button"
          onClick={next}
          className="absolute inset-y-0 right-0 z-10 w-1/2 bg-transparent"
          aria-label={showroom("nextObject")}
        />
      </div>
      <div className="mt-6 flex items-end justify-between gap-6">
        <div>
          <p className="label">
            {String(shown + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </p>
          <p className={`mt-2 font-serif ${filmstrip ? "text-lg md:text-xl" : "text-xl md:text-2xl"}`}>
            {captionText}
          </p>
        </div>
        <div className="mb-1 flex gap-2" role="tablist" aria-label={showroom("observe")}>
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              role="tab"
              aria-selected={i === shown}
              aria-label={slide.caption}
              onClick={() => go(i)}
              className={`h-1.5 w-6 border-0 p-0 transition-colors duration-slow ${
                i === shown ? "bg-charcoal" : "bg-hardwood/30 hover:bg-hardwood"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
