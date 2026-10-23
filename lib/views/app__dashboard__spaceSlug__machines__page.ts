import { loadComingSoonView } from "@/lib/comingSoon";

/** Machines: a real route behind its capability; the content arrives in a later phase. */
export async function loadMachinesView({ params }: { params: Promise<{ spaceSlug: string }> }) {
  return loadComingSoonView(params, ["machines.view"]);
}
