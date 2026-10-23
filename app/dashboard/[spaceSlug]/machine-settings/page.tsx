import type { Metadata } from "next";
import { loadMachineSettingsView } from "@/lib/views/app__dashboard__spaceSlug__machine-settings__page";
import { SpacePageHeader } from "@/components/dashboard/space/SpacePageHeader";
import { NewTypeDialog } from "@/components/machine-settings/NewTypeDialog";
import { TypesTable } from "@/components/machine-settings/TypesTable";

export const metadata: Metadata = { title: "Machine settings", robots: { index: false, follow: false } };

export default async function MachineSettingsPage({ params }: { params: Promise<{ spaceSlug: string }> }) {
  const view = await loadMachineSettingsView({ params });
  return <div className="flex flex-col gap-7 pb-4">
    <SpacePageHeader space={view.space} title="Machine settings" description="Types, specifications, file policies and queue rules."
      actions={view.canManage ? <NewTypeDialog spaceSlug={view.space.slug} types={view.types} /> : null} />
    <TypesTable spaceSlug={view.space.slug} types={view.types} canManage={view.canManage} />
  </div>;
}
