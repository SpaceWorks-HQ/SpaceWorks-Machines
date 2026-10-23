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
- Phases 1 and the Phase 2 domain were built by Claude Code sessions. Phase 2 UI and Phase 3 were implemented
  by Codex under Claude's prompts, verification, gates and review. From Phase 4 on the owner asked for Claude
  only again. Any coding agent can continue from this file plus `CLAUDE.md`.

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

**Done and committed on `dev` (local commits; pushing is the owner's call):**
- Phase 1, Foundation. The Organization platform is forked, Space tenancy, roles, magic link, and the BullMQ
  worker and beat are in place.
- Phase 2, Machines. Domain (types, machines, consumables, files, webhooks) plus the UI: staff machine catalogue
  and machine page (details, specs from the type's fields, status, retire, flags, photos, documents), machine
  settings (type list, new/duplicate/archive/reorder, type editor for every section incl. spec and request field
  definitions), consumables (pools, restock, correction, retire, public toggle, ledger, low-stock alerts), public
  machine pages `/s/[spaceSlug]/machines` and `/s/[spaceSlug]/machines/[machineSlug]` with public photos and
  documents. New capability `consumables.view` (all staff). The `0002_machines_domain` migration matches the
  schema (no drift).
- Phase 3, Jobs. File validation and parsers (`lib/files`), pricing resolution and engine (`lib/pricing`), the
  usage writer (`lib/usage/record.ts`, the only writer of usage and meters), submission, the lifecycle
  (`lib/jobs/transitions.ts`, the only writer of job status), queue position and ETA, job payments (upfront,
  deposit, on completion, pay later; Razorpay Payment Links, Stripe Checkout, offline with maker-checker, waive),
  refunds (automatic proposals, manual, gateway and offline), webhook settlement, notifications, and the UI:
  request form, requester job page, `/account/jobs`, `/j/[token]` status link, staff job board and job page
  with every action, payments page with CSV export, job settings and pricing rules. Migration
  `0003_job_payments`. Map of the code: `docs/JOBS.md`.
- Phase 4, Upkeep (`lib/upkeep`): maintenance schedules by time, machine hours or job count with due state and
  reminders once per due cycle, append-only maintenance records with attachments (completing a schedule advances
  it), downtime windows, fault reports (makers from the public machine page, staff from the machine) with the
  OPEN → RESOLVED / WON'T FIX workflow and photos, warranty with documents and expiry reminders, daily beat
  sweeps (`maintenance-due`, `warranty-expiry`), per-machine service history, and reports (`lib/reports`:
  jobs, utilisation with availability/MTBF/MTTR, consumables, revenue per currency, maintenance, warranty)
  with CSV export. Upkeep files share the private machine-file store and are staff-only.
- Phase 5, Integrations: REST API `/api/v1` with per-space API keys and scopes (`lib/apiKeys.ts`,
  `lib/api/handler.ts`, OpenAPI at `/api/v1/openapi.json`, `docs/API.md`), signed outbound webhooks with SQL-
  scheduled retries, auto switch-off after 10 failures, delivery log, test and redeliver (`lib/webhooks`, beat
  `webhook-relay`), the printer adapter layer (`lib/printers`: manual and simulated working; OctoPrint,
  Moonraker, Bambu and PrusaLink stubs shown as "Coming soon"; beat `printer-poll` finishes jobs from
  telemetry), and the audit log page with CSV export.

**How it was verified:** lint, typecheck, unit (557), integration (471, PostgreSQL), `build`, `build:jobs`,
frontend typecheck and build, `frontend:catalog --check`, `prisma migrate diff` (no drift), and the production
browser suites `test:e2e:vps` and `test:e2e:split` (17 tests each, signed-in journeys included). Those two
scripts accept `--external-services` (use DATABASE_URL, REDIS_URL and optional S3_* from the environment instead
of starting containers) and seed the demo when DEMO_PASSWORD is set. On Windows run them inside a Linux
container: their server commands use POSIX syntax.

## What is left

Phase 6 from `docs/plans/2026-10-23-machines-build.md`:
6. Ship: README with real screenshots, one-line VPS install and Render deploy verified, e2e journeys,
   design polish, and an independent review. Then open the `dev → main` PR for the owner.

## Open questions

Decisions taken conservatively while building without the owner; change them if they're wrong.
- Reports use UTC calendar days for their date range, not the space's time zone.
- Revenue figures in reports need `payments.view` as well as `reports.view`.
- A fault's reporter can add photos only within a day of reporting; makers can't see fault photos afterwards.
- API writes act as the key's creator and need their current permission; there is no separate service account.
- Webhook hosts are checked against private addresses when saved and before each send, without DNS pinning
  between the check and the request (the same as chat alerts).
- Printer connections allow only public hosts for future network adapters; LAN printers would need an
  explicit instance setting.
- Overdue schedules with "take out of service" only block a machine that is idle or reserved, never a running job.

## Run it locally

`cp .env.example .env`, then `npm ci && npm run db:migrate && npm run db:seed-demo && npm run dev`.
Checks: `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:integration` (needs
Postgres), `npm run test:e2e`.
