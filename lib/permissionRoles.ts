import type { SpaceMember, SpaceRole, SpaceStatus } from "@prisma/client";

/** Every staff role, most senior first. MEMBER (a maker) is not staff. */
export const STAFF_ROLES = ["OWNER", "MANAGER", "MACHINE_MANAGER", "OPERATOR", "TECHNICIAN", "VIEWER"] as const satisfies readonly SpaceRole[];
export type StaffRole = (typeof STAFF_ROLES)[number];
const ALL_STAFF = STAFF_ROLES;
const SPACE_MANAGERS = ["OWNER", "MANAGER"] as const;
const MACHINE_MANAGERS = ["OWNER", "MANAGER", "MACHINE_MANAGER"] as const;

/**
 * What each space role may do. Space managers (OWNER, MANAGER) run the whole makerspace: settings, money,
 * people and integrations. Machine managers run the machine side: machines, consumables, maintenance,
 * machine settings and printers. Operators run jobs; technicians keep machines working; viewers read.
 * MEMBER (a maker) holds no staff capability. Unknown capabilities grant nothing.
 */
export const CAPABILITIES = {
  "space.view": ALL_STAFF,
  "space.settings": SPACE_MANAGERS,
  "space.delete": ["OWNER"],
  "team.manage": SPACE_MANAGERS,
  "members.manage": SPACE_MANAGERS,
  "machines.view": ALL_STAFF,
  "machines.manage": MACHINE_MANAGERS,
  /** Set a machine's status by hand (idle, reserved, maintenance, offline) with a note. */
  "machines.status": [...MACHINE_MANAGERS, "OPERATOR", "TECHNICIAN"],
  "machine.settings": MACHINE_MANAGERS,
  "printers.manage": MACHINE_MANAGERS,
  "jobs.view": ALL_STAFF,
  "jobs.review": [...MACHINE_MANAGERS, "OPERATOR"],
  "jobs.operate": [...MACHINE_MANAGERS, "OPERATOR"],
  "consumables.manage": [...MACHINE_MANAGERS, "OPERATOR"],
  "maintenance.view": ALL_STAFF,
  "maintenance.manage": [...MACHINE_MANAGERS, "TECHNICIAN"],
  "payments.view": SPACE_MANAGERS,
  "payments.manage": SPACE_MANAGERS,
  "payments.settings": SPACE_MANAGERS,
  "reports.view": [...MACHINE_MANAGERS, "VIEWER"],
  "audit.view": MACHINE_MANAGERS,
  "integrations.manage": SPACE_MANAGERS,
} as const satisfies Record<string, readonly SpaceRole[]>;

export type Capability = keyof typeof CAPABILITIES;

export function can(role: SpaceRole | null | undefined, capability: Capability): boolean {
  return role != null && (CAPABILITIES[capability] as readonly SpaceRole[]).includes(role);
}

export function isStaffRole(role: SpaceRole | null | undefined): role is StaffRole {
  return role != null && role !== "MEMBER";
}

/**
 * Capabilities a suspended or archived space keeps: reading what is there and settling money already
 * received. Everything else waits until the space is active again.
 */
export const SUSPENDED_CAPABILITIES: ReadonlySet<Capability> = new Set<Capability>(["space.view", "machines.view", "jobs.view", "maintenance.view", "payments.view", "payments.manage", "reports.view", "audit.view"]);

/** Whether a space in this status may use a capability at all. Before approval: none. */
export function spaceAllows(status: SpaceStatus, capability: Capability): boolean {
  if (status === "ACTIVE") return true;
  if (status === "SUSPENDED" || status === "ARCHIVED") return SUSPENDED_CAPABILITIES.has(capability);
  return false;
}

/** Seniority, only for who may change whose role. Machine managers outrank operators, technicians and viewers. */
const roleRank: Record<SpaceRole, number> = { MEMBER: 0, VIEWER: 1, TECHNICIAN: 2, OPERATOR: 2, MACHINE_MANAGER: 3, MANAGER: 4, OWNER: 5 };

export function hasRoleAtLeast(role: SpaceRole, min: SpaceRole): boolean {
  return roleRank[role] >= roleRank[min];
}

export function isSpaceManager(role: SpaceRole | null | undefined): boolean {
  return role === "OWNER" || role === "MANAGER";
}

/** Owners manage everyone; space managers manage every role below theirs, never owners or other managers. */
export function canManageTeamMember(actor: SpaceRole, target: SpaceRole): boolean {
  if (actor === "OWNER") return true;
  return actor === "MANAGER" && roleRank[target] < roleRank.MANAGER;
}

/** The roles an actor may hand out (on an invite or a role change). */
export function assignableRoles(actor: SpaceRole): SpaceRole[] {
  if (actor === "OWNER") return [...STAFF_ROLES, "MEMBER"];
  if (actor === "MANAGER") return ["MACHINE_MANAGER", "OPERATOR", "TECHNICIAN", "VIEWER", "MEMBER"];
  return [];
}

export function canManageTeam(m: Pick<SpaceMember, "role"> | null): boolean {
  return m != null && can(m.role, "team.manage");
}

export function canDeleteSpace(m: Pick<SpaceMember, "role"> | null): boolean {
  return m != null && can(m.role, "space.delete");
}

export const ROLE_LABELS: Record<SpaceRole, string> = {
  OWNER: "Owner",
  MANAGER: "Space manager",
  MACHINE_MANAGER: "Machine manager",
  OPERATOR: "Operator",
  TECHNICIAN: "Technician",
  VIEWER: "Viewer",
  MEMBER: "Maker",
};

export const ROLE_DESCRIPTIONS: Record<SpaceRole, string> = {
  OWNER: "Everything, including the team, owners and deleting the space.",
  MANAGER: "The whole makerspace: settings, payments, join policy, notifications, branding and the team.",
  MACHINE_MANAGER: "The machine side: machines, file and queue rules, pricing per machine, consumables, maintenance and printers.",
  OPERATOR: "Reviews and runs jobs, and records consumables.",
  TECHNICIAN: "Maintenance, faults and service history.",
  VIEWER: "Reads machines, jobs, maintenance and reports.",
  MEMBER: "A maker: submits jobs and pays for them.",
};

export function roleLabel(role: SpaceRole) {
  return ROLE_LABELS[role];
}

/** Staff (any role except MEMBER) must use an authenticator app; makers and super admins need not. */
export const STAFF_AUTHENTICATOR_SETUP = "/account/security?authenticator=required";
export const STAFF_AUTHENTICATOR_MESSAGE = "Your role in this space needs an authenticator app. Set one up under Account, Security, then try again.";
