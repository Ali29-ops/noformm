"use client";

import { FormEvent, useRef, useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { addProductAction, updateProductAction, uploadProductPhotoAction } from "@/app/admin/actions";
import type { CollectionId } from "@/lib/catalog";
import { prepareProductPhoto } from "@/lib/prepare-product-photo";
import { colorLegendKey, materialLegendKey, resolveColors, resolveMaterials, type SwatchOption } from "@/lib/product-options";
import { productPhotoAccept, productPhotoPrefix } from "@/lib/product-photo-upload";
import en from "@/messages/en.json";
import type { LiveProduct } from "@/lib/repo/products";

export function ProductForm({
  mode,
  collections,
  product,
  defaults,
  currency,
}: {
  mode: "add" | "edit";
  collections: { id: CollectionId; name: string }[];
  product?: LiveProduct;
  defaults?: { name: string; description: string; materials: string[]; nameAr: string; descriptionAr: string; materialsAr: string[] };
  currency: string;
}) {
  const materialKey = materialLegendKey(product?.slug ?? "");
  const materialLabel = materialKey === "materials" ? en.common.materials : en.product[materialKey];
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [fileCount, setFileCount] = useState(0);
  const [madeToOrder, setMadeToOrder] = useState(product?.madeToOrder ?? false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProgress("Saving product…");
    setError("");
    const data = new FormData(event.currentTarget);
    let uploading: File | undefined;
    try {
      const files = [...data].filter((entry): entry is [string, File] => entry[1] instanceof File);
      for (const [key] of files) data.delete(key);
      const selected = files.filter(([, file]) => file.size > 0);
      const swatches = {
        materialSwatches: JSON.parse(String(data.get("materialSwatches"))) as SwatchOption[],
        colorSwatches: JSON.parse(String(data.get("colorSwatches"))) as SwatchOption[],
      };
      for (const [index, [key, file]] of selected.entries()) {
        uploading = file;
        setProgress(`Uploading photo ${index + 1} of ${selected.length}…`);
        const body = new FormData();
        body.set("photo", await prepareProductPhoto(file));
        const result = await uploadProductPhotoAction(body);
        if (!result.id) throw new Error(result.error);
        if (key === "images") {
          data.append("galleryPhotoDraft", result.id);
        } else {
          const match = /^(materialSwatches|colorSwatches)(Photo|ProductPhoto)-(\d+)$/.exec(key);
          if (!match) throw new Error("This photo is missing its colour or material option.");
          const group = match[1] === "materialSwatches" ? swatches.materialSwatches : swatches.colorSwatches;
          const row = group[Number(match[3])];
          if (!row) throw new Error("This photo is missing its colour or material option.");
          row[match[2] === "Photo" ? "image" : "productImage"] = productPhotoPrefix + result.id;
        }
        data.append("photoDraft", result.id);
      }
      uploading = undefined;
      for (const [key, rows] of Object.entries(swatches)) data.set(key, JSON.stringify(rows));
      setProgress("Saving product…");
      const result = await (mode === "edit" ? updateProductAction(data) : addProductAction(data));
      if (result?.error) setError(result.error);
    } catch (err) {
      unstable_rethrow(err);
      const message = err instanceof Error ? err.message : "";
      if (/Server Components render|unexpected response/i.test(message)) {
        setError(uploading ? `Could not upload “${uploading.name}”. Try saving again.` : "Could not save the product. Please try again.");
      } else {
        setError(uploading ? `“${uploading.name}” — ${message || "Could not upload this photo."}` : message || "Could not save the product.");
      }
    } finally {
      setProgress("");
    }
  }

  const isCatalog = product?.source === "catalog";
  const inputCls = "mt-2";

  return (
    <form onSubmit={onSubmit} className="space-y-14">
      {mode === "edit" ? <input type="hidden" name="slug" value={product?.slug} /> : null}

      <Section title="Identity" hint={isCatalog ? "Studio pieces take their name and copy from the site translations unless you override them here." : undefined}>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block">
            <span className="label">Name (EN)</span>
            <input name="name" required={!isCatalog} defaultValue={product?.name ?? ""} placeholder={defaults?.name} className={inputCls} />
          </label>
          <label className="block" dir="rtl">
            <span className="label">الاسم (AR)</span>
            <input name="nameAr" defaultValue={product?.nameAr ?? ""} placeholder={defaults?.nameAr} className={inputCls} />
          </label>
          <label className="block">
            <span className="label">Collection</span>
            <select name="collection" required defaultValue={product?.collection ?? collections[0]?.id} className={inputCls}>
              {collections.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">SKU / reference</span>
            <input name="sku" defaultValue={product?.sku ?? ""} className={inputCls} />
            <p className="mt-2 text-sm text-hardwood">Leave blank to assign a reference from the collection, such as NF-SPH-001.</p>
          </label>
          <label className="block md:col-span-2">
            <span className="label">Description (EN)</span>
            <textarea name="description" rows={3} defaultValue={product?.description ?? ""} placeholder={defaults?.description} className={`${inputCls} resize-none`} />
          </label>
          <label className="block md:col-span-2" dir="rtl">
            <span className="label">الوصف (AR)</span>
            <textarea name="descriptionAr" rows={3} defaultValue={product?.descriptionAr ?? ""} placeholder={defaults?.descriptionAr} className={`${inputCls} resize-none`} />
          </label>
          <label className="block">
            <span className="label">Materials (EN, comma separated)</span>
            <input name="materials" defaultValue={product?.materials.join(", ") ?? ""} placeholder={defaults?.materials.join(", ")} className={inputCls} />
          </label>
          <label className="block" dir="rtl">
            <span className="label">الخامات (AR)</span>
            <input name="materialsAr" defaultValue={product?.materialsAr.join(", ") ?? ""} placeholder={defaults?.materialsAr.join("، ")} className={inputCls} />
          </label>
        </div>
      </Section>

      <Section
        title="Colours & materials"
        hint="Small circles on the product page. Add one row for each option the customer can pick before checkout. Leave empty if this piece has no choice."
      >
        <SwatchEditor name="materialSwatches" label={materialLabel} initial={product ? resolveMaterials(product) : []} />
        <div className="mt-10">
          <SwatchEditor name="colorSwatches" label={en.product[colorLegendKey(product?.slug ?? "")]} initial={product ? resolveColors(product) : []} />
        </div>
      </Section>

      <Section title="Price & stock">
        <div className="grid gap-6 md:grid-cols-4">
          <label className="block">
            <span className="label">Price {currency}</span>
            <input name="price" type="number" min={0} step="0.01" required defaultValue={product?.price ?? 2400} className={inputCls} />
          </label>
          <label className="block">
            <span className="label">Compare-at price</span>
            <input name="compareAtPrice" type="number" min={0} step="0.01" defaultValue={product?.compareAtPrice ?? ""} className={inputCls} />
          </label>
          <label className="block">
            <span className="label">On hand</span>
            <input name="onHand" type="number" min={0} required defaultValue={product?.onHand ?? 4} disabled={madeToOrder} className={inputCls} />
            {product && product.reserved > 0 ? <span className="mt-1 block text-xs text-hardwood">{product.reserved} reserved by open orders</span> : null}
          </label>
          <label className="block">
            <span className="label">Lead time (days)</span>
            <input name="leadTimeDays" type="number" min={0} defaultValue={product?.leadTimeDays ?? ""} className={inputCls} />
          </label>
        </div>
        <div className="mt-6 flex flex-wrap gap-8">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="madeToOrder" defaultChecked={product?.madeToOrder ?? false} onChange={(e) => setMadeToOrder(e.target.checked)} className="h-4 w-4" />
            Made to order (stock is not tracked)
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="active" defaultChecked={product?.active ?? true} className="h-4 w-4" />
            Visible on the site
          </label>
          <label className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <input type="checkbox" name="readyToShip" defaultChecked={product?.readyToShip ?? false} className="h-4 w-4" />
            Ready to ship
            <span className="w-full text-hardwood">Shows a stamp on All Products when stock is available and the product is not made to order.</span>
          </label>
        </div>
      </Section>

      <Section title="Facts">
        <div className="grid gap-6 md:grid-cols-4">
          <label className="block">
            <span className="label">Width cm</span>
            <input name="widthCm" type="number" min={0} step="0.1" defaultValue={product?.widthCm ?? ""} className={inputCls} />
          </label>
          <label className="block">
            <span className="label">Depth cm</span>
            <input name="depthCm" type="number" min={0} step="0.1" defaultValue={product?.depthCm ?? ""} className={inputCls} />
          </label>
          <label className="block">
            <span className="label">Height cm</span>
            <input name="heightCm" type="number" min={0} step="0.1" defaultValue={product?.heightCm ?? ""} className={inputCls} />
          </label>
          <label className="block">
            <span className="label">Weight kg</span>
            <input name="weightKg" type="number" min={0} step="0.1" defaultValue={product?.weightKg ?? ""} className={inputCls} />
          </label>
          <label className="block md:col-span-2">
            <span className="label">Care (EN)</span>
            <textarea name="care" rows={2} defaultValue={product?.care ?? ""} className={`${inputCls} resize-none`} />
          </label>
          <label className="block md:col-span-2" dir="rtl">
            <span className="label">العناية (AR)</span>
            <textarea name="careAr" rows={2} defaultValue={product?.careAr ?? ""} className={`${inputCls} resize-none`} />
          </label>
        </div>
      </Section>

      <Section title="Catalog order">
        <label className="block max-w-xs">
          <span className="label">Featured position</span>
          <input name="sortOrder" type="number" step="1" required defaultValue={product?.sortOrder ?? 0} className={inputCls} />
          <p className="mt-2 text-sm text-hardwood">Lower numbers appear first in the featured sort.</p>
        </label>
      </Section>

      <Section title="Photos">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block">
            <span className="label">Photo URLs</span>
            <textarea name="imageUrls" rows={3} className={`${inputCls} resize-none`} placeholder={"/catalog/...\none URL per line"} />
          </label>
          <label className="block">
            <span className="label">Upload photos</span>
            <input name="images" type="file" accept={productPhotoAccept} multiple className={inputCls} onChange={(event) => setFileCount(event.currentTarget.files?.length ?? 0)} />
            <p className="mt-2 text-sm text-hardwood">{fileCount > 0 ? `${fileCount} selected.` : "Select as many as you need, in one go."}</p>
          </label>
        </div>
        {product?.images.length ? (
          <fieldset className="mt-8">
            <legend className="label">Current photos — untick to remove</legend>
            <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {product.images.map((src) => (
                <li key={src} className="border border-hardwood/25 p-2">
                  {/* native img so remote URLs preview without next/image config */}
                  <img src={src} alt="" className="aspect-[4/5] w-full object-cover" />
                  <label className="mt-2 flex items-center gap-2 text-sm">
                    <input type="checkbox" name="keep" value={src} defaultChecked />
                    Keep
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ) : null}
      </Section>

      {error ? <p role="alert" className="text-sm text-burgundy">{error}</p> : null}
      <button type="submit" disabled={Boolean(progress)} className="border border-charcoal px-6 py-3 font-sans text-[11px] uppercase tracking-label disabled:opacity-40">
        {progress || (mode === "edit" ? "Save product" : "Add product")}
      </button>
    </form>
  );
}

function emptySwatch(): SwatchOption {
  return { id: "", hex: "#8b5a2b", en: "", ar: "" };
}

function SwatchEditor({
  name,
  label,
  initial,
}: {
  name: "materialSwatches" | "colorSwatches";
  label: string;
  initial: SwatchOption[];
}) {
  const [rows, setRows] = useState(() => initial.map((row, index) => ({ ...row, rowKey: index })));
  const nextRowKey = useRef(initial.length);

  function update(index: number, patch: Partial<SwatchOption>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div>
      <p className="label">{label}</p>
      <input type="hidden" name={name} value={JSON.stringify(rows.map(({ rowKey, ...row }) => row))} />
      <ul className="mt-4 space-y-4">
        {rows.map((row, index) => (
          <li key={row.rowKey} className="grid items-end gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.65fr)_1fr_1fr_auto]">
            <label className="block">
              <span className="label">Swatch image</span>
              <span className="mt-2 flex items-center gap-3">
                <span
                  className="h-11 w-11 shrink-0 rounded-full border border-hardwood/40 bg-cover bg-center"
                  style={row.image ? { backgroundImage: `url(${row.image})` } : { background: row.hex || "#ccc" }}
                />
                <input
                  name={`${name}Photo-${index}`}
                  type="file"
                  accept={productPhotoAccept}
                  className="min-w-0 w-full"
                  aria-label={`${label} photo ${index + 1}`}
                />
              </span>
            </label>
            <label className="block">
              <span className="label">Hex</span>
              <input
                value={row.hex}
                onChange={(event) => update(index, { hex: event.target.value })}
                placeholder="#8b5a2b"
                className="mt-2"
              />
            </label>
            <label className="block">
              <span className="label">Name (EN)</span>
              <input
                value={row.en}
                onChange={(event) => update(index, { en: event.target.value })}
                placeholder="Olive"
                className="mt-2"
              />
            </label>
            <label className="block" dir="rtl">
              <span className="label">الاسم (AR)</span>
              <input
                value={row.ar}
                onChange={(event) => update(index, { ar: event.target.value })}
                placeholder="زيتوني"
                className="mt-2"
              />
            </label>
            <button
              type="button"
              onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
              className="mb-1 text-left font-sans text-[11px] uppercase tracking-label text-hardwood"
            >
              Remove
            </button>
            <div className="grid items-start gap-3 md:col-span-full md:grid-cols-2">
              <label className="block">
                <span className="label">Product photo URL</span>
                <input
                  value={row.productImage ?? ""}
                  onChange={(event) => update(index, { productImage: event.target.value })}
                  placeholder="/catalog/product.jpg or https://example.com/product.jpg"
                  className="mt-2"
                />
              </label>
              <label className="block">
                <span className="label">Upload product photo</span>
                <span className="mt-2 flex items-center gap-3">
                  {row.productImage ? (
                    <img src={row.productImage} alt="" className="h-16 w-12 shrink-0 object-cover" />
                  ) : null}
                  <input
                    name={`${name}ProductPhoto-${index}`}
                    type="file"
                accept={productPhotoAccept}
                    className="w-full min-w-0"
                  />
                </span>
              </label>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => {
          const rowKey = nextRowKey.current++;
          setRows((prev) => [...prev, { ...emptySwatch(), rowKey }]);
        }}
        className="mt-4 border border-charcoal px-4 py-2 font-sans text-[11px] uppercase tracking-label"
      >
        Add option
      </button>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-hardwood/25 pt-8">
      <h2 className="font-serif text-2xl">{title}</h2>
      {hint ? <p className="mt-2 max-w-2xl text-sm text-hardwood">{hint}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}
