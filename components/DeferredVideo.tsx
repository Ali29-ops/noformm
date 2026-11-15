"use client";

import { useEffect, useRef, useState } from "react";

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
};

export function DeferredVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster?: string;
  className: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const connection = (navigator as NavigatorWithConnection).connection;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (connection?.saveData || /^(slow-2g|2g|3g)$/.test(connection?.effectiveType ?? "")) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldLoad(true);
        observer.disconnect();
      }
    });

    const observe = () => observer.observe(video);
    if (document.readyState === "complete") {
      observe();
    } else {
      window.addEventListener("load", observe, { once: true });
    }

    return () => {
      window.removeEventListener("load", observe);
      observer.disconnect();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className={className}
      src={shouldLoad ? src : undefined}
      poster={poster}
      preload="none"
      autoPlay
      muted
      loop
      playsInline
      aria-hidden
    />
  );
}
