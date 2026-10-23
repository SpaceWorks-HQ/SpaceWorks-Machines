import { Cog, Globe, Mail, MapPin, Phone } from "lucide-react";
import { loadPublicSpacePage } from "@/lib/views/app__s__spaceSlug__page";
import { JoinSpaceCard } from "@/components/public/JoinSpaceCard";
import { EmptyState, SpaceLogo } from "@/components/ui/display";

export default async function PublicSpacePage({ params }: { params: Promise<{ spaceSlug: string }> }) {
  const { space, takingMakers, viewer } = await loadPublicSpacePage({ params });
  const place = [space.city, space.region, space.country].filter(Boolean).join(", ");
  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-12 px-4 py-10 sm:px-6 lg:py-16">
      <section aria-labelledby="space-name" className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex max-w-[720px] flex-col gap-5">
          <SpaceLogo name={space.name} src={space.logoUrl} size="xl" />
          <h1 id="space-name" className="text-display-m text-balance text-ink">{space.name}</h1>
          {space.description ? <p className="whitespace-pre-wrap text-body-l text-ink-secondary">{space.description}</p> : null}
          <JoinSpaceCard slug={space.slug} name={space.name} joinPolicy={space.joinPolicy} takingMakers={takingMakers} viewer={viewer} />
        </div>
        <dl className="flex shrink-0 flex-col gap-3 rounded-2xl border border-line bg-panel p-5 text-body-ui lg:w-[300px]">
          {place ? <div className="flex items-center gap-2.5"><dt><MapPin aria-label="Location" className="size-4 text-ink-muted" /></dt><dd>{place}</dd></div> : null}
          {space.contactEmail ? <div className="flex items-center gap-2.5"><dt><Mail aria-label="Email" className="size-4 text-ink-muted" /></dt><dd className="min-w-0 truncate"><a className="underline-offset-4 hover:underline" href={`mailto:${space.contactEmail}`}>{space.contactEmail}</a></dd></div> : null}
          {space.contactPhone ? <div className="flex items-center gap-2.5"><dt><Phone aria-label="Phone" className="size-4 text-ink-muted" /></dt><dd><a className="underline-offset-4 hover:underline" href={`tel:${space.contactPhone.replace(/\s/g, "")}`}>{space.contactPhone}</a></dd></div> : null}
          {space.website ? <div className="flex items-center gap-2.5"><dt><Globe aria-label="Website" className="size-4 text-ink-muted" /></dt><dd className="min-w-0 truncate"><a className="underline-offset-4 hover:underline" href={space.website} rel="noopener noreferrer" target="_blank">{space.website.replace(/^https?:\/\//, "")}</a></dd></div> : null}
        </dl>
      </section>

      <section aria-labelledby="machines" className="flex flex-col gap-6">
        <h2 id="machines" className="text-h1 text-ink">Machines</h2>
        <EmptyState icon={<Cog />} title="Machines are on their way">The machine catalogue, live status and job requests arrive in the next release.</EmptyState>
      </section>
    </div>
  );
}
