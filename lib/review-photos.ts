import path from "node:path";

export const reviewPhotoDirectory = path.join(process.cwd(), "data", "review-photos");
export const reviewPhotoTypes: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};
