import { getPublishedProductPhoto } from "@/lib/repo/product-photos";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const photo = await getPublishedProductPhoto((await params).id);
  if (!photo) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(photo.bytes), {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
