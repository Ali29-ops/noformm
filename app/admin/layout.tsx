import "../globals.css";
import { Outfit, Instrument_Serif } from "next/font/google";
import { AdminNav } from "@/components/AdminNav";
import { readAdminSession } from "@/lib/admin-auth";
import { emailTransportStatus } from "@/lib/email/send";
import { cardPaymentsConfigured, shippingApiConfigured } from "@/lib/settings";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

export const metadata = {
  title: "NO FORM — Studio",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await readAdminSession();
  const integrations = {
    mail: emailTransportStatus() === "resend",
    payments: cardPaymentsConfigured(),
    shipping: shippingApiConfigured(),
  };
  return (
    <html lang="en" className={`${outfit.variable} ${instrument.variable}`}>
      <body className="min-h-screen bg-ivory font-sans text-charcoal antialiased">
        <AdminNav admin={admin ? { name: admin.name, email: admin.email } : null} integrations={integrations} />
        <main className="mx-auto max-w-editorial px-6 pb-24 pt-28 md:px-12">{children}</main>
      </body>
    </html>
  );
}
