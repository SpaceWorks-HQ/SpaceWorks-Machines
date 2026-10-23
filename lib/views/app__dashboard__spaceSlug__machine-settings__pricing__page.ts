import { prisma } from "@/lib/db";
import { requireSpaceCapability } from "@/lib/permissions";

export async function loadPricingRulesView({ params }: { params: Promise<{ spaceSlug: string }> }) {
  const { space } = await requireSpaceCapability((await params).spaceSlug, "machine.settings");
  const [profile, rules, types, machines] = await Promise.all([
    prisma.space.findUniqueOrThrow({ where: { id: space.id }, select: { logoUrl: true, currency: true } }),
    prisma.pricingRule.findMany({ where: { spaceId: space.id }, orderBy: { createdAt: "asc" } }),
    prisma.machineType.findMany({ where: { spaceId: space.id }, select: { id: true, name: true } }),
    prisma.machine.findMany({ where: { spaceId: space.id }, select: { id: true, name: true, typeId: true } }),
  ]);
  return { space: { ...space, ...profile }, types, machines, rules: rules.map((r) => ({ ...r, materialRate: r.materialRate.toString(), createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })) };
}
