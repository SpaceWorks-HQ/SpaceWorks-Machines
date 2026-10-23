import type { Metadata } from "next";
import { Plug } from "lucide-react";
import { loadIntegrationsView } from "@/lib/views/app__dashboard__spaceSlug__integrations__page";
import { ComingSoon } from "@/components/dashboard/space/ComingSoon";

export const metadata: Metadata = { title: "Integrations", robots: { index: false, follow: false } };

export default async function IntegrationsPage({ params }: { params: Promise<{ spaceSlug: string }> }) {
  const { space } = await loadIntegrationsView({ params });
  return (
    <ComingSoon space={space} title="Integrations" description="Printer connections, API keys and webhooks." icon={<Plug />} heading="Integrations arrive in a later release">
      Printer connections (manual and simulated first, then OctoPrint, Moonraker, Bambu and PrusaLink), API keys and outbound webhooks are coming in Phase 5.
    </ComingSoon>
  );
}
