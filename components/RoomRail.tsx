"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { collectionEnterHref, collectionIds, type CollectionId } from "@/lib/catalog";

export function RoomRail() {
  const pathname = usePathname();
  const t = useTranslations("collections");
  const rooms = useTranslations("showroom");
  const onAFloor = collectionIds.some(
    (id) => pathname === `/collections/${id}` || pathname.startsWith(`/collections/${id}/`),
  );
  if (onAFloor) return null;
  const show = pathname.startsWith("/collections/");
  if (!show) return null;

  const current = collectionIds.find((id) =>
    pathname.startsWith(`/collections/${id}`),
  );

  return (
    <nav
      aria-label={rooms("room")}
      className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center md:inset-auto md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:end-7"
    >
      <ul className="pointer-events-auto flex items-center gap-4 rounded-full border border-hardwood/25 bg-ivory/88 px-4 py-3 backdrop-blur-md md:flex-col md:gap-5 md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
        {collectionIds.map((id) => {
          const active = current === id;
          return (
            <li key={id}>
              <Link
                href={collectionEnterHref(id)}
                className="group flex items-center gap-3"
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={`block h-1.5 w-1.5 rounded-full transition-all duration-slow ${
                    active
                      ? "scale-125 bg-charcoal"
                      : "bg-hardwood/45 group-hover:bg-charcoal"
                  }`}
                />
                <span
                  className={`hidden font-sans text-[10px] uppercase tracking-label md:block ${
                    active ? "text-charcoal" : "text-hardwood/0 group-hover:text-hardwood"
                  }`}
                >
                  {t(`${id as CollectionId}.name`)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
