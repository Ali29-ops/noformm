import type { Order } from "../repo/orders";
import type { EnquiryRow } from "../db/schema";
import { formatMoney } from "../money";
import { governorateName } from "../egypt";
import type { StoreSettings } from "../settings";

type Locale = "en" | "ar";

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(locale: Locale, title: string, body: string, settings: StoreSettings) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const align = locale === "ar" ? "right" : "left";
  const footer =
    locale === "ar"
      ? `${settings.studioName} · ${settings.studioAddressAr}${settings.studioPhone ? ` · ${settings.studioPhone}` : ""}`
      : `${settings.studioName} · ${settings.studioAddressEn}${settings.studioPhone ? ` · ${settings.studioPhone}` : ""}`;
  return `<!doctype html><html lang="${locale}" dir="${dir}"><body style="margin:0;background:#F5F2E9;font-family:Georgia,serif;color:#1E201F;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F2E9;padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;text-align:${align};">
<tr><td style="padding:0 0 28px;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;">NO FORM</td></tr>
<tr><td style="font-size:28px;line-height:1.15;padding:0 0 20px;">${esc(title)}</td></tr>
<tr><td style="font-size:16px;line-height:1.6;">${body}</td></tr>
<tr><td style="padding:40px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.12em;color:#78675C;">${esc(footer)}<br/><a href="mailto:${esc(settings.studioEmail)}" style="color:#78675C;">${esc(settings.studioEmail)}</a></td></tr>
</table></td></tr></table></body></html>`;
}

