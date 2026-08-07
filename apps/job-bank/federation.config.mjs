import { share, withNativeFederation } from '@softarc/native-federation/config';
import {
  sharedUiScdsCoreFederationDependency,
  sharedReactFederationDependencies,
} from '@tn4consulting/shared-federation-config/react';

// React remote -- imports the framework-agnostic core's config API
// (@softarc/native-federation/config), not the Angular wrapper's re-export
// (@angular-architects/native-federation/config), since this app no longer
// has Angular installed at all. Shares react/react-dom (so the shell's own
// mount-adapter binds to the same React instance this bundle uses -- see
// REACT_MOUNTER in mfe-pot-platform) plus @tn4consulting/shared-ui-scds-core
// (the framework-agnostic SCDS layer this app renders via scds-card/
// scds-multi-column-list). GCDS itself has been removed from the family
// entirely -- this app never rendered a gcds-* element directly, so there
// was nothing else to drop here beyond the old shared-singleton entry.

// TEMP LOCAL ADDITION (not yet in the published shared-federation-config):
// register-scds.ts imports `defineCustomElements` from the Stencil-generated
// '@tn4consulting/shared-ui-scds-core/loader' subpath, not just the bare
// package -- but sharedUiScdsCoreFederationDependency's
// `includeSecondaries: false` (deliberately set to dodge the same
// jsx-runtime-style auto-discovery bug documented in
// shared-federation-config/react.js) means only the bare specifier is in
// the shared import map, so this subpath was never resolvable ("Unable to
// resolve specifier '@tn4consulting/shared-ui-scds-core/loader'") the one
// time this route was actually exercised end to end through the shell.
// Sharing it explicitly here, same singleton shape as the bare package,
// until this can be folded into the published package properly.
const sharedUiScdsCoreLoader = share({
  '@tn4consulting/shared-ui-scds-core/loader': {
    singleton: true,
    strictVersion: true,
    requiredVersion: 'auto',
    includeSecondaries: false,
  },
});

export default withNativeFederation({
  name: 'job-bank',

  exposes: {
    './Component': './apps/job-bank/src/app/App.tsx',
    './JobApplicationsWidget': './apps/job-bank/src/app/components/JobApplicationsList.tsx',
  },

  shared: {
    ...sharedReactFederationDependencies,
    ...sharedUiScdsCoreFederationDependency,
    ...sharedUiScdsCoreLoader,
  },
});
