import "server-only";

/**
 * Handler for the `webhooks.deliver` queue job. Phase 5 builds the sender: sign the payload
 * (X-SpaceWorks-Signature), POST it, record the attempt and schedule retries. Until then deliveries stay PENDING.
 */
export async function deliverWebhook(deliveryId: string): Promise<void> {
  // TODO(phase 5): send the delivery, record the response and schedule retries. Nothing is marked yet.
  void deliveryId;
}
