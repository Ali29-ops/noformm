"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/admin/actions";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/questionnaire", label: "Enquiries" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/sales", label: "Sales" },
  { href: "/admin/demand", label: "Demand" },
  { href: "/admin/mail", label: "Mail" },
  { href: "/admin/activity", label: "Activity" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav({
  admin,
  integrations,
}: {
  admin: { name: string; email: string } | null;
  integrations: { mail: boolean; payments: boolean; shipping: boolean };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (pathname === "/admin/login" || !admin) return null;

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  const items = links.map((link) => (
    <Link
      key={link.href}
      href={link.href}
      className={`font-sans text-[11px] uppercase tracking-label ${
        isActive(link.href) ? "text-charcoal" : "text-hardwood hover:text-charcoal"
      }`}
    >
      {link.label}
    </Link>
  ));

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-hardwood/25 bg-ivory/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-editorial items-center justify-between gap-6 px-6 py-4 md:px-12">
        <Link href="/admin" className="font-sans text-[11px] uppercase tracking-label">
          NO FORM · Studio
        </Link>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Studio">
          {items}
          <span className="hidden items-center gap-2 xl:flex" title="Integrations">
            <Dot on={integrations.mail} label="Mail" />
            <Dot on={integrations.payments} label="Paymob" />
            <Dot on={integrations.shipping} label="Bosta" />
          </span>
          <form action={logoutAction}>
            <button type="submit" className="font-sans text-[11px] uppercase tracking-label text-hardwood">
              Leave
            </button>
          </form>
        </nav>
        <button
          type="button"
          className="flex min-h-11 items-center gap-2 font-sans text-[11px] uppercase tracking-label lg:hidden"
          aria-expanded={open}
          aria-controls="admin-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      <div id="admin-menu" hidden={!open} className="border-t border-hardwood/25 bg-ivory lg:hidden">
        <nav className="flex flex-col gap-4 px-6 py-6" aria-label="Studio">
          {items}
          <div className="flex items-center gap-3 pt-2">
            <Dot on={integrations.mail} label="Mail" />
            <Dot on={integrations.payments} label="Paymob" />
            <Dot on={integrations.shipping} label="Bosta" />
          </div>
          <form action={logoutAction} className="pt-2">
            <button type="submit" className="font-sans text-[11px] uppercase tracking-label text-hardwood">
              Leave · {admin.email}
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}

function Dot({ on, label }: { on: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1 font-sans text-[10px] uppercase tracking-wide text-hardwood">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${on ? "bg-sage" : "bg-hardwood/40"}`} />
      {label}
    </span>
  );
}
