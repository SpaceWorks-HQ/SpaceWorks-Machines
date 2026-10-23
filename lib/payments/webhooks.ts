import "server-only";

import type { PaymentProvider, Prisma } from "@prisma/client";
import { recordAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { credentialsOf, GATEWAYS } from "./config";
import type { GatewayEvent } from "./gateway";

export type WebhookOutcome = { status: number; body: string };

/**
 * What a verified, first-seen gateway event does. Phase 1 has no payments yet, so every event is recorded
 * as unmatched; Phase 3 settles job payments and refunds here, inside the same transaction as the
 * idempotency row.
 */
async function applyGatewayEvent(tx: Prisma.TransactionClient, spaceId: string, provider: PaymentProvider, event: GatewayEvent) {
  await recordAuditEvent({ action: "PAYMENT_WEBHOOK_UNMATCHED", actorUserId: null, spaceId, targetType: "Webhook", targetId: event.eventId.slice(0, 120), metadata: { provider, type: event.type }, client: tx });
}

/**
 * Verify and record one webhook. The space is found by the unguessable code in the URL; the body must carry
 * a valid signature for that space's own secret; each provider event id is applied once
 * (ProcessedWebhookEvent), however often the gateway retries.
 */
export async function handleWebhook(provider: Exclude<PaymentProvider, "OFFLINE">, code: string, rawBody: string, headers: Headers): Promise<WebhookOutcome> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(code)) return { status: 404, body: "Not found" };
  const settings = await prisma.spacePaymentSettings.findUnique({ where: { webhookPublicCode: code } });
  if (!settings || settings.provider !== provider) return { status: 404, body: "Not found" };
  const credentials = credentialsOf(settings);
  const gateway = GATEWAYS[provider];
  if (!credentials || !gateway.verifyWebhook(credentials, rawBody, headers)) return { status: 401, body: "Invalid signature" };

  let event: GatewayEvent;
  try {
    event = gateway.parseEvent(rawBody, headers);
  } catch {
    return { status: 400, body: "Invalid payload" };
  }
  if (event.type === "ignored" || !event.eventId) return { status: 200, body: "Ignored" };

  const applied = await prisma.$transaction(async (tx) => {
    const fresh = await tx.processedWebhookEvent.createMany({ data: [{ provider, eventId: event.eventId.slice(0, 200), spaceId: settings.spaceId }], skipDuplicates: true });
    if (fresh.count === 0) return false;
    await applyGatewayEvent(tx, settings.spaceId, provider, event);
    return true;
  });
  return { status: 200, body: applied ? "OK" : "Duplicate" };
}
