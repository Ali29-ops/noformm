import { redirect } from "next/navigation";

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ collection?: string; piece?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const next = new URLSearchParams();
  if (query.collection) next.set("collection", query.collection);
  if (query.piece) next.set("piece", query.piece);
  const qs = next.toString();
  redirect(`/${locale}/designer${qs ? `?${qs}` : ""}`);
}
