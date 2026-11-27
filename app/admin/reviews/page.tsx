import { requireAdmin } from "@/lib/admin-auth";
import { getStylingReviews, type Review } from "@/lib/styling-reviews";
import { PageTitle } from "@/components/admin/ui";
import { saveHeading } from "./actions";
import { ReviewEditorForm } from "./ReviewEditorForm";

const button = "border border-charcoal px-5 py-2.5 label";

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const [{ heading, reviews }, { status }] = await Promise.all([getStylingReviews(), searchParams]);
  const nextOrder = Math.max(0, ...reviews.map((review) => review.order)) + 10;

  return (
    <div className="space-y-10">
      <PageTitle title="Client reviews" lede="Manage the heading and cards on the Styling page." />
      {status === "saved" && <p role="status">Changes saved.</p>}
      {status === "invalid" && <p role="alert">Check the required fields and try again.</p>}
      <form action={saveHeading} className="space-y-4 border-y border-hardwood/25 py-6">
        <h2 className="font-serif text-3xl">Section heading</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Title (EN)" name="titleEn" value={heading.en.title} multiline required />
          <TextField label="Title (AR)" name="titleAr" value={heading.ar.title} multiline required />
          <TextField label="Subtitle (EN)" name="noteEn" value={heading.en.note} />
          <TextField label="Subtitle (AR)" name="noteAr" value={heading.ar.note} />
        </div>
        <button className={button}>Save heading</button>
      </form>

      <details className="border-b border-hardwood/25 pb-6" open>
        <summary className="cursor-pointer font-serif text-3xl">Add a review</summary>
        <ReviewForm order={nextOrder} />
      </details>

      <section className="space-y-4">
        <h2 className="font-serif text-3xl">Existing reviews</h2>
        {reviews.map((review) => (
          <details key={review.id} className="border-b border-hardwood/25 pb-4">
            <summary className="cursor-pointer">{review.en.quote} · {review.visible ? "Visible" : "Hidden"}</summary>
            <ReviewForm review={review} order={review.order} />
          </details>
        ))}
      </section>
    </div>
  );
}

function TextField({ label, name, value, multiline, required }: {
  label: string; name: string; value?: string; multiline?: boolean; required?: boolean;
}) {
  const props = { name, defaultValue: value, required, className: "mt-2" };
  return (
    <label className="block">
      <span className="label">{label}</span>
      {multiline ? <textarea {...props} rows={2} dir="auto" /> : <input {...props} dir="auto" />}
    </label>
  );
}

function ReviewForm({ review, order }: { review?: Review; order: number }) {
  return (
    <ReviewEditorForm buttonClass={button} submitLabel={review ? "Save review" : "Add review"}>
      {review && <input type="hidden" name="id" value={review.id} />}
      {review && <img src={review.image} alt={review.en.alt} className="h-24 w-24 object-cover" />}
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Quote (EN)" name="quoteEn" value={review?.en.quote} multiline required />
        <TextField label="Quote (AR)" name="quoteAr" value={review?.ar.quote} multiline />
        <TextField label="Client name (EN)" name="nameEn" value={review?.en.name} required />
        <TextField label="Client name (AR)" name="nameAr" value={review?.ar.name} />
        <TextField label="Photo description (EN)" name="altEn" value={review?.en.alt} />
        <TextField label="Photo description (AR)" name="altAr" value={review?.ar.alt} />
        <TextField label="Photo URL" name="image" value={review?.image} />
        <label className="block">
          <span className="label">Upload photo</span>
          <input name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="mt-2" />
        </label>
      </div>
      <div className="grid items-center gap-4 sm:grid-cols-4">
        <label className="block">
          <span className="label">Vertical crop (%)</span>
          <input name="position" type="number" min={0} max={100} defaultValue={review?.position ?? 50} required className="mt-2" />
        </label>
        <label className="block">
          <span className="label">Display order</span>
          <input name="order" type="number" defaultValue={order} required className="mt-2" />
        </label>
        <label className="block">
          <span className="label">Stars</span>
          <input name="rating" type="number" min={1} max={5} defaultValue={review?.rating ?? 5} required className="mt-2" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="visible" type="checkbox" defaultChecked={review?.visible ?? true} className="h-4 w-4" />
          Visible on Styling
        </label>
      </div>
    </ReviewEditorForm>
  );
}
