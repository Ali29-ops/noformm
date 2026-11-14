import { setRequestLocale } from "next-intl/server";
import { ShowroomFrame } from "@/components/ShowroomFrame";

export default async function CollectionsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as "en" | "ar");
  return <ShowroomFrame />;
}
