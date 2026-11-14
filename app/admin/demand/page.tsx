import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { demandBoard } from "@/lib/demand";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { PageTitle, Stat, formatDate } from "@/components/admin/ui";
import { emailAllOpenCartsAction, emailOpenCartAction } from "@/app/admin/actions";
import { EmailCartButton } from "@/components/admin/EmailCartButton";

export const dynamic = "force-dynamic";

export default async function AdminDemandPage({ searchParams }: { searchParams: Promise<{ sent?: string; visitor?: string }> }) {
  await requireAdmin();
  const query = await searchParams;
  const sent = Number(query.sent);
  const emailed = query.visitor ?? "";
  const [board, settings] = await Promise.all([demandBoard(30), getSettings()]);
  const money = (value: number) => formatMoney(value, settings.currency, "en");
  const cartValue = board.open.reduce((sum, cart) => sum + cart.value, 0);

  return (
    <div>
      <PageTitle
        title="Demand."
        lede="What people open, what they put in the cart, and who still has pieces waiting. Counts cover the last 30 days. A view is counted once per person each half hour."
      />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Open carts" value={String(board.open.length)} hint={money(cartValue)} />
        <Stat label="Checkout, still in cart" value={String(board.stalled)} hint="Last 14 days" />
        <Stat label="Most opened" value={board.mostOpened[0]?.name ?? "—"} hint={board.mostOpened[0] ? `${board.mostOpened[0].views} views` : "No views yet"} />
        <Stat label="Most added" value={board.mostAdded[0]?.name ?? "—"} hint={board.mostAdded[0] ? `${board.mostAdded[0].adds} adds` : "No adds yet"} />
      </div>

      <div className="mt-16 grid gap-16 lg:grid-cols-3">
        <Rank title="Opened most" rows={board.mostOpened.map((piece) => ({ key: piece.slug, name: piece.name, meta: `${piece.views} views` }))} />
        <Rank title="Added most" rows={board.mostAdded.map((piece) => ({ key: piece.slug, name: piece.name, meta: `${piece.adds} adds` }))} />
        <Rank
          title="Opened, rarely added"
          rows={board.quiet.map((piece) => ({
            key: piece.slug,
            name: piece.name,
            meta: `${piece.adds} adds from ${piece.views} views`,
          }))}
        />
      </div>

      <section className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-serif text-3xl">Carts still open</h2>
          {board.open.some((cart) => cart.email) ? (
            <form action={emailAllOpenCartsAction}>
              <EmailCartButton label="Email everyone with a cart" />
            </form>
          ) : null}
        </div>
        {Number.isFinite(sent) && sent > 0 ? (
          <p className="mt-4 text-sm text-hardwood">{sent === 1 ? "Reminder sent. It is also in Mail." : `${sent} reminders sent. They are also in Mail.`}</p>
        ) : sent === 0 ? (
          <p className="mt-4 text-sm text-hardwood">No email was sent. Guests have no address on file.</p>
        ) : null}
        <ul className="mt-6 divide-y divide-hardwood/20 border-y border-hardwood/20">
          {board.open.map((cart) => (
            <li key={cart.visitor} className="grid gap-2 py-4 md:grid-cols-[14rem_1fr_auto_auto] md:items-start">
              <span>
                {cart.email && cart.customerId ? (
                  <Link href={`/admin/customers/${cart.customerId}`} className="draw-underline">
                    {cart.name}
                  </Link>
                ) : (
                  <span>Guest</span>
                )}
                <span className="block text-sm text-hardwood">{formatDate(cart.updatedAt)}</span>
              </span>
              <span className="text-sm text-hardwood">
                {cart.lines.map((line) => `${line.name} × ${line.quantity}`).join(" · ")}
              </span>
              <span className="md:text-end">{money(cart.value)}</span>
              {cart.email ? (
                emailed === cart.visitor ? (
                  <span className="border border-sage px-4 py-2 font-sans text-[11px] uppercase tracking-label text-sage">Sent</span>
                ) : (
                  <form action={emailOpenCartAction}>
                    <input type="hidden" name="visitor" value={cart.visitor} />
                    <EmailCartButton />
                  </form>
                )
              ) : (
                <span className="text-sm text-hardwood">No email</span>
              )}
            </li>
          ))}
          {board.open.length === 0 ? <li className="py-4 text-hardwood">No open carts yet. They appear after someone adds a piece.</li> : null}
        </ul>
      </section>
    </div>
  );
}

function Rank({ title, rows }: { title: string; rows: { key: string; name: string; meta: string }[] }) {
  return (
    <section>
      <h2 className="font-serif text-3xl">{title}</h2>
      <ul className="mt-6 divide-y divide-hardwood/20 border-y border-hardwood/20">
        {rows.map((row) => (
          <li key={row.key} className="flex items-baseline justify-between gap-4 py-3">
            <Link href={`/admin/products/${row.key}`} className="draw-underline">
              {row.name}
            </Link>
            <span className="shrink-0 text-sm text-hardwood">{row.meta}</span>
          </li>
        ))}
        {rows.length === 0 ? <li className="py-4 text-hardwood">Nothing yet.</li> : null}
      </ul>
    </section>
  );
}
