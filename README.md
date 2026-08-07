# mfe-pot-job-bank

> **Disclaimer:** This is an independent proof-of-technology project, not
> affiliated with, endorsed by, or associated with Service Canada,
> Employment and Social Development Canada (ESDC), Job Bank, or the
> Government of Canada in any way. Any GC branding/design-system references
> are used only to ground the proof of technology in a realistic scenario.

The **job search and apply** frontend for the mfe-pot Government of Canada
MFE proof-of-technology. Federated as a remote into `mfe-pot-shell`, but also
built to work standalone outside this shell — the reason its business logic
lives in `libs/feature-*` rather than the app itself.

This README covers running **this app (+ its BFF) standalone**. For the full
family (all 6 repos together) and architecture rationale, see
[`../mfe-pot-platform/README.md`](../mfe-pot-platform/README.md) and
[`CLAUDE.md`](./CLAUDE.md) in this repo.

## Prerequisites

- **asdf** with the `nodejs` plugin (`.tool-versions` pins the exact
  version — currently 22.22.0, anything ≥ 22.12 works).
- **pnpm** (not asdf-managed — install globally or via `corepack enable`).
- **A GitHub personal access token with `read:packages` scope**, exported as
  `NODE_AUTH_TOKEN` — `pnpm install` pulls `@tn4consulting/shared-*` packages
  from GitHub Packages (`.npmrc` in this repo points at that registry). `gh
  auth token` works as a substitute if you have `gh` authenticated.
- **Docker**, **kind**, **helm**, **kubectl** — only for the containerized
  loop below.

## Install & run standalone

```bash
export NODE_AUTH_TOKEN=<your GitHub token>
pnpm install
pnpm exec nx serve job-bank-bff   # terminal 1 — port 3001
pnpm exec nx serve job-bank       # terminal 2 — port 4203
```

Open `http://localhost:4203`. Job Bank has no dependency on the shell or any
sibling remote to run — this is deliberate (see `CLAUDE.md`'s "This repo's
own architecture doc" pointer and the platform repo's "Independent
testability" section).

## Test, lint, build

```bash
pnpm exec nx test job-bank
pnpm exec nx test job-bank-bff
pnpm exec nx lint job-bank
pnpm exec nx run job-bank-bff:eslint:lint   # BFF's lint target isn't named "lint"
pnpm exec nx build job-bank --configuration=production
pnpm exec nx build job-bank-bff
```

Or across this repo's projects at once: `pnpm run test` / `pnpm run lint` /
`pnpm run build`.

## Build & run the Docker images standalone

```bash
docker build --secret id=npm_token,src=<(printf '%s' "$NODE_AUTH_TOKEN") \
  -t mfe-pot-job-bank:local -f apps/job-bank/Dockerfile .
docker build --secret id=npm_token,src=<(printf '%s' "$NODE_AUTH_TOKEN") \
  -t mfe-pot-job-bank-bff:local -f apps/job-bank-bff/Dockerfile .

docker run -p 8080:80 mfe-pot-job-bank:local
docker run -p 3001:3001 -e HOST=0.0.0.0 mfe-pot-job-bank-bff:local
```

## Deploy this app's Helm chart locally (kind)

```bash
pnpm deploy:local
```

Runs `tools/deploy-local.sh` — builds both images, creates/reuses a local
`kind` cluster (shared with the other app repos, named `kind`), and
`helm upgrade --install`s `charts/job-bank` (one Helm release for both the
frontend and `job-bank-bff`). This was the first app extracted, so this
script is the template every other app repo's own `deploy-local.sh` follows.
Requires `../mfe-pot-platform` checked out as a sibling (this chart's
library-chart dependencies resolve via
`file://../../../mfe-pot-platform/charts/...` relative paths). Add to
`/etc/hosts`:

```
127.0.0.1 job-bank-mfe.mfe-pot.local
```

Then `curl -H "Host: job-bank-mfe.mfe-pot.local" http://localhost/` or browse
there directly.

## Where to go next

- [`CLAUDE.md`](./CLAUDE.md) — this repo's specific gotchas (the CMS-driven
  intro block, extraction-era Docker/Jest/tsconfig fixes, Renovate).
- [`../mfe-pot-platform/CLAUDE.md`](../mfe-pot-platform/CLAUDE.md) — the
  full architecture reference for the whole family.
- [`../mfe-pot-platform/README.md`](../mfe-pot-platform/README.md) —
  running all 6 repos together.
