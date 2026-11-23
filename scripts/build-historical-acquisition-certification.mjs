// Build a reviewable immutable historical acquisition package; no automatic promotion.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root='data-integrity/historical-trade-draft-audits/';
const read=n=>JSON.parse(fs.readFileSync(root+n+'.json','utf8'));
const sha=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const ledger=read('acquisition-hall-of-fame-research'),audit=read('unattributed-starter-audit-research'),timing=read('acquisition-kickoff-evidence-research'),independent=read('historical-near-kickoff-independent-review'),drake=read('kenyan-drake-2021-source-reconciliation');
const key=r=>[r.year,r.week,Number(r.roster),String(r.player_id)].join(':');
const akey=a=>[a.year,Number(a.roster),String(a.player_id),String(a.id)].join(':');
const cents=n=>{assert(Number.isFinite(n));return Math.round(n*100)};
const acquisitions=new Map(),receipts=new Map(),exceptions=[];
let checks=0;const eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)};
for(const a of ledger.ledger){
 const k=akey(a);assert(!acquisitions.has(k));acquisitions.set(k,a);
 eq(a.starts,a.receipts.length);
 eq(cents(a.strict_pf),a.receipts.reduce((n,r)=>n+cents(r.points),0));
 for(const r of a.receipts){
 const k=key({...a,week:r.week});assert(!receipts.has(k));
 receipts.set(k,{year:a.year,week:r.week,roster:Number(a.roster),player_id:a.player_id,manager:a.manager,acquisition_id:a.id,category:a.category,pf_cents:cents(r.points),confidence:'STRICT_OWNERSHIP'});
 }
}
eq(acquisitions.size,2542);eq(receipts.size,6672);
const missing=new Map(audit.rows.map(r=>[key(r),r]));eq(missing.size,702);
const reviewed=new Set();
for(const r of timing.rows){
 const k=key(r),base=missing.get(k);assert(base&&!reviewed.has(k)&&!receipts.has(k));reviewed.add(k);eq(cents(r.pf),cents(base.pf));
 if(!r.credit){exceptions.push({...base,timing_status:r.status});continue;}
 const a=acquisitions.get(akey({...r,id:r.credit.id}));assert(a);eq(a.category,r.credit.category);
 assert(base.candidates.some(c=>String(c.id)===String(a.id)));
 assert(a.boundary.some(b=>b.week===r.week&&cents(b.points)===cents(r.pf)));
 receipts.set(k,{year:r.year,week:r.week,roster:Number(r.roster),player_id:r.player_id,manager:a.manager,acquisition_id:a.id,category:a.category,pf_cents:cents(r.pf),confidence:'SCHEDULE_SUPPORTED',scheduled_kickoff_utc:r.scheduled_kickoff_utc,evidence:r.credit});
}
eq(reviewed.size,702);eq(receipts.size,7363);eq(exceptions.length,11);
const additional=[];
for(const e of exceptions){
 const candidates=independent.rows.filter(r=>r.year===e.year&&r.week===e.week&&String(r.player_id)===String(e.player_id));
 if(candidates.length!==1)continue;
 const r=candidates[0];if(r.status!=='OPENING_PLAY_TIMESTAMP_SUPPORTS_PRE_GAME_ACQUISITION_REVIEW')continue;
 const a=acquisitions.get(akey({...e,id:r.transaction_id}));assert(a);
 eq(cents(e.pf),cents(r.pf));eq(a.time,r.acquired_ms);
 const p=r.opening_kickoff_wallclock_candidates;eq(p.length,1);
 const km=Date.parse(p[0].timestamp);assert(Number.isFinite(km)&&a.time<km&&(!a.exit_ms||a.exit_ms>km));
 assert(a.boundary.some(b=>b.week===e.week&&cents(b.points)===cents(e.pf)));
 const overlaps=[...acquisitions.values()].filter(x=>x.year===e.year&&Number(x.roster)===Number(e.roster)&&String(x.player_id)===String(e.player_id)&&x.time<km&&(!x.exit_ms||x.exit_ms>km));
 eq(overlaps.length,1);eq(akey(overlaps[0]),akey(a));
 additional.push({key:key(e),acquisition_id:a.id,category:a.category,pf_cents:cents(e.pf),confidence:'OPENING_PLAY_SUPPORTED_PENDING_APPROVAL',evidence:{event:r.espn_event_id,source:r.summary_source,play:p[0]}});
}
// Preserve the original 2,542 acquisition ledger; record the newly discovered commissioner event separately.
const event=drake.events.find(t=>t.id==='768151870828122112');assert(event&&event.type==='commissioner'&&event.status==='complete'&&Number(event.adds['3242'])===3);
const exit=drake.events.find(t=>t.id==='772259735494889472');assert(exit&&exit.status==='complete'&&Number(exit.drops['3242'])===3&&exit.updated>event.updated);
const commissioner={year:2021,roster:3,manager:'Tom',player_id:'3242',name:'Kenyan Drake',category:'COMMISSIONER',id:event.id,week:event.bucket,time:event.updated,exit_transaction:exit.id,exit_ms:exit.updated,exit_week:exit.bucket,cost:null};
const commissionerReview=[];
for(const e of exceptions.filter(e=>e.year===2021&&String(e.player_id)==='3242'&&Number(e.roster)===3)){
 const lineup=drake.lineups.find(r=>r.week===e.week&&Number(r.roster)===3&&r.starter);assert(lineup);eq(cents(lineup.points),cents(e.pf));assert(e.week>=commissioner.week&&e.week<commissioner.exit_week);
 commissionerReview.push({key:key(e),acquisition_id:event.id,category:'COMMISSIONER',pf_cents:cents(e.pf),confidence:e.week===commissioner.week?'COMMISSIONER_BOUNDARY_LINEUP_SUPPORTED_PENDING_APPROVAL':'COMMISSIONER_OWNERSHIP_SUPPORTED_PENDING_APPROVAL',evidence:{transaction:event.id,exit:exit.id,lineup}});
}
eq(commissionerReview.length,2);eq(commissionerReview.reduce((n,r)=>n+r.pf_cents,0),640);
const baseline={schema:'fellas-historical-acquisitions-v1',status:'REVIEW_CANDIDATE_NOT_APPROVED',scope:{provider:'Sleeper',years:[2020,2025],phase:'regular'},coverage:{observed:7374,strict:6672,schedule_supported:691,unresolved:11,pending_opening_play_review:additional.length,pending_commissioner_review:commissionerReview.length},acquisitions:ledger.ledger,receipts:[...receipts.values()],exceptions,additional_review:additional,commissioner_acquisition:commissioner,commissioner_review:commissionerReview,drake_review:drake,source_fingerprints:{ledger:sha(ledger),audit:sha(audit),timing:sha(timing),independent:sha(independent),drake:sha(drake)},limitations:['Scheduled kickoff and opening play timestamps do not independently prove Sleeper lineup lock.','Historical keeper classification remains archive-derived.','No additional opening-play receipts credited until reviewed.','Missing acquisition category remains unknown rather than inferred.']};
eq(baseline.receipts.length+baseline.exceptions.length,baseline.coverage.observed);
const out={...baseline,content_sha256:sha(baseline)};
fs.writeFileSync(root+'historical-acquisition-certification-candidate.json',JSON.stringify(out,null,2)+'\n');
console.log('HISTORICAL ACQUISITION CERTIFICATION CANDIDATE PASS '+JSON.stringify({checks,coverage:out.coverage,content_sha256:out.content_sha256}));
