import { Link } from "@/i18n/navigation";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <p className="label">NO FORM</p>
      <h1 className="mt-6 font-serif text-5xl">This space is empty.</h1>
      <Link href="/" className="mt-10 draw-underline text-[11px] uppercase tracking-label">
        Return
      </Link>
    </div>
  );
}
