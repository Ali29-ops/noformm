"use client";

import { useFormStatus } from "react-dom";

export function EmailCartButton({ label = "Email" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-charcoal px-4 py-2 font-sans text-[11px] uppercase tracking-label disabled:opacity-50"
    >
      {pending ? "Sending…" : label}
    </button>
  );
}
