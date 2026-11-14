"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { NavCatalog } from "@/lib/nav-catalog";

const pages = [
  { href: "/products", key: "allProducts" as const },
  { href: "/collections", key: "showroom" as const },
];

export function CollectionsMenu({
  catalog,
  onOpenChange,
}: {
  catalog: NavCatalog;
  onOpenChange?: (open: boolean) => void;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(0);
  const rootRef = useRef<HTMLSpanElement>(null);
  const leaveTimer = useRef<number>(0);
  const menuId = useId();
  const active = pathname === "/products" || pathname === "/collections" || pathname.startsWith("/collections/");
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const header = rootRef.current?.closest("header");
    if (header) setTop(header.getBoundingClientRect().bottom);

    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if ((event.target as HTMLElement | null)?.closest?.("[data-mega-panel]")) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onScroll = () => {
      const next = rootRef.current?.closest("header");
      if (next) setTop(next.getBoundingClientRect().bottom);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  function cancelLeave() {
    window.clearTimeout(leaveTimer.current);
  }

  function scheduleLeave() {
    cancelLeave();
    leaveTimer.current = window.setTimeout(() => setOpen(false), 220);
  }

  const linkClass = "draw-underline font-sans text-[11px] uppercase tracking-label";

  return (
    <>
      <span
        ref={rootRef}
        className="inline-flex"
        onMouseEnter={() => {
          cancelLeave();
          setOpen(true);
          onOpenChange?.(true);
        }}
        onMouseLeave={scheduleLeave}
      >
        <button
          type="button"
          className={`${linkClass} ${active ? "text-current" : ""}`}
          aria-expanded={open}
          aria-controls={menuId}
          aria-haspopup="true"
          onClick={() => {
            cancelLeave();
            setOpen(true);
          }}
        >
          {t("showroom")}
        </button>
      </span>
      {open ? (
        <div
          id={menuId}
          data-mega-panel
          className="fixed inset-x-0 z-50 overflow-y-auto overscroll-contain"
          style={{ top, maxHeight: `calc(100vh - ${top}px)` }}
          onMouseEnter={cancelLeave}
          onMouseLeave={scheduleLeave}
        >
          <div className="border-t border-hardwood/20 bg-ivory text-charcoal shadow-[0_24px_48px_rgba(30,32,31,0.08)]">
            <div className="mx-auto grid max-w-editorial grid-cols-2 gap-x-8 gap-y-10 px-6 py-10 sm:grid-cols-3 lg:grid-cols-5 lg:px-12 lg:py-12">
              <div className="flex flex-col gap-3">
                {pages.map((item) => {
                  const here = pathname === item.href;
                  const filled = item.key === "showroom";
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex min-h-11 items-center justify-between gap-3 border px-4 font-sans text-[11px] uppercase tracking-label transition-colors ${
                        filled
                          ? here
                            ? "border-charcoal bg-charcoal text-ivory"
                            : "border-charcoal bg-charcoal text-ivory hover:bg-hardwood"
                          : here
                            ? "border-charcoal bg-ivory text-charcoal"
                            : "border-hardwood/50 bg-ivory text-charcoal hover:border-charcoal"
                      }`}
                    >
                      {t(item.key)}
                      <span aria-hidden className="text-base leading-none rtl:rotate-180">
                        →
                      </span>
                    </Link>
                  );
                })}
              </div>
              {catalog.columns.map((column) => (
                <div key={column.id} className="flex flex-col gap-3">
                  <Link
                    href={column.href}
                    className="font-sans text-[11px] uppercase tracking-label text-charcoal"
                  >
                    {column.name}
                  </Link>
                  {column.products.map((product) => (
                    <Link
                      key={product.slug}
                      href={product.href}
                      className={`text-sm leading-snug transition-colors hover:text-charcoal ${
                        pathname === product.href ? "text-charcoal" : "text-hardwood"
                      }`}
                    >
                      {product.name}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
