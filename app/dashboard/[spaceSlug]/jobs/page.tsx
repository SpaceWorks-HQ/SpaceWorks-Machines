import Link from "next/link";
import type { Metadata } from "next";
import { loadJobsView } from "@/lib/views/app__dashboard__spaceSlug__jobs__page";
import { SpacePageHeader } from "@/components/dashboard/space/SpacePageHeader";
import { EmptyState, Card, Chip } from "@/components/ui/display";
import { JOB_STATUSES, STATUS_LABELS, jobNumber, words } from "@/lib/jobs/presentation";
import { JobFilters } from "@/components/jobs/JobFilters";
import { CreateJobDialog } from "@/components/jobs/CreateJobDialog";

export const metadata: Metadata = { title: "Jobs", robots: { index: false, follow: false } };
export default async function JobsPage(props: Parameters<typeof loadJobsView>[0]) {
  const view = await loadJobsView(props);
  return <div className="flex flex-col gap-7"><SpacePageHeader space={view.space} title="Jobs" description="Review requests, run machines and hand finished jobs back to their makers."
    actions={view.intake ? <CreateJobDialog space={view.space} intake={view.intake} /> : null} />
    <JobFilters types={view.types} machines={view.machines} filters={view.filters} />
    {view.jobs.length ? <>
      <section aria-labelledby="collection"><h2 id="collection" className="mb-3 text-title">Awaiting collection</h2>{view.jobs.some((j) => j.status === "COMPLETED") ? <ul className="flex flex-wrap gap-3">{view.jobs.filter((j) => j.status === "COMPLETED").map((j) => <li key={j.id}><Link className="text-accent-text underline" href={`/dashboard/${view.space.slug}/jobs/${j.number}`}>{jobNumber(j.number)} · {j.title}</Link></li>)}</ul> : <p className="text-ink-secondary">No jobs awaiting collection.</p>}</section>
      <div aria-label="Jobs board" className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">{JOB_STATUSES.map((status) => <section key={status} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3">
        <h2 className="flex justify-between gap-2 text-title">{STATUS_LABELS[status]} <span>{view.jobs.filter((j) => j.status === status).length}</span></h2>
        {view.jobs.filter((j) => j.status === status).map((j) => <Card key={j.id}><Link className="text-label text-accent-text underline" href={`/dashboard/${view.space.slug}/jobs/${j.number}`}>{jobNumber(j.number)} · {j.title}</Link>
          <p className="mt-2 text-body-ui text-ink-secondary">{j.requester.name || j.requester.email}</p><p className="text-caption text-ink-secondary">{j.type.name}{j.assignedMachine ? ` · ${j.assignedMachine.name}` : ""}</p><div className="mt-2"><Chip size="sm">{words(j.paymentState)}</Chip></div></Card>)}
      </section>)}</div>
    </> : <EmptyState title="No jobs to show" patch={!Object.values(view.filters).some(Boolean)}>New requests will appear here. Try clearing filters if you expected a job.</EmptyState>}
  </div>;
}
