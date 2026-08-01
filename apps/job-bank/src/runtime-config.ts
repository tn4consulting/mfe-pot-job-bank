import { getRuntimeConfig } from '@tn4consulting/shared-runtime-config';

/**
 * Replaces environment.ts/environment.prod.ts + fileReplacements -- see
 * CLAUDE.md's Hosting section. Under plain `nx serve` these dev defaults
 * apply directly; in a container, the entrypoint script injects real values
 * via window.__mfePotEnv from the Helm chart's ConfigMap.
 */
export const runtimeConfig = getRuntimeConfig({
  jobBankBffBaseUrl: 'http://localhost:3001',
});
