import { requireAdmin } from "@/lib/admin-auth";
import { listOrders } from "@/lib/repo/orders";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { collectionIds } from "@/lib/catalog";
import { PageTitle, Stat } from "@/components/admin/ui";
import en from "@/messages/en.json";

export const dynamic = "force-dynamic";

export default async function AdminSalesPage() {
  await requireAdmin();
  const [orders, settings] = await Promise.all([listOrders(), getSettings()]);
  const money = (v: number) => formatMoney(v, settings.currency, "en");
  const counted = orders.filter((order) => order.status !== "cancelled");
  const paid = counted.filter((o) => o.paymentStatus === "paid");
  const delivered = counted.filter((o) => o.status === "delivered");
  const revenue = counted.reduce((sum, o) => sum + o.amountPaid, 0);
  const pipeline = counted.reduce((sum, o) => sum + Math.max(0, o.total - o.amountPaid), 0);
  const discounts = counted.reduce((sum, o) => sum + o.discount, 0);
  const aov = counted.length ? counted.reduce((s, o) => s + o.total, 0) / counted.length : 0;

  const byCollection = Object.fromEntries(collectionIds.map((id) => [id, 0])) as Record<string, number>;
  const byProduct = new Map<string, { name: string; qty: number; total: number }>();
  for (const order of counted) {
    for (const item of order.items) {
      byCollection[item.collection] = (byCollection[item.collection] ?? 0) + item.lineTotal;
      const row = byProduct.get(item.productSlug) ?? { name: item.name, qty: 0, total: 0 };
      row.qty += item.quantity;
      row.total += item.lineTotal;
      byProduct.set(item.productSlug, row);
    }
  }
  const topProducts = [...byProduct.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 10);

  const byMethod = new Map<string, number>();
  for (const order of counted) byMethod.set(order.paymentMethod, (byMethod.get(order.paymentMethod) ?? 0) + order.total);

  const byGov = new Map<string, number>();
  for (const order of counted) {
    const g = order.shippingAddress.governorate || "—";
    byGov.set(g, (byGov.get(g) ?? 0) + 1);
  }
  const topGov = [...byGov.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const byDay = new Map<string, number>();
  for (const order of counted) {
    const day = order.createdAt.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + order.total);
  }
  const days = [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);

  const byMonth = new Map<string, number>();
  for (const order of counted) {
    const key = order.createdAt.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + order.total);
  }
  const months = [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12);

  return (
    <div>
      <PageTitle title="Sales." lede="Cancelled orders are excluded. Collected is money actually received (deposits and balances); outstanding is what live orders still owe." />
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Collected" value={money(revenue)} hint={`${paid.length} paid in full`} />
        <Stat label="Outstanding" value={money(pipeline)} hint="Deposits + balances still due" />
        <Stat label="Average order" value={money(Math.round(aov))} hint={`${counted.length} orders`} />
        <Stat label="Discounts given" value={money(discounts)} hint={`${delivered.length} delivered`} />
      </div>

      <section className="mt-16 grid gap-16 md:grid-cols-2">
        <div>
          <h2 className="font-serif text-3xl">By collection</h2>
          <ul className="mt-6 divide-y divide-hardwood/20 border-y border-hardwood/20">
            {collectionIds.map((id) => (
              <li key={id} className="flex justify-between py-3">
                <span>{en.collections[id].name}</span>
                <span>{money(byCollection[id] ?? 0)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-serif text-3xl">Top pieces</h2>
          <ul className="mt-6 divide-y divide-hardwood/20 border-y border-hardwood/20">
            {topProducts.map(([slug, row]) => (
              <li key={slug} className="flex justify-between gap-4 py-3">
                <span>
                  {row.name} <span className="text-hardwood">× {row.qty}</span>
                </span>
                <span>{money(row.total)}</span>
              </li>
            ))}
            {topProducts.length === 0 ? <li className="py-4 text-hardwood">No sales yet.</li> : null}
          </ul>
        </div>
      </section>

      <section className="mt-16 grid gap-16 md:grid-cols-2">
        <div>
          <h2 className="font-serif text-3xl">By deposit method</h2>
          <ul className="mt-6 divide-y divide-hardwood/20 border-y border-hardwood/20">
            {[...byMethod.entries()].map(([method, total]) => (
              <li key={method} className="flex justify-between py-3">
                <span>{method.replace("_", " ")}</span>
                <span>{money(total)}</span>
              </li>
            ))}
            {byMethod.size === 0 ? <li className="py-4 text-hardwood">No sales yet.</li> : null}
          </ul>
        </div>
        <div>
          <h2 className="font-serif text-3xl">By governorate</h2>
          <ul className="mt-6 divide-y divide-hardwood/20 border-y border-hardwood/20">
            {topGov.map(([g, count]) => (
              <li key={g} className="flex justify-between py-3">
                <span>{g}</span>
                <span>{count}</span>
              </li>
            ))}
            {topGov.length === 0 ? <li className="py-4 text-hardwood">No sales yet.</li> : null}
          </ul>
        </div>
      </section>

      <section className="mt-16 grid gap-16 md:grid-cols-2">
        <div>
          <h2 className="font-serif text-3xl">By day</h2>
          <ul className="mt-6 divide-y divide-hardwood/20 border-y border-hardwood/20">
            {days.map(([day, total]) => (
              <li key={day} className="flex justify-between py-3">
                <span className="text-hardwood">{day}</span>
                <span>{money(total)}</span>
              </li>
            ))}
            {days.length === 0 ? <li className="py-4 text-hardwood">No days yet.</li> : null}
          </ul>
        </div>
        <div>
          <h2 className="font-serif text-3xl">By month</h2>
          <ul className="mt-6 divide-y divide-hardwood/20 border-y border-hardwood/20">
            {months.map(([month, total]) => (
              <li key={month} className="flex justify-between py-3">
                <span className="text-hardwood">{month}</span>
                <span>{money(total)}</span>
              </li>
            ))}
            {months.length === 0 ? <li className="py-4 text-hardwood">No months yet.</li> : null}
          </ul>
        </div>
      </section>
    </div>
  );
}
