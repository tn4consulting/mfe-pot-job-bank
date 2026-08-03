// es-module-shims itself is loaded via a plain classic <script> tag in
// index.html, not imported here -- it has to already be active before this
// module (loaded via <script type="module-shim">) is even parsed, since
// it's the thing that makes the browser recognize that script type at all.
// See index.html and build.mjs/serve.mjs for the rest of the wiring.
import { initFederation } from '@softarc/native-federation-orchestrator';

initFederation({ 'job-bank': './remoteEntry.json' })
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error(err));