function itemsTable(order: Order, locale: Locale) {
  const rows = order.items
    .map((item) => {
      const name = locale === "ar" && item.nameAr ? item.nameAr : item.name;
      return `<tr><td style="padding:8px 0;border-bottom:1px solid #d9d2c4;">${esc(name)} × ${item.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #d9d2c4;text-align:${locale === "ar" ? "left" : "right"};">${formatMoney(item.lineTotal, order.currency, locale)}</td></tr>`;
    })
    .join("");
  const labels =
    locale === "ar"
      ? { subtotal: "المجموع الفرعي", shipping: "الشحن", discount: "الخصم", tax: "الضريبة", total: "الإجمالي" }
      : { subtotal: "Subtotal", shipping: "Delivery", discount: "Discount", tax: "VAT", total: "Total" };
  const right = locale === "ar" ? "left" : "right";
  const line = (label: string, value: number, strong = false) =>
    `<tr><td style="padding:6px 0;${strong ? "font-weight:bold;" : ""}">${label}</td><td style="padding:6px 0;text-align:${right};${strong ? "font-weight:bold;" : ""}">${formatMoney(value, order.currency, locale)}</td></tr>`;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;font-size:15px;">${rows}
${line(labels.subtotal, order.subtotal)}
${order.discount > 0 ? line(labels.discount, -order.discount) : ""}
${line(labels.shipping, order.shippingFee)}
${order.tax > 0 ? line(labels.tax, order.tax) : ""}
${line(labels.total, order.total, true)}</table>`;
}

function addressBlock(order: Order, locale: Locale) {
  const a = order.shippingAddress;
  const parts = [
    a.name,
    a.phone,
    [a.street, a.building, a.floor && `${locale === "ar" ? "الطابق" : "Floor"} ${a.floor}`, a.apartment && `${locale === "ar" ? "شقة" : "Apt"} ${a.apartment}`]
      .filter(Boolean)
      .join(", "),
    [a.area, a.city, governorateName(a.governorate, locale)].filter(Boolean).join(", "),
    a.landmark,
  ].filter((part): part is string => Boolean(part));
  return `<p style="margin:16px 0;color:#78675C;">${parts.map(esc).join("<br/>")}</p>`;
}

function depositBlock(order: Order, locale: Locale, settings: StoreSettings) {
  const money = (v: number) => formatMoney(v, order.currency, locale);
  const balance = Math.max(0, Math.round((order.total - Math.max(order.amountPaid, order.depositAmount)) * 100) / 100);
  const depositLeft = Math.max(0, Math.round((order.depositAmount - order.amountPaid) * 100) / 100);
  const right = locale === "ar" ? "left" : "right";
  const line = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:6px 0;${strong ? "font-weight:bold;" : ""}">${label}</td><td style="padding:6px 0;text-align:${right};${strong ? "font-weight:bold;" : ""}">${value}</td></tr>`;
  const labels =
    locale === "ar"
      ? {
          deposit: `العربون · ${order.depositPercent}٪`,
          paid: "المدفوع",
          balance: settings.balanceOnDelivery ? "الباقي عند التسليم" : "الباقي قبل الشحن",
          how: "كيفية دفع العربون",
          hold: `تُحفظ القطع لمدة ${settings.depositHoldHours} ساعة بانتظار العربون.`,
          nocod: "لا نوفّر الدفع عند الاستلام لكامل المبلغ.",
          card: "ادفع العربون بالبطاقة من صفحة الطلب.",
        }
      : {
          deposit: `Deposit · ${order.depositPercent}%`,
          paid: "Paid",
          balance: settings.balanceOnDelivery ? "Balance on delivery" : "Balance before shipping",
          how: "How to pay the deposit",
          hold: `Pieces are held for ${settings.depositHoldHours} hours awaiting the deposit.`,
          nocod: "We do not offer cash on delivery for the full amount.",
          card: "Pay the deposit by card from your order page.",
        };
  let table = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:8px 0 16px;font-size:15px;border-top:1px solid #d9d2c4;">
${line(labels.deposit, money(order.depositAmount), true)}
${order.amountPaid > 0 ? line(labels.paid, money(order.amountPaid)) : ""}
${balance > 0 ? line(labels.balance, money(balance)) : ""}</table>`;
  if (order.status === "pending" && depositLeft > 0) {
    const instructions =
      order.paymentMethod === "bank_transfer"
        ? locale === "ar"
          ? settings.bankTransferInstructionsAr
          : settings.bankTransferInstructionsEn
        : labels.card;
    table += `<p style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin-top:24px;">${labels.how} · ${money(depositLeft)}</p>
<p>${esc(instructions)}</p>
<p style="color:#78675C;">${settings.depositHoldHours > 0 ? esc(labels.hold) + " " : ""}${esc(labels.nocod)}</p>`;
  }
  return table;
}

function orderLink(order: Order, settings: StoreSettings) {
  return `${settings.siteUrl}/${order.locale}/orders/${order.id}?t=${order.publicToken}`;
}

export function orderPlacedEmail(order: Order, settings: StoreSettings) {
  const locale = order.locale === "ar" ? "ar" : "en";
  const title = locale === "ar" ? `وصل طلبك · ${order.id}` : `Your order · ${order.id}`;
  const intro =
    locale === "ar"
      ? `شكراً ${esc(order.customerName)}. وصل طلبك وقطعك محفوظة لك. يُؤكَّد الطلب حين يستلم الاستوديو العربون.`
      : `Thank you, ${esc(order.customerName)}. Your order has been received and the pieces are held for you. It is confirmed once the studio receives the deposit.`;
  const body = `<p>${intro}</p>${itemsTable(order, locale)}${depositBlock(order, locale, settings)}
<p style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin-top:24px;">${locale === "ar" ? "عنوان التسليم" : "Delivery address"}</p>${addressBlock(order, locale)}
<p><a href="${orderLink(order, settings)}" style="color:#1E201F;">${locale === "ar" ? "تابع طلبك" : "Track your order"}</a></p>`;
  return { subject: title, html: layout(locale, title, body, settings), text: `${title}\n${orderLink(order, settings)}` };
}

export function orderStatusEmail(order: Order, settings: StoreSettings) {
  const locale = order.locale === "ar" ? "ar" : "en";
  const titles: Record<string, [string, string]> = {
    confirmed: ["Your order is confirmed", "تم تأكيد طلبك"],
    processing: ["Your pieces are being prepared", "قطعك قيد التجهيز"],
    shipped: ["Your order is on its way", "طلبك في الطريق"],
    delivered: ["Your order has been delivered", "تم تسليم طلبك"],
    cancelled: ["Your order was cancelled", "تم إلغاء طلبك"],
  };
  const pair = titles[order.status] ?? ["Order update", "تحديث الطلب"];
  const title = `${locale === "ar" ? pair[1] : pair[0]} · ${order.id}`;
  let extra = "";
  if (order.status === "shipped" && order.trackingNumber) {
    extra = `<p>${locale === "ar" ? "رقم التتبع" : "Tracking number"}: <strong>${esc(order.trackingNumber)}</strong>${
      order.trackingUrl ? ` · <a href="${esc(order.trackingUrl)}" style="color:#1E201F;">${locale === "ar" ? "تتبّع" : "Track"}</a>` : ""
    }</p>`;
  }
  if (order.status === "cancelled" && order.cancelReason) {
    extra = `<p style="color:#78675C;">${esc(order.cancelReason)}</p>`;
  }
  const body = `<p>${locale === "ar" ? `مرحباً ${esc(order.customerName)}،` : `Hello ${esc(order.customerName)},`}</p>${extra}${itemsTable(order, locale)}${
    order.status === "cancelled" ? "" : depositBlock(order, locale, settings)
  }
<p><a href="${orderLink(order, settings)}" style="color:#1E201F;">${locale === "ar" ? "عرض الطلب" : "View order"}</a></p>`;
  return { subject: title, html: layout(locale, title, body, settings), text: `${title}\n${orderLink(order, settings)}` };
}

export function paymentReceivedEmail(
  order: Order,
  settings: StoreSettings,
  payment: { kind: "deposit" | "balance"; amount: number; confirmed: boolean; settled: boolean },
) {
  const locale = order.locale === "ar" ? "ar" : "en";
  const money = (v: number) => formatMoney(v, order.currency, locale);
  const isDeposit = payment.kind === "deposit";
  const title =
    locale === "ar"
      ? `${isDeposit ? "تم استلام العربون" : "تم استلام الدفع"} · ${order.id}`
      : `${isDeposit ? "Deposit received" : "Payment received"} · ${order.id}`;
  let intro: string;
  if (locale === "ar") {
    intro = `استلمنا ${money(payment.amount)}. شكراً ${esc(order.customerName)}.`;
    if (payment.confirmed) intro += " تم تأكيد طلبك وسيبدأ الاستوديو تجهيز القطع.";
    if (payment.settled) intro += " طلبك الآن مدفوع بالكامل.";
  } else {
    intro = `We received ${money(payment.amount)}. Thank you, ${esc(order.customerName)}.`;
    if (payment.confirmed) intro += " Your order is now confirmed and the studio will begin preparing the pieces.";
    if (payment.settled) intro += " Your order is now paid in full.";
  }
  const body = `<p>${intro}</p>${depositBlock(order, locale, settings)}<p><a href="${orderLink(order, settings)}" style="color:#1E201F;">${
    locale === "ar" ? "عرض الطلب" : "View order"
  }</a></p>`;
  return { subject: title, html: layout(locale, title, body, settings), text: title };
}

export function studioNewOrderEmail(order: Order, settings: StoreSettings) {
  const title = `New order ${order.id} · ${formatMoney(order.total, order.currency, "en")}`;
  const body = `<p>${esc(order.customerName)} · ${esc(order.customerEmail)} · ${esc(order.customerPhone)}</p>
<p>Deposit ${formatMoney(order.depositAmount, order.currency, "en")} (${order.depositPercent}%) via ${order.paymentMethod.replace("_", " ")} · ${order.paymentStatus.replace("_", " ")}</p>${itemsTable(order, "en")}${addressBlock(order, "en")}
${order.notes ? `<p><em>${esc(order.notes)}</em></p>` : ""}
<p><a href="${settings.siteUrl}/admin/orders/${order.id}" style="color:#1E201F;">Open in admin</a></p>`;
  return { subject: title, html: layout("en", title, body, settings), text: title };
}

export function enquiryReceivedEmail(enquiry: EnquiryRow, settings: StoreSettings) {
  const locale: Locale = enquiry.locale === "ar" ? "ar" : "en";
  const title = locale === "ar" ? "وصل استفسارك" : "We received your enquiry";
  const body = `<p>${
    locale === "ar"
      ? `شكراً ${esc(enquiry.name)}. سنردّ بعناية خلال يومي عمل.`
      : `Thank you, ${esc(enquiry.name)}. We will reply with care within two working days.`
  }</p><blockquote style="margin:16px 0;padding:0 16px;border-${locale === "ar" ? "right" : "left"}:2px solid #d9d2c4;color:#78675C;">${esc(enquiry.message)}</blockquote>`;
  return { subject: title, html: layout(locale, title, body, settings), text: title };
}

export function studioNewEnquiryEmail(enquiry: EnquiryRow, settings: StoreSettings) {
  const title = `New message from ${enquiry.name} — Meet our designer`;
  const body = `<p>${esc(enquiry.name)} · <a href="mailto:${esc(enquiry.email)}">${esc(enquiry.email)}</a>${enquiry.phone ? ` · ${esc(enquiry.phone)}` : ""}</p>
<p>${[enquiry.collection, enquiry.piece].filter(Boolean).map(esc).join(" · ") || "General"}</p>
<blockquote style="margin:16px 0;padding:0 16px;border-left:2px solid #d9d2c4;">${esc(enquiry.message)}</blockquote>
<p><a href="${settings.siteUrl}/admin/questionnaire" style="color:#1E201F;">Open in admin</a></p>`;
  return { subject: title, html: layout("en", title, body, settings), text: title };
}

export function passwordResetEmail(locale: Locale, name: string, link: string, settings: StoreSettings) {
  const title = locale === "ar" ? "إعادة تعيين كلمة المرور" : "Reset your password";
  const body = `<p>${locale === "ar" ? `مرحباً ${esc(name)}،` : `Hello ${esc(name)},`}</p>
<p>${
    locale === "ar"
      ? "اضغط الرابط أدناه لاختيار كلمة مرور جديدة. الرابط صالح لمدة ساعة."
      : "Use the link below to choose a new password. It is valid for one hour."
  }</p><p><a href="${link}" style="color:#1E201F;">${link}</a></p>
<p style="color:#78675C;">${locale === "ar" ? "إن لم تطلب ذلك، تجاهل هذا البريد." : "If you did not request this, you can ignore this email."}</p>`;
  return { subject: title, html: layout(locale, title, body, settings), text: `${title}\n${link}` };
}

export function cartReminderEmail(
  locale: Locale,
  name: string,
  lines: { name: string; quantity: number }[],
  cartUrl: string,
  settings: StoreSettings,
) {
  const title = locale === "ar" ? "قطعتك ما زالت في السلة" : "Your pieces are still in the cart";
  const intro =
    locale === "ar"
      ? `${esc(name)}، تركت هذه القطع. يمكن إكمال الطلب من السلة.`
      : `${esc(name)}, these pieces are still waiting. You can finish the order from your cart.`;
  const list = lines.map((line) => `<li>${esc(line.name)} × ${line.quantity}</li>`).join("");
  const label = locale === "ar" ? "افتح السلة" : "Open the cart";
  const body = `<p>${intro}</p><ul style="margin:16px 0;padding:0 18px;">${list}</ul><p><a href="${cartUrl}" style="color:#1E201F;">${label}</a></p>`;
  const text = `${title}\n${lines.map((line) => `${line.name} × ${line.quantity}`).join("\n")}\n${cartUrl}`;
  return { subject: title, html: layout(locale, title, body, settings), text };
}

export function welcomeEmail(locale: Locale, name: string, settings: StoreSettings) {
  const title = locale === "ar" ? "مرحباً بك في NO FORM" : "Welcome to NO FORM";
  const body = `<p>${
    locale === "ar"
      ? `${esc(name)}، أصبح لديك حساب. يحفظ طلباتك وعناوينك ويعرّف الاستوديو بمن يكتب.`
      : `${esc(name)}, your account is ready. It holds your orders and addresses and lets the studio know who is writing.`
  }</p><p><a href="${settings.siteUrl}/${locale}/collections" style="color:#1E201F;">${locale === "ar" ? "ادخل المجموعات" : "Enter the collections"}</a></p>`;
  return { subject: title, html: layout(locale, title, body, settings), text: title };
}
