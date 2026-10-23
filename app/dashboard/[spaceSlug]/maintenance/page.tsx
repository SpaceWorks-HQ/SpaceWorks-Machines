import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { loadMaintenanceView } from "@/lib/views/app__dashboard__spaceSlug__maintenance__page";
import { ComingSoon } from "@/components/dashboard/space/ComingSoon";

export const metadata: Metadata = { title: "Maintenance", robots: { index: false, follow: false } };

export default async function MaintenancePage({ params }: { params: Promise<{ spaceSlug: string }> }) {
  const { space } = await loadMaintenanceView({ params });
  return (
    <ComingSoon space={space} title="Maintenance" description="Service schedules, faults, downtime and warranty." icon={<Wrench />} heading="Maintenance arrives in a later release">
      Schedules by time or usage, fault reports, downtime, warranty and service history are coming in Phase 4.
    </ComingSoon>
  );
}
