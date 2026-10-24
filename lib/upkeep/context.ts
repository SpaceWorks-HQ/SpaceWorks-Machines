import "server-only";
import type { Machine, Prisma } from "@prisma/client";
import { changeMachineStatus } from "@/lib/machines/machines";

export class UpkeepNotFoundError extends Error {
  constructor() { super("Space not found."); }
}
export class UpkeepError extends Error {}

export type Actor = { spaceId: string; actorId: string | null };

export function text(value: string | undefined, max: number) {
  return (value ?? "").trim().slice(0, max);
}

export function required(value: string | undefined, max: number, message: string) {
  const clean = text(value, max);
  if (!clean) throw new UpkeepError(message);
  return clean;
}

/** Row-lock a machine of this space (machine before schedule/downtime rows, as the job services do). */
export async function lockMachine(tx: Prisma.TransactionClient, spaceId: string, machineId: string): Promise<Machine> {
  const rows = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Machine" WHERE "spaceId" = ${spaceId} AND "id" = ${machineId} FOR UPDATE`;
  if (!rows[0]) throw new UpkeepNotFoundError();
  return tx.machine.findUniqueOrThrow({ where: { spaceId_id: { spaceId, id: machineId } } });
}

/** Set a machine's status unless it is retired or already there; returns webhook delivery ids. */
export async function setStatus(tx: Prisma.TransactionClient, actor: Actor, machine: Machine, status: Machine["status"], note: string) {
  if (machine.retiredAt || machine.status === status) return [];
  return (await changeMachineStatus(tx, { spaceId: actor.spaceId, actorId: actor.actorId, machineId: machine.id, status, note })).webhookDeliveryIds;
}

export async function upkeepSettings(tx: Prisma.TransactionClient, spaceId: string) {
  const settings = await tx.spaceJobSettings.findUnique({ where: { spaceId }, select: { maintenanceReminderDays: true, warrantyReminderDays: true } });
  return { maintenanceReminderDays: settings?.maintenanceReminderDays ?? 3, warrantyReminderDays: settings?.warrantyReminderDays ?? 30 };
}

export function day(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new UpkeepError("Enter a valid date.");
  return date;
}
