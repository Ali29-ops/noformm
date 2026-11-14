"use client";

import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";

export function LanguageToggle({ inverted = false }: { inverted?: boolean }) {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const suffix = `${pathname}${query ? `?${query}` : ""}`;
  const muted = inverted ? "text-ivory/50" : "text-hardwood";
  const active = inverted ? "text-ivory" : "text-charcoal";

  return (
    <div className="flex items-center gap-2 font-sans text-[11px] tracking-wide">
      <a href={`/en${suffix}`} className={locale === "en" ? active : muted}>
        EN
      </a>
      <span className={muted}>/</span>
      <a href={`/ar${suffix}`} className={locale === "ar" ? active : muted}>
        ع
      </a>
    </div>
  );
}
