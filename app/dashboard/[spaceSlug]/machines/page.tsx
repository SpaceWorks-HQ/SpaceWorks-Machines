import type { Metadata } from "next";
import { Cog } from "lucide-react";
import { loadMachinesView } from "@/lib/views/app__dashboard__spaceSlug__machines__page";
import { ComingSoon } from "@/components/dashboard/space/ComingSoon";

export const metadata: Metadata = { title: "Machines", robots: { index: false, follow: false } };

export default async function MachinesPage({ params }: { params: Promise<{ spaceSlug: string }> }) {
  const { space } = await loadMachinesView({ params });
  return (
    <ComingSoon space={space} title="Machines" description="Every machine in the space, its status and what it can do." icon={<Cog />} heading="Machines arrive in the next release">
      Machine types with their own fields, machine records, photos, status and public machine pages are coming in Phase 2.
    </ComingSoon>
  );
}
