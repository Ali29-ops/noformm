import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { balanceAfterDeposit, balanceDue, depositCovered, depositDue, getOrder, statusFlow } from "@/lib/repo/orders";
import { getCustomerById } from "@/lib/repo/customers";
import { getSettings, shippingApiConfigured } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { governorateName } from "@/lib/egypt";
import { Button, Field, PageTitle, PaymentBadge, StatusBadge, formatDate } from "@/components/admin/ui";
import { BOSTA_MAX_COD, bostaSizes, getBostaDistricts, matchDistrict, type BostaDistrict } from "@/lib/shipping/bosta";
import {
  createBostaShipmentAction,
  syncBostaAction,
  orderMetaAction,
  orderNoteAction,
  orderPaymentAction,
  orderPaymentFailedAction,
  orderTransitionAction,
  resendOrderEmailAction,
} from "../../actions";

const methodOptions = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "instapay", label: "InstaPay / wallet" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
];
import { OrderActionForm } from "@/components/admin/OrderActionForm";

export const dynamic = "force-dynamic";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [order, settings] = await Promise.all([getOrder(id), getSettings()]);
  if (!order) notFound();
  const customer = order.customerId ? await getCustomerById(order.customerId) : null;
  const money = (v: number) => formatMoney(v, order.currency, "en");
  const a = order.shippingAddress;
  const nextStatuses = statusFlow[order.status];
  const depositOk = depositCovered(order);
  const depositLeft = depositDue(order);
  const balance = balanceDue(order);
  const open = order.status !== "cancelled";
  const bostaShipment = order.shippingProvider === "Bosta" && order.trackingNumber ? order.trackingNumber : null;
  const canCreateBosta = shippingApiConfigured() && nextStatuses.includes("shipped") && !bostaShipment;
  let districts: BostaDistrict[] = [];
  let districtError = "";
  if (canCreateBosta) {
    try {
      districts = await getBostaDistricts(a.governorate);
    } catch (err) {
      districtError = err instanceof Error ? err.message : "Could not load Bosta districts.";
    }
  }
  const guessedDistrict = matchDistrict(districts, a.area, a.city);
  const codDefault = settings.balanceOnDelivery ? balance : 0;

  return (
    <div>
      <Link href="/admin/orders" className="label draw-underline">
        Orders
      </Link>
      <div className="mt-6">
        <PageTitle
          kicker={formatDate(order.createdAt)}
          title={order.id}
          action={
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={order.status} />
              <PaymentBadge status={order.paymentStatus} />
              <span className="label text-hardwood">deposit via {order.paymentMethod.replace("_", " ")}</span>
              <a href={`/${order.locale}/orders/${order.id}?t=${order.publicToken}`} target="_blank" rel="noreferrer" className="label draw-underline">
                Customer view ↗
              </a>
            </div>
          }
        />
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-12">
          <section>
            <h2 className="font-serif text-2xl">Pieces</h2>
            <ul className="mt-4 divide-y divide-hardwood/20 border-y border-hardwood/20">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="h-14 w-11 shrink-0 object-cover" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${item.productSlug}`} className="font-serif text-lg draw-underline">
                      {item.name}
                    </Link>
                    <p className="text-sm text-hardwood">
                      {item.collection} · {money(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <p>{money(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 ms-auto max-w-xs space-y-1 text-sm">
              <Row label="Subtotal" value={money(order.subtotal)} />
              {order.discount > 0 ? <Row label={`Discount${order.couponCode ? ` · ${order.couponCode}` : ""}`} value={`− ${money(order.discount)}`} /> : null}
              <Row label="Delivery" value={money(order.shippingFee)} />
              {order.tax > 0 ? <Row label="VAT" value={money(order.tax)} /> : null}
              <div className="flex justify-between border-t border-hardwood/25 pt-2 font-serif text-xl">
                <dt>Total</dt>
                <dd>{money(order.total)}</dd>
              </div>
              <Row label={`Deposit · ${order.depositPercent}%`} value={money(order.depositAmount)} />
              <Row label="Paid so far" value={money(order.amountPaid)} />
              <Row label={settings.balanceOnDelivery ? "Balance on delivery" : "Balance before shipping"} value={money(balanceAfterDeposit(order))} />
            </dl>
            <p className="mt-2 text-xs text-hardwood">
              Stock: {order.stockState}
              {order.expiresAt ? ` · reservation expires ${formatDate(order.expiresAt)}` : ""}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl">Fulfilment</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {nextStatuses.length === 0 ? <p className="text-sm text-hardwood">This order is closed.</p> : null}
              {nextStatuses.includes("confirmed") && !depositOk ? (
                <p className="w-full border border-hardwood/25 p-4 text-sm text-hardwood">
                  Awaiting the {order.depositPercent}% deposit — <strong className="text-charcoal">{money(depositLeft)}</strong> still due. Record it under
                  Payment and the order confirms itself.
                  {order.expiresAt ? ` Hold expires ${formatDate(order.expiresAt)}.` : ""}
                </p>
              ) : null}
              {nextStatuses.includes("confirmed") && depositOk ? (
                <OrderActionForm action={orderTransitionAction} id={order.id} to="confirmed" label="Confirm order" hint="Commits stock and emails the customer." />
              ) : null}
              {nextStatuses.includes("processing") ? (
                <OrderActionForm action={orderTransitionAction} id={order.id} to="processing" label="Start preparing" />
              ) : null}
              {canCreateBosta && districts.length > 0 ? (
                <OrderActionForm
                  action={createBostaShipmentAction}
                  id={order.id}
                  label="Create Bosta shipment"
                  hint={`Books a real Bosta pickup, saves the tracking number and moves the order to shipped.${
                    guessedDistrict ? ` District matched: ${guessedDistrict.districtName}.` : " Pick the district."
                  }`}
                  confirm={`Create a live Bosta shipment for ${order.id}? A courier will be booked to collect it.`}
                  fields={[
                    {
                      name: "districtId",
                      type: "select",
                      label: `Bosta district · ${governorateName(a.governorate, "en")} (customer wrote: ${[a.area, a.city].filter(Boolean).join(", ")})`,
                      defaultValue: guessedDistrict?.districtId ?? "",
                      options: [
                        { value: "", label: "— Choose district —" },
                        ...districts.map((d) => ({
                          value: d.districtId,
                          label: d.zoneName === d.districtName ? d.districtName : `${d.zoneName} — ${d.districtName}`,
                        })),
                      ],
                    },
                    {
                      name: "size",
                      type: "select",
                      label: "Package size",
                      defaultValue: "LARGE",
                      options: bostaSizes.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() })),
                    },
                    {
                      name: "cod",
                      type: "number",
                      step: "0.01",
                      min: "0",
                      label: `Cash to collect on delivery (${order.currency}) · Bosta max ${BOSTA_MAX_COD}`,
                      defaultValue: String(codDefault),
                    },
                    { name: "notes", label: "Note for the courier", defaultValue: "Fragile furniture — please call before arriving." },
                    { name: "allowToOpenPackage", type: "checkbox", label: "Customer may open the package before paying", defaultValue: "on" },
                    { name: "notify", type: "checkbox", label: "Email the customer that it has shipped", defaultValue: "on" },
                  ]}
                />
              ) : null}
              {nextStatuses.includes("shipped") ? (
                <OrderActionForm
                  action={orderTransitionAction}
                  id={order.id}
                  to="shipped"
                  label={canCreateBosta ? "Mark shipped manually" : "Mark shipped"}
                  fields={[
                    { name: "shippingProvider", label: "Courier", placeholder: shippingApiConfigured() ? "Bosta" : "Bosta / studio van", defaultValue: order.shippingProvider ?? "" },
                    { name: "trackingNumber", label: "Tracking number", defaultValue: order.trackingNumber ?? "" },
                    { name: "trackingUrl", label: "Tracking URL", defaultValue: order.trackingUrl ?? "" },
                  ]}
                />
              ) : null}
              {nextStatuses.includes("delivered") ? (
                <OrderActionForm
                  action={orderTransitionAction}
                  id={order.id}
                  to="delivered"
                  label="Mark delivered"
                  hint={balance > 0 ? `${money(balance)} balance is still due.` : undefined}
                  fields={
                    balance > 0
                      ? [{ name: "collectBalance", type: "checkbox", label: `Balance of ${money(balance)} collected in cash on delivery`, defaultValue: settings.balanceOnDelivery ? "on" : "" }]
                      : []
                  }
                />
              ) : null}
              {nextStatuses.includes("cancelled") ? (
                <OrderActionForm
                  action={orderTransitionAction}
                  id={order.id}
                  to="cancelled"
                  label="Cancel order"
                  tone="danger"
                  confirm="Cancel this order? Reserved or committed stock returns to the studio."
                  fields={[{ name: "reason", label: "Reason (shown to the customer)", defaultValue: "" }]}
                />
              ) : null}
            </div>
            {!shippingApiConfigured() ? (
              <p className="mt-4 text-xs text-hardwood">
                Bosta is not connected. Enter tracking manually; once <code>BOSTA_API_KEY</code> is set a “Create shipment” button appears here.
              </p>
            ) : null}
            {districtError ? <p className="mt-4 text-sm text-burgundy">{districtError}</p> : null}
            {bostaShipment ? (
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border border-hardwood/25 p-4 text-sm">
                <span>
                  <span className="label">Bosta</span> <strong className="ms-2 font-normal">{bostaShipment}</strong>
                </span>
                {order.trackingUrl ? (
                  <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="label draw-underline">
                    Track ↗
                  </a>
                ) : null}
                <a href={`/admin/orders/${order.id}/label`} target="_blank" rel="noreferrer" className="label draw-underline">
                  Print label ↗
                </a>
                {shippingApiConfigured() && order.status === "shipped" ? (
                  <OrderActionForm action={syncBostaAction} id={order.id} label="Refresh from Bosta" hint="Pulls the latest courier status into the timeline." />
                ) : null}
              </div>
            ) : null}
          </section>

          <section>
            <h2 className="font-serif text-2xl">Payment</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {open && !depositOk ? (
                <OrderActionForm
                  action={orderPaymentAction}
                  id={order.id}
                  hidden={{ kind: "deposit" }}
                  label="Record deposit"
                  hint={`Enter what was received. Once ${money(order.depositAmount)} is covered the order confirms, stock is committed, and the customer gets a receipt.`}
                  fields={[
                    { name: "amount", type: "number", step: "0.01", min: "0", label: `Amount received (${order.currency})`, defaultValue: String(depositLeft) },
                    { name: "method", type: "select", label: "Received by", defaultValue: order.paymentMethod, options: methodOptions },
                    { name: "reference", label: "Reference (transfer no. / receipt)", defaultValue: "" },
                    { name: "note", label: "Note", defaultValue: "" },
                  ]}
                />
              ) : null}
              {open && depositOk && balance > 0 ? (
                <OrderActionForm
                  action={orderPaymentAction}
                  id={order.id}
                  hidden={{ kind: "balance" }}
                  label="Record balance"
                  hint={`${money(balance)} still due. Emails a receipt when recorded.`}
                  fields={[
                    { name: "amount", type: "number", step: "0.01", min: "0", label: `Amount received (${order.currency})`, defaultValue: String(balance) },
                    { name: "method", type: "select", label: "Received by", defaultValue: settings.balanceOnDelivery ? "cash" : order.paymentMethod, options: methodOptions },
                    { name: "reference", label: "Reference (transfer no. / receipt)", defaultValue: "" },
                    { name: "note", label: "Note", defaultValue: "" },
                  ]}
                />
              ) : null}
              {order.amountPaid > 0 ? (
                <OrderActionForm
                  action={orderPaymentAction}
                  id={order.id}
                  hidden={{ kind: "refund" }}
                  label="Record refund"
                  tone="danger"
                  fields={[
                    { name: "amount", type: "number", step: "0.01", min: "0", label: `Amount refunded (${order.currency})`, defaultValue: String(order.amountPaid) },
                    { name: "method", type: "select", label: "Refunded by", defaultValue: "bank_transfer", options: methodOptions },
                    { name: "reference", label: "Reference", defaultValue: "" },
                    { name: "note", label: "Note", defaultValue: "" },
                  ]}
                />
              ) : null}
              {order.status === "pending" && order.paymentMethod === "card" && order.amountPaid === 0 ? (
                <OrderActionForm action={orderPaymentFailedAction} id={order.id} label="Card payment failed" tone="danger" confirm="Cancel this order and release its stock?" />
              ) : null}
            </div>
            {order.payments.length > 0 ? (
              <ol className="mt-4 divide-y divide-hardwood/20 border-y border-hardwood/20 text-sm">
                {order.payments.map((payment) => (
                  <li key={payment.id} className="grid gap-1 py-3 md:grid-cols-[11rem_6rem_8rem_1fr_auto]">
                    <span className="text-hardwood">{formatDate(payment.createdAt)}</span>
                    <span className="label">{payment.kind}</span>
                    <span className="text-hardwood">{payment.method.replace("_", " ")}</span>
                    <span className="text-hardwood">
                      {[payment.reference, payment.note].filter(Boolean).join(" · ") || "—"}
                    </span>
                    <span className={payment.amount < 0 ? "text-burgundy" : ""}>{money(payment.amount)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-hardwood">No payments recorded yet.</p>
            )}
            <dl className="mt-4 space-y-1 text-sm text-hardwood">
              {order.paidAt ? <Row label="Paid in full at" value={formatDate(order.paidAt)} /> : null}
              {order.paymentProvider ? <Row label="Provider" value={order.paymentProvider} /> : null}
              {order.providerTransactionId ? <Row label="Provider reference" value={order.providerTransactionId} /> : null}
            </dl>
          </section>

          <section>
            <h2 className="font-serif text-2xl">Timeline</h2>
            <ol className="mt-4 divide-y divide-hardwood/20 border-y border-hardwood/20 text-sm">
              {order.events.map((event) => (
                <li key={event.id} className="grid gap-1 py-3 md:grid-cols-[11rem_11rem_1fr]">
                  <span className="text-hardwood">{formatDate(event.createdAt)}</span>
                  <span className="label break-all">{event.type.replace(":", " · ")}</span>
                  <span>
                    {event.message || "—"}
                    <span className="ms-2 text-xs text-hardwood">· {event.actor}</span>
                  </span>
                </li>
              ))}
            </ol>
            <form action={orderNoteAction} className="mt-4 flex gap-2">
              <input type="hidden" name="id" value={order.id} />
              <input name="message" placeholder="Add an internal note to the timeline" className="mt-0 flex-1" required />
              <Button tone="quiet">Add</Button>
            </form>
          </section>
        </div>

        <aside className="space-y-10">
          <section>
            <h2 className="font-serif text-2xl">Customer</h2>
            <p className="mt-3">
              {customer ? (
                <Link href={`/admin/customers/${customer.id}`} className="draw-underline">
                  {order.customerName}
                </Link>
              ) : (
                <>
                  {order.customerName} <span className="text-xs text-hardwood">· guest</span>
                </>
              )}
            </p>
            <p className="text-sm text-hardwood">
              <a href={`mailto:${order.customerEmail}?subject=${order.id}`} className="draw-underline">
                {order.customerEmail}
              </a>
            </p>
            <p className="text-sm text-hardwood">
              <a href={`tel:${order.customerPhone}`} className="draw-underline">
                {order.customerPhone}
              </a>
              {a.phone2 ? ` · ${a.phone2}` : ""}
            </p>
            <p className="mt-1 text-xs text-hardwood">Locale: {order.locale}</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl">Delivery address</h2>
            <p className="mt-3 text-sm leading-relaxed">
              {a.name}
              <br />
              {[a.street, a.building, a.floor && `Floor ${a.floor}`, a.apartment && `Apt ${a.apartment}`].filter(Boolean).join(", ")}
              <br />
              {[a.area, a.city, governorateName(a.governorate, "en")].filter(Boolean).join(", ")}
              {a.landmark ? (
                <>
                  <br />
                  <span className="text-hardwood">{a.landmark}</span>
                </>
              ) : null}
            </p>
            {order.notes ? (
              <p className="mt-3 border-l-2 border-hardwood/30 ps-3 text-sm text-hardwood">{order.notes}</p>
            ) : null}
          </section>

          <section>
            <h2 className="font-serif text-2xl">Details</h2>
            <form action={orderMetaAction} className="mt-4 space-y-4">
              <input type="hidden" name="id" value={order.id} />
              <Field label="Customer phone">
                <input name="customerPhone" defaultValue={order.customerPhone} />
              </Field>
              <Field label="Courier">
                <input name="shippingProvider" defaultValue={order.shippingProvider ?? ""} />
              </Field>
              <Field label="Tracking number">
                <input name="trackingNumber" defaultValue={order.trackingNumber ?? ""} />
              </Field>
              <Field label="Tracking URL">
                <input name="trackingUrl" defaultValue={order.trackingUrl ?? ""} />
              </Field>
              <Field label="Internal notes">
                <textarea name="adminNotes" rows={4} defaultValue={order.adminNotes} className="resize-none" />
              </Field>
              <Button>Save details</Button>
            </form>
          </section>

          <section>
            <h2 className="font-serif text-2xl">Email</h2>
            <form action={resendOrderEmailAction} className="mt-4">
              <input type="hidden" name="id" value={order.id} />
              <Button tone="quiet">Resend current status email</Button>
            </form>
            <p className="mt-2 text-xs text-hardwood">
              Sent mail appears under <Link href="/admin/mail" className="draw-underline">Mail</Link>.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-hardwood">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
