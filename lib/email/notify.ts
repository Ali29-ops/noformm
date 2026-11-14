import type { EnquiryRow } from "../db/schema";
import type { Order } from "../repo/orders";
import { getSettings } from "../settings";
import { sendEmail } from "./send";
import {
  enquiryReceivedEmail,
  orderPlacedEmail,
  orderStatusEmail,
  passwordResetEmail,
  paymentReceivedEmail,
  studioNewEnquiryEmail,
  studioNewOrderEmail,
  welcomeEmail,
  cartReminderEmail,
} from "./templates";

async function safe(fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (error) {
    console.error("[mail]", error);
  }
}

export async function notifyOrderPlaced(order: Order) {
  const settings = await getSettings();
  await safe(async () => {
    const mail = orderPlacedEmail(order, settings);
    await sendEmail({ to: order.customerEmail, ...mail, template: "order-placed", relatedType: "order", relatedId: order.id });
  });
  await safe(async () => {
    if (!settings.orderNotifyEmail) return;
    const mail = studioNewOrderEmail(order, settings);
    await sendEmail({ to: settings.orderNotifyEmail, ...mail, template: "studio-new-order", relatedType: "order", relatedId: order.id });
  });
}

export async function notifyOrderStatus(order: Order) {
  if (!["confirmed", "processing", "shipped", "delivered", "cancelled"].includes(order.status)) return;
  const settings = await getSettings();
  await safe(async () => {
    const mail = orderStatusEmail(order, settings);
    await sendEmail({ to: order.customerEmail, ...mail, template: `order-${order.status}`, relatedType: "order", relatedId: order.id });
  });
}

export async function notifyPaymentReceived(
  order: Order,
  payment: { kind: "deposit" | "balance"; amount: number; confirmed: boolean; settled: boolean },
) {
  const settings = await getSettings();
  await safe(async () => {
    const mail = paymentReceivedEmail(order, settings, payment);
    await sendEmail({
      to: order.customerEmail,
      ...mail,
      template: payment.kind === "deposit" ? "deposit-received" : "balance-received",
      relatedType: "order",
      relatedId: order.id,
    });
  });
}

export async function notifyEnquiry(enquiry: EnquiryRow) {
  const settings = await getSettings();
  await safe(async () => {
    const mail = enquiryReceivedEmail(enquiry, settings);
    await sendEmail({ to: enquiry.email, ...mail, template: "enquiry-received", relatedType: "enquiry", relatedId: enquiry.id });
  });
  await safe(async () => {
    if (!settings.orderNotifyEmail) return;
    const mail = studioNewEnquiryEmail(enquiry, settings);
    await sendEmail({ to: settings.orderNotifyEmail, ...mail, template: "studio-new-enquiry", relatedType: "enquiry", relatedId: enquiry.id });
  });
}

export async function notifyPasswordReset(locale: "en" | "ar", to: string, name: string, token: string) {
  const settings = await getSettings();
  await safe(async () => {
    const link = `${settings.siteUrl}/${locale}/reset-password?token=${encodeURIComponent(token)}`;
    const mail = passwordResetEmail(locale, name, link, settings);
    await sendEmail({ to, ...mail, template: "password-reset" });
  });
}

export async function notifyCartReminder(
  locale: "en" | "ar",
  to: string,
  name: string,
  lines: { name: string; quantity: number }[],
  visitor: string,
) {
  const settings = await getSettings();
  const cartUrl = `${settings.siteUrl}/${locale}/cart`;
  const mail = cartReminderEmail(locale, name, lines, cartUrl, settings);
  await sendEmail({ to, ...mail, template: "cart-reminder", relatedType: "cart", relatedId: visitor });
}

export async function notifyWelcome(locale: "en" | "ar", to: string, name: string) {
  const settings = await getSettings();
  await safe(async () => {
    const mail = welcomeEmail(locale, name, settings);
    await sendEmail({ to, ...mail, template: "welcome" });
  });
}
