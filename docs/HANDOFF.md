# Handoff: Space Works Machines

Read this first, then `CLAUDE.md` (same as `AGENTS.md`), `docs/plans/2026-10-23-machines-build.md` (the
phase plan), `docs/plans/domain-behaviour.md` (the rules ported from Django) and
`docs/plans/source-survey.md` (a map of the Django source). Snapshot taken 2026-10-23.

## Where this repo fits

Space Works is a family of self-hosted, open-source (AGPL-3.0-or-later) tools for makerspaces and
communities, published under the [SpaceWorks-HQ](https://github.com/SpaceWorks-HQ) GitHub org.
The original product, [SpaceWorks](https://github.com/SpaceWorks-HQ/SpaceWorks) (Django + React), bundles
inventory, lending, machines, 3D printing, space bookings and payments in one app. On 2026-10-23 three of
those areas were split out into **standalone apps**, each in its own repo:

| Repo | What it is |
| --- | --- |
| [SpaceWorks-Inventory](https://github.com/SpaceWorks-HQ/SpaceWorks-Inventory) | Stock room and lending desk: setup wizard, catalogue, QR, counts, transfers between locations and spaces, free or paid member lending |
| [SpaceWorks-Machines](https://github.com/SpaceWorks-HQ/SpaceWorks-Machines) | Machine types and catalogue, job/service requests (3D printing, laser, CNC…), pricing and payments, consumables, maintenance and usage logs, 3D-printer hardware adapter layer |
| [SpaceWorks-Bookings](https://github.com/SpaceWorks-HQ/SpaceWorks-Bookings) | Space booking (rooms, studios, desks, halls) with every payment and refund scenario |

Sibling apps on the same stack, used as the reference for structure, install and deploy:
[SpaceWorks-Events](https://github.com/SpaceWorks-HQ/SpaceWorks-Events),
[SpaceWorks-Workspace](https://github.com/SpaceWorks-HQ/SpaceWorks-Workspace) and SpaceWorks-Organization.
Brand and UI rules come only from [SpaceWorks-Design](https://spaceworks-hq.github.io/SpaceWorks-Design/).

## Decisions already made (do not re-open without the owner)

- **Stack:** Next.js 16 + React 19 + TypeScript, PostgreSQL 16 with Prisma, Auth.js, Tailwind 4 + Radix,
  Redis with a BullMQ `worker` and `beat`, S3-compatible private storage (Silo on a VPS), Vitest and
  Playwright. Domain logic is *ported* from the Django SpaceWorks code, not copied.
- **Multi-space:** one install runs several makerspaces; every tenant row and query is scoped to one.
- **Own accounts per app** (email + password, magic link, TOTP MFA). No SSO.
- **Fully standalone:** no runtime dependency on any other Space Works app. Integration happens later
  through each app's REST API (API keys) and signed outbound webhooks.
- **Free and paid everywhere:** every flow works free or paid. Payments use Razorpay, Stripe,
  offline (cash/bank/UPI recorded by staff) or pay later (shown as *payment pending*), with refunds.
- **Nothing hardcoded:** the Space manager has makerspace-wide settings; the domain manager
  (Inventory / Machine / Bookings manager) has their own settings area; both are RBAC-gated and every
  settings change is audited.
- **Ship requirements:** a README with real Playwright screenshots (light and dark) under
  `docs/screenshots/`, a one-line VPS install (`curl -fsSL …/main/install.sh | bash`) and one-click
  cloud hosting (`render.yaml` + Deploy to Render button).

## How work is done here

- `dev` is the integration branch; `main` is production and only **Shaan-Shoukath** merges into it
  (branch protection + `.github/CODEOWNERS`). Branch from `dev`, open PRs into `dev`.
- Work in phases; each phase ends with lint, typecheck and tests green, a commit and a push to `dev`.
- `CLAUDE.md` and `AGENTS.md` are byte-identical; edit one, copy it over the other.
- The original build was done by Claude Code sessions (no Codex). Any coding agent can continue from
  this file plus `CLAUDE.md`.

## Machines-specific decisions

- Roles: OWNER and MANAGER (Space managers, who own makerspace-wide settings and money), MACHINE_MANAGER
  (machine settings: types, file policies, queue rules, pricing, consumables, maintenance, printers),
  OPERATOR, TECHNICIAN, VIEWER, and MEMBER (makers who submit jobs).
- No training, certification or machine-access gating. The owner excluded it.
- 3D-printer hardware is a typed adapter layer. The manual/simulated adapter works now. OctoPrint,
  Moonraker/Klipper, Bambu (MQTT) and PrusaLink are stubs shown as "Coming soon".
- Jobs can be free or paid: flat fee, per time/material/weight, member vs public rates, deposits or pay
  later, with refunds for failed or cancelled jobs.

## Status (2026-10-23)

**Done and committed on `dev`:** Phase 1, Foundation. The Organization platform is forked, Space tenancy,
roles, magic link, and the BullMQ worker and beat are in place.

**Last commit, work in progress (`wip:`):** Phase 2, Machines. It adds machine types, machines,
consumables, machine files, space job settings, the spaces API, webhooks and `lib/machines`/`lib/consumables`
with their Prisma schema changes. Typecheck is clean and 343 unit tests pass. One known failure:
`tests/unit/upload-route.test.ts` cannot load because `app/api/uploads/[...key]/route.ts` now pulls in
next-auth. Mock `@/lib/auth` in that test. No migration has been generated for the schema changes yet;
run `npm run db:migrate` to create it.

## What is left

Phases 2 (finish) to 6 from `docs/plans/2026-10-23-machines-build.md`:
2. Finish Machines: migration, admin UI, public machine pages, photos, tests.
3. Jobs: uploads validated by file policy, queue and position, review and lifecycle, pricing engine,
   Razorpay/Stripe/offline/pay-later payments and refunds, consumable deduction, notifications.
4. Upkeep: metering, maintenance schedules, downtime, fault reports, warranty, service history, reports.
5. Integrations: printer adapter layer, REST API with API keys, webhooks, audit log views.
6. Ship: README with real screenshots, one-line VPS install and Render deploy verified, e2e journeys,
   design polish, and an independent review. Then open the `dev → main` PR for the owner.

## Run it locally

`cp .env.example .env`, then `npm ci && npm run db:migrate && npm run db:seed-demo && npm run dev`.
Checks: `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:integration` (needs
Postgres), `npm run test:e2e`.
