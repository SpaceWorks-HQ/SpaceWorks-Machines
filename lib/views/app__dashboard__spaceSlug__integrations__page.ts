import { loadComingSoonView } from "@/lib/comingSoon";

/** Integrations: a real route behind its capability; the content arrives in a later phase. */
export async function loadIntegrationsView({ params }: { params: Promise<{ spaceSlug: string }> }) {
  return loadComingSoonView(params, ["integrations.manage", "printers.manage"]);
}
