import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { collectionIds } from "@/lib/catalog";
import { getProductBySlug } from "@/lib/repo/products";
import { getSettings } from "@/lib/settings";
import { productCopy } from "@/lib/product-copy";
import { ProductForm } from "@/components/ProductForm";
import { DeleteProductButton } from "@/components/DeleteProductButton";
import { PageTitle } from "@/components/admin/ui";
import en from "@/messages/en.json";

export const dynamic = "force-dynamic";

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug, { includeInactive: true }), getSettings()]);
  if (!product) notFound();
  const collections = collectionIds.map((id) => ({ id, name: en.collections[id].name }));
  const enCopy = productCopy({ ...product, name: null, nameAr: null, description: null, descriptionAr: null, materials: [], materialsAr: [] }, "en");
  const arCopy = productCopy({ ...product, name: null, nameAr: null, description: null, descriptionAr: null, materials: [], materialsAr: [] }, "ar");

  return (
    <div>
      <Link href="/admin/products" className="label draw-underline">
        Products
      </Link>
      <div className="mt-6">
        <PageTitle
          title={productCopy(product, "en").name}
          lede={`${product.collection} · ${product.source === "catalog" ? "studio piece" : "added piece"} · ${product.slug}`}
          action={
            <div className="flex items-center gap-6">
              <a href={`/en/collections/${product.collection}/${product.slug}`} target="_blank" rel="noreferrer" className="label draw-underline">
                View on site ↗
              </a>
              {product.source === "custom" ? <DeleteProductButton slug={product.slug} name={productCopy(product, "en").name} /> : null}
            </div>
          }
        />
      </div>
      <div className="mt-14">
        <ProductForm
          mode="edit"
          collections={collections}
          product={product}
          currency={settings.currency}
          defaults={{
            name: enCopy.name,
            description: enCopy.description,
            materials: enCopy.materials,
            nameAr: arCopy.name,
            descriptionAr: arCopy.description,
            materialsAr: arCopy.materials,
          }}
        />
      </div>
    </div>
  );
}
