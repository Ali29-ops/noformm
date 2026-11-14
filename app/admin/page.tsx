import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { expireStaleOrders, listOrders } from "@/lib/repo/orders";
import { listEnquiries } from "@/lib/repo/enquiries";
import { lowStockProducts } from "@/lib/repo/products";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { productCopy } from "@/lib/product-copy";
import { PageTitle, PaymentBadge, Stat, StatusBadge, formatDate } from "@/components/admin/ui";
import { emailTransportStatus } from "@/lib/email/send";
import { cardPaymentsConfigured, shippingApiConfigured } from "@/lib/settings";
import { demandBoard } from "@/lib/demand";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  await requireAdmin();
  await expireStaleOrders();
  const [orders, enquiries, settings, demand] = await Promise.all([
    listOrders(),
    listEnquiries(),
    getSettings(),
    demandBoard(30),
  ]);
  const low = await lowStockProducts(settings.lowStockThreshold);
  const money = (v: number) => formatMoney(v, settings.currency, "en");

  const live = orders.filter((o) => o.status !== "cancelled");
  const revenue = live.reduce((s, o) => s + o.amountPaid, 0);
  const pipeline = live.reduce((s, o) => s + Math.max(0, o.total - o.amountPaid), 0);
  const pending = orders.filter((o) => o.status === "pending");
  const toShip = orders.filter((o) => o.status === "confirmed" || o.status === "processing");
  const balanceDueOrders = live.filter((o) => o.status !== "pending" && o.total - o.amountPaid > 0.005);
  const newEnquiries = enquiries.filter((e) => e.status === "new");
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonth = live.filter((o) => new Date(o.createdAt) >= monthStart);

  const setupItems = [
    { ok: emailTransportStatus() === "resend", label: "Email transport", hint: "Set RESEND_API_KEY and EMAIL_FROM. Until then every email is stored in Mail as “logged”." },
    { ok: cardPaymentsConfigured(), label: "Card payments (Paymob)", hint: "Set PAYMOB_API_KEY and PAYMOB_INTEGRATION_ID to open the card option at checkout." },
    { ok: shippingApiConfigured(), label: "Shipping (Bosta)", hint: "Set BOSTA_API_KEY to create shipments from an order. Tracking numbers can be entered manually meanwhile." },
    { ok: settings.siteUrl.startsWith("https://"), label: "Public site URL", hint: `Emails link to ${settings.siteUrl}. Set it in Settings.` },
    { ok: Boolean(settings.studioPhone), label: "Studio phone", hint: "Shown in the footer and on invoices." },
  ];
  const setupPending = setupItems.filter((i) => !i.ok);

  return (
    <div>
      <PageTitle title="Overview." lede={`${formatDate(new Date().toISOString(), false)} · ${orders.length} orders in total`} />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Collected" value={money(revenue)} hint="Deposits + balances received" />
        <Stat label="Outstanding" value={money(pipeline)} hint="Still to collect on live orders" />
        <Stat label="This month" value={String(thisMonth.length)} hint={money(thisMonth.reduce((s, o) => s + o.total, 0))} />
        <Stat label="New enquiries" value={String(newEnquiries.length)} href="/admin/questionnaire" />
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <Stat label="Most opened" value={demand.mostOpened[0]?.name ?? "—"} hint="Last 30 days" href="/admin/demand" />
        <Stat label="Open carts" value={String(demand.open.length)} hint={money(demand.open.reduce((sum, cart) => sum + cart.value, 0))} href="/admin/demand" />
        <Stat label="Left at checkout" value={String(demand.stalled)} hint="Cart still open" href="/admin/demand" />
      </div>

      <section className="mt-16">
        <h2 className="font-serif text-3xl">Needs attention</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Attention
            title={`Awaiting ${settings.depositPercent}% deposit`}
            count={pending.length}
            href="/admin/orders?status=pending"
            rows={pending.slice(0, 4).map((o) => `${o.id} · ${o.customerName} · ${money(Math.max(0, o.depositAmount - o.amountPaid))}`)}
          />
          <Attention title="Ready to ship" count={toShip.length} href="/admin/orders?status=confirmed" rows={toShip.slice(0, 4).map((o) => `${o.id} · ${o.customerName}`)} />
          <Attention
            title="Balance to collect"
            count={balanceDueOrders.length}
            href="/admin/orders?status=open"
            rows={balanceDueOrders.slice(0, 4).map((o) => `${o.id} · ${money(o.total - o.amountPaid)}`)}
          />
        </div>
      </section>

      <section className="mt-16 grid gap-16 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="flex items-end justify-between">
            <h2 className="font-serif text-3xl">Recent orders</h2>
            <Link href="/admin/orders" className="label draw-underline">
              All orders
            </Link>
          </div>
          <ul className="mt-6 divide-y divide-hardwood/20 border-y border-hardwood/20">
            {orders.slice(0, 8).map((order) => (
              <li key={order.id}>
                <Link href={`/admin/orders/${order.id}`} className="grid gap-2 py-4 hover:bg-charcoal/[0.03] md:grid-cols-[10rem_1fr_auto_auto] md:items-center md:gap-4">
                  <span className="font-serif">{order.id}</span>
                  <span>
                    {order.customerName}
                    <span className="block text-sm text-hardwood">{formatDate(order.createdAt)}</span>
                  </span>
                  <span className="flex gap-2">
                    <StatusBadge status={order.status} />
                    <PaymentBadge status={order.paymentStatus} />
                  </span>
                  <span className="md:text-end">{money(order.total)}</span>
                </Link>
              </li>
            ))}
            {orders.length === 0 ? <li className="py-4 text-hardwood">No orders yet.</li> : null}
          </ul>
        </div>

        <div className="space-y-16">
          <div>
            <h2 className="font-serif text-3xl">Low stock</h2>
            {low.length === 0 ? (
              <p className="mt-4 text-hardwood">All pieces are above {settings.lowStockThreshold}.</p>
            ) : (
              <ul className="mt-6 divide-y divide-hardwood/20 border-y border-hardwood/20">
                {low.map((item) => (
                  <li key={item.slug} className="flex justify-between py-3">
                    <Link href={`/admin/products/${item.slug}`} className="draw-underline">
                      {productCopy(item, "en").name}
                    </Link>
                    <span className="text-hardwood">
                      {item.available}
                      {item.reserved > 0 ? <span className="text-xs"> (+{item.reserved} reserved)</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {setupPending.length > 0 ? (
            <div>
              <h2 className="font-serif text-3xl">Setup</h2>
              <ul className="mt-6 space-y-4">
                {setupPending.map((item) => (
                  <li key={item.label} className="border-l-2 border-hardwood/30 ps-4">
                    <p className="font-serif text-lg">{item.label}</p>
                    <p className="text-sm text-hardwood">{item.hint}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Attention({ title, count, href, rows }: { title: string; count: number; href: string; rows: string[] }) {
  return (
    <Link href={href} className="border border-hardwood/25 p-5 hover:border-charcoal">
      <p className="label">{title}</p>
      <p className="mt-3 font-serif text-4xl">{count}</p>
      <ul className="mt-3 space-y-1 text-sm text-hardwood">
        {rows.map((row) => (
          <li key={row} className="truncate">
            {row}
          </li>
        ))}
      </ul>
    </Link>
  );
}
