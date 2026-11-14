import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { expireStaleOrders, listOrders } from "@/lib/repo/orders";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { PageTitle, PaymentBadge, StatusBadge, formatDate } from "@/components/admin/ui";
import type { OrderStatus } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const filters: { id: OrderStatus | "open" | "all"; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "processing", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
  { id: "all", label: "All" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin();
  await expireStaleOrders();
  const { status = "open", q = "" } = await searchParams;
  const filter = filters.some((f) => f.id === status) ? (status as OrderStatus | "open" | "all") : "open";
  const [orders, settings] = await Promise.all([
    listOrders({ status: filter === "all" ? undefined : filter }),
    getSettings(),
  ]);
  const needle = q.trim().toLowerCase();
  const rows = needle
    ? orders.filter(
        (o) =>
          o.id.toLowerCase().includes(needle) ||
          o.customerName.toLowerCase().includes(needle) ||
          o.customerEmail.includes(needle) ||
          o.customerPhone.includes(needle),
      )
    : orders;
  const money = (v: number) => formatMoney(v, settings.currency, "en");

  return (
    <div>
      <PageTitle title="Orders." lede="Confirm, prepare, ship, and settle. Every change is recorded on the order's timeline and emailed to the customer." />

      <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-wrap gap-5">
          {filters.map((f) => (
            <Link
              key={f.id}
              href={`/admin/orders?status=${f.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`label ${filter === f.id ? "text-charcoal" : "text-hardwood"}`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <form className="flex gap-2">
          <input type="hidden" name="status" value={filter} />
          <input name="q" defaultValue={q} placeholder="Search ref, name, email, phone" className="mt-0 w-72" />
          <button type="submit" className="label">
            Search
          </button>
        </form>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="label border-b border-hardwood/25">
              <th className="py-3 font-normal">Ref</th>
              <th className="py-3 font-normal">Date</th>
              <th className="py-3 font-normal">Customer</th>
              <th className="py-3 font-normal">Pieces</th>
              <th className="py-3 font-normal">Payment</th>
              <th className="py-3 font-normal">Status</th>
              <th className="py-3 text-end font-normal">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((order) => (
              <tr key={order.id} className="border-b border-hardwood/15 align-top hover:bg-charcoal/[0.03]">
                <td className="py-4 font-serif">
                  <Link href={`/admin/orders/${order.id}`} className="draw-underline">
                    {order.id}
                  </Link>
                </td>
                <td className="py-4 text-hardwood">{formatDate(order.createdAt)}</td>
                <td className="py-4">
                  <p>{order.customerName}</p>
                  <p className="text-hardwood">{order.customerEmail}</p>
                  <p className="text-hardwood">
                    {order.shippingAddress.city}
                    {order.customerPhone ? ` · ${order.customerPhone}` : ""}
                  </p>
                </td>
                <td className="py-4">
                  {order.items.map((item) => (
                    <p key={item.id}>
                      {item.name} × {item.quantity}
                    </p>
                  ))}
                </td>
                <td className="py-4">
                  <PaymentBadge status={order.paymentStatus} />
                  <p className="mt-1 text-xs text-hardwood">
                    {order.total - order.amountPaid > 0.005
                      ? `${money(Math.max(0, order.total - order.amountPaid))} due`
                      : order.paymentMethod.replace("_", " ")}
                  </p>
                </td>
                <td className="py-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="py-4 text-end">
                  {money(order.total)}
                  <p className="mt-1 text-xs text-hardwood">{money(order.amountPaid)} paid</p>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-hardwood">
                  No orders match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
