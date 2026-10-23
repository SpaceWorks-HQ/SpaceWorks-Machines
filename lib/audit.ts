import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Write a deliberately minimal audit record. Callers must not pass PII,
 * passwords, reset links, check-in tokens, or registration answers in metadata.
 */
export async function recordAuditEvent(params: {
  action: string;
  actorUserId?: string | null;
  spaceId?: string | null;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, string | number | boolean | null>;
  client?: Prisma.TransactionClient;
}) {
  const client = params.client ?? prisma;
  return client.auditEvent.create({
    data: {
      action: params.action,
      actorUserId: params.actorUserId ?? null,
      spaceId: params.spaceId ?? null,
      targetType: params.targetType ?? null,
      targetId: params.targetId ?? null,
      metadata: params.metadata ?? undefined,
    },
  });
}

/**
 * For autosaving editors: record the event unless the same actor already has
 * one for the same action and target within `windowMs`.
 */
export async function recordThrottledAuditEvent(params: Parameters<typeof recordAuditEvent>[0] & { windowMs: number }) {
  const { windowMs, ...event } = params;
  const recent = await (event.client ?? prisma).auditEvent.findFirst({
    where: {
      action: event.action,
      actorUserId: event.actorUserId ?? null,
      targetType: event.targetType ?? null,
      targetId: event.targetId ?? null,
      createdAt: { gt: new Date(Date.now() - windowMs) },
    },
    select: { id: true },
  });
  if (recent) return null;
  return recordAuditEvent(event);
}

/**
 * Every settings change in a space writes one of these, inside the change's transaction when there is one.
 * `area` names the settings page ("space.profile", "space.payments", "machine.queue"...); `fields` lists
 * the field names that changed, never their values (some are secrets).
 */
export async function recordSettingsChange(params: {
  spaceId: string;
  actorUserId: string;
  area: string;
  fields?: readonly string[];
  client?: Prisma.TransactionClient;
}) {
  return recordAuditEvent({
    action: "SPACE_SETTINGS_CHANGED",
    actorUserId: params.actorUserId,
    spaceId: params.spaceId,
    targetType: "Space",
    targetId: params.spaceId,
    metadata: { area: params.area, ...(params.fields?.length ? { fields: params.fields.slice(0, 20).join(",") } : {}) },
    client: params.client,
  });
}
