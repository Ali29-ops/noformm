"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

export function ShowroomFrame() {
  const locale = useLocale();
  useEffect(() => {
    document.body.classList.add("showroom-open");
    return () => document.body.classList.remove("showroom-open");
  }, []);

  return (
    <iframe
      src={`/showroom/index.html?locale=${locale}`}
      title="The Showroom"
      className="fixed inset-0 z-30 border-0 bg-[#0c0b0a]"
      style={{ width: "100vw", height: "100dvh" }}
    />
  );
}
