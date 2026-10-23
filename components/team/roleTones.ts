import type { SpaceRole } from "@prisma/client";

/** Chip and avatar tones per role, shared by the team list, role picker and roles card. */
export const ROLE_TONES = {
  OWNER: "ink",
  MANAGER: "warning",
  MACHINE_MANAGER: "accent",
  OPERATOR: "info",
  TECHNICIAN: "success",
  VIEWER: "neutral",
  MEMBER: "outline",
} as const satisfies Record<SpaceRole, string>;

export const DOT_TONES: Record<SpaceRole, string> = {
  OWNER: "bg-primary",
  MANAGER: "bg-highlight",
  MACHINE_MANAGER: "bg-accent",
  OPERATOR: "bg-info-solid",
  TECHNICIAN: "bg-success-solid",
  VIEWER: "bg-line-strong",
  MEMBER: "bg-line",
};
