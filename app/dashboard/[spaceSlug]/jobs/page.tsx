import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { loadJobsView } from "@/lib/views/app__dashboard__spaceSlug__jobs__page";
import { ComingSoon } from "@/components/dashboard/space/ComingSoon";

export const metadata: Metadata = { title: "Jobs", robots: { index: false, follow: false } };

export default async function JobsPage({ params }: { params: Promise<{ spaceSlug: string }> }) {
  const { space } = await loadJobsView({ params });
  return (
    <ComingSoon space={space} title="Jobs" description="Requests from makers, the queue, and what is running now." icon={<ClipboardList />} heading="Jobs arrive in a later release">
      Job requests with file checks, the queue, review, pricing and payment are coming in Phase 3.
    </ComingSoon>
  );
}
