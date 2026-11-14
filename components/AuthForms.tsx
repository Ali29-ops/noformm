"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { unstable_rethrow } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { registerAction, signInAction } from "@/app/auth-actions";

export function AuthForms({ next }: { next?: string }) {
  const t = useTranslations("account");
  const contact = useTranslations("contact");
  const shop = useTranslations("shop");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      if (mode === "in") await signInAction(data);
      else await registerAction(data);
    } catch (err) {
      unstable_rethrow(err);
      setError(err instanceof Error ? err.message : t("failed"));
      setPending(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="flex gap-6">
        <button
          type="button"
          className={`label ${mode === "in" ? "text-charcoal" : "text-hardwood"}`}
          onClick={() => setMode("in")}
        >
          {t("signIn")}
        </button>
        <button
          type="button"
          className={`label ${mode === "up" ? "text-charcoal" : "text-hardwood"}`}
          onClick={() => setMode("up")}
        >
          {t("create")}
        </button>
      </div>
      <form onSubmit={onSubmit} className="mt-10 space-y-8">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        {mode === "up" ? (
          <label className="block">
            <span className="label">{contact("name")}</span>
            <input name="name" required autoComplete="name" className="mt-2" />
          </label>
        ) : null}
        <label className="block">
          <span className="label">{contact("email")}</span>
          <input name="email" type="email" required autoComplete="email" className="mt-2" />
        </label>
        <label className="block">
          <span className="label">{t("password")}</span>
          <input
            name="password"
            type="password"
            required
            minLength={mode === "up" ? 8 : 1}
            autoComplete={mode === "up" ? "new-password" : "current-password"}
            className="mt-2"
          />
        </label>
        {mode === "in" ? (
          <p className="text-sm">
            <Link href="/forgot-password" className="draw-underline text-hardwood">
              {t("forgot")}
            </Link>
          </p>
        ) : (
          <>
            <label className="block">
              <span className="label">
                {shop("phone")} · {contact("optional")}
              </span>
              <input name="phone" autoComplete="tel" inputMode="tel" className="mt-2" />
            </label>
            <label className="block">
              <span className="label">
                {shop("city")} · {contact("optional")}
              </span>
              <input name="city" autoComplete="address-level2" className="mt-2" />
            </label>
          </>
        )}
        {error ? <p className="text-sm text-burgundy">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="border border-charcoal px-6 py-3 font-sans text-[11px] uppercase tracking-label disabled:opacity-40"
        >
          {pending ? "…" : mode === "in" ? t("signIn") : t("create")}
        </button>
      </form>
    </div>
  );
}
