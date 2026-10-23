import { loadComingSoonView } from "@/lib/comingSoon";

/** Jobs: a real route behind its capability; the content arrives in a later phase. */
export async function loadJobsView({ params }: { params: Promise<{ spaceSlug: string }> }) {
  return loadComingSoonView(params, ["jobs.view"]);
}
