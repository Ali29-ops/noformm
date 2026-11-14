"use client";

import { deleteProductAction } from "@/app/admin/actions";

export function DeleteProductButton({ slug, name }: { slug: string; name: string }) {
  return (
    <form
      action={deleteProductAction}
      onSubmit={(event) => {
        if (!confirm(`Delete ${name}? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <button type="submit" className="label text-burgundy">
        Delete
      </button>
    </form>
  );
}
