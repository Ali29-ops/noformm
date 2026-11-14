import { desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { emails, type EmailRow } from "../db/schema";
import { nowIso, prefixedId } from "../ids";

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  template?: string;
  relatedType?: string;
  relatedId?: string;
};

function transportConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

async function deliver(row: Pick<EmailRow, "to" | "subject" | "html" | "text">) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [row.to],
      subject: row.subject,
      html: row.html,
      text: row.text || undefined,
      reply_to: process.env.EMAIL_REPLY_TO || undefined,
    }),
  });
  const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!response.ok) throw new Error(body.message || `Resend responded ${response.status}`);
  return body.id ?? "";
}

/**
 * Persists the email in the outbox and attempts delivery. Never throws — a
 * failed email must not roll back an order.
 */
export async function sendEmail(input: OutgoingEmail) {
  const db = await getDb();
  const id = prefixedId("EM");
  const base = {
    id,
    to: input.to.trim().toLowerCase(),
    subject: input.subject,
    html: input.html,
    text: input.text ?? "",
    template: input.template ?? "",
    relatedType: input.relatedType ?? null,
    relatedId: input.relatedId ?? null,
  };
  if (!base.to) return null;
  if (!transportConfigured()) {
    await db.insert(emails).values({ ...base, status: "logged", attempts: 0 });
    if (process.env.NODE_ENV !== "production") {
      console.log(`[mail:logged] → ${base.to} · ${base.subject}`);
    }
    return id;
  }
  await db.insert(emails).values({ ...base, status: "queued", attempts: 0 });
  await attemptDelivery(id);
  return id;
}

export async function attemptDelivery(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(emails).where(eq(emails.id, id));
  if (!row) return;
  if (!transportConfigured()) {
    await db.update(emails).set({ status: "logged" }).where(eq(emails.id, id));
    return;
  }
  try {
    const providerId = await deliver(row);
    await db
      .update(emails)
      .set({ status: "sent", providerId, sentAt: nowIso(), attempts: row.attempts + 1, error: null })
      .where(eq(emails.id, id));
  } catch (error) {
    await db
      .update(emails)
      .set({
        status: "failed",
        attempts: row.attempts + 1,
        error: error instanceof Error ? error.message : String(error),
      })
      .where(eq(emails.id, id));
  }
}

export async function listEmails(limit = 200) {
  const db = await getDb();
  return db.select().from(emails).orderBy(desc(emails.createdAt)).limit(limit);
}

export async function getEmail(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(emails).where(eq(emails.id, id));
  return row ?? null;
}

export function emailTransportStatus() {
  return transportConfigured() ? ("resend" as const) : ("outbox-only" as const);
}
