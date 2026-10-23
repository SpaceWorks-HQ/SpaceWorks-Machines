import type { Metadata } from "next";
import { Package } from "lucide-react";
import { loadConsumablesView } from "@/lib/views/app__dashboard__spaceSlug__consumables__page";
import { ComingSoon } from "@/components/dashboard/space/ComingSoon";

export const metadata: Metadata = { title: "Consumables", robots: { index: false, follow: false } };

export default async function ConsumablesPage({ params }: { params: Promise<{ spaceSlug: string }> }) {
  const { space } = await loadConsumablesView({ params });
  return (
    <ComingSoon space={space} title="Consumables" description="Filament, sheets, resin and everything else the machines use." icon={<Package />} heading="Consumables arrive in the next release">
      Consumable pools per machine type, stock levels and deduction per job are coming in Phases 2 and 3.
    </ComingSoon>
  );
}
