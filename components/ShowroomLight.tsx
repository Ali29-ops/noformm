"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import { collectionIds } from "@/lib/catalog";

export function ShowroomLight() {
  const pathname = usePathname();
  const lit =
    pathname.startsWith("/collections") &&
    !collectionIds.some(
      (id) => pathname === `/collections/${id}` || pathname.startsWith(`/collections/${id}/`),
    );

  useEffect(() => {
    const root = document.documentElement;
    if (!lit) {
      root.classList.remove("showroom-lit");
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    if (window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    root.classList.add("showroom-lit");
    const onMove = (event: PointerEvent) => {
      root.style.setProperty("--spot-x", `${event.clientX}px`);
      root.style.setProperty("--spot-y", `${event.clientY}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      root.classList.remove("showroom-lit");
    };
  }, [lit]);

  return null;
}
