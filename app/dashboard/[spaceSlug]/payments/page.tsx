import Link from "next/link";
import type { Metadata } from "next";
import { loadPaymentsView } from "@/lib/views/app__dashboard__spaceSlug__payments__page";
import { SpacePageHeader } from "@/components/dashboard/space/SpacePageHeader";
import { PaymentBlock } from "@/components/jobs/PaymentBlock";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, Dropdown } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/display";
import { jobNumber, words } from "@/lib/jobs/presentation";

export const metadata: Metadata = { title: "Payments", robots: { index: false, follow: false } };
export default async function PaymentsPage(props: Parameters<typeof loadPaymentsView>[0]) {
  const view = await loadPaymentsView(props);
  const query = new URLSearchParams(Object.entries(view.filters).filter(([, v]) => typeof v === "string"));
  return <div className="flex flex-col gap-6"><SpacePageHeader space={view.space} title="Payments" description="Payments and refunds for this space's jobs." actions={<a className={buttonClasses({ variant: "secondary" })} href={`/api/spaces/${view.space.slug}/payments/export?${query}`}>Export CSV</a>} />
    <form className="flex flex-wrap items-end gap-3"><Field label="Status"><Dropdown name="status" defaultValue={view.filters.status ?? ""}><option value="">All statuses</option>{["PENDING", "PAID", "FAILED", "CANCELLED", "WAIVED"].map((v) => <option key={v} value={v}>{words(v)}</option>)}</Dropdown></Field>
      <Field label="Method"><Dropdown name="method" defaultValue={view.filters.method ?? ""}><option value="">All methods</option>{["RAZORPAY", "STRIPE", "CASH", "BANK_TRANSFER", "UPI", "CARD_TERMINAL", "OTHER"].map((v) => <option key={v} value={v}>{words(v)}</option>)}</Dropdown></Field><Button type="submit" variant="secondary">Apply filters</Button></form>
    {view.payments.length ? view.payments.map((p) => <section key={p.id} className="flex flex-col gap-2"><Link className="text-label text-accent-text underline" href={`/dashboard/${view.space.slug}/jobs/${p.job.number}`}>{jobNumber(p.job.number)} · {p.job.title}</Link><PaymentBlock payments={[p]} spaceSlug={view.space.slug} manage={view.canManage} methods={view.offlineMethods} userId={view.userId} /></section>) : <EmptyState title="No payments to show">Payments appear when a paid job is approved or completed.</EmptyState>}
  </div>;
}
