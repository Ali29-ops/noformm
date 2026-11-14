import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { collectionIds } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { ProductForm } from "@/components/ProductForm";
import { PageTitle } from "@/components/admin/ui";
import en from "@/messages/en.json";

export const dynamic = "force-dynamic";

export default async function AdminNewProductPage() {
  await requireAdmin();
  const settings = await getSettings();
  const collections = collectionIds.map((id) => ({ id, name: en.collections[id].name }));
  return (
    <div>
      <Link href="/admin/products" className="label draw-underline">
        Products
      </Link>
      <div className="mt-6">
        <PageTitle title="Add a product." lede="New pieces join a collection and appear on that floor." />
      </div>
      <div className="mt-14">
        <ProductForm mode="add" collections={collections} currency={settings.currency} />
      </div>
    </div>
  );
}
