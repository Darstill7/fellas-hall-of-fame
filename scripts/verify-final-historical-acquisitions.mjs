// Independently verify final historical receipts against the original reviewed candidate.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyHistoricalPackage} from './verify-historical-acquisition-package.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const root='data-integrity/historical-trade-draft-audits/';
const key=r=>[r.year,r.week,Number(r.roster),String(r.player_id)].join(':');
export function verifyFinalHistory(final,candidate,approvedHash=null){
 const verified=verifyHistoricalPackage(candidate);
 assert.equal(verified.unreviewed,0);
 const {content_sha256,...body}=final;
 assert.equal(hash(body),content_sha256);
 if(approvedHash)assert.equal(content_sha256,approvedHash,'Approved historical fingerprint mismatch');
 assert.equal(final.schema,'fellas-historical-acquisitions-final-v1');
 assert.equal(final.status,'FINAL_REVIEW_NOT_YET_FROZEN');
 assert.deepEqual(final.scope,candidate.scope);
 assert.equal(final.source_candidate_sha256,candidate.content_sha256);
 assert.deepEqual(final.acquisitions,[...candidate.acquisitions,candidate.commissioner_acquisition]);
 assert.deepEqual(final.exceptions,[]);
 const old=new Map(candidate.receipts.map(r=>[key(r),r]));
 const exceptions=new Map(candidate.exceptions.map(r=>[key(r),r]));
 const reviews=new Map([...candidate.additional_review,...candidate.commissioner_review].map(r=>[r.key,r]));
 const seen=new Set(),counts={};let pf=0,checks=0;
 const eq=(a,b)=>{assert.deepEqual(a,b);checks++};
 for(const r of final.receipts){
  const k=key(r);assert(!seen.has(k));seen.add(k);
  if(old.has(k)){eq(r,old.get(k));}
  else{
   const e=exceptions.get(k),review=reviews.get(k);assert(e&&review);
   const a=final.acquisitions.find(a=>a.year===r.year&&Number(a.roster)===r.roster&&String(a.player_id)===String(r.player_id)&&a.id===review.acquisition_id);assert(a);
   eq(r.acquisition_id,review.acquisition_id);eq(r.category,a.category);eq(r.manager,a.manager);eq(r.pf_cents,Math.round(e.pf*100));eq(r.pf_cents,review.pf_cents);eq(r.evidence,review.evidence);
   eq(r.confidence,r.category==='COMMISSIONER'?(r.week===a.week?'COMMISSIONER_BOUNDARY_LINEUP_SUPPORTED':'COMMISSIONER_OWNERSHIP_SUPPORTED'):'OPENING_PLAY_SUPPORTED');
  }
  counts[r.confidence]=(counts[r.confidence]||0)+1;pf+=r.pf_cents;
 }
 eq(seen.size,7374);eq(final.receipts.length,7374);eq(final.acquisitions.length,2543);eq(counts,final.coverage);
 for(const k of [...old.keys(),...exceptions.keys()])assert(seen.has(k));
 return {checks,receipts:seen.size,acquisitions:final.acquisitions.length,pf_cents:pf,coverage:counts,sha256:content_sha256,approved:!!approvedHash};
}
if(process.argv[2]==='--verify'){
 const final=JSON.parse(fs.readFileSync(root+'historical-acquisition-final-review.json','utf8'));
 const candidate=JSON.parse(fs.readFileSync(root+'historical-acquisition-certification-candidate.json','utf8'));
 console.log('FINAL HISTORICAL INDEPENDENT VERIFICATION PASS '+JSON.stringify(verifyFinalHistory(final,candidate)));
}
