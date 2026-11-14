"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { unstable_rethrow } from "next/navigation";
import { requestPasswordResetAction, resetPasswordAction } from "@/app/auth-actions";

export function PasswordResetForms({ mode, token }: { mode: "request" | "reset"; token?: string }) {
  const t = useTranslations("account");
  const contact = useTranslations("contact");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      if (mode === "request") {
        await requestPasswordResetAction(new FormData(event.currentTarget));
        setDone(true);
      } else {
        await resetPasswordAction(new FormData(event.currentTarget));
      }
    } catch (err) {
      unstable_rethrow(err);
      setError(err instanceof Error ? err.message : t("failed"));
    } finally {
      setPending(false);
    }
  }

  if (done) return <p className="font-serif text-2xl">{t("resetSent")}</p>;

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-8">
      {mode === "request" ? (
        <label className="block">
          <span className="label">{contact("email")}</span>
          <input name="email" type="email" required autoComplete="email" className="mt-2" />
        </label>
      ) : (
        <>
          <input type="hidden" name="token" value={token} />
          <label className="block">
            <span className="label">{t("newPassword")}</span>
            <input name="password" type="password" required minLength={8} autoComplete="new-password" className="mt-2" />
          </label>
        </>
      )}
      {error ? <p className="text-sm text-burgundy">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="border border-charcoal px-6 py-3 font-sans text-[11px] uppercase tracking-label disabled:opacity-40"
      >
        {pending ? "…" : mode === "request" ? t("sendReset") : t("reset")}
      </button>
    </form>
  );
}
