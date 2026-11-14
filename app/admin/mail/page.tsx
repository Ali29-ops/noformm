import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { emailTransportStatus, getEmail, listEmails } from "@/lib/email/send";
import { PageTitle, formatDate } from "@/components/admin/ui";
import { retryEmailAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminMailPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  await requireAdmin();
  const { id } = await searchParams;
  const [rows, open] = await Promise.all([listEmails(), id ? getEmail(id) : null]);
  const transport = emailTransportStatus();

  return (
    <div>
      <PageTitle
        title="Mail."
        lede={
          transport === "resend"
            ? "Every transactional email, with delivery status. Failed messages can be retried."
            : "No email transport is configured yet, so every message is stored here as “logged” instead of being sent. Set RESEND_API_KEY and EMAIL_FROM to start delivering."
        }
      />
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <ul className="divide-y divide-hardwood/20 border-y border-hardwood/20 text-sm">
          {rows.map((row) => (
            <li key={row.id} className={row.id === id ? "bg-charcoal/[0.04]" : ""}>
              <Link href={`/admin/mail?id=${row.id}`} className="block py-3">
                <p className="flex items-center justify-between gap-4">
                  <span className="truncate font-serif text-base">{row.subject}</span>
                  <span className={`label ${row.status === "failed" ? "text-burgundy" : row.status === "sent" ? "text-sage" : "text-hardwood"}`}>{row.status}</span>
                </p>
                <p className="mt-1 truncate text-hardwood">
                  {row.to} · {formatDate(row.createdAt)}
                  {row.template ? ` · ${row.template}` : ""}
                </p>
              </Link>
            </li>
          ))}
          {rows.length === 0 ? <li className="py-6 text-hardwood">No mail yet.</li> : null}
        </ul>
        <div>
          {open ? (
            <div className="border border-hardwood/25">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hardwood/25 p-4 text-sm">
                <div>
                  <p className="font-serif text-lg">{open.subject}</p>
                  <p className="text-hardwood">
                    To {open.to} · {open.status} · {open.attempts} attempt{open.attempts === 1 ? "" : "s"}
                    {open.sentAt ? ` · sent ${formatDate(open.sentAt)}` : ""}
                  </p>
                  {open.error ? <p className="text-burgundy">{open.error}</p> : null}
                  {open.relatedType === "order" && open.relatedId ? (
                    <Link href={`/admin/orders/${open.relatedId}`} className="label draw-underline">
                      Open order {open.relatedId}
                    </Link>
                  ) : null}
                </div>
                {open.status !== "sent" ? (
                  <form action={retryEmailAction}>
                    <input type="hidden" name="id" value={open.id} />
                    <button type="submit" className="border border-charcoal px-4 py-2 font-sans text-[11px] uppercase tracking-label">
                      {transport === "resend" ? "Send now" : "Retry (no transport)"}
                    </button>
                  </form>
                ) : null}
              </div>
              <iframe title="Email preview" srcDoc={open.html} className="h-[70vh] w-full bg-white" sandbox="" />
            </div>
          ) : (
            <p className="text-hardwood">Select a message to preview it.</p>
          )}
        </div>
      </div>
    </div>
  );
}
