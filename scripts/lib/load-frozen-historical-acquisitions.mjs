// Read-only frozen history loader; verify byte hashes and independent historical evidence.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyFinalHistory} from '../verify-final-historical-acquisitions.mjs';
const approved='5420fef3afbade40ac96ef98d7c0b48d506aa8daf9aff2e1f0ade20015073a08';
export function loadFrozenHistory(dir='data-integrity/frozen-acquisitions-2020-2025'){
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
 assert.equal(manifest.schema,'fellas-frozen-acquisitions-v1');
 assert.equal(manifest.status,'ARCHIVED_APPROVED_BASELINE');
 assert.equal(manifest.content_sha256,approved);
 const expected=['historical-acquisition-final-review.json','historical-acquisition-certification-candidate.json','final-historical-source-completeness-audit.json'];
 assert.deepEqual(manifest.files.map(f=>f.name).sort(),expected.slice().sort());
 const read=name=>{const bytes=fs.readFileSync(path.join(dir,name));assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.files.find(f=>f.name===name).sha256,'Frozen bytes changed: '+name);return JSON.parse(bytes)};
 const [final,candidate,audit]=expected.map(read);
 const verified=verifyFinalHistory(final,candidate,approved);
 assert.equal(verified.receipts,7374);assert.equal(verified.acquisitions,2543);assert.equal(verified.pf_cents,9153678);
 assert.equal(audit.status,'SOURCE_COMPLETENESS_PASS');assert.equal(audit.historical_package_sha256,approved);assert.deepEqual(audit.findings,[]);
 assert.deepEqual(audit.coverage,{provider_starts:7374,package_starts:7374,matched_acquisitions:2543,package_acquisitions:2543});
 return {final,candidate,verified,manifest};
}
