// Finalize a reviewed historical candidate without modifying its original evidence.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyHistoricalPackage} from './verify-historical-acquisition-package.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const root='data-integrity/historical-trade-draft-audits/';
const pkg=JSON.parse(fs.readFileSync(root+'historical-acquisition-certification-candidate.json','utf8'));
const verified=verifyHistoricalPackage(pkg);
assert.equal(verified.unreviewed,0);
assert.equal(verified.pending,9);assert.equal(verified.commissioner_pending,2);
const key=r=>[r.year,r.week,Number(r.roster),String(r.player_id)].join(':');
const ak=r=>[r.year,Number(r.roster),String(r.player_id),String(r.id)].join(':');
const acquisitions=[...pkg.acquisitions,pkg.commissioner_acquisition];
const index=new Map(acquisitions.map(a=>[ak(a),a]));
assert.equal(index.size,2543);
const exceptions=new Map(pkg.exceptions.map(e=>[key(e),e]));
const receipts=structuredClone(pkg.receipts);
for(const r of [...pkg.additional_review,...pkg.commissioner_review]){
 const e=exceptions.get(r.key);assert(e);
 const a=index.get(ak({...e,id:r.acquisition_id}));assert(a);assert.equal(a.category,r.category);
 const confidence=r.category==='COMMISSIONER'?(e.week===a.week?'COMMISSIONER_BOUNDARY_LINEUP_SUPPORTED':'COMMISSIONER_OWNERSHIP_SUPPORTED'):'OPENING_PLAY_SUPPORTED';
 receipts.push({year:e.year,week:e.week,roster:Number(e.roster),player_id:String(e.player_id),manager:a.manager,acquisition_id:a.id,category:a.category,pf_cents:r.pf_cents,confidence,evidence:r.evidence});
 exceptions.delete(r.key);
}
assert.equal(exceptions.size,0);assert.equal(receipts.length,7374);assert.equal(new Set(receipts.map(key)).size,7374);
const coverage={};for(const r of receipts)coverage[r.confidence]=(coverage[r.confidence]||0)+1;
assert.equal(coverage.STRICT_OWNERSHIP,6672);assert.equal(coverage.SCHEDULE_SUPPORTED,691);assert.equal(coverage.OPENING_PLAY_SUPPORTED,9);
assert.equal(coverage.COMMISSIONER_BOUNDARY_LINEUP_SUPPORTED,1);assert.equal(coverage.COMMISSIONER_OWNERSHIP_SUPPORTED,1);
const body={schema:'fellas-historical-acquisitions-final-v1',status:'FINAL_REVIEW_NOT_YET_FROZEN',scope:pkg.scope,source_candidate_sha256:pkg.content_sha256,coverage,acquisitions,receipts,exceptions:[],limitations:pkg.limitations.filter(s=>!s.includes('No additional opening-play')).concat(['Opening-play and schedule-supported evidence are not actual Sleeper lineup-lock logs. Commissioner acquisitions excluded from ordinary manager acquisition grades.'])};
const output={...body,content_sha256:hash(body)};
fs.writeFileSync(root+'historical-acquisition-final-review.json',JSON.stringify(output,null,2)+'\n');
console.log('HISTORICAL FINAL REVIEW PASS '+JSON.stringify({acquisitions:acquisitions.length,receipts:receipts.length,coverage,unresolved:0,sha256:output.content_sha256}));
