#!/usr/bin/env node
// Demo data for local QA: platform admin, team accounts and spaces in every review state.
//
//   DEMO_PASSWORD=<12+ chars> [DEMO_MFA_SECRET=<base32> MFA_ENCRYPTION_KEY=<base64 32 bytes>] npm run db:seed-demo
//
// Every account uses DEMO_PASSWORD. With DEMO_MFA_SECRET the platform admin also has two-step
// verification on (the super-admin panel requires it). Idempotent; never runs in production.
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

if (process.env.NODE_ENV === "production") throw new Error("seed-demo never runs in production.");
const password = process.env.DEMO_PASSWORD ?? "";
if (password.length < 12) throw new Error("Set DEMO_PASSWORD (at least 12 characters).");

function encryptMfaSecret(secret) {
  const key = Buffer.from(process.env.MFA_ENCRYPTION_KEY ?? "", "base64");
  if (key.length !== 32) throw new Error("MFA_ENCRYPTION_KEY must be base64 for a 32-byte key.");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash(password, 12);
const now = new Date();

async function user(email, name, extra = {}) {
  return prisma.user.upsert({
    where: { email },
    create: { email, name, emailVerified: now, passwordHash, ...extra },
    update: { name, emailVerified: now, passwordHash, ...extra },
  });
}

const mfa = process.env.DEMO_MFA_SECRET ? { mfaSecretEncrypted: encryptMfaSecret(process.env.DEMO_MFA_SECRET), mfaEnabledAt: now } : {};
const admin = await user("admin@demo.test", "Shaan Shoukath", { isSuperAdmin: true, ...mfa });
// Staff need an authenticator before the dashboard opens; with DEMO_MFA_SECRET the demo staff share one.
const owner = await user("owner@demo.test", "Abhiram NJ", mfa);
const machines = await user("machines@demo.test", "Abdul Samad MJ", mfa);
const viewer = await user("viewer@demo.test", "Ajzal P", mfa);
const maker = await user("maker@demo.test", "Anin Arafath");
const applicant = await user("applicant@demo.test", "Midlaj C");

const base = { country: "IN", timezone: "Asia/Kolkata", currency: "INR", region: "Kerala" };
const spaces = [
  {
    slug: "tinkerspace", name: "Tinkerspace", status: "ACTIVE", city: "Kochi", joinPolicy: "APPROVAL", visibility: "PUBLIC",
    description: "A shared workshop with 3D printers, a laser cutter and a CNC router, open to makers around Kochi.",
    contactEmail: "hello@tinkerspace.demo.test",
    team: [[owner, "OWNER"], [machines, "MACHINE_MANAGER"], [viewer, "VIEWER"], [maker, "MEMBER"]],
    reviews: [["SUBMITTED", owner, null], ["APPROVED", admin, null]],
  },
  {
    slug: "kunj-lab", name: "Kunj Lab", status: "PENDING_REVIEW", city: "Kozhikode",
    description: "A college fab lab with printers and a vinyl cutter for students and alumni, open on weekends.",
    contactEmail: "office@kunj-lab.demo.test", team: [[applicant, "OWNER"]],
    reviews: [["SUBMITTED", applicant, null]],
  },
  {
    slug: "ideologists", name: "Ideologists Workshop", status: "CHANGES_REQUESTED", city: "Thrissur",
    description: "A workshop for people who turn ideas into prototypes, with mentoring and an annual showcase.",
    contactEmail: "hello@ideologists.demo.test", team: [[applicant, "OWNER"]],
    reviews: [["SUBMITTED", applicant, null], ["CHANGES_REQUESTED", admin, "Please add your full address and a contact phone number."]],
  },
  {
    slug: "spaceworks", name: "SpaceWorks Makerspace", status: "SUSPENDED", city: "Alappuzha",
    description: "Build nights, a laser cutter and a resin printer for makers around Alappuzha.",
    contactEmail: "hello@spaceworks.demo.test", team: [[owner, "OWNER"]],
    reviews: [["SUBMITTED", owner, null], ["APPROVED", admin, null], ["SUSPENDED", admin, "Suspended while we confirm the workshop's insurance cover."]],
  },
];

for (const { team, reviews, ...data } of spaces) {
  const existing = await prisma.space.findUnique({ where: { slug: data.slug }, select: { id: true } });
  if (existing) continue;
  const space = await prisma.space.create({ data: { ...base, ...data } });
  for (const [member, role] of team) await prisma.spaceMember.create({ data: { spaceId: space.id, userId: member.id, role } });
  let at = Date.now() - reviews.length * 3_600_000;
  for (const [action, actor, reason] of reviews) {
    await prisma.spaceReview.create({ data: { spaceId: space.id, action, actorUserId: actor.id, reason, createdAt: new Date((at += 3_600_000)) } });
  }
}

// Older demo installs predate the Machines UI. Keep its public journey available on every seed run.
const tinkerspace = await prisma.space.update({
  where: { slug: "tinkerspace" }, data: { status: "ACTIVE", visibility: "PUBLIC" },
});
await prisma.machineType.upsert({
  where: { spaceId_slug: { spaceId: tinkerspace.id, slug: "workshop-equipment" } },
  create: {
    spaceId: tinkerspace.id, slug: "workshop-equipment", name: "Workshop equipment", icon: "wrench",
    filePolicy: { extensions: ["pdf", "txt"], maxBytes: 20 * 1024 * 1024, maxFiles: 5, required: false },
  },
  update: { archivedAt: null },
});

await prisma.$disconnect();
console.log(`seed-demo: ${spaces.length} spaces and 6 accounts (admin, owner, machines, viewer, maker, applicant @demo.test) ready.`);
