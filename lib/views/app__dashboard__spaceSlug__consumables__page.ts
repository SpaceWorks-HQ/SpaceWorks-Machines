import { loadComingSoonView } from "@/lib/comingSoon";

/** Consumables: a real route behind its capability; the content arrives in a later phase. */
export async function loadConsumablesView({ params }: { params: Promise<{ spaceSlug: string }> }) {
  return loadComingSoonView(params, ["machines.view"]);
}
