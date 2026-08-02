import { fetchRuntimeConfig } from '@tn4consulting/shared-runtime-config';

/**
 * Replaces environment.ts/environment.prod.ts + fileReplacements -- see
 * CLAUDE.md's Hosting section. Under plain `nx serve` these dev defaults
 * apply directly; in a container, the entrypoint script injects real values
 * via window.__mfePotEnv from the Helm chart's ConfigMap.
 *
 * Fetched from this app's own origin (not read off window.__mfePotEnv)
 * because this app is loaded as a Native Federation remote inside the
 * shell as often as it's loaded standalone -- when federated, this app's
 * own index.html/env.js never loads (the shell's already-running page
 * just imports this app's JS module into the same window), so
 * window.__mfePotEnv only ever carries the shell's own values. Fetching
 * this app's own env.js directly from its own origin works in both cases.
 */
const devDefaults = {
  jobBankBffBaseUrl: 'http://localhost:3001',
};

export function loadRuntimeConfig(ownOriginUrl: string) {
  return fetchRuntimeConfig(ownOriginUrl, devDefaults);
}
