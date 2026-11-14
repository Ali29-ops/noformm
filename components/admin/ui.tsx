import Link from "next/link";
import type { OrderStatus, PaymentStatus } from "@/lib/db/schema";

export function PageTitle({ kicker = "Studio", title, lede, action }: { kicker?: string; title: string; lede?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <p className="label">{kicker}</p>
        <h1 className="mt-4 font-serif text-5xl md:text-6xl">{title}</h1>
        {lede ? <p className="mt-4 max-w-xl text-hardwood">{lede}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, hint, href }: { label: string; value: string; hint?: string; href?: string }) {
  const body = (
    <>
      <p className="label">{label}</p>
      <p className="mt-3 font-serif text-3xl">{value}</p>
      {hint ? <p className="mt-2 text-sm text-hardwood">{hint}</p> : null}
    </>
  );
  return href ? (
    <Link href={href} className="block border-t border-hardwood/25 pt-4 hover:border-charcoal">
      {body}
    </Link>
  ) : (
    <div className="border-t border-hardwood/25 pt-4">{body}</div>
  );
}

const statusTone: Record<OrderStatus, string> = {
  pending: "border-hardwood/40 text-hardwood",
  confirmed: "border-charcoal text-charcoal",
  processing: "border-charcoal text-charcoal",
  shipped: "border-sage text-sage",
  delivered: "border-sage bg-sage/10 text-sage",
  cancelled: "border-burgundy/40 text-burgundy",
};

const paymentTone: Record<PaymentStatus, string> = {
  unpaid: "border-hardwood/40 text-hardwood",
  deposit_paid: "border-charcoal text-charcoal",
  paid: "border-sage bg-sage/10 text-sage",
  failed: "border-burgundy/40 text-burgundy",
  refunded: "border-burgundy/40 text-burgundy",
  partially_refunded: "border-burgundy/40 text-burgundy",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block border px-2 py-1 font-sans text-[10px] uppercase tracking-wide ${statusTone[status]}`}>
      {status}
    </span>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`inline-block border px-2 py-1 font-sans text-[10px] uppercase tracking-wide ${paymentTone[status]}`}>
      {status === "unpaid" ? "awaiting deposit" : status === "deposit_paid" ? "deposit paid" : status.replace("_", " ")}
    </span>
  );
}

export function formatDate(iso: string | null | undefined, withTime = true) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: withTime ? "short" : undefined }).format(new Date(iso));
}

export function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

export function Button({ children, tone = "solid", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "solid" | "quiet" | "danger" }) {
  const cls =
    tone === "solid"
      ? "border border-charcoal px-5 py-2.5 font-sans text-[11px] uppercase tracking-label disabled:opacity-40"
      : tone === "danger"
        ? "border border-burgundy/50 px-5 py-2.5 font-sans text-[11px] uppercase tracking-label text-burgundy disabled:opacity-40"
        : "label draw-underline disabled:opacity-40";
  return (
    <button type="submit" {...rest} className={`${cls} ${rest.className ?? ""}`}>
      {children}
    </button>
  );
}
