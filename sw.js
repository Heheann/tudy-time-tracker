// Backward-compatible shim for older registrations that still point to ./sw.js
// Keep query-string versioning to preserve deterministic cache-busting behavior.
const search = new URL(self.location.href).search;
importScripts(`./service-worker.js${search}`);
