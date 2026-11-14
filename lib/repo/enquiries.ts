import { desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { enquiries, type EnquiryRow } from "../db/schema";
import { nowIso, prefixedId } from "../ids";

export type Enquiry = EnquiryRow;

export async function listEnquiries() {
  const db = await getDb();
  return db.select().from(enquiries).orderBy(desc(enquiries.createdAt));
}

export async function getEnquiry(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(enquiries).where(eq(enquiries.id, id));
  return row ?? null;
}

export async function addEnquiry(input: {
  name: string;
  email: string;
  phone?: string;
  collection: string;
  piece: string;
  message: string;
  locale: string;
}) {
  const db = await getDb();
  const id = prefixedId("EQ");
  await db.insert(enquiries).values({
    id,
    name: input.name,
    email: input.email.trim().toLowerCase(),
    phone: input.phone ?? "",
    collection: input.collection,
    piece: input.piece,
    message: input.message,
    locale: input.locale,
  });
  return (await getEnquiry(id))!;
}

export async function updateEnquiry(
  id: string,
  patch: Partial<Pick<EnquiryRow, "status" | "adminNotes">>,
) {
  const db = await getDb();
  const set: Partial<EnquiryRow> = { ...patch, updatedAt: nowIso() };
  if (patch.status === "replied") set.repliedAt = nowIso();
  await db.update(enquiries).set(set).where(eq(enquiries.id, id));
}

export async function countNewEnquiries() {
  const rows = await listEnquiries();
  return rows.filter((r) => r.status === "new").length;
}
