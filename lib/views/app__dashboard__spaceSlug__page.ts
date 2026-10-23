import { prisma } from "@/lib/db";
import { can, requireSpaceCapability } from "@/lib/permissions";

/** The space's home: status, people at a glance and the first steps still to do. */
export async function loadSpaceOverviewView({ params }: { params: Promise<{ spaceSlug: string }> }) {
  const { spaceSlug } = await params;
  const { space, membership } = await requireSpaceCapability(spaceSlug, "space.view");
  const now = new Date();
  const [details, staffCount, makers, pending, openInvites] = await Promise.all([
    prisma.space.findUniqueOrThrow({ where: { id: space.id }, select: { name: true, slug: true, status: true, logoUrl: true, description: true, contactEmail: true } }),
    prisma.spaceMember.count({ where: { spaceId: space.id, role: { not: "MEMBER" } } }),
    prisma.spaceMember.count({ where: { spaceId: space.id, role: "MEMBER", status: "ACTIVE" } }),
    prisma.spaceMember.count({ where: { spaceId: space.id, role: "MEMBER", status: "PENDING" } }),
    prisma.spaceInvite.count({ where: { spaceId: space.id, usedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } }),
  ]);
  const base = `/dashboard/${details.slug}`;
  const steps = [
    { id: "logo", label: "Add your logo", description: "It appears on your public page and in emails to makers.", done: Boolean(details.logoUrl), href: `${base}/settings`, visible: can(membership.role, "space.settings") },
    { id: "team", label: "Invite your staff", description: "Machine managers, operators and technicians who help run the machines.", done: staffCount > 1, href: `${base}/team`, visible: can(membership.role, "team.manage") },
    { id: "machines", label: "Add your machines", description: "Printers, laser cutters, CNC and the rest. Arrives in the next release.", done: false, href: `${base}/machines`, visible: can(membership.role, "machines.manage") },
  ].filter((step) => step.visible);
  return { space: details, role: membership.role, staffCount, makers, pending, openInvites, steps };
}
