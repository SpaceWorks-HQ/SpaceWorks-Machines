import { loadComingSoonView } from "@/lib/comingSoon";

/** Machine settings: a real route behind its capability; the content arrives in a later phase. */
export async function loadMachineSettingsView({ params }: { params: Promise<{ spaceSlug: string }> }) {
  return loadComingSoonView(params, ["machine.settings"]);
}
