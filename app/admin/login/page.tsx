import { redirect } from "next/navigation";
import { loginAction } from "../actions";
import { readAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; expired?: string }>;
}) {
  const { error, expired } = await searchParams;
  const admin = await readAdminSession();
  if (admin) redirect("/admin");

  return (
    <div className="mx-auto max-w-md pt-12">
      <p className="label">Studio</p>
      <h1 className="mt-4 font-serif text-5xl">Enter.</h1>
      <p className="mt-4 text-hardwood">A quiet door for the work behind the gallery.</p>
      <form action={loginAction} className="mt-12 space-y-8">
        <label className="block">
          <span className="label">Email</span>
          <input name="email" type="email" required autoComplete="username" className="mt-2" />
        </label>
        <label className="block">
          <span className="label">Password</span>
          <input name="password" type="password" required autoComplete="current-password" className="mt-2" />
        </label>
        {error ? <p className="text-sm text-burgundy">Those details do not open the studio.</p> : null}
        {expired && !error ? <p className="text-sm text-hardwood">Your session ended. Please sign in again.</p> : null}
        <button type="submit" className="border border-charcoal px-6 py-3 font-sans text-[11px] uppercase tracking-label">
          Enter
        </button>
      </form>
      <p className="mt-10 text-sm text-hardwood">
        First time? The owner account is created from <code>ADMIN_EMAIL</code> and <code>ADMIN_PASSWORD</code> in{" "}
        <code>.env.local</code>.
      </p>
    </div>
  );
}
