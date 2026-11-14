import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getCustomerById, listAddresses } from "@/lib/repo/customers";
import { getOrdersByCustomer } from "@/lib/repo/orders";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { governorateName } from "@/lib/egypt";
import { Button, PageTitle, PaymentBadge, StatusBadge, formatDate } from "@/components/admin/ui";
import { customerNotesAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();
  const [orders, addresses, settings] = await Promise.all([
    getOrdersByCustomer(customer.id, customer.email),
    listAddresses(customer.id),
    getSettings(),
  ]);
  const spent = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);

  return (
    <div>
      <Link href="/admin/customers" className="label draw-underline">
        Customers
      </Link>
      <div className="mt-6">
        <PageTitle
          kicker={`Joined ${formatDate(customer.createdAt, false)}`}
          title={customer.name}
          lede={`${customer.email}${customer.phone ? ` · ${customer.phone}` : ""}${customer.city ? ` · ${customer.city}` : ""} · ${customer.locale.toUpperCase()}`}
        />
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section>
          <h2 className="font-serif text-2xl">
            Orders · {orders.length} · {formatMoney(spent, settings.currency, "en")}
          </h2>
          <ul className="mt-4 divide-y divide-hardwood/20 border-y border-hardwood/20">
            {orders.map((order) => (
              <li key={order.id}>
                <Link href={`/admin/orders/${order.id}`} className="grid gap-2 py-4 hover:bg-charcoal/[0.03] md:grid-cols-[10rem_1fr_auto_auto] md:items-center md:gap-4">
                  <span className="font-serif">{order.id}</span>
                  <span className="text-sm text-hardwood">
                    {formatDate(order.createdAt)} · {order.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}
                  </span>
                  <span className="flex gap-2">
                    <StatusBadge status={order.status} />
                    <PaymentBadge status={order.paymentStatus} />
                  </span>
                  <span className="md:text-end">{formatMoney(order.total, order.currency, "en")}</span>
                </Link>
              </li>
            ))}
            {orders.length === 0 ? <li className="py-4 text-hardwood">No orders yet.</li> : null}
          </ul>
        </section>

        <aside className="space-y-10">
          <section>
            <h2 className="font-serif text-2xl">Addresses</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {addresses.map((a) => (
                <li key={a.id} className="border border-hardwood/25 p-3">
                  <p className="font-serif text-lg">
                    {a.label || a.name}
                    {a.isDefault ? <span className="label ms-2 text-sage">default</span> : null}
                  </p>
                  <p className="text-hardwood">
                    {[a.street, a.building, a.floor && `Floor ${a.floor}`, a.apartment && `Apt ${a.apartment}`].filter(Boolean).join(", ")}
                    <br />
                    {[a.area, a.city, governorateName(a.governorate, "en")].filter(Boolean).join(", ")}
                    <br />
                    {a.phone}
                  </p>
                </li>
              ))}
              {addresses.length === 0 ? <li className="text-hardwood">No saved addresses.</li> : null}
            </ul>
          </section>
          <section>
            <h2 className="font-serif text-2xl">Notes</h2>
            <form action={customerNotesAction} className="mt-4 space-y-4">
              <input type="hidden" name="id" value={customer.id} />
              <textarea name="notes" rows={5} defaultValue={customer.notes} className="resize-none" placeholder="Preferences, delivery quirks, relationship history…" />
              <Button>Save notes</Button>
            </form>
            <p className="mt-4 text-xs text-hardwood">Last sign in {formatDate(customer.lastLoginAt)}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
