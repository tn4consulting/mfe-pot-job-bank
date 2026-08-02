import { provideMfeTransloco } from '@tn4consulting/shared-i18n';
import { HttpJobBankApiClient, JOB_BANK_API_CLIENT } from 'job-bank-data-access';
import { loadRuntimeConfig } from '../runtime-config';

// Split across two statements deliberately: Vite/esbuild specially
// recognize the inline pattern `new URL('...', import.meta.url)` and
// rewrite it for static asset bundling, which hijacks this computation in
// dev mode (it resolves to a dev-server /@fs/ disk path instead of this
// remote's actual serving origin). Storing import.meta.url first avoids
// that -- see apps/shell/src/app/app.config.ts for the fuller story.
const moduleUrl = import.meta.url;
const assetBaseUrl = new URL('.', moduleUrl).href;

// A Promise, not a plain array: this app's own BFF base URL has to be
// resolved by fetching this app's own env.js (see runtime-config.ts) --
// RemoteRouteHost awaits REMOTE_PROVIDERS before applying it.
export const REMOTE_PROVIDERS = loadRuntimeConfig(assetBaseUrl).then((runtimeConfig) => [
  ...provideMfeTransloco(assetBaseUrl),
  {
    provide: JOB_BANK_API_CLIENT,
    useValue: new HttpJobBankApiClient(runtimeConfig.jobBankBffBaseUrl),
  },
]);
