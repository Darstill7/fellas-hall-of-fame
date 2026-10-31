// Guard against reintroducing inferred ownership after a trade or equal-timestamp conflict.
// The event ledger is a research artifact, not verified unowned status.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const src=fs.readFileSync('scripts/build-faab-ownership-events.mjs','utf8');
for(const term of [
 'const owner=new Map(),tainted=new Set()',
 'owner.delete(String(p.id));tainted.add(String(p.id))',
 "status='simultaneous_processing_uncertain';owner.delete(pid);tainted.add(pid)",
 "status='prior_ownership_invalidated'",
 '!tainted.has(pid)'
])assert.ok(src.includes(term),'Missing historical ownership quarantine guard: '+term);
const d=JSON.parse(fs.readFileSync('data-integrity/faab-observed-ownership-events-v1.json','utf8'));
assert.equal(d.status,'partial_event_ledger_not_certified_availability');
for(const e of d.rows)assert.ok(!['verified_unowned','confirmed_free_agent'].includes(e.status),'Unsupported free-agent certainty');
console.log('Ownership quarantine guard PASS: trades and equal-time claims cannot establish availability.');
