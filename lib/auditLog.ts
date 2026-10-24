import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

import { AUDIT_AREAS, type AuditArea } from "./auditAreas";

/** The space audit log: filters shared by the page and its CSV export. */
export type AuditFilters = { actor?: string; area?: string; from?: string; to?: string };

const day = (value?: string) => value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : null;

export function auditWhere(spaceId: string, filters: AuditFilters): Prisma.AuditEventWhereInput {
  const area = filters.area && filters.area in AUDIT_AREAS ? filters.area as AuditArea : null;
  const from = day(filters.from), to = day(filters.to);
  return {
    spaceId,
    ...(filters.actor ? { actorUserId: filters.actor.slice(0, 64) } : {}),
    ...(area ? { action: area === "settings" ? "SPACE_SETTINGS_CHANGED" : { startsWith: `${area}.` } } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: new Date(to.getTime() + 86_400_000) } : {}) } } : {}),
  };
}

export async function auditRows(spaceId: string, filters: AuditFilters, take: number) {
  const rows = await prisma.auditEvent.findMany({ where: auditWhere(spaceId, filters), orderBy: { createdAt: "desc" }, take,
    select: { id: true, action: true, targetType: true, targetId: true, metadata: true, createdAt: true, actor: { select: { name: true, email: true } } } });
  return rows.map((row) => ({ id: row.id, action: row.action, target: [row.targetType, row.targetId].filter(Boolean).join(" "), createdAt: row.createdAt.toISOString(),
    actor: row.actor ? row.actor.name || row.actor.email || "Someone" : "System",
    detail: row.metadata && typeof row.metadata === "object" ? Object.entries(row.metadata as Record<string, unknown>).map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`).join("; ").slice(0, 300) : "" }));
}
