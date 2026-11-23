"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export type ReviewCard = {
  id: string;
  quote: string;
  name: string;
  image: string;
  alt: string;
  position: number;
  rating: number;
};

export function ReviewRail({
  reviews,
  previousLabel,
  nextLabel,
  locale,
}: {
  reviews: ReviewCard[];
  previousLabel: string;
  nextLabel: string;
  locale: string;
}) {
  const count = reviews.length;
  const [pageIndex, setPageIndex] = useState(0);
  const [perPage, setPerPage] = useState(2);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const apply = () => setPerPage(media.matches ? Math.min(2, count) : 1);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [count]);

  if (count === 0) return null;

  const page = Math.max(perPage, 1);
  const pageCount = Math.ceil(count / page);
  const currentPage = pageIndex % pageCount;
  const shown = reviews.slice(currentPage * page, (currentPage + 1) * page);
  const mark = locale === "ar" ? "«" : "“";
  const previousGlyph = locale === "ar" ? "→" : "←";
  const nextGlyph = locale === "ar" ? "←" : "→";

  function step(direction: number) {
    setPageIndex((current) => (current % pageCount + direction + pageCount) % pageCount);
  }

  return (
    <div>
      <ul className="mt-12 grid gap-4 md:mt-14 md:grid-cols-2 md:gap-5">
        {shown.map((review) => (
          <li
            key={review.id}
            className="grid bg-[#f3efe6] md:aspect-[100/46] md:grid-cols-[minmax(0,46%)_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)]"
          >
            <div className="relative aspect-[4/3] w-full self-center md:aspect-square">
              <Image
                src={review.image}
                alt={review.alt}
                fill
                sizes="(min-width: 768px) 22vw, 92vw"
                className="object-cover"
                style={{ objectPosition: `center ${review.position}%` }}
                unoptimized={!review.image.startsWith("/") || review.image.startsWith("/api/review-photos/")}
              />
            </div>
            <div className="flex min-h-0 flex-col overflow-auto px-6 py-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-7 md:py-8">
              <div className="my-auto break-words">
                <p className="font-serif text-5xl leading-none text-charcoal md:text-6xl" aria-hidden>
                  {mark}
                </p>
                <p className="mt-2 font-serif text-lg italic leading-snug text-charcoal">
                  {review.quote}
                </p>
                <p className="label mt-5 text-charcoal">— {review.name}</p>
                <p className="mt-2.5 flex gap-1.5 text-[13px] leading-none text-charcoal" aria-label={`${review.rating}/5`}>
                  {Array.from({ length: review.rating }, (_, index) => (
                    <span key={index} aria-hidden>{"\u2605"}</span>
                  ))}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {count > page ? (
        <div className="mt-8 flex items-center md:mt-10">
          <span className="h-px flex-1 bg-charcoal/25" aria-hidden />
          <div className="ms-8 flex gap-6">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={previousLabel}
              className="font-serif text-2xl leading-none text-charcoal transition-opacity hover:opacity-50"
            >
              {previousGlyph}
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label={nextLabel}
              className="font-serif text-2xl leading-none text-charcoal transition-opacity hover:opacity-50"
            >
              {nextGlyph}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
