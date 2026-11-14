"use client";

import { useState } from "react";
import type { OrderStatus } from "@/lib/db/schema";

type FieldSpec = {
  name: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  type?: "text" | "number" | "checkbox" | "select";
  options?: { value: string; label: string }[];
  step?: string;
  min?: string;
};

export function OrderActionForm({
  action,
  id,
  to,
  hidden = {},
  label,
  hint,
  fields = [],
  tone = "solid",
  confirm: confirmText,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  to?: OrderStatus;
  /** Extra hidden inputs submitted with the form. */
  hidden?: Record<string, string>;
  label: string;
  hint?: string;
  fields?: FieldSpec[];
  tone?: "solid" | "danger";
  confirm?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const cls =
    tone === "danger"
      ? "border border-burgundy/50 px-5 py-2.5 font-sans text-[11px] uppercase tracking-label text-burgundy disabled:opacity-40"
      : "border border-charcoal px-5 py-2.5 font-sans text-[11px] uppercase tracking-label disabled:opacity-40";

  if (fields.length > 0 && !open) {
    return (
      <div>
        <button type="button" className={cls} onClick={() => setOpen(true)}>
          {label}
        </button>
        {hint ? <p className="mt-1 text-xs text-hardwood">{hint}</p> : null}
      </div>
    );
  }

  return (
    <form
      action={async (data) => {
        if (confirmText && !confirm(confirmText)) return;
        setPending(true);
        setError("");
        try {
          await action(data);
          setOpen(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed.");
        } finally {
          setPending(false);
        }
      }}
      className={fields.length > 0 ? "w-full space-y-3 border border-hardwood/25 p-4" : ""}
    >
      <input type="hidden" name="id" value={id} />
      {to ? <input type="hidden" name="to" value={to} /> : null}
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {fields.map((field) =>
        field.type === "checkbox" ? (
          <label key={field.name} className="flex items-center gap-3 text-sm">
            <input type="checkbox" name={field.name} defaultChecked={field.defaultValue === "on"} className="h-4 w-4" />
            {field.label}
          </label>
        ) : field.type === "select" ? (
          <label key={field.name} className="block">
            <span className="label">{field.label}</span>
            <select name={field.name} defaultValue={field.defaultValue} className="mt-1">
              {(field.options ?? []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label key={field.name} className="block">
            <span className="label">{field.label}</span>
            <input
              name={field.name}
              type={field.type ?? "text"}
              step={field.step}
              min={field.min}
              defaultValue={field.defaultValue}
              placeholder={field.placeholder}
              className="mt-1"
            />
          </label>
        ),
      )}
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={cls}>
          {pending ? "…" : label}
        </button>
        {fields.length > 0 ? (
          <button type="button" className="label text-hardwood" onClick={() => setOpen(false)}>
            Cancel
          </button>
        ) : null}
      </div>
      {hint && fields.length === 0 ? <p className="text-xs text-hardwood">{hint}</p> : null}
      {error ? <p className="text-sm text-burgundy">{error}</p> : null}
    </form>
  );
}
