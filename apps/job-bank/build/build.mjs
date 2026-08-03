// Production/development build for the React job-bank remote, run via the
// `build` Nx target (nx:run-commands, cwd = repo root). Replaces the
// `@angular-architects/native-federation:build` executor -- this app no
// longer has any Angular in it, so there's no Angular CLI/esbuild adapter
// to delegate to.
//
// Two genuinely separate builds happen here, for two different consumers:
//
// 1. The federation build (@softarc/native-federation-esbuild), producing
//    remoteEntry.json + the externalized `./Component` bundle + the shared
//    react/react-dom chunks -- what the shell loads when this app is
//    federated. This is the only build proven to produce a manifest the
//    shell's existing @angular-architects/native-federation runtime can
//    consume unmodified (both wrap the same @softarc/native-federation
//    core).
// 2. A plain, ordinary esbuild bundle of main.tsx (react bundled inline,
//    self-contained, nothing externalized) -- what serves this app's own
//    index.html when run standalone. These CANNOT be the same build: the
//    federation adapter bundles an exposed entry's *entire* locally
//    reachable graph (including anything reached via a local dynamic
//    import) into one file with no code-splitting, so a static `import
//    ... from 'react'` anywhere in that graph -- including deep inside
//    App.tsx's own component tree -- gets hoisted to a top-level static
//    import of the output file itself. That needs to resolve *before*
//    main.ts's own `initFederation()` call even runs, which is exactly
//    backwards (confirmed by testing directly: the resulting bundle threw
//    "Unable to resolve specifier 'react'" immediately on load, before any
//    of this app's own code executed). The standalone entry doesn't need
//    react to be a federation-shared singleton at all -- nothing else on
//    that page is federated -- so building it as a normal, fully
//    self-contained bundle sidesteps the whole problem.
import { runEsBuildBuilder } from '@softarc/native-federation-esbuild';
import * as esbuild from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);

// Deliberately NOT using @softarc/native-federation-esbuild's built-in
// `reactFrameworkPlugin()` -- its hardcoded dev/prod file-replacement map
// (e.g. 'react/cjs/react.production.min.js') is stale against React 19,
// which renamed its production CJS files (dropped the `.min` suffix) and
// now does its own dev/prod branching internally via `process.env.NODE_ENV`
// checks in react-dom/client.js's own `require()` calls -- confirmed by
// reading that file directly. esbuild's own NODE_ENV-based dead-code
// elimination (driven by the `dev`/`minify` flags below) already resolves
// the right file without any manual replacement needed.

const dev = process.argv.includes('--dev');
const outputPath = 'dist/apps/job-bank/browser';

// Unlike the Angular executor this replaces, nothing here incrementally
// diffs stale output against a fresh build -- a leftover file from a
// previous (possibly Angular) build would otherwise sit alongside the new
// one indefinitely, and since `dist/apps/job-bank/browser` is also nginx's
// serve root (see the Dockerfile), a stale bundle chunk being reachable is
// a real correctness risk, not just clutter.
await rm(outputPath, { recursive: true, force: true });
await mkdir(outputPath, { recursive: true });

// esbuild has no Angular-CLI-style implicit assets pipeline -- copy
// public/** (i18n JSON, favicon, env.js placeholder) and index.html by
// hand. Must happen before the federation build so remoteEntry.json/
// importmap.json (written into the same outputPath) aren't clobbered.
await cp('apps/job-bank/public', outputPath, { recursive: true });
await cp('apps/job-bank/src/index.html', join(outputPath, 'index.html'));

// es-module-shims must be loaded via a plain classic <script> tag (see
// index.html) -- it has to already be active before the `type="module-shim"`
// entry script is even recognized. Angular's `polyfills` build option used
// to handle wiring this in; here it's a plain file copy of the package's
// own prebuilt browser bundle.
await cp(require.resolve('es-module-shims'), join(outputPath, 'es-module-shims.js'));

const result = await runEsBuildBuilder('apps/job-bank/federation.config.mjs', {
  workspaceRoot: process.cwd(),
  outputPath,
  tsConfig: 'apps/job-bank/tsconfig.federation.json',
  packageJson: 'package.json',
  dev,
  watch: false,
  adapterConfig: {
    plugins: [],
    // createEsBuildAdapter() defaults `frameworks` to [reactFrameworkPlugin()]
    // whenever this key is omitted entirely, not just when explicitly
    // requested -- must be an explicit empty array to actually opt out.
    frameworks: [],
  },
});
await result.close();

await esbuild.build({
  entryPoints: ['apps/job-bank/src/main.tsx'],
  outfile: join(outputPath, 'main.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  jsx: 'automatic',
  target: 'es2022',
  minify: !dev,
  sourcemap: true,
  define: {
    'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production'),
  },
});

console.log(`job-bank built to ${outputPath} (${dev ? 'development' : 'production'})`);
