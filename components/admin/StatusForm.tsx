"use client";

import { FormEvent, useState } from "react";

/** Wraps a server action returning `{ ok }` and shows saved / error inline. */
export function StatusForm({
  action,
  children,
  className,
  submitLabel = "Save",
}: {
  action: (formData: FormData) => Promise<unknown>;
  children: React.ReactNode;
  className?: string;
  submitLabel?: string;
}) {
  const [status, setStatus] = useState<{ ok?: boolean; error?: string }>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus({});
    try {
      await action(new FormData(event.currentTarget));
      setStatus({ ok: true });
    } catch (err) {
      setStatus({ error: err instanceof Error ? err.message : "Failed." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      {children}
      <div className="mt-8 flex items-center gap-6">
        <button type="submit" disabled={pending} className="border border-charcoal px-5 py-2.5 font-sans text-[11px] uppercase tracking-label disabled:opacity-40">
          {pending ? "…" : submitLabel}
        </button>
        {status.ok ? <span className="text-sm text-sage">Saved.</span> : null}
        {status.error ? <span className="text-sm text-burgundy">{status.error}</span> : null}
      </div>
    </form>
  );
}
