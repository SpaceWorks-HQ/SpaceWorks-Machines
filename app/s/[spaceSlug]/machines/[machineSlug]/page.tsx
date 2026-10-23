import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { loadPublicMachineView } from "@/lib/views/app__s__spaceSlug__machines__machineSlug__page";
import { MachineStatusChip } from "@/components/machines/MachineStatusChip";
import { MachineSpecs } from "@/components/public/MachineSpecs";
import { buttonClasses } from "@/components/ui/button";

type Props = { params: Promise<{ spaceSlug: string; machineSlug: string }> };
const kindLabels = { MANUAL: "Manual", SOP: "Standard operating procedure", SAFETY: "Safety", DATASHEET: "Datasheet", OTHER: "Other" };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { space, machine } = await loadPublicMachineView({ params });
  return {
    title: machine.name,
    description: machine.description.slice(0, 160) || `${machine.name} at ${space.name}: specifications, photos and documents.`,
    robots: { index: space.visibility === "PUBLIC", follow: space.visibility === "PUBLIC" },
  };
}

export default async function PublicMachinePage({ params }: Props) {
  const { space, machine, photos, documents, requestHref } = await loadPublicMachineView({ params });
  return <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-10 px-4 py-10 sm:px-6 lg:py-16">
    <header className="flex flex-col gap-4">
      <Link href={`/s/${space.slug}/machines`} className="text-body-ui text-accent-text underline underline-offset-4">Back to machines</Link>
      <p className="text-body-ui text-ink-secondary">{machine.type.name}</p>
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="break-words text-display-m text-ink">{machine.name}</h1>
        <MachineStatusChip status={machine.status} />
      </div>
      {machine.description ? <p className="max-w-[720px] whitespace-pre-wrap text-body-l text-ink-secondary">{machine.description}</p> : null}
    </header>
    {requestHref ? <div><Link href={requestHref} className={buttonClasses({})}>Request a job</Link></div> : null}
    {photos.length ? <section aria-labelledby="photos" className="flex flex-col gap-5">
      <h2 id="photos" className="text-h1 text-ink">Photos</h2>
      <ol className="grid gap-5 sm:grid-cols-2">
        {photos.map((photo, index) => <li key={photo.url}>
          <a href={photo.url} className="relative block aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-surface" aria-label={`Open photo ${index + 1}: ${photo.alt || machine.name}`}>
            <Image src={photo.url} alt={photo.alt || `${machine.name}, photo ${index + 1}`} fill unoptimized sizes="(min-width:640px) 50vw, 100vw" className="object-contain" />
          </a>
        </li>)}
      </ol>
    </section> : null}
    <section aria-labelledby="specifications" className="flex max-w-[720px] flex-col gap-5">
      <h2 id="specifications" className="text-h1 text-ink">Specifications</h2>
      {machine.specs.length ? <MachineSpecs rows={machine.specs} /> : <p className="text-body-ui text-ink-secondary">No public specifications listed.</p>}
    </section>
    <section aria-labelledby="documents" className="flex flex-col gap-5">
      <h2 id="documents" className="text-h1 text-ink">Documents</h2>
      {documents.length ? <ul className="flex flex-col divide-y divide-line">
        {documents.map((document) => <li key={document.id} className="flex flex-wrap items-center gap-3 py-3">
          <a href={document.url} className="break-words text-body-ui text-accent-text underline underline-offset-4">{document.title}</a>
          <span className="text-caption text-ink-secondary">{kindLabels[document.kind]}</span>
        </li>)}
      </ul> : <p className="text-body-ui text-ink-secondary">No public documents listed.</p>}
    </section>
  </div>;
}
