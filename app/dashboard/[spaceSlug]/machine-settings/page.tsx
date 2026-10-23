import type { Metadata } from "next";
import { SlidersHorizontal } from "lucide-react";
import { loadMachineSettingsView } from "@/lib/views/app__dashboard__spaceSlug__machine-settings__page";
import { ComingSoon } from "@/components/dashboard/space/ComingSoon";

export const metadata: Metadata = { title: "Machine settings", robots: { index: false, follow: false } };

export default async function MachineSettingsPage({ params }: { params: Promise<{ spaceSlug: string }> }) {
  const { space } = await loadMachineSettingsView({ params });
  return (
    <ComingSoon space={space} title="Machine settings" description="Machine types and fields, file rules, queue rules and pricing per machine." icon={<SlidersHorizontal />} heading="Machine settings arrive in the next release">
      Machine managers will set machine types and their fields, file policies, queue rules and pricing per type or machine here, starting in Phase 2.
    </ComingSoon>
  );
}
