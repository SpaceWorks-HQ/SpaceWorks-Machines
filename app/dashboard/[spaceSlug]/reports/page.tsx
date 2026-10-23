import type { Metadata } from "next";
import { ChartColumn } from "lucide-react";
import { loadReportsView } from "@/lib/views/app__dashboard__spaceSlug__reports__page";
import { ComingSoon } from "@/components/dashboard/space/ComingSoon";

export const metadata: Metadata = { title: "Reports", robots: { index: false, follow: false } };

export default async function ReportsPage({ params }: { params: Promise<{ spaceSlug: string }> }) {
  const { space } = await loadReportsView({ params });
  return (
    <ComingSoon space={space} title="Reports" description="Usage, jobs, money and upkeep over time." icon={<ChartColumn />} heading="Reports arrive in a later release">
      Machine usage, job and money reports with exports are coming in Phase 4.
    </ComingSoon>
  );
}
