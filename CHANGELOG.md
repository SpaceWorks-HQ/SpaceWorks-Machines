# Changelog

Releases are published from `main` and titled **`Space Works Machines <version>`**. The root `VERSION`
file selects the series; each build is tagged `v<series>-main.<run>.<sha>`, which is what a deployment pins
to. Pushes to `dev` publish staging images tagged `dev` without a release.

## 0.1.0 (Unreleased)

Phase 1: the foundation for a multi-space machine management platform.

- **Forked from the Space Works Organization platform** (0.7.0). Its platform layer (accounts, spaces as
  tenants, super admin, outbox email, chat alerts, payment settings, storage, installer, updater, release
  pipeline and split hosting) carries over; the membership domain (plans, memberships, renewals, member cards,
  receipts and GST documents, accounts, refunds and reports) is removed.
- **Spaces as tenants.** `Space` holds a makerspace's profile, address, time zone (default Asia/Kolkata),
  currency (default INR) and locale, its review status, the super admin's `PUBLIC` or `UNLISTED` visibility,
  member and staff limits, and the offline-payment maker-checker setting. Spaces apply at `/start` or are
  created by the super admin; public pages live at `/s/[spaceSlug]` and listed spaces at `/spaces`.
  Cross-space access returns 404.
- **Roles.** OWNER, MANAGER ("Space manager"), MACHINE_MANAGER ("Machine manager"), OPERATOR, TECHNICIAN and
  VIEWER are staff; MEMBER ("Maker") submits jobs. Capabilities are defined once in `lib/permissionRoles.ts`.
  Staff need an authenticator app; makers never do. Space managers cannot change owners or other managers.
- **Joining.** Join policies OPEN, APPROVAL and INVITE_ONLY, invites by link or email, approval of waiting
  makers, and seat limits.
- **Sign-in.** Email and password, or an emailed magic link (15 minutes, single use, stored hashed, rate
  limited, the same answer for unknown addresses, never for super admins; `/login/link` waits for a button
  press). Authenticator MFA with recovery codes, new-browser codes and alerts, automatic address blocking and
  breached-password checks carry over. The Google, GitHub and Apple providers and their `AUTH_GOOGLE_*`,
  `AUTH_GITHUB_*` and `AUTH_APPLE_*` settings are removed.
- **Per-space settings.** Razorpay or Stripe keys (encrypted with `PAYMENT_SECRETS_KEY`) with verified,
  once-only webhooks, offline payment instructions, the space's own SMTP sender, and chat alerts to Slack,
  Discord, Mattermost, Telegram and WhatsApp for join requests and makers joining or leaving. Every settings
  change is audited (`SPACE_SETTINGS_CHANGED`) with the changed field names only.
- **Background jobs on BullMQ.** A `worker` and a `beat` role (`npm run build:jobs`, `dist/worker.js` and
  `dist/beat.js`) replace the scheduler pass: queues `outbox`, `scheduled` and `sync`, a job registry in
  `lib/queue/registry.ts`, and `/health` on `JOBS_HEALTH_PORT`. New settings `JOBS_QUEUE_PREFIX`,
  `JOBS_HEALTH_PORT`, `JOBS_INPROCESS` (development only) and `QUEUE_<NAME>_CONCURRENCY`. `POST
  /api/internal/jobs` joins `/api/internal/outbox` as the `CRON_SECRET` fallback for hosts without a beat.
  The `scheduler` role, its Compose services and `SCHEDULER_MODE` are removed.
- **Database.** A fresh schema with one migration, `0001_init`.
- **Machines branding.** Space Works Machines name, landing page, images
  (`spaceworks-machines-backend` and `-frontend`), host paths (`/opt/spaceworks-machines`,
  `/etc/spaceworks-machines`), `SWM_` settings and the `swmach` and `swmach_app` database roles.
- **Dashboard.** Overview, Team and Space settings work; Machines, Jobs, Maintenance, Consumables, Payments,
  Reports, Integrations and Machine settings are placeholders for later phases.
