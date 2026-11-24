// Verify a historical package without querying live sources. Approval is explicit, never inferred from CI.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function verifyHistoricalPackage(pkg,{approvedHash=null}={}){
 const {content_sha256,...body}=pkg;
 assert.equal(hash(body),content_sha256,'Historical content fingerprint mismatch');
 assert.equal(pkg.schema,'fellas-historical-acquisitions-v1');
 assert.deepEqual(pkg.scope,{provider:'Sleeper',years:[2020,2025],phase:'regular'});
 assert.equal(pkg.status,'REVIEW_CANDIDATE_NOT_APPROVED');
 if(approvedHash!==null)assert.equal(content_sha256,approvedHash,'Historical package differs from approved fingerprint');
 const akey=a=>[a.year,Number(a.roster),String(a.player_id),String(a.id)].join(':');
 const rkey=r=>[r.year,r.week,Number(r.roster),String(r.player_id)].join(':');
 const index=new Map(pkg.acquisitions.map(a=>[akey(a),a]));
 assert.equal(index.size,2542);assert.equal(pkg.acquisitions.length,2542);
 const seen=new Set(),counts={STRICT_OWNERSHIP:0,SCHEDULE_SUPPORTED:0};
 for(const r of pkg.receipts){
  const k=rkey(r);assert(!seen.has(k),'Duplicate receipt '+k);seen.add(k);
  const a=index.get(akey({...r,id:r.acquisition_id}));assert(a,'Missing acquisition '+k);
  assert.equal(r.manager,a.manager);assert.equal(r.category,a.category);
  assert(Object.hasOwn(counts,r.confidence));counts[r.confidence]++;
  const source=r.confidence==='STRICT_OWNERSHIP'?a.receipts:a.boundary;
  assert(source.some(s=>s.week===r.week&&Math.round(s.points*100)===r.pf_cents),'Missing source scoring receipt '+k);
 }
 const exceptions=new Map();
 for(const e of pkg.exceptions){const k=rkey(e);assert(!seen.has(k),'Duplicate exception '+k);seen.add(k);exceptions.set(k,e);}
 assert.equal(seen.size,7374);assert.equal(counts.STRICT_OWNERSHIP,pkg.coverage.strict);assert.equal(counts.SCHEDULE_SUPPORTED,pkg.coverage.schedule_supported);assert.equal(exceptions.size,pkg.coverage.unresolved);assert.equal(pkg.coverage.observed,seen.size);
 const pending=new Set();
 for(const a of pkg.additional_review){assert(exceptions.has(a.key));assert(!pending.has(a.key));pending.add(a.key);assert.equal(a.confidence,'OPENING_PLAY_SUPPORTED_PENDING_APPROVAL');assert.equal(a.pf_cents,Math.round(exceptions.get(a.key).pf*100));}
 assert.equal(pending.size,pkg.coverage.pending_opening_play_review);
 const commissioner=pkg.commissioner_acquisition;assert(commissioner&&commissioner.category==='COMMISSIONER'&&commissioner.id==='768151870828122112');
 const event=pkg.drake_review.events.find(t=>t.id===commissioner.id);assert(event&&event.status==='complete'&&event.type==='commissioner'&&Number(event.adds[commissioner.player_id])===commissioner.roster);assert.equal(event.updated,commissioner.time);
 const exit=pkg.drake_review.events.find(t=>t.id===commissioner.exit_transaction);assert(exit&&exit.status==='complete'&&Number(exit.drops[commissioner.player_id])===commissioner.roster);assert.equal(exit.updated,commissioner.exit_ms);
 const commissionerPending=new Set();
 for(const r of pkg.commissioner_review){const e=exceptions.get(r.key);assert(e&&!pending.has(r.key)&&!commissionerPending.has(r.key));assert.equal(r.acquisition_id,commissioner.id);assert.equal(r.category,'COMMISSIONER');assert.equal(r.pf_cents,Math.round(e.pf*100));assert.equal(e.year,commissioner.year);assert.equal(Number(e.roster),commissioner.roster);assert.equal(String(e.player_id),commissioner.player_id);assert(e.week>=commissioner.week&&e.week<commissioner.exit_week);const lineup=pkg.drake_review.lineups.find(l=>l.week===e.week&&Number(l.roster)===commissioner.roster&&l.starter);assert(lineup);assert.equal(Math.round(lineup.points*100),r.pf_cents);commissionerPending.add(r.key);}
 assert.equal(commissionerPending.size,pkg.coverage.pending_commissioner_review);
 assert.equal(commissionerPending.size,2);
 for(const x of Object.values(pkg.source_fingerprints))assert.match(x,/^[a-f0-9]{64}$/);
 return {status:approvedHash?'APPROVED_FINGERPRINT_VERIFIED':'CANDIDATE_INTEGRITY_VERIFIED',observed:seen.size,strict:counts.STRICT_OWNERSHIP,schedule_supported:counts.SCHEDULE_SUPPORTED,exceptions:exceptions.size,pending:pending.size,commissioner_pending:commissionerPending.size,unreviewed:exceptions.size-pending.size-commissionerPending.size,sha256:content_sha256};
}
const file=process.argv[2];
if(file&&process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const pkg=JSON.parse(fs.readFileSync(file,'utf8'));
 const approvedHash=process.env.FELLAS_APPROVED_HISTORICAL_ACQUISITION_SHA256||null;
 if(process.env.FELLAS_REQUIRE_APPROVED_HISTORY==='1')assert(approvedHash,'Approved historical fingerprint required');
 console.log('HISTORICAL ACQUISITION OFFLINE VERIFICATION PASS '+JSON.stringify(verifyHistoricalPackage(pkg,{approvedHash})));
}
