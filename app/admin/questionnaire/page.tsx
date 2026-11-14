import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listEnquiries } from "@/lib/repo/enquiries";
import { toWhatsAppDigits } from "@/lib/settings";
import { Button, PageTitle, formatDate } from "@/components/admin/ui";
import { enquiryUpdateAction } from "../actions";

export const dynamic = "force-dynamic";

const tabs = [
  { id: "new", label: "New" },
  { id: "replied", label: "Replied" },
  { id: "closed", label: "Closed" },
  { id: "all", label: "All" },
];

export default async function AdminQuestionnairePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status = "new" } = await searchParams;
  const all = await listEnquiries();
  const rows = status === "all" ? all : all.filter((r) => r.status === status);

  return (
    <div>
      <PageTitle title="Enquiries." lede="Messages from Meet our designer. Phone is required — call or WhatsApp back, then mark the enquiry replied or closed." />
      <div className="mt-10 flex flex-wrap gap-5">
        {tabs.map((tab) => (
          <Link key={tab.id} href={`/admin/questionnaire?status=${tab.id}`} className={`label ${status === tab.id ? "text-charcoal" : "text-hardwood"}`}>
            {tab.label} · {tab.id === "all" ? all.length : all.filter((r) => r.status === tab.id).length}
          </Link>
        ))}
      </div>
      <ul className="mt-10 divide-y divide-hardwood/20 border-y border-hardwood/20">
        {rows.map((row) => {
          const whatsapp = toWhatsAppDigits(row.phone);
          return (
          <li key={row.id} className="grid gap-8 py-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div>
              <p className="label">
                {formatDate(row.createdAt)} · {row.status}
                {row.locale === "ar" ? " · AR" : ""}
              </p>
              <h2 className="mt-3 font-serif text-3xl">{row.name}</h2>
              <p className="mt-2 text-hardwood">
                <a href={`mailto:${row.email}?subject=${encodeURIComponent("Re: your message to the designer")}`} className="draw-underline">
                  {row.email}
                </a>
                {row.phone ? (
                  <>
                    {" · "}
                    <a href={`tel:${row.phone}`} className="draw-underline">
                      {row.phone}
                    </a>
                    {whatsapp ? (
                      <>
                        {" · "}
                        <a
                          href={`https://wa.me/${whatsapp}`}
                          className="draw-underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          WhatsApp
                        </a>
                      </>
                    ) : null}
                  </>
                ) : null}
              </p>
              <p className="label mt-4">{[row.collection, row.piece].filter(Boolean).join(" · ") || "Any"}</p>
              <p className="mt-4 max-w-2xl whitespace-pre-line leading-relaxed">{row.message}</p>
            </div>
            <form action={enquiryUpdateAction} className="space-y-4">
              <input type="hidden" name="id" value={row.id} />
              <label className="block">
                <span className="label">Status</span>
                <select name="status" defaultValue={row.status} className="mt-2">
                  <option value="new">New</option>
                  <option value="replied">Replied</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
              <label className="block">
                <span className="label">Internal notes</span>
                <textarea name="adminNotes" rows={3} defaultValue={row.adminNotes} className="mt-2 resize-none" />
              </label>
              <Button>Save</Button>
              {row.repliedAt ? <p className="text-xs text-hardwood">Replied {formatDate(row.repliedAt)}</p> : null}
            </form>
          </li>
          );
        })}
        {rows.length === 0 ? <li className="py-8 text-hardwood">Nothing here.</li> : null}
      </ul>
    </div>
  );
}
