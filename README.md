# Space Works Machines

Self-hosted machine management for makerspaces, fab labs and college workshops: machine types and a
catalogue, job requests with a queue, pricing and payments, consumables, maintenance and usage logs, and 3D
printer connections. One install runs many makerspaces ("spaces"), each with its own staff, makers, machines,
prices and payment account. Licensed under AGPL-3.0-or-later.

## Status

**Phase 1 foundation (0.1.0, unreleased).** The platform is in place: spaces that apply or are created by the
super admin, staff roles and makers, join policies and invites, sign-in with a password or an emailed link,
authenticator apps for staff, per-space payment, email and chat settings, the BullMQ worker and beat, and the
VPS, cloud and Netlify deployments. The dashboard areas for machines, jobs, maintenance, consumables,
payments, reports and integrations are placeholders that later phases fill in.

## Quick start (development)

Needs Node.js 22 and Docker (for PostgreSQL and Redis).

```bash
npm ci
docker compose up -d          # PostgreSQL 16 and Redis 7 on localhost
cp .env.example .env          # then set AUTH_SECRET (openssl rand -base64 32)
npm run db:deploy             # apply the migrations
npm run dev                   # http://localhost:3000
```

Background jobs (email, retention) run in separate processes:

```bash
npm run build:jobs && npm run worker   # in a second terminal
npm run beat                           # in a third
```

Without Redis, set `JOBS_INPROCESS=true` and leave `REDIS_URL` unset to deliver email from the web process
instead. Create a super admin with `npm run admin -- create --email you@example.org`.

Checks: `npm run lint`, `npm run typecheck`, `npm run test:unit`, and `npm run test:integration` with
`TEST_DATABASE_URL` pointing at a disposable database.

## Deploying

One line on a fresh Linux server:

```bash
curl -fsSL https://raw.githubusercontent.com/SpaceWorks-HQ/SpaceWorks-Machines/main/install.sh | bash
```

## Documentation

- [Deploying on a server (VPS)](docs/DEPLOYMENT_VPS.md)
- [Deploying with managed services (cloud)](docs/DEPLOYMENT_CLOUD.md)
- [Hosting the site on Netlify](docs/DEPLOYMENT_NETLIFY.md)
- [Configuration reference](docs/CONFIGURATION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Security](docs/SECURITY.md)
- [Email and chat notifications](docs/NOTIFICATIONS.md)
- [Design](docs/DESIGN.md)
- [Changelog](CHANGELOG.md)
