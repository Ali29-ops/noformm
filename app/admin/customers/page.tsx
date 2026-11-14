import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listCustomers } from "@/lib/repo/customers";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { PageTitle, formatDate } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q = "" } = await searchParams;
  const [rows, settings] = await Promise.all([listCustomers(), getSettings()]);
  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? rows.filter((r) => r.customer.name.toLowerCase().includes(needle) || r.customer.email.includes(needle) || r.customer.phone.includes(needle))
    : rows;

  return (
    <div>
      <PageTitle
        title="Customers."
        lede={`${rows.length} accounts. Guest orders appear under Orders only.`}
        action={
          <form className="flex gap-2">
            <input name="q" defaultValue={q} placeholder="Search name, email, phone" className="mt-0 w-72" />
            <button type="submit" className="label">
              Search
            </button>
          </form>
        }
      />
      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="label border-b border-hardwood/25">
              <th className="py-3 font-normal">Name</th>
              <th className="py-3 font-normal">Contact</th>
              <th className="py-3 font-normal">Joined</th>
              <th className="py-3 font-normal">Last sign in</th>
              <th className="py-3 text-end font-normal">Orders</th>
              <th className="py-3 text-end font-normal">Spent</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ customer, orderCount, spent }) => (
              <tr key={customer.id} className="border-b border-hardwood/15 hover:bg-charcoal/[0.03]">
                <td className="py-4 font-serif text-lg">
                  <Link href={`/admin/customers/${customer.id}`} className="draw-underline">
                    {customer.name}
                  </Link>
                </td>
                <td className="py-4 text-hardwood">
                  {customer.email}
                  {customer.phone ? <span className="block">{customer.phone}</span> : null}
                </td>
                <td className="py-4 text-hardwood">{formatDate(customer.createdAt, false)}</td>
                <td className="py-4 text-hardwood">{formatDate(customer.lastLoginAt, false)}</td>
                <td className="py-4 text-end">{orderCount}</td>
                <td className="py-4 text-end">{formatMoney(spent, settings.currency, "en")}</td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-hardwood">
                  No customers match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
