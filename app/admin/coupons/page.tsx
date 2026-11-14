import { requireAdmin } from "@/lib/admin-auth";
import { listCoupons } from "@/lib/repo/coupons";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { Button, Field, PageTitle, formatDate } from "@/components/admin/ui";
import { createCouponAction, deleteCouponAction, toggleCouponAction } from "../actions";
import { ConfirmForm } from "@/components/admin/ConfirmForm";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  await requireAdmin();
  const [coupons, settings] = await Promise.all([listCoupons(), getSettings()]);

  return (
    <div>
      <PageTitle title="Coupons." lede="Codes customers enter at checkout. Percent or fixed amount, with optional minimum, limit, and dates." />

      <section className="mt-12 border-t border-hardwood/25 pt-8">
        <h2 className="font-serif text-2xl">New coupon</h2>
        <form action={createCouponAction} className="mt-6 grid gap-6 md:grid-cols-4">
          <Field label="Code">
            <input name="code" required placeholder="WELCOME10" className="uppercase" />
          </Field>
          <Field label="Type">
            <select name="type" defaultValue="percent">
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed amount off</option>
            </select>
          </Field>
          <Field label="Value">
            <input name="value" type="number" min={0} step="0.01" required defaultValue={10} />
          </Field>
          <Field label={`Minimum subtotal (${settings.currency})`}>
            <input name="minSubtotal" type="number" min={0} step="0.01" defaultValue={0} />
          </Field>
          <Field label="Max uses (blank = unlimited)">
            <input name="maxUses" type="number" min={1} />
          </Field>
          <Field label="Starts">
            <input name="startsAt" type="date" />
          </Field>
          <Field label="Expires">
            <input name="expiresAt" type="date" />
          </Field>
          <Field label="Note (internal)">
            <input name="note" />
          </Field>
          <label className="flex items-center gap-3 text-sm md:col-span-3">
            <input type="checkbox" name="active" defaultChecked className="h-4 w-4" />
            Active
          </label>
          <div className="md:text-end">
            <Button>Create coupon</Button>
          </div>
        </form>
      </section>

      <section className="mt-16">
        <h2 className="font-serif text-2xl">Existing</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="label border-b border-hardwood/25">
                <th className="py-3 font-normal">Code</th>
                <th className="py-3 font-normal">Discount</th>
                <th className="py-3 font-normal">Minimum</th>
                <th className="py-3 font-normal">Uses</th>
                <th className="py-3 font-normal">Window</th>
                <th className="py-3 font-normal">Status</th>
                <th className="py-3 font-normal" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className={`border-b border-hardwood/15 ${c.active ? "" : "opacity-60"}`}>
                  <td className="py-3 font-serif text-lg">
                    {c.code}
                    {c.note ? <span className="block font-sans text-xs text-hardwood">{c.note}</span> : null}
                  </td>
                  <td className="py-3">{c.type === "percent" ? `${c.value}%` : formatMoney(c.value, settings.currency, "en")}</td>
                  <td className="py-3">{c.minSubtotal > 0 ? formatMoney(c.minSubtotal, settings.currency, "en") : "—"}</td>
                  <td className="py-3">
                    {c.usedCount}
                    {c.maxUses !== null ? ` / ${c.maxUses}` : ""}
                  </td>
                  <td className="py-3 text-hardwood">
                    {c.startsAt ? formatDate(c.startsAt, false) : "…"} → {c.expiresAt ? formatDate(c.expiresAt, false) : "…"}
                  </td>
                  <td className="py-3">
                    <form action={toggleCouponAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="active" value={c.active ? "false" : "true"} />
                      <button type="submit" className="label">
                        {c.active ? "Active · disable" : "Disabled · enable"}
                      </button>
                    </form>
                  </td>
                  <td className="py-3 text-end">
                    <ConfirmForm action={deleteCouponAction} message={`Delete coupon ${c.code}?`}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="label text-burgundy">
                        Delete
                      </button>
                    </ConfirmForm>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-hardwood">
                    No coupons yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
