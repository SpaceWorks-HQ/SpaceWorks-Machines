import "server-only";

import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/email/message";
import type { ChatRefs } from "./message";

/** Maintenance, fault and warranty alerts: machine name and a link to the machine's upkeep, never people. */
export async function upkeepMessage(spaceId: string, space: { name: string; slug: string }, event: "maintenance-due" | "fault-reported" | "warranty-expiring", refs: ChatRefs) {
  if (!refs.machineId) return null;
  const machine = await prisma.machine.findFirst({ where: { id: refs.machineId, spaceId }, select: { name: true, slug: true } });
  if (!machine) return null;
  const link = absoluteUrl(event === "fault-reported" ? `/dashboard/${space.slug}/maintenance/faults` : `/dashboard/${space.slug}/machines/${machine.slug}`);
  if (event === "fault-reported") {
    const fault = refs.faultId ? await prisma.faultReport.findFirst({ where: { id: refs.faultId, spaceId }, select: { number: true, severity: true } }) : null;
    return fault ? `${space.name}: fault F-${String(fault.number).padStart(4, "0")} (${fault.severity.toLowerCase()}) reported on ${machine.name}.\n${link}` : null;
  }
  if (event === "warranty-expiring") return `${space.name}: the warranty for ${machine.name} is expiring.\n${link}`;
  const schedule = refs.scheduleId ? await prisma.maintenanceSchedule.findFirst({ where: { id: refs.scheduleId, spaceId }, select: { title: true } }) : null;
  return schedule ? `${space.name}: ${schedule.title} on ${machine.name} is due.\n${link}` : null;
}
