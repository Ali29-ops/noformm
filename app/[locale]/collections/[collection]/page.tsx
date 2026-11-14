import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { collectionEnterHref, getCollection } from "@/lib/catalog";
import type { Locale } from "@/i18n/routing";

export default async function CollectionWorldPage({
  params,
}: {
  params: Promise<{ locale: string; collection: string }>;
}) {
  const { locale, collection } = await params;
  const id = getCollection(collection);
  if (!id) notFound();
  redirect({ href: collectionEnterHref(id), locale: locale as Locale });
}
