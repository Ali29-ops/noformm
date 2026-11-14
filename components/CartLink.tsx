"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { getCartLines } from "@/app/shop-actions";
import { cartCount } from "@/lib/cart-model";

export function CartLink({
  label,
}: {
  label: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const load = () => {
      getCartLines()
        .then((lines) => setCount(cartCount(lines)))
        .catch(() => setCount(0));
    };
    load();
    window.addEventListener("nf-cart", load);
    return () => window.removeEventListener("nf-cart", load);
  }, []);

  return (
    <Link href="/cart" className="draw-underline font-sans text-[11px] uppercase tracking-label">
      {label}
      {count > 0 ? ` (${count})` : ""}
    </Link>
  );
}
