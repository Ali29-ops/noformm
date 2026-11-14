import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { recentAudit } from "@/lib/repo/audit";
import { recentEvents } from "@/lib/repo/orders";
import { PageTitle, formatDate } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  await requireAdmin();
  const [audit, events] = await Promise.all([recentAudit(150), recentEvents(80)]);

  return (
    <div>
      <PageTitle title="Activity." lede="Who changed what. Admin actions on the left, order timeline events on the right." />
      <div className="mt-10 grid gap-12 lg:grid-cols-2">
        <section>
          <h2 className="font-serif text-2xl">Admin actions</h2>
          <ul className="mt-4 divide-y divide-hardwood/20 border-y border-hardwood/20 text-sm">
            {audit.map((row) => (
              <li key={row.id} className="grid gap-1 py-3 md:grid-cols-[10rem_1fr]">
                <span className="text-hardwood">{formatDate(row.createdAt)}</span>
                <span>
                  <span className="label">{row.action}</span>{" "}
                  <span className="text-hardwood">
                    {row.entity}
                    {row.entityId ? ` · ${row.entityId}` : ""}
                  </span>
                  <span className="block text-xs text-hardwood">{row.actor}</span>
                </span>
              </li>
            ))}
            {audit.length === 0 ? <li className="py-4 text-hardwood">Nothing yet.</li> : null}
          </ul>
        </section>
        <section>
          <h2 className="font-serif text-2xl">Order events</h2>
          <ul className="mt-4 divide-y divide-hardwood/20 border-y border-hardwood/20 text-sm">
            {events.map((event) => (
              <li key={event.id} className="grid gap-1 py-3 md:grid-cols-[10rem_1fr]">
                <span className="text-hardwood">{formatDate(event.createdAt)}</span>
                <span>
                  <Link href={`/admin/orders/${event.orderId}`} className="font-serif draw-underline">
                    {event.orderId}
                  </Link>{" "}
                  <span className="label">{event.type}</span>
                  <span className="block text-xs text-hardwood">
                    {event.message} · {event.actor}
                  </span>
                </span>
              </li>
            ))}
            {events.length === 0 ? <li className="py-4 text-hardwood">Nothing yet.</li> : null}
          </ul>
        </section>
      </div>
    </div>
  );
}