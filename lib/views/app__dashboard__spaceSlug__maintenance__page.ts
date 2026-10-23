import { loadComingSoonView } from "@/lib/comingSoon";

/** Maintenance: a real route behind its capability; the content arrives in a later phase. */
export async function loadMaintenanceView({ params }: { params: Promise<{ spaceSlug: string }> }) {
  return loadComingSoonView(params, ["maintenance.view"]);
}
