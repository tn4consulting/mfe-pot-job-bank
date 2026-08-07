// es-module-shims itself is loaded via a plain classic <script> tag in
// index.html, not imported here -- it has to already be active before this
// module (loaded via <script type="module-shim">) is even parsed, since
// it's the thing that makes the browser recognize that script type at all.
// See index.html and build.mjs/serve.mjs for the rest of the wiring.
//
// styles.css (SCDS's global design tokens) only matters for this app's own
// *standalone* serving -- when composed into the shell, only the exposed
// ./Component/./JobApplicationsWidget modules load, not this
// main.tsx/index.html at all, and the shell's own styles.css already put
// the same --scds-* custom properties on :root. Importing it here (bundled
// by esbuild into a sibling main.css, linked from index.html -- same
// pattern as mfe-pot-shell's main.tsx) closes a real pre-existing gap:
// this app previously had no global stylesheet of its own at all, so its
// scds-card/scds-multi-column-list elements rendered unstyled when served
// standalone with no shell running.
import './styles.css';
import { initFederation } from '@softarc/native-federation-orchestrator';

initFederation({ 'job-bank-mfe': './remoteEntry.json' })
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error(err));
