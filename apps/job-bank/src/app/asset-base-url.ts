// Split across two statements deliberately: esbuild specially recognizes
// the inline pattern `new URL('...', import.meta.url)` and rewrites it for
// static asset bundling, which hijacks this computation in dev mode -- see
// mfe-pot-platform's CLAUDE.md and the Angular remote-providers.ts this
// replaces for the fuller story.
//
// Deliberately its own module, not inlined in App.tsx: `import.meta.url`
// is a syntax construct ts-jest can't downlevel to CommonJS (a hard
// "Cannot use 'import.meta' outside a module" error), so it needs to live
// somewhere App.spec.tsx can `jest.mock()` around rather than execute --
// the same evasion the old Angular version got for free via DI (its own
// remote-providers.ts, which had the identical line, was never imported by
// app.spec.ts, since tests injected CONTENT_CLIENT/JOB_BANK_API_CLIENT
// directly instead).
const moduleUrl = import.meta.url;
export const assetBaseUrl = new URL('.', moduleUrl).href;
