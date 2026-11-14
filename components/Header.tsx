"use client";

import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { LanguageToggle } from "./LanguageToggle";
import { CartLink } from "./CartLink";
import { SignInLink } from "./SignInLink";
import { CollectionsMenu } from "./CollectionsMenu";
import type { NavCatalog } from "@/lib/nav-catalog";

const itemClass = "flex min-h-14 items-center justify-between font-sans text-2xl uppercase tracking-wide";

export function Header({ signedIn, catalog }: { signedIn: boolean; catalog: NavCatalog }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [barHover, setBarHover] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setShopOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      setShopOpen(false);
      document.body.style.overflow = "";
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (shopOpen) setShopOpen(false);
        else setOpen(false);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, shopOpen]);

  const homeHero = pathname === "/";
  const galleryFloor =
    /^\/collections\/(sphere|retro|tiles|fringes)(\/[^/]+)?$/.test(pathname);
  const showroom = pathname === "/collections";
  const overlay = (showroom || galleryFloor || (homeHero && !scrolled)) && !open && !megaOpen && !barHover;
  const tone = overlay ? "text-ivory" : "text-charcoal";
  const linkClass = "draw-underline font-sans text-[11px] uppercase tracking-label";

  function closeMenu() {
    setOpen(false);
    setShopOpen(false);
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-200 ${
          overlay
            ? "border-b border-transparent bg-transparent"
            : "border-b border-hardwood/25 bg-ivory"
        } ${open ? "md:block hidden" : ""}`}
        onMouseEnter={() => setBarHover(true)}
        onMouseLeave={() => setBarHover(false)}
      >
        <div className={`mx-auto flex max-w-editorial items-center justify-between px-6 py-4 md:px-12 ${tone}`}>
          <Link href="/" aria-label="NO FORM">
            <Logo inverted={overlay} />
          </Link>

          <nav className="hidden items-center gap-8 lg:gap-10 md:flex" aria-label={t("menu")}>
            <CollectionsMenu catalog={catalog} onOpenChange={setMegaOpen} />
            <Link href="/about" className={linkClass}>
              {t("about")}
            </Link>
            <Link href="/styling" className={linkClass}>
              {t("styling")}
            </Link>
            <Link href="/designer" className={linkClass}>
              {t("designer")}
            </Link>
            <CartLink label={t("cart")} />
            <SignInLink signedIn={signedIn} signIn={t("signIn")} account={t("account")} />
            <Suspense>
              <LanguageToggle inverted={overlay} />
            </Suspense>
          </nav>

          <div className="flex items-center gap-5 md:hidden">
            <CartLink label={t("cart")} />
            <button
              type="button"
              className="flex min-h-11 min-w-11 items-center justify-end font-sans text-[11px] uppercase tracking-label"
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen(true)}
            >
              {t("menu")}
              <span className="relative ms-2 h-3 w-4" aria-hidden>
                <span className="absolute inset-x-0 top-0 h-px bg-current" />
                <span className="absolute inset-x-0 top-[5px] h-px bg-current" />
                <span className="absolute inset-x-0 top-[10px] h-px bg-current" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div
          id="site-menu"
          className="fixed inset-0 z-[60] flex h-[100dvh] max-h-[100dvh] flex-col bg-ivory text-charcoal md:hidden"
        >
          <div className="flex shrink-0 items-center justify-between px-6 py-4">
            {shopOpen ? (
              <button
                type="button"
                className="flex min-h-11 items-center gap-3 font-sans text-[11px] uppercase tracking-label"
                onClick={() => setShopOpen(false)}
              >
                <Chevron className="rotate-180 rtl:rotate-0" />
                {t("showroom")}
              </button>
            ) : (
              <Link href="/" aria-label="NO FORM" onClick={closeMenu}>
                <Logo />
              </Link>
            )}
            <button
              type="button"
              className="flex min-h-11 min-w-11 items-center justify-end font-sans text-[11px] uppercase tracking-label"
              aria-expanded
              aria-controls="site-menu"
              onClick={closeMenu}
            >
              {t("close")}
              <span className="relative ms-2 h-3 w-4" aria-hidden>
                <span className="absolute inset-x-0 top-[5px] h-px rotate-45 bg-current" />
                <span className="absolute inset-x-0 top-[5px] h-px -rotate-45 bg-current" />
              </span>
            </button>
          </div>

          <nav
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-16"
            aria-label={t("menu")}
          >
            {shopOpen ? (
              <>
                <div className="mb-6 flex flex-col gap-3">
                  <Link
                    href="/products"
                    className="inline-flex min-h-12 items-center justify-between border border-hardwood/50 px-4 font-sans text-[11px] uppercase tracking-label"
                    onClick={() => pathname === "/products" && closeMenu()}
                  >
                    {t("allProducts")}
                    <span aria-hidden className="text-base leading-none rtl:rotate-180">
                      →
                    </span>
                  </Link>
                  <Link
                    href="/collections"
                    className="inline-flex min-h-12 items-center justify-between border border-charcoal bg-charcoal px-4 font-sans text-[11px] uppercase tracking-label text-ivory"
                    onClick={() => pathname === "/collections" && closeMenu()}
                  >
                    {t("showroom")}
                    <span aria-hidden className="text-base leading-none rtl:rotate-180">
                      →
                    </span>
                  </Link>
                </div>
                {catalog.columns.map((column) => (
                  <div key={column.id} className="mt-8">
                    <Link
                      href={column.href}
                      className="flex min-h-11 items-center font-sans text-xl uppercase tracking-wide"
                      onClick={() => pathname === column.href && closeMenu()}
                    >
                      {column.name}
                    </Link>
                    <div className="mt-1 flex flex-col">
                      {column.products.map((product) => (
                        <Link
                          key={product.slug}
                          href={product.href}
                          className="flex min-h-10 items-center text-lg text-hardwood"
                          onClick={() => pathname === product.href && closeMenu()}
                        >
                          {product.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <Link href="/" className={itemClass} onClick={() => pathname === "/" && closeMenu()}>
                  {t("home")}
                </Link>
                <button type="button" className={itemClass} onClick={() => setShopOpen(true)}>
                  {t("showroom")}
                  <Chevron className="rtl:rotate-180" />
                </button>
                <Link
                  href="/about"
                  className={itemClass}
                  onClick={() => pathname === "/about" && closeMenu()}
                >
                  {t("about")}
                </Link>
                <Link
                  href="/styling"
                  className={itemClass}
                  onClick={() => pathname === "/styling" && closeMenu()}
                >
                  {t("styling")}
                </Link>
                <Link
                  href="/designer"
                  className={itemClass}
                  onClick={() => pathname === "/designer" && closeMenu()}
                >
                  {t("designer")}
                </Link>
                <Link
                  href="/cart"
                  className={itemClass}
                  onClick={() => pathname === "/cart" && closeMenu()}
                >
                  {t("cart")}
                </Link>
                <Link
                  href={signedIn ? "/account" : "/signin"}
                  className={itemClass}
                  onClick={() => pathname === (signedIn ? "/account" : "/signin") && closeMenu()}
                >
                  {signedIn ? t("account") : t("signIn")}
                </Link>
                <div className="mt-10">
                  <Suspense>
                    <LanguageToggle />
                  </Suspense>
                </div>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </>
  );
}

function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`h-4 w-4 ${className}`} fill="none" aria-hidden>
      <path d="M6 3.5 11 8l-5 4.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
