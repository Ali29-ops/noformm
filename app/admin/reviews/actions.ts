"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getStylingReviews, saveStylingReview } from "@/lib/styling-reviews";
import { saveReviewPhoto } from "@/lib/review-photos";

function field(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

function finish(status: "saved" | "invalid" = "saved"): never {
  if (status === "saved") {
    revalidatePath("/admin/reviews");
    revalidatePath("/[locale]/styling", "page");
  }
  redirect(`/admin/reviews?status=${status}`);
}

export async function saveHeading(form: FormData) {
  await requireAdmin();
  const en = { title: field(form, "titleEn"), note: field(form, "noteEn") };
  const ar = { title: field(form, "titleAr"), note: field(form, "noteAr") };
  if (!en.title || !ar.title) finish("invalid");
  await saveStylingReview({ en, ar });
  finish();
}

export async function saveReview(form: FormData) {
  await requireAdmin();
  const id = field(form, "id");
  const { reviews } = await getStylingReviews();
  const current = reviews.find((review) => review.id === id);
  if (id && !current) finish("invalid");
  const en = { quote: field(form, "quoteEn"), name: field(form, "nameEn"), alt: field(form, "altEn") };
  const ar = { quote: field(form, "quoteAr"), name: field(form, "nameAr"), alt: field(form, "altAr") };
  const order = Number(field(form, "order"));
  const position = Number(field(form, "position"));
  const rating = Number(field(form, "rating"));
  const file = form.get("photo");
  const hasUpload = file instanceof File && file.size > 0;
  let image = field(form, "image");
  if (!en.quote || !en.name || !Number.isSafeInteger(order) || !Number.isInteger(position) ||
      position < 0 || position > 100 || !Number.isInteger(rating) || rating < 1 || rating > 5) finish("invalid");

  if (hasUpload) {
    try {
      image = await saveReviewPhoto(file);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Choose a JPEG")) finish("invalid");
      throw error;
    }
  }
  if (!/^\/(?![/\\])/.test(image) && !/^https?:\/\/[^\s]+$/i.test(image)) finish("invalid");
  await saveStylingReview({ id: current?.id ?? randomUUID(), image, position, order, rating, visible: form.has("visible"), en, ar });
  finish();
}
