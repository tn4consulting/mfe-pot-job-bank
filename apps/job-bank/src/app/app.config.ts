import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { REMOTE_PROVIDERS } from './remote-providers';

// Async because REMOTE_PROVIDERS itself is: this app's BFF client needs its
// own fetched runtime config (own env.js, not window.__mfePotEnv -- see
// runtime-config.ts), resolved the same way whether this app boots
// standalone (here) or federated into the shell (RemoteRouteHost awaits it
// the same way).
export async function createAppConfig(): Promise<ApplicationConfig> {
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideRouter(appRoutes),
      ...(await REMOTE_PROVIDERS),
    ],
  };
}
