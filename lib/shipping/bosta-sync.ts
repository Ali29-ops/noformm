import type { OrderEventRow } from "../db/schema";
import { addOrderNote, balanceDue, getOrder, transitionOrder } from "../repo/orders";
import { notifyOrderStatus } from "../email/notify";
import { BOSTA_DELIVERED, bostaStates } from "./bosta";

/** Record a Bosta delivery state on its order; a delivered state closes the order. */
export async function applyBostaState(
  orderId: string,
  state: { code: number; value?: string; trackingNumber?: string; cod?: number },
  actor: OrderEventRow["actor"],
) {
  const order = await getOrder(orderId);
  if (!order) return { ok: false as const, reason: "order not found" };
  if (state.trackingNumber && order.trackingNumber && state.trackingNumber !== order.trackingNumber) {
    return { ok: false as const, reason: "tracking number does not match" };
  }

  const label = bostaStates[state.code] ?? state.value ?? `State ${state.code}`;
  const message = `Bosta · ${label}`;
  const latestBosta = order.events.filter((e) => e.type === "note" && e.message.startsWith("Bosta · ")).at(0);
  if (latestBosta?.message !== message) await addOrderNote(orderId, message, actor);

  if (state.code === BOSTA_DELIVERED && order.status === "shipped") {
    const due = balanceDue(order);
    const delivered = await transitionOrder(orderId, "delivered", actor, {
      collectBalance: due > 0 && (state.cod ?? due) > 0,
      recordedBy: "Bosta",
      message: "Delivered by Bosta",
    });
    await notifyOrderStatus(delivered);
  }
  return { ok: true as const, label };
}
