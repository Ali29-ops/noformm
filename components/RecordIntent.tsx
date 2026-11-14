"use client";

import { useEffect } from "react";
import { recordCheckoutAction, recordViewAction } from "@/app/shop-actions";

export function RecordView({ slug }: { slug: string }) {
  useEffect(() => {
    void recordViewAction(slug).catch(() => undefined);
  }, [slug]);
  return null;
}

export function RecordCheckout({ slugs }: { slugs: string[] }) {
  const key = slugs.join(",");
  useEffect(() => {
    void recordCheckoutAction(slugs).catch(() => undefined);
    // The cart contents are the signal; a new array identity should not refire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}
