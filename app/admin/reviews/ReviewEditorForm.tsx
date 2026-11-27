"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { preparePhotoUpload } from "@/lib/prepare-photo-upload";
import { saveReview } from "./actions";

export function ReviewEditorForm({ children, submitLabel, buttonClass }: {
  children: ReactNode;
  submitLabel: string;
  buttonClass: string;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const photo = data.get("photo");
    setError("");
    setPending(true);
    try {
      if (photo instanceof File && photo.size > 0) {
        if (photo.type === "image/gif") throw new Error("Choose a JPEG, PNG, WebP or AVIF image.");
        data.set("photo", await preparePhotoUpload(photo));
      } else {
        data.delete("photo");
      }
      const result = await saveReview(data);
      if (result?.error) setError(result.error);
      else form.reset();
    } catch (error) {
      unstable_rethrow(error);
      const message = error instanceof Error ? error.message : "";
      setError(message && !/Server Components render|unexpected response/i.test(message)
        ? message
        : "Could not save this review. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form method="post" onSubmit={submit} className="mt-5 space-y-4">
      {children}
      {error ? <p role="alert" className="text-sm text-burgundy">{error}</p> : null}
      <button className={buttonClass} disabled={pending}>{pending ? "Saving review…" : submitLabel}</button>
    </form>
  );
}
