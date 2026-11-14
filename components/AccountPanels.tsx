"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  changePasswordAction,
  defaultAddressAction,
  deleteAddressAction,
  saveAddressAction,
  updateProfileAction,
} from "@/app/auth-actions";
import { governorates } from "@/lib/egypt";
import type { AddressRow } from "@/lib/db/schema";

type Status = { ok?: string; error?: string };

function useSubmit(action: (data: FormData) => Promise<unknown>, onDone?: () => void) {
  const [status, setStatus] = useState<Status>({});
  const [pending, setPending] = useState(false);
  const t = useTranslations("account");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus({});
    try {
      await action(new FormData(event.currentTarget));
      setStatus({ ok: t("saved") });
      onDone?.();
    } catch (err) {
      setStatus({ error: err instanceof Error ? err.message : "Failed." });
    } finally {
      setPending(false);
    }
  }
  return { submit, status, pending };
}

export function AccountPanels({
  profile,
  addresses,
}: {
  profile: { name: string; phone: string; city: string };
  addresses: AddressRow[];
}) {
  const t = useTranslations("account");
  const shop = useTranslations("shop");
  const contact = useTranslations("contact");
  const locale = useLocale();
  const router = useRouter();
  const [editing, setEditing] = useState<AddressRow | "new" | null>(null);

  const profileForm = useSubmit(updateProfileAction, () => router.refresh());
  const passwordForm = useSubmit(changePasswordAction);
  const addressForm = useSubmit(saveAddressAction, () => {
    setEditing(null);
    router.refresh();
  });

  const govName = (id: string) => governorates.find((g) => g.id === id)?.[locale === "ar" ? "ar" : "en"] ?? id;

  return (
    <>
      <section className="mt-16">
        <h2 className="font-serif text-3xl">{t("addresses")}</h2>
        {addresses.length === 0 && editing === null ? <p className="mt-6 text-hardwood">{t("noAddresses")}</p> : null}
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="border border-hardwood/25 p-5 text-sm leading-relaxed">
              <p className="font-serif text-xl">
                {address.label || address.name}
                {address.isDefault ? <span className="label ms-3 text-sage">{t("default")}</span> : null}
              </p>
              <p className="mt-2">
                {address.name} · {address.phone}
              </p>
              <p className="text-hardwood">
                {[address.street, address.building, address.floor && `${shop("floor")} ${address.floor}`, address.apartment && `${shop("apartment")} ${address.apartment}`]
                  .filter(Boolean)
                  .join(", ")}
                <br />
                {[address.area, address.city, govName(address.governorate)].filter(Boolean).join(", ")}
              </p>
              <div className="mt-4 flex flex-wrap gap-5">
                <button type="button" className="label" onClick={() => setEditing(address)}>
                  {t("editAddress")}
                </button>
                {!address.isDefault ? (
                  <form
                    action={async (data) => {
                      await defaultAddressAction(data);
                      router.refresh();
                    }}
                  >
                    <input type="hidden" name="id" value={address.id} />
                    <button type="submit" className="label">
                      {t("makeDefault")}
                    </button>
                  </form>
                ) : null}
                <form
                  action={async (data) => {
                    await deleteAddressAction(data);
                    router.refresh();
                  }}
                >
                  <input type="hidden" name="id" value={address.id} />
                  <button type="submit" className="label text-burgundy">
                    {t("delete")}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
        {editing === null ? (
          <button
            type="button"
            className="mt-8 border border-charcoal px-6 py-3 font-sans text-[11px] uppercase tracking-label"
            onClick={() => setEditing("new")}
          >
            {t("addAddress")}
          </button>
        ) : (
          <form onSubmit={addressForm.submit} className="mt-8 max-w-xl space-y-6 border-t border-hardwood/25 pt-8">
            {editing !== "new" ? <input type="hidden" name="id" value={editing.id} /> : null}
            <label className="block">
              <span className="label">{t("label")}</span>
              <input name="label" defaultValue={editing !== "new" ? editing.label : ""} className="mt-2" />
            </label>
            <label className="block">
              <span className="label">{contact("name")}</span>
              <input name="name" required defaultValue={editing !== "new" ? editing.name : profile.name} className="mt-2" />
            </label>
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="label">{shop("phone")}</span>
                <input name="phone" required inputMode="tel" defaultValue={editing !== "new" ? editing.phone : profile.phone} className="mt-2" />
              </label>
              <label className="block">
                <span className="label">
                  {shop("phone2")} · {contact("optional")}
                </span>
                <input name="phone2" inputMode="tel" defaultValue={editing !== "new" ? editing.phone2 : ""} className="mt-2" />
              </label>
            </div>
            <label className="block">
              <span className="label">{shop("governorate")}</span>
              <select name="governorate" required defaultValue={editing !== "new" ? editing.governorate : ""} className="mt-2">
                <option value="">{shop("choose")}</option>
                {governorates.map((g) => (
                  <option key={g.id} value={g.id}>
                    {locale === "ar" ? g.ar : g.en}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="label">{shop("city")}</span>
                <input name="city" required defaultValue={editing !== "new" ? editing.city : profile.city} className="mt-2" />
              </label>
              <label className="block">
                <span className="label">
                  {shop("area")} · {contact("optional")}
                </span>
                <input name="area" defaultValue={editing !== "new" ? editing.area : ""} className="mt-2" />
              </label>
            </div>
            <label className="block">
              <span className="label">{shop("street")}</span>
              <input name="street" required defaultValue={editing !== "new" ? editing.street : ""} className="mt-2" />
            </label>
            <div className="grid gap-6 sm:grid-cols-3">
              <label className="block">
                <span className="label">{shop("building")}</span>
                <input name="building" defaultValue={editing !== "new" ? editing.building : ""} className="mt-2" />
              </label>
              <label className="block">
                <span className="label">{shop("floor")}</span>
                <input name="floor" defaultValue={editing !== "new" ? editing.floor : ""} className="mt-2" />
              </label>
              <label className="block">
                <span className="label">{shop("apartment")}</span>
                <input name="apartment" defaultValue={editing !== "new" ? editing.apartment : ""} className="mt-2" />
              </label>
            </div>
            <label className="block">
              <span className="label">
                {shop("landmark")} · {contact("optional")}
              </span>
              <input name="landmark" defaultValue={editing !== "new" ? editing.landmark : ""} className="mt-2" />
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="isDefault" defaultChecked={editing !== "new" ? editing.isDefault : addresses.length === 0} className="h-4 w-4" />
              {t("makeDefault")}
            </label>
            {addressForm.status.error ? <p className="text-sm text-burgundy">{addressForm.status.error}</p> : null}
            <div className="flex gap-6">
              <button
                type="submit"
                disabled={addressForm.pending}
                className="border border-charcoal px-6 py-3 font-sans text-[11px] uppercase tracking-label disabled:opacity-40"
              >
                {t("save")}
              </button>
              <button type="button" className="label" onClick={() => setEditing(null)}>
                {t("cancel")}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="mt-16 grid gap-12 md:grid-cols-2">
        <form onSubmit={profileForm.submit} className="space-y-6">
          <h2 className="font-serif text-3xl">{t("profile")}</h2>
          <label className="block">
            <span className="label">{contact("name")}</span>
            <input name="name" required defaultValue={profile.name} className="mt-2" />
          </label>
          <label className="block">
            <span className="label">{shop("phone")}</span>
            <input name="phone" inputMode="tel" defaultValue={profile.phone} className="mt-2" />
          </label>
          <label className="block">
            <span className="label">{shop("city")}</span>
            <input name="city" defaultValue={profile.city} className="mt-2" />
          </label>
          {profileForm.status.error ? <p className="text-sm text-burgundy">{profileForm.status.error}</p> : null}
          {profileForm.status.ok ? <p className="text-sm text-sage">{profileForm.status.ok}</p> : null}
          <button
            type="submit"
            disabled={profileForm.pending}
            className="border border-charcoal px-6 py-3 font-sans text-[11px] uppercase tracking-label disabled:opacity-40"
          >
            {t("save")}
          </button>
        </form>

        <form
          onSubmit={(e) => {
            passwordForm.submit(e);
            e.currentTarget.reset();
          }}
          className="space-y-6"
        >
          <h2 className="font-serif text-3xl">{t("security")}</h2>
          <label className="block">
            <span className="label">{t("currentPassword")}</span>
            <input name="current" type="password" required autoComplete="current-password" className="mt-2" />
          </label>
          <label className="block">
            <span className="label">{t("newPassword")}</span>
            <input name="password" type="password" required minLength={8} autoComplete="new-password" className="mt-2" />
          </label>
          {passwordForm.status.error ? <p className="text-sm text-burgundy">{passwordForm.status.error}</p> : null}
          {passwordForm.status.ok ? <p className="text-sm text-sage">{passwordForm.status.ok}</p> : null}
          <button
            type="submit"
            disabled={passwordForm.pending}
            className="border border-charcoal px-6 py-3 font-sans text-[11px] uppercase tracking-label disabled:opacity-40"
          >
            {t("changePassword")}
          </button>
        </form>
      </section>
    </>
  );
}
