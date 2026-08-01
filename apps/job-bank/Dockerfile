# syntax=docker/dockerfile:1
#
# Built from this repo's own root, post Phase 1 extraction (see
# docs/plans/20260801-1935-mfe-pot-polyrepo-split-and-k8s-hosting.md).
#
# One image, built once, promoted across environments unchanged -- see
# CLAUDE.md's Hosting section. Environment-specific values are injected at
# container startup via MFE_POT_ENV_JSON (see tools/docker/frontend-entrypoint.sh),
# never baked in at build time.
#
# `pnpm install` needs to fetch @tn4consulting/shared-* from GitHub
# Packages, which requires auth the build container doesn't have by
# default (unlike a host install, which picks up ~/.npmrc). The token is
# passed as a BuildKit secret (`--secret id=npm_token,env=NODE_AUTH_TOKEN`),
# mounted as a file rather than an env var directly -- this environment's
# Docker Desktop doesn't support the newer `--mount=...,env=` form
# (errors with "experimental feature exec.secretenv is not supported") --
# so it's available to this RUN step's environment only and never gets
# written into an image layer or the build cache. CI passes its same-org
# GITHUB_TOKEN the same way.
#
# The pnpm store is cache-mounted (persists across builds, not baked into
# any layer) and network-concurrency is capped -- this environment's
# Docker Desktop network path to the public npm registry is flaky enough
# under pnpm's default concurrency to blow through hundreds of ECONNRESET
# retries and take over an hour on a cold store; a warm store plus fewer
# parallel connections avoids re-triggering that every build.

FROM node:22-alpine AS build
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json tsconfig.json .npmrc ./
COPY apps ./apps
COPY libs ./libs
COPY tools ./tools
RUN --mount=type=secret,id=npm_token \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    NODE_AUTH_TOKEN="$(cat /run/secrets/npm_token)" pnpm install --frozen-lockfile --network-concurrency=4
RUN pnpm exec nx build job-bank --configuration=production

FROM nginx:alpine AS runtime
COPY tools/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY tools/docker/frontend-entrypoint.sh /docker-entrypoint.d/40-mfe-pot-env.sh
RUN chmod +x /docker-entrypoint.d/40-mfe-pot-env.sh
COPY --from=build /workspace/dist/apps/job-bank/browser /usr/share/nginx/html
EXPOSE 80
