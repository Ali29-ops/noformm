import { productPhotoAccept, productPhotoMaxBytes } from "./product-photo-upload";

export async function prepareProductPhoto(file: File) {
  if (!productPhotoAccept.split(",").includes(file.type)) {
    throw new Error("Choose a JPEG, PNG, WebP, GIF or AVIF image.");
  }
  if (file.size <= productPhotoMaxBytes) return file;
  if (file.type === "image/gif") throw new Error("Choose a GIF under 900 KB to preserve its animation.");

  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not resize this photo.");
    for (const maxSide of [2400, 1800, 1350, 1000, 750, 500]) {
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const image = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.88));
      if (image?.size && image.size <= productPhotoMaxBytes) {
        const extension = image.type === "image/webp" ? ".webp" : ".png";
        return new File([image], file.name.replace(/\.[^.]+$/, "") + extension, { type: image.type });
      }
    }
    throw new Error("This photo could not be resized for upload.");
  } finally {
    bitmap.close();
  }
}
