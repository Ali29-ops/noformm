import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function WalkNav({
  prev,
  next,
  index,
  total,
  className = "",
}: {
  prev: { collection: string; slug: string; name: string };
  next: { collection: string; slug: string; name: string };
  index: number;
  total: number;
  className?: string;
}) {
  const t = await getTranslations("showroom");
  if (total < 2) return null;

  return (
    <nav className={`border-t border-hardwood/20 px-6 py-12 md:px-12 ${className}`}>
      <div className="mx-auto flex max-w-editorial items-end justify-between gap-8">
        <Link href={`/collections/${prev.collection}/${prev.slug}`} className="group max-w-[45%]">
          <p className="label">{t("previousObject")}</p>
          <p className="mt-3 font-serif text-2xl md:text-3xl group-hover:text-hardwood">
            {prev.name}
          </p>
        </Link>
        <p className="label hidden sm:block">
          {index + 1} {t("of")} {total}
        </p>
        <Link href={`/collections/${next.collection}/${next.slug}`} className="group max-w-[45%] text-end">
          <p className="label">{t("nextObject")}</p>
          <p className="mt-3 font-serif text-2xl md:text-3xl group-hover:text-hardwood">
            {next.name}
          </p>
        </Link>
      </div>
    </nav>
  );
}
