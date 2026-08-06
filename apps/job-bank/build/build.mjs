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
// `reactFrameworkPlugin()` wholesale -- its hardcoded dev/prod
// file-replacement map (e.g. 'react/cjs/react.production.min.js') is stale
// against React 19, which renamed its production CJS files (dropped the
// `.min` suffix) and now does its own dev/prod branching internally via
// `process.env.NODE_ENV` checks in react-dom/client.js's own `require()`
// calls -- confirmed by reading that file directly. esbuild's own
// NODE_ENV-based dead-code elimination (driven by the `dev`/`minify` flags
// below) already resolves the right file without any manual replacement
// needed.
//
// But `frameworks: []` below still opts in to `needsCommonJsPlugin: true`
// on its own (not just the stale file-replacement map) -- that flag is
// what makes `createNodeModulesEsbuildContext` load
// `@chialab/esbuild-plugin-commonjs` for the shared react/react-dom
// chunks (see node-modules-bundler.js). Without it, esbuild's own default
// CJS→ESM interop is used instead, which only synthesizes named exports it
// can statically prove are used *within the same build graph* -- a shared
// chunk built as its own standalone entry point (no importing consumers in
// scope to scan) has none to find, so it degrades to a single
// `export default` wrapping the whole `module.exports` object. Any
// consumer's `import { useState } from 'react'` against that chunk then
// fails at runtime with "does not provide an export named 'useState'"
// (confirmed live: inspected the actual deployed shared chunk, found
// exactly this shape). `@chialab/esbuild-plugin-commonjs` uses real static
// analysis of the CJS module's own exports (not the importer's usage), so
// it emits genuine named exports regardless of build-graph visibility --
// fixing the actual bug the stale-file-replacement workaround
// accidentally threw away. Passing a minimal custom framework object here
// keeps that flag without reintroducing the broken paths.

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

// `dev: true` here even in a production build -- deliberately NOT `dev`
// (the CLI-flag-derived value used below for the standalone bundle).
// This step's own minification is broken: confirmed the hard way
// (mfe-pot-shell, same underlying tooling, and reproduced against this
// app's own production build too) that a MINIFIED shared react.js chunk
// crashes at runtime ("TypeError: ... is not a function", every named
// React import resolving to `undefined`) while the default export stays
// correctly populated -- esbuild's minifier tree-shakes away the CJS
// module body `@chialab/esbuild-plugin-commonjs`'s named-export
// extraction depends on. `node-modules-bundler.js` hardcodes
// `minify: !dev` with no independent minify-only control, so the
// resulting `-dev.js`-suffixed filename on these specific vendor chunks
// (react.js, react-dom.js) is a cosmetic side effect of reusing the `dev`
// flag for this, not a sign anything else is running in dev mode -- this
// app's own standalone bundle below is still fully minified.
const result = await runEsBuildBuilder('apps/job-bank/federation.config.mjs', {
  workspaceRoot: process.cwd(),
  outputPath,
  tsConfig: 'apps/job-bank/tsconfig.federation.json',
  packageJson: 'package.json',
  dev: true,
  watch: false,
  adapterConfig: {
    plugins: [],
    // createEsBuildAdapter() defaults `frameworks` to [reactFrameworkPlugin()]
    // whenever this key is omitted entirely, not just when explicitly
    // requested. Not an empty array, though -- see the comment above:
    // this minimal object keeps `needsCommonJsPlugin: true` (the actual
    // fix for the shared react chunk's missing named exports) without
    // reintroducing the stale React-19 `fileReplacements` paths.
    frameworks: [{ needsCommonJsPlugin: true }],
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
