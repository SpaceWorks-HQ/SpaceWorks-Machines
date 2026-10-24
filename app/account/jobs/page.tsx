import Link from "next/link";
import type { Metadata } from "next";
import { loadAccountJobsView } from "@/lib/views/app__account__jobs__page";
import { EmptyState, Card } from "@/components/ui/display";
import { JobStatusChip } from "@/components/jobs/JobStatusChip";
import { jobNumber } from "@/lib/jobs/presentation";

export const metadata: Metadata = { title: "Your jobs", robots: { index: false, follow: false } };
export default async function AccountJobsPage() {
  const { jobs } = await loadAccountJobsView();
  return <section className="flex flex-col gap-5"><h2 className="text-h1">Your jobs</h2>{jobs.length ? <ul className="flex flex-col gap-3">{jobs.map((j) => <li key={j.id}><Card className="flex flex-wrap items-center justify-between gap-3"><div><Link className="text-title text-accent-text underline" href={`/s/${j.space.slug}/jobs/${j.number}`}>{jobNumber(j.number)} · {j.title}</Link><p className="text-caption text-ink-secondary">{j.space.name}</p></div><JobStatusChip status={j.status} /></Card></li>)}</ul> : <EmptyState title="No jobs yet" patch>Your requests from every space will appear here.</EmptyState>}</section>;
}
