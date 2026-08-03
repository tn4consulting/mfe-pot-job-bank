import { withNativeFederation } from '@softarc/native-federation/config';
import {
  sharedGcdsFederationDependency,
  sharedReactFederationDependencies,
} from '@tn4consulting/shared-federation-config/react';

// React remote -- imports the framework-agnostic core's config API
// (@softarc/native-federation/config), not the Angular wrapper's re-export
// (@angular-architects/native-federation/config), since this app no longer
// has Angular installed at all. Shares react/react-dom (so the shell's own
// mount-adapter binds to the same React instance this bundle uses -- see
// REACT_MOUNTER in mfe-pot-platform) plus @gcds-core/components (the
// framework-agnostic GCDS layer -- not used yet, declared now so a future
// GCDS component doesn't need this file touched again).
export default withNativeFederation({
  name: 'job-bank',

  exposes: {
    './Component': './apps/job-bank/src/app/App.tsx',
    './JobApplicationsWidget': './apps/job-bank/src/app/components/JobApplicationsList.tsx',
  },

  shared: { ...sharedReactFederationDependencies, ...sharedGcdsFederationDependency },
});
