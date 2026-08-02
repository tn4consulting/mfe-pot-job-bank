import { bootstrapApplication } from '@angular/platform-browser';
import { createAppConfig } from './app/app.config';
import { App } from './app/app';

createAppConfig()
  .then((appConfig) => bootstrapApplication(App, appConfig))
  .catch((err) => console.error(err));
