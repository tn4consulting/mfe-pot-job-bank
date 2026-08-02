# mfe-pot-job-bank

## What this is

The **job search and apply** frontend for the mfe-pot Government of Canada MFE proof-of-technology. Federated as a remote into `mfe-pot-shell`, but built to also work standalone on a real-world Job Bank site outside this shell entirely — that concrete requirement is *why* the platform's "apps are thin, libs hold the logic" pattern exists at all, and this app was the first one taken through the whole extraction, so its Docker/Helm/CI setup is the template every other app repo's followed.

**This repo doesn't carry its own architecture doc.** Full rationale — bilingual/WCAG/GCDS requirements, the Native Federation setup, the federation-sharing policy, security model, i18n mechanism, the BFF pattern, hosting/Helm pattern, and every non-obvious gotcha behind the code in this repo — lives in **`../mfe-pot-platform/CLAUDE.md`**. Read it before making any architectural change here; this file only covers what's specific to this repo. See `../CLAUDE.md` (the `mfe-pot` meta repo) for the full 6-repo map.

## What's in this repo

- `apps/job-bank` — the frontend, federated on port `4203` in local dev.
- `apps/job-bank-bff` — job-bank's dedicated BFF (port `3001`), plain Express/TypeScript, routes already carry the `/api` prefix internally (`/api/jobs`, `/api/applications`, `/health` at root) — deliberate, since it's what lets the Ingress path rule below be a plain prefix match with no rewrite.
- `libs/feature-search`, `libs/feature-apply` — the real component/business logic (job-bank's whole reason for existing as a reusable-outside-the-shell library, not app-embedded code). `libs/data-access` — `JobBankApiClient`.
- `charts/job-bank` — deploys the frontend+BFF pair as one Helm release; the reference every other app-repo chart was copied from.

Depends on published packages from GitHub Packages: `@tn4consulting/shared-auth`, `shared-content-client`, `shared-federation-config`, `shared-i18n`, `shared-runtime-config` (pinned in `package.json`; keep in sync with `platform-versions.json` in `mfe-pot-platform`).

## Repo-specific things worth knowing

- **`App` (`apps/job-bank/src/app/app.ts`) renders a CMS-driven intro block** (`job-bank.intro` key, fetched via `ContentClient` -- `content-client.token.ts`, same pattern as `mfe-pot-dashboard`'s own `content-client.token.ts`) above the `feature-search`/`feature-apply` sections, re-fetched on cross-remote locale change. `runtime-config.ts`'s `strapiBaseUrl` points at `mfe-pot-platform`'s `charts/strapi` in a real deployment (`http://cms.mfe-pot.local`, browser-to-server, not in-cluster Service DNS). The feature libraries' own section headings/buttons/status text are still hardcoded English (not yet Transloco- or CMS-driven) -- a separate, pre-existing gap, not touched by this.

- **This repo hit (and fixed) most of the extraction-wide Docker/Jest/tsconfig gotchas first** — see the platform repo's CLAUDE.md ("Monorepo → per-app repos") for the full list (the `@tn4consulting` ESM `transformIgnorePatterns` fix, the npm-auth BuildKit secret mount, the `nx` postinstall hang fix via `pnpm.onlyBuiltDependencies`, the explicit `"types": ["node"]` fix). If a build/test/Docker problem here looks unfamiliar, check that list before assuming it's new.
- **`Chart.yaml`'s library-chart `dependencies` resolve via a sibling-checkout-relative `file://` path** into `../mfe-pot-platform/charts/mfe-frontend-lib` (and `mfe-backend-lib`) — this only works if `mfe-pot-platform` is checked out as an actual sibling at the expected relative path (see `../mfe-pot.code-workspace`). The packaged `.tgz` dependency archives `helm dependency update` generates are gitignored, not committed, since they'd drift stale relative to the source charts.
- **`dashboardBffBaseUrl`-style same-origin pattern**: `runtime-config.ts`'s `jobBankBffBaseUrl` dev default is `http://localhost:3001`, but the chart's `values.yaml` overrides it to `/api` — a same-origin Ingress path rule, not a second hostname, since `job-bank-bff`'s routes already carry that prefix internally.
- **CI** (`.github/workflows/ci.yml`): lint/test/build (including `job-bank-bff`'s separately-run `eslint:lint` target), then builds both images, spins up an ephemeral `kind` cluster, `helm install`s this chart, and curls the Ingress-routed hostname to confirm it serves — the template every other app repo's workflow follows, matching the pattern this repo already set for Docker/Helm. No `README.md` yet — still open work tracked in `../TODO.md`.

## Renovate

`renovate.json` extends `github>tn4consulting/mfe-pot-platform` — the shared preset (groups `@angular/*`, `@schematics/angular`, `listr2` into one coordinated pinned bump). Don't hand-roll Angular version bumps here independently of the other 5 repos; `platform-versions.json` in `mfe-pot-platform` is the source of truth for what version they should all be on.
