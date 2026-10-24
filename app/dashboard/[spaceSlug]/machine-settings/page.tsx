import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
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
    {view.canManage ? <nav aria-label="Job configuration" className="flex flex-wrap gap-3"><Link className={buttonClasses({ variant: "secondary" })} href={`/dashboard/${view.space.slug}/machine-settings/jobs`}>Job settings</Link><Link className={buttonClasses({ variant: "secondary" })} href={`/dashboard/${view.space.slug}/machine-settings/pricing`}>Pricing rules</Link><Link className={buttonClasses({ variant: "secondary" })} href={`/dashboard/${view.space.slug}/machine-settings/printers`}>Printer connections</Link></nav> : null}
    <TypesTable spaceSlug={view.space.slug} types={view.types} canManage={view.canManage} />
  </div>;
}
