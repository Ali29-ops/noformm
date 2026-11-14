import { getTranslations } from "next-intl/server";
import type { OrderStatus } from "@/lib/db/schema";

const steps: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];

export async function OrderStatusSteps({ status }: { status: OrderStatus }) {
  const t = await getTranslations("order");
  if (status === "cancelled") {
    return (
      <p className="inline-block border border-burgundy/40 px-4 py-2 font-sans text-[11px] uppercase tracking-label text-burgundy">
        {t("statuses.cancelled")}
      </p>
    );
  }
  const current = steps.indexOf(status);
  return (
    <ol className="grid grid-cols-5 gap-2">
      {steps.map((step, index) => (
        <li key={step} className="min-w-0">
          <div className={`h-px w-full ${index <= current ? "bg-charcoal" : "bg-hardwood/30"}`} />
          <p
            className={`mt-3 truncate font-sans text-[10px] uppercase tracking-wide ${
              index <= current ? "text-charcoal" : "text-hardwood/60"
            }`}
          >
            {t(`statuses.${step}`)}
          </p>
        </li>
      ))}
    </ol>
  );
}
