import { prisma } from "@/lib/db";
import { requireSpaceCapability } from "@/lib/permissions";
import { can, spaceAllows } from "@/lib/permissionRoles";
import { TYPE_SUMMARY, typeSummary } from "@/lib/machines/queries";

export async function loadMachineSettingsView({ params }: { params: Promise<{ spaceSlug: string }> }) {
  const { spaceSlug } = await params;
  const { space, membership } = await requireSpaceCapability(spaceSlug, "machines.view");
  const [profile, rows] = await Promise.all([
    prisma.space.findUniqueOrThrow({ where: { id: space.id }, select: { logoUrl: true } }),
    prisma.machineType.findMany({ where: { spaceId: space.id }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { ...TYPE_SUMMARY, _count: { select: { machines: { where: { spaceId: space.id } } } } } }),
  ]);
  return { space: { ...space, ...profile },
    canManage: can(membership.role, "machine.settings") && spaceAllows(space.status, "machine.settings"),
    types: rows.map((row) => ({ ...typeSummary(row), machineCount: row._count.machines })) };
}
