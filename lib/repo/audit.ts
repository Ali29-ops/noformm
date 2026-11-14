import { desc } from "drizzle-orm";
import { getDb } from "../db";
import { auditLog } from "../db/schema";

export async function audit(
  actor: string,
  action: string,
  entity: string,
  entityId = "",
  data?: Record<string, unknown>,
) {
  const db = await getDb();
  await db.insert(auditLog).values({ actor, action, entity, entityId, data });
}

export async function recentAudit(limit = 100) {
  const db = await getDb();
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt), desc(auditLog.id)).limit(limit);
}
