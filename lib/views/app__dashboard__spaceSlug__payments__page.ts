import { loadComingSoonView } from "@/lib/comingSoon";

/** Payments: a real route behind its capability; the content arrives in a later phase. */
export async function loadPaymentsView({ params }: { params: Promise<{ spaceSlug: string }> }) {
  return loadComingSoonView(params, ["payments.view"]);
}
