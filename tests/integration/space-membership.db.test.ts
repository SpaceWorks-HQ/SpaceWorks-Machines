import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const identity = vi.hoisted(() => ({ current: { id: "", email: "" } }));
vi.mock("@/lib/auth", () => ({ auth: async () => (identity.current.id ? { user: identity.current, authenticatedAt: Date.now() } : null) }));
vi.mock("@/lib/actionRateLimit", () => ({ isActionRateLimited: async () => false }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { prisma } from "@/lib/db";
import { joinSpace, leaveSpace } from "@/app/actions/account-spaces";
import { decideMember, removeSpaceMember, updateSpaceRole } from "@/app/actions/team";
import { createSpaceInvite } from "@/app/actions/space-invites";
import { setJoinPolicy } from "@/app/actions/space";
import { acceptSpaceInviteToken } from "@/lib/inviteAcceptance";
import { spaceFixtures } from "../helpers/spaceFixtures";

const f = spaceFixtures("members");
type Person = Awaited<ReturnType<typeof f.person>>;
let owner: Person, manager: Person, machineManager: Person, maker: Person, other: Person;
const as = (person: Person) => { identity.current = { id: person.id, email: person.email! }; };
const row = (spaceId: string, userId: string) => prisma.spaceMember.findUnique({ where: { userId_spaceId: { userId, spaceId } } });
const outbox = (spaceId: string, kind: string) => prisma.$queryRaw<Array<{ payload: Record<string, unknown> }>>`
  SELECT "payload" FROM "OutboxMessage" WHERE "kind" = ${kind} AND "payload"->>'spaceId' = ${spaceId}`;

beforeAll(async () => {
  [owner, manager, machineManager, maker, other] = await Promise.all(
    ["Owner", "Manager", "Machine Manager", "Maker", "Other"].map((name) => f.person(name, { mfaEnabledAt: new Date() })),
  );
});

afterAll(async () => {
  await f.cleanup();
  await prisma.$disconnect();
});

describe.sequential("joining a space as a maker", () => {
  it("joins an open space at once, and only once", async () => {
    const space = await f.space({ joinPolicy: "OPEN" });
    as(maker);
    expect(await joinSpace({ spaceSlug: space.slug })).toEqual({ ok: true, data: { status: "joined" } });
    expect(await row(space.id, maker.id)).toMatchObject({ role: "MEMBER", status: "ACTIVE" });
    expect(await joinSpace({ spaceSlug: space.slug })).toMatchObject({ ok: false, error: "You're already part of this space." });
  });

  it("waits for a space manager under the approval policy, who approves with an email and a chat alert", async () => {
    const space = await f.space({ joinPolicy: "APPROVAL" });
    await f.member(space.id, manager.id, "MANAGER");
    await prisma.chatChannel.create({ data: { spaceId: space.id, kind: "SLACK", name: "Desk", events: ["join-request", "member-joined"], configEncrypted: "x" } });
    as(maker);
    expect(await joinSpace({ spaceSlug: space.slug })).toEqual({ ok: true, data: { status: "requested" } });
    const pending = (await row(space.id, maker.id))!;
    expect(pending.status).toBe("PENDING");
    expect((await outbox(space.id, "chat-notice")).map((m) => m.payload.event)).toEqual(["join-request"]);

    as(machineManager);
    await f.member(space.id, machineManager.id, "MACHINE_MANAGER");
    expect(await decideMember({ spaceSlug: space.slug, memberId: pending.id, decision: "approve" })).toMatchObject({ ok: false, error: "Your role doesn't allow this." });
    as(manager);
    expect(await decideMember({ spaceSlug: space.slug, memberId: pending.id, decision: "approve" })).toEqual({ ok: true });
    expect(await row(space.id, maker.id)).toMatchObject({ status: "ACTIVE" });
    expect((await outbox(space.id, "member-notice")).map((m) => m.payload.notice)).toEqual(["approved"]);
    expect((await outbox(space.id, "chat-notice")).map((m) => m.payload.event).sort()).toEqual(["join-request", "member-joined"]);
  });

  it("refuses invite-only spaces, full spaces and blocked makers", async () => {
    const inviteOnly = await f.space({ joinPolicy: "INVITE_ONLY" });
    const full = await f.space({ joinPolicy: "OPEN", memberLimit: 1 });
    await f.member(full.id, other.id, "MEMBER");
    as(maker);
    expect(await joinSpace({ spaceSlug: inviteOnly.slug })).toMatchObject({ ok: false, error: "This space takes makers by invite only." });
    expect(await joinSpace({ spaceSlug: full.slug })).toMatchObject({ ok: false, error: "This space isn't taking new makers right now." });

    const open = await f.space({ joinPolicy: "OPEN" });
    await f.member(open.id, manager.id, "MANAGER");
    as(maker);
    await joinSpace({ spaceSlug: open.slug });
    as(manager);
    const joined = (await row(open.id, maker.id))!;
    expect(await decideMember({ spaceSlug: open.slug, memberId: joined.id, decision: "block" })).toEqual({ ok: true });
    as(maker);
    expect(await leaveSpace({ spaceSlug: open.slug })).toMatchObject({ ok: false });
    expect(await joinSpace({ spaceSlug: open.slug })).toMatchObject({ ok: false, error: expect.stringContaining("can't join") });
  });

  it("lets a space manager change the join policy, audited", async () => {
    const space = await f.space({ joinPolicy: "OPEN" });
    await f.member(space.id, manager.id, "MANAGER");
    await f.member(space.id, machineManager.id, "MACHINE_MANAGER");
    as(machineManager);
    expect((await setJoinPolicy({ spaceSlug: space.slug, joinPolicy: "INVITE_ONLY" })).ok).toBe(false);
    as(manager);
    expect(await setJoinPolicy({ spaceSlug: space.slug, joinPolicy: "INVITE_ONLY" })).toEqual({ ok: true });
    const audit = await prisma.auditEvent.findFirstOrThrow({ where: { spaceId: space.id, action: "SPACE_SETTINGS_CHANGED" } });
    expect(audit.metadata).toMatchObject({ area: "space.joining", fields: "joinPolicy" });
  });
});

describe.sequential("staff roles and invites", () => {
  it("lets a space manager hand out machine roles but never owner or manager", async () => {
    const space = await f.space();
    await f.member(space.id, owner.id, "OWNER");
    await f.member(space.id, manager.id, "MANAGER");
    as(manager);
    expect((await createSpaceInvite({ spaceSlug: space.slug, role: "MANAGER" })).ok).toBe(false);
    const invite = await createSpaceInvite({ spaceSlug: space.slug, role: "MACHINE_MANAGER", email: machineManager.email });
    expect(invite.ok).toBe(true);
    expect((await outbox(space.id, "member-notice")).map((m) => m.payload.notice)).toEqual(["invited"]);

    const token = invite.ok ? invite.data!.token : "";
    expect(await acceptSpaceInviteToken(token, { id: other.id, email: other.email, emailVerified: true })).toEqual({ ok: false, reason: "wrong-account" });
    expect(await acceptSpaceInviteToken(token, { id: machineManager.id, email: machineManager.email, emailVerified: true })).toEqual({ ok: true, href: `/dashboard/${space.slug}` });
    expect(await row(space.id, machineManager.id)).toMatchObject({ role: "MACHINE_MANAGER", status: "ACTIVE" });

    expect(await updateSpaceRole({ spaceSlug: space.slug, targetUserId: owner.id, role: "VIEWER" })).toMatchObject({ ok: false });
    expect(await updateSpaceRole({ spaceSlug: space.slug, targetUserId: machineManager.id, role: "OPERATOR" })).toEqual({ ok: true });
    expect(await updateSpaceRole({ spaceSlug: space.slug, targetUserId: machineManager.id, role: "MANAGER" })).toMatchObject({ ok: false });
    expect(await removeSpaceMember({ spaceSlug: space.slug, targetUserId: owner.id })).toMatchObject({ ok: false });
  });

  it("upgrades a maker who accepts a staff invite, and respects the staff limit", async () => {
    const space = await f.space({ staffLimit: 2 });
    await f.member(space.id, owner.id, "OWNER");
    await f.member(space.id, maker.id, "MEMBER");
    as(owner);
    const first = await createSpaceInvite({ spaceSlug: space.slug, role: "OPERATOR" });
    const second = await createSpaceInvite({ spaceSlug: space.slug, role: "TECHNICIAN" });
    expect(await acceptSpaceInviteToken(first.ok ? first.data!.token : "", { id: maker.id, email: maker.email, emailVerified: true })).toEqual({ ok: true, href: `/dashboard/${space.slug}` });
    expect(await row(space.id, maker.id)).toMatchObject({ role: "OPERATOR" });
    expect(await acceptSpaceInviteToken(second.ok ? second.data!.token : "", { id: other.id, email: other.email, emailVerified: true })).toEqual({ ok: false, reason: "full" });
    expect(await prisma.spaceInvite.findFirstOrThrow({ where: { spaceId: space.id, role: "TECHNICIAN" } })).toMatchObject({ usedAt: null });
  });

  it("returns 'not found' to anyone outside the space, staff of another space included", async () => {
    const mine = await f.space();
    const theirs = await f.space();
    await f.member(mine.id, manager.id, "MANAGER");
    await f.member(theirs.id, other.id, "MEMBER");
    as(manager);
    expect(await setJoinPolicy({ spaceSlug: theirs.slug, joinPolicy: "OPEN" })).toEqual({ ok: false, error: "Space not found." });
    as(other);
    expect(await setJoinPolicy({ spaceSlug: theirs.slug, joinPolicy: "OPEN" })).toEqual({ ok: false, error: "Space not found." });
  });
});
