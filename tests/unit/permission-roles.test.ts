import { describe, expect, it } from "vitest";
import type { SpaceRole } from "@prisma/client";
import { assignableRoles, can, CAPABILITIES, canManageTeamMember, isStaffRole, ROLE_LABELS, STAFF_ROLES, type Capability } from "@/lib/permissionRoles";

const ALL: SpaceRole[] = [...STAFF_ROLES, "MEMBER"];
const holders = (capability: Capability) => ALL.filter((role) => can(role, capability));

describe("space roles and capabilities", () => {
  it("splits the whole-space side from the machine side", () => {
    for (const capability of ["space.settings", "team.manage", "members.manage", "payments.settings", "payments.manage", "integrations.manage"] as const) {
      expect(holders(capability)).toEqual(["OWNER", "MANAGER"]);
    }
    for (const capability of ["machines.manage", "machine.settings", "printers.manage"] as const) {
      expect(holders(capability)).toEqual(["OWNER", "MANAGER", "MACHINE_MANAGER"]);
    }
    expect(holders("space.delete")).toEqual(["OWNER"]);
  });

  it("gives operators jobs and consumables, and technicians maintenance", () => {
    expect(holders("jobs.review")).toEqual(["OWNER", "MANAGER", "MACHINE_MANAGER", "OPERATOR"]);
    expect(holders("jobs.operate")).toEqual(["OWNER", "MANAGER", "MACHINE_MANAGER", "OPERATOR"]);
    expect(holders("consumables.manage")).toEqual(["OWNER", "MANAGER", "MACHINE_MANAGER", "OPERATOR"]);
    expect(holders("maintenance.manage")).toEqual(["OWNER", "MANAGER", "MACHINE_MANAGER", "TECHNICIAN"]);
    expect(holders("reports.view")).toEqual(["OWNER", "MANAGER", "MACHINE_MANAGER", "VIEWER"]);
    expect(holders("audit.view")).toEqual(["OWNER", "MANAGER", "MACHINE_MANAGER"]);
  });

  it("lets every staff role read, and makers hold no staff capability", () => {
    for (const capability of ["space.view", "machines.view", "consumables.view", "jobs.view", "maintenance.view"] as const) expect(holders(capability)).toEqual([...STAFF_ROLES]);
    for (const capability of Object.keys(CAPABILITIES) as Capability[]) expect(can("MEMBER", capability)).toBe(false);
    expect(can(null, "space.view")).toBe(false);
    expect(isStaffRole("MEMBER")).toBe(false);
    expect(STAFF_ROLES.every(isStaffRole)).toBe(true);
  });

  it("never lets space managers manage owners or other managers", () => {
    expect(canManageTeamMember("MANAGER", "OWNER")).toBe(false);
    expect(canManageTeamMember("MANAGER", "MANAGER")).toBe(false);
    expect(canManageTeamMember("MANAGER", "MACHINE_MANAGER")).toBe(true);
    expect(canManageTeamMember("MANAGER", "MEMBER")).toBe(true);
    expect(canManageTeamMember("OWNER", "OWNER")).toBe(true);
    expect(canManageTeamMember("MACHINE_MANAGER", "OPERATOR")).toBe(false);
    expect(assignableRoles("MANAGER")).not.toContain("OWNER");
    expect(assignableRoles("MANAGER")).not.toContain("MANAGER");
    expect(assignableRoles("OWNER")).toEqual([...STAFF_ROLES, "MEMBER"]);
    expect(assignableRoles("OPERATOR")).toEqual([]);
  });

  it("labels the two manager roles distinctly", () => {
    expect(ROLE_LABELS.MANAGER).toBe("Space manager");
    expect(ROLE_LABELS.MACHINE_MANAGER).toBe("Machine manager");
    expect(ROLE_LABELS.MEMBER).toBe("Maker");
  });
});
