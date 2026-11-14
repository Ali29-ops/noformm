import { requireAdmin, listAdmins } from "@/lib/admin-auth";
import { getSettings, cardPaymentsConfigured, shippingApiConfigured } from "@/lib/settings";
import { emailTransportStatus } from "@/lib/email/send";
import { getDb } from "@/lib/db";
import { shippingRates } from "@/lib/db/schema";
import { governorates } from "@/lib/egypt";
import { Field, PageTitle, formatDate } from "@/components/admin/ui";
import { StatusForm } from "@/components/admin/StatusForm";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import {
  changeAdminPasswordAction,
  createAdminAction,
  deleteAdminAction,
  saveSettingsAction,
  saveShippingRatesAction,
  updateAdminProfileAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  const db = await getDb();
  const [settings, rates, admins] = await Promise.all([getSettings(), db.select().from(shippingRates), listAdmins()]);
  const rateFor = (id: string) => rates.find((r) => r.governorate === id);

  return (
    <div>
      <PageTitle title="Settings." lede="Store, payments, delivery, and the team. Secrets (API keys) live in .env.local, never here." />

      <section className="mt-12 border-t border-hardwood/25 pt-8">
        <h2 className="font-serif text-2xl">Integrations</h2>
        <ul className="mt-4 grid gap-4 text-sm md:grid-cols-3">
          <Integration on={emailTransportStatus() === "resend"} name="Email · Resend" env="RESEND_API_KEY, EMAIL_FROM, EMAIL_REPLY_TO" note="Until set, emails are stored in Mail as “logged” so you can read what would have gone out." />
          <Integration on={cardPaymentsConfigured()} name="Payments · Paymob" env="PAYMOB_API_KEY, PAYMOB_INTEGRATION_ID, PAYMOB_IFRAME_ID, PAYMOB_HMAC_SECRET" note="Opens the card option at checkout. Orders already carry providerOrderId / providerTransactionId fields for the webhook." />
          <Integration on={shippingApiConfigured()} name="Shipping · Bosta" env="BOSTA_API_KEY, BOSTA_API_URL, BOSTA_WEBHOOK_SECRET" note="‘Create Bosta shipment’ on an order books the courier and saves tracking. Deliveries close themselves through /api/webhooks/bosta." />
        </ul>
      </section>

      <StatusForm action={saveSettingsAction} className="mt-16 border-t border-hardwood/25 pt-8" submitLabel="Save settings">
        <h2 className="font-serif text-2xl">Store</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Field label="Studio name">
            <input name="studioName" defaultValue={settings.studioName} />
          </Field>
          <Field label="Public site URL (used in emails)">
            <input name="siteUrl" defaultValue={settings.siteUrl} placeholder="https://noform.design" />
          </Field>
          <Field label="Currency (ISO)">
            <input name="currency" defaultValue={settings.currency} className="uppercase" maxLength={3} />
          </Field>
          <Field label="Studio email (public)">
            <input name="studioEmail" type="email" defaultValue={settings.studioEmail} />
          </Field>
          <Field label="Order notifications go to">
            <input name="orderNotifyEmail" type="email" defaultValue={settings.orderNotifyEmail} />
          </Field>
          <Field label="Studio phone">
            <input name="studioPhone" defaultValue={settings.studioPhone} placeholder="+20 …" />
          </Field>
          <Field label="WhatsApp number (Talk on WhatsApp)">
            <input name="whatsapp" defaultValue={settings.whatsapp} placeholder="+20 …" />
          </Field>
          <Field label="Instagram handle">
            <input name="instagram" defaultValue={settings.instagram} placeholder="@noform" />
          </Field>
          <Field label="Low-stock threshold">
            <input name="lowStockThreshold" type="number" min={0} defaultValue={settings.lowStockThreshold} />
          </Field>
          <Field label="Studio address (EN)">
            <input name="studioAddressEn" defaultValue={settings.studioAddressEn} />
          </Field>
          <Field label="عنوان الاستوديو (AR)">
            <input name="studioAddressAr" defaultValue={settings.studioAddressAr} dir="rtl" />
          </Field>
          <Field label="Returns window (days)">
            <input name="returnsWindowDays" type="number" min={0} defaultValue={settings.returnsWindowDays} />
          </Field>
        </div>

        <h2 className="mt-14 font-serif text-2xl">Tax & delivery</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Field label="VAT rate %">
            <input name="taxRate" type="number" min={0} step="0.1" defaultValue={settings.taxRate} />
          </Field>
          <label className="flex items-center gap-3 self-end pb-3 text-sm">
            <input type="checkbox" name="pricesIncludeTax" defaultChecked={settings.pricesIncludeTax} className="h-4 w-4" />
            Prices already include VAT
          </label>
          <div />
          <Field label={`Default delivery fee (${settings.currency})`}>
            <input name="shippingDefaultFee" type="number" min={0} step="0.01" defaultValue={settings.shippingDefaultFee} />
          </Field>
          <Field label="Free delivery over (0 = never)">
            <input name="freeShippingOver" type="number" min={0} step="0.01" defaultValue={settings.freeShippingOver} />
          </Field>
        </div>

        <h2 className="mt-14 font-serif text-2xl">Deposit &amp; payment</h2>
        <p className="mt-2 text-sm text-hardwood">
          Every order needs a deposit before it can be confirmed. There is no cash on delivery for the full amount — the balance is
          collected when the pieces are handed over.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Field label="Deposit required (% of total)">
            <input name="depositPercent" type="number" min={1} max={100} step="1" defaultValue={settings.depositPercent} />
          </Field>
          <Field label="Hold pieces awaiting deposit (hours, 0 = never expire)">
            <input name="depositHoldHours" type="number" min={0} step="1" defaultValue={settings.depositHoldHours} />
          </Field>
          <Field label="Card reservation window (minutes)">
            <input name="cardReservationMinutes" type="number" min={5} defaultValue={settings.cardReservationMinutes} />
          </Field>
          <label className="flex items-center gap-3 text-sm md:col-span-3">
            <input type="checkbox" name="balanceOnDelivery" defaultChecked={settings.balanceOnDelivery} className="h-4 w-4" />
            Balance is collected on delivery (untick if the balance must be paid before shipping)
          </label>
          <label className="flex items-center gap-3 text-sm md:col-span-3">
            <input type="checkbox" name="bankTransferEnabled" defaultChecked={settings.bankTransferEnabled} className="h-4 w-4" />
            Accept the deposit by bank transfer / InstaPay
          </label>
          <Field label="Deposit instructions (EN) — include account / InstaPay details" className="md:col-span-3">
            <textarea name="bankTransferInstructionsEn" rows={3} defaultValue={settings.bankTransferInstructionsEn} className="resize-none" />
          </Field>
          <Field label="تعليمات دفع العربون (AR)" className="md:col-span-3">
            <textarea name="bankTransferInstructionsAr" rows={3} defaultValue={settings.bankTransferInstructionsAr} dir="rtl" className="resize-none" />
          </Field>
        </div>
      </StatusForm>

      <StatusForm action={saveShippingRatesAction} className="mt-16 border-t border-hardwood/25 pt-8" submitLabel="Save rates">
        <h2 className="font-serif text-2xl">Delivery rates by governorate</h2>
        <p className="mt-2 text-sm text-hardwood">A fee of 0 falls back to the default delivery fee. Untick to stop delivering to a governorate.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {governorates.map((g) => {
            const rate = rateFor(g.id);
            return (
              <div key={g.id} className="grid grid-cols-[1fr_5.5rem_5rem_auto] items-center gap-2 border-b border-hardwood/15 py-2 text-sm">
                <span>
                  {g.en} <span className="text-hardwood">{g.ar}</span>
                </span>
                <input name={`fee:${g.id}`} type="number" min={0} step="0.01" defaultValue={rate?.fee ?? 0} className="mt-0" aria-label={`Fee ${g.en}`} />
                <input name={`eta:${g.id}`} defaultValue={rate?.etaDays ?? ""} placeholder="2–4 d" className="mt-0" aria-label={`ETA ${g.en}`} />
                <input type="checkbox" name={`active:${g.id}`} defaultChecked={rate?.active ?? true} className="h-4 w-4" aria-label={`Deliver to ${g.en}`} />
              </div>
            );
          })}
        </div>
      </StatusForm>

      <section className="mt-16 grid gap-16 border-t border-hardwood/25 pt-8 lg:grid-cols-2">
        <StatusForm action={updateAdminProfileAction} submitLabel="Save profile">
          <h2 className="font-serif text-2xl">Your account</h2>
          <div className="mt-6 space-y-6">
            <Field label="Name">
              <input name="name" defaultValue={admin.name} required />
            </Field>
            <Field label="Email">
              <input name="email" type="email" defaultValue={admin.email} required />
            </Field>
          </div>
        </StatusForm>
        <StatusForm action={changeAdminPasswordAction} submitLabel="Change password">
          <h2 className="font-serif text-2xl">Password</h2>
          <div className="mt-6 space-y-6">
            <Field label="Current password">
              <input name="current" type="password" required autoComplete="current-password" />
            </Field>
            <Field label="New password (10+ characters)">
              <input name="password" type="password" required minLength={10} autoComplete="new-password" />
            </Field>
          </div>
        </StatusForm>
      </section>

      <section className="mt-16 border-t border-hardwood/25 pt-8">
        <h2 className="font-serif text-2xl">Team</h2>
        <ul className="mt-4 divide-y divide-hardwood/20 border-y border-hardwood/20 text-sm">
          {admins.map((user) => (
            <li key={user.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
              <span>
                <span className="font-serif text-lg">{user.name}</span> <span className="text-hardwood">· {user.email} · {user.role}</span>
                <span className="block text-xs text-hardwood">Last sign in {formatDate(user.lastLoginAt)}</span>
              </span>
              {admin.role === "owner" && user.id !== admin.id ? (
                <ConfirmForm action={deleteAdminAction} message={`Remove ${user.email} from the studio?`}>
                  <input type="hidden" name="id" value={user.id} />
                  <button type="submit" className="label text-burgundy">
                    Remove
                  </button>
                </ConfirmForm>
              ) : null}
            </li>
          ))}
        </ul>
        {admin.role === "owner" ? (
          <StatusForm action={createAdminAction} className="mt-8" submitLabel="Add team member">
            <div className="grid gap-6 md:grid-cols-4">
              <Field label="Name">
                <input name="name" required />
              </Field>
              <Field label="Email">
                <input name="email" type="email" required />
              </Field>
              <Field label="Temporary password">
                <input name="password" type="text" required minLength={10} autoComplete="off" />
              </Field>
              <Field label="Role">
                <select name="role" defaultValue="staff">
                  <option value="staff">Staff</option>
                  <option value="owner">Owner</option>
                </select>
              </Field>
            </div>
          </StatusForm>
        ) : null}
      </section>
    </div>
  );
}

function Integration({ on, name, env, note }: { on: boolean; name: string; env: string; note: string }) {
  return (
    <li className="border border-hardwood/25 p-4">
      <p className="flex items-center gap-2 font-serif text-lg">
        <span className={`inline-block h-2 w-2 rounded-full ${on ? "bg-sage" : "bg-hardwood/40"}`} />
        {name}
        <span className="label ms-auto text-hardwood">{on ? "connected" : "not set"}</span>
      </p>
      <p className="mt-2 break-words font-mono text-xs text-hardwood">{env}</p>
      <p className="mt-2 text-hardwood">{note}</p>
    </li>
  );
}
