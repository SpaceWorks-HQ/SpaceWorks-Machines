import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSpaceCapability } from "@/lib/permissions";
import { can, spaceAllows } from "@/lib/permissionRoles";
import { loadFullType } from "@/lib/machines/queries";

export async function loadMachineTypeView({ params }: { params: Promise<{ spaceSlug: string; typeSlug: string }> }) {
  const { spaceSlug, typeSlug } = await params;
  const { space, membership } = await requireSpaceCapability(spaceSlug, "machines.view");
  const type = await loadFullType(space.id, { slug: typeSlug });
  if (!type) notFound();
  const profile = await prisma.space.findUniqueOrThrow({ where: { id: space.id }, select: { logoUrl: true } });
  return { space: { ...space, ...profile }, type,
    canManage: can(membership.role, "machine.settings") && spaceAllows(space.status, "machine.settings") };
}
