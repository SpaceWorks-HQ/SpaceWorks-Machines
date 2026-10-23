import { prisma } from "@/lib/db";
import { requireSpaceCapability } from "@/lib/permissions";
import { can, spaceAllows } from "@/lib/permissionRoles";
import { loadReports, reportRange } from "@/lib/reports/load";

type Props = { params: Promise<{ spaceSlug: string }>; searchParams: Promise<{ from?: string; to?: string }> };

/** Reports over a date range. Money appears only for roles that may see payments. */
export async function loadReportsView({ params, searchParams }: Props) {
  const { spaceSlug } = await params;
  const { space, membership } = await requireSpaceCapability(spaceSlug, "reports.view");
  const query = await searchParams;
  const range = reportRange(query.from, query.to);
  const [profile, reports] = await Promise.all([
    prisma.space.findUniqueOrThrow({ where: { id: space.id }, select: { logoUrl: true, timezone: true, currency: true, locale: true } }),
    loadReports(space.id, range.from, range.to),
  ]);
  const showMoney = can(membership.role, "payments.view") && spaceAllows(space.status, "payments.view");
  return { space: { ...space, ...profile }, range: { from: range.fromInput, to: range.toInput }, showMoney,
    reports: { ...reports, revenue: showMoney ? reports.revenue : null } };
}
