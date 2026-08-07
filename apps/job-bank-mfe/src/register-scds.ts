// Registers the SCDS custom elements (ScdsCard, ScdsMultiColumnList) once,
// as a side effect. Belongs here rather than in bootstrap.tsx: when
// federated, the shell mounts App.tsx / JobApplicationsList.tsx directly
// (see federation.config.mjs's `exposes`) and this app's own bootstrap.tsx
// never runs -- so each exposed entry point imports this module itself.
// Stencil's own loader guards against double-registering
// (customElements.get(tag) || customElements.define(...)), so importing
// this from both entry points is harmless even if both happen to load in
// the same page.
import { defineCustomElements } from '@tn4consulting/shared-ui-scds-core/loader';

defineCustomElements();
