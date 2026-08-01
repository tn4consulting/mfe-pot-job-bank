import { withNativeFederation } from '@angular-architects/native-federation/config';
import {
  sharedFederationDependencies,
  sharedFederationFeatures,
  sharedFederationSkip,
} from '@tn4consulting/shared-federation-config';

export default withNativeFederation({
  name: 'job-bank',

  exposes: {
    './Component': './apps/job-bank/src/app/app.ts',
    './RemoteProviders': './apps/job-bank/src/app/remote-providers.ts',
  },

  shared: sharedFederationDependencies,
  skip: sharedFederationSkip,

  // Please read our FAQ about sharing libs:
  // https://shorturl.at/jmzH0

  features: sharedFederationFeatures,
});
