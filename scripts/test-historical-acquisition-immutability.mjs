import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyHistoricalPackage} from './verify-historical-acquisition-package.mjs';
const pkg=JSON.parse(fs.readFileSync('data-integrity/historical-trade-draft-audits/historical-acquisition-certification-candidate.json','utf8'));
const approved=pkg.content_sha256;
let checks=0;
const reject=(mutate,rehash=false)=>{const copy=structuredClone(pkg);mutate(copy);if(rehash){delete copy.content_sha256;copy.content_sha256=createHash('sha256').update(JSON.stringify(copy)).digest('hex');}assert.throws(()=>verifyHistoricalPackage(copy,{approvedHash:approved}));checks++;};
assert.equal(verifyHistoricalPackage(pkg).status,'CANDIDATE_INTEGRITY_VERIFIED');checks++;
assert.equal(verifyHistoricalPackage(pkg,{approvedHash:approved}).observed,7374);checks++;
for(const mutate of [p=>p.receipts[0].pf_cents++,p=>p.acquisitions.pop(),p=>p.receipts.push(p.receipts[0]),p=>p.receipts[0].manager='Incorrect',p=>p.receipts[0].category='Incorrect',p=>p.exceptions.pop(),p=>p.scope.years[0]=2019,p=>p.source_fingerprints.ledger='0'.repeat(64)]){
 reject(mutate);reject(mutate,true);
}
const before=JSON.stringify(pkg);
for(const week of [10,11,12,14,15,17]){
 const active={year:2026,week,receipts:[{points:week*10}]};
 const combined={historical:pkg,active};
 assert.equal(verifyHistoricalPackage(combined.historical,{approvedHash:approved}).sha256,approved);assert.equal(JSON.stringify(pkg),before);checks+=2;
}
console.log('HISTORICAL IMMUTABILITY REGRESSION PASS '+JSON.stringify({checks,synthetic_active_weeks:[10,11,12,14,15,17]}));
