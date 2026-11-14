import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getCatalogBoard } from "@/lib/live-catalog";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { productCopy } from "@/lib/product-copy";
import { toggleProductActiveAction, updateOnHandAction } from "../actions";
import { PageTitle } from "@/components/admin/ui";
import en from "@/messages/en.json";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ collection?: string }>;
}) {
  await requireAdmin();
  const { collection } = await searchParams;
  const [board, settings] = await Promise.all([getCatalogBoard(), getSettings()]);
  const rows = collection ? board.filter((p) => p.collection === collection) : board;
  const collections = Object.keys(en.collections);

  return (
    <div>
      <PageTitle
        title="Products."
        lede="Every piece — studio and added — is editable here: price, stock, facts, translations, photos, and its pin on the floor."
        action={
          <Link href="/admin/products/new" className="border border-charcoal px-5 py-2.5 font-sans text-[11px] uppercase tracking-label">
            Add a product
          </Link>
        }
      />

      <div className="mt-10 flex flex-wrap gap-5">
        <Link href="/admin/products" className={`label ${!collection ? "text-charcoal" : "text-hardwood"}`}>
          All · {board.length}
        </Link>
        {collections.map((id) => (
          <Link key={id} href={`/admin/products?collection=${id}`} className={`label ${collection === id ? "text-charcoal" : "text-hardwood"}`}>
            {(en.collections as Record<string, { name: string }>)[id].name} · {board.filter((p) => p.collection === id).length}
          </Link>
        ))}
      </div>

      <ul className="mt-10 divide-y divide-hardwood/20 border-y border-hardwood/20">
        {rows.map((item) => {
          const name = productCopy(item, "en").name;
          const low = !item.madeToOrder && item.available <= settings.lowStockThreshold;
          return (
            <li key={item.slug} className={`grid items-center gap-4 py-5 md:grid-cols-12 ${item.active ? "" : "opacity-60"}`}>
              <div className="flex items-center gap-4 md:col-span-4">
                {item.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.images[0]} alt="" className="h-16 w-12 shrink-0 object-cover" />
                ) : (
                  <div className="h-16 w-12 shrink-0 bg-charcoal/10" />
                )}
                <div className="min-w-0">
                  <Link href={`/admin/products/${item.slug}`} className="font-serif text-2xl draw-underline">
                    {name}
                  </Link>
                  <p className="label mt-1 truncate">
                    {item.collection}
                    {item.custom ? " · added" : ""}
                    {item.sku ? ` · ${item.sku}` : ""}
                    {!item.active ? " · hidden" : ""}
                  </p>
                </div>
              </div>
              <p className="md:col-span-2">
                {formatMoney(item.price, settings.currency, "en")}
                {item.compareAtPrice ? <span className="block text-xs text-hardwood line-through">{formatMoney(item.compareAtPrice, settings.currency, "en")}</span> : null}
              </p>
              <form action={updateOnHandAction} className="flex items-end gap-3 md:col-span-3">
                <input type="hidden" name="slug" value={item.slug} />
                <label className="block flex-1">
                  <span className={`label ${low ? "text-burgundy" : ""}`}>
                    {item.madeToOrder ? "Made to order" : `On hand${item.reserved ? ` · ${item.reserved} reserved` : ""}`}
                  </span>
                  <input name="onHand" type="number" min={0} defaultValue={item.onHand} disabled={item.madeToOrder} className="mt-2" />
                </label>
                {!item.madeToOrder ? (
                  <button type="submit" className="label pb-3">
                    Save
                  </button>
                ) : null}
              </form>
              <div className="flex items-center justify-end gap-5 md:col-span-3">
                <form action={toggleProductActiveAction}>
                  <input type="hidden" name="slug" value={item.slug} />
                  <input type="hidden" name="active" value={item.active ? "false" : "true"} />
                  <button type="submit" className="label text-hardwood">
                    {item.active ? "Hide" : "Show"}
                  </button>
                </form>
                <Link href={`/admin/products/${item.slug}`} className="label draw-underline">
                  Edit
                </Link>
                <a href={`/en/collections/${item.collection}/${item.slug}`} target="_blank" rel="noreferrer" className="label text-hardwood">
                  View ↗
                </a>
              </div>
            </li>
          );
        })}
        {rows.length === 0 ? <li className="py-8 text-hardwood">No products in this collection.</li> : null}
      </ul>
    </div>
  );
}
