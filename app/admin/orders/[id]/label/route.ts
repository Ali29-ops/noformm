import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getOrder } from "@/lib/repo/orders";
import { getBostaLabel } from "@/lib/shipping/bosta";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order?.trackingNumber || order.shippingProvider !== "Bosta") {
    return NextResponse.json({ error: "No Bosta shipment on this order." }, { status: 404 });
  }
  try {
    const pdf = await getBostaLabel(order.trackingNumber);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${order.id}-bosta-${order.trackingNumber}.pdf"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Label failed." }, { status: 502 });
  }
}
