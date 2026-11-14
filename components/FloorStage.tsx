"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { collectionEnterHref, getFloorIndex, type CollectionId } from "@/lib/catalog";

export function FloorSides({
  prev,
  next,
}: {
  prev: { id: CollectionId; name: string };
  next: { id: CollectionId; name: string };
}) {
  const t = useTranslations("showroom");

  return (
    <>
      <Link
        href={collectionEnterHref(prev.id)}
        className="floor-side floor-side-prev"
        aria-label={`${t("previousRoom")}: ${prev.name}`}
      >
        <span className="floor-side-index">{getFloorIndex(prev.id)}</span>
        <span className="floor-side-name">{prev.name}</span>
      </Link>
      <Link
        href={collectionEnterHref(next.id)}
        className="floor-side floor-side-next"
        aria-label={`${t("nextRoom")}: ${next.name}`}
      >
        <span className="floor-side-index">{getFloorIndex(next.id)}</span>
        <span className="floor-side-name">{next.name}</span>
      </Link>
    </>
  );
}
