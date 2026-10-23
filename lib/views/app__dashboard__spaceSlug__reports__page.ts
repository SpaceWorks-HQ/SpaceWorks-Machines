import { loadComingSoonView } from "@/lib/comingSoon";

/** Reports: a real route behind its capability; the content arrives in a later phase. */
export async function loadReportsView({ params }: { params: Promise<{ spaceSlug: string }> }) {
  return loadComingSoonView(params, ["reports.view"]);
}
