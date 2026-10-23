import "server-only";

import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/email/message";
import type { ChatEvent } from "./events";

/** Ids only, so nothing personal sits in the queue. Later phases add jobId, machineId and so on. */
export type ChatRefs = { memberId?: string };

/**
 * The plain-text alert for one event, built when it is sent. Null when the record has gone (the alert is
 * dropped). Names appear only when the channel asks for them.
 */
export async function chatMessage(spaceId: string, event: ChatEvent, refs: ChatRefs, includeNames: boolean): Promise<string | null> {
  const space = await prisma.space.findUnique({ where: { id: spaceId }, select: { name: true, slug: true } });
  if (!space || !refs.memberId) return null;
  const member = await prisma.spaceMember.findFirst({ where: { id: refs.memberId, spaceId }, select: { user: { select: { name: true } } } });
  if (!member && event !== "member-left") return null;
  const who = includeNames && member?.user.name ? member.user.name : "A maker";
  const line = (text: string) => `${space.name}: ${text}\n${absoluteUrl(`/dashboard/${space.slug}/team`)}`;
  if (event === "join-request") return line(`${who} asked to join. Review it:`);
  if (event === "member-joined") return line(`${who} joined.`);
  return line(`${includeNames && member?.user.name ? member.user.name : "A maker"} left.`);
}
