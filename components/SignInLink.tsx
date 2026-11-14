import { Link } from "@/i18n/navigation";

export function SignInLink({
  signedIn,
  signIn,
  account,
}: {
  signedIn: boolean;
  signIn: string;
  account: string;
}) {
  if (signedIn) {
    return (
      <Link href="/account" className="draw-underline font-sans text-[11px] uppercase tracking-label">
        {account}
      </Link>
    );
  }

  return (
    <Link href="/signin" className="draw-underline font-sans text-[11px] uppercase tracking-label">
      {signIn}
    </Link>
  );
}
