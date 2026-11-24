// Scope-lock a scoring-only Trade Museum release against current main.
// Any transaction ID, participant, received asset, source status, or
// historical receipt change must be reviewed in a DIFFERENT release.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const original=JSON.parse(execFileSync('git',['show','origin/main:data/trade_museum_stage66.json'],{encoding:'utf8'}));
const updated=JSON.parse(fs.readFileSync('data/trade_museum_stage66.json','utf8'));
const audit=JSON.parse(fs.readFileSync('data-integrity/trade-point-recalculations/2026-through-week10.json','utf8'));
if(updated.some(t=>t.year===2026&&t.scoring_through_week>10)){
 const cert=JSON.parse(fs.readFileSync('data-integrity/trade-certifications/2026-week11.json','utf8'));
 assert.equal(cert.status,'COMMISSIONER_APPROVED');
 const originalById=new Map(original.map(t=>[String(t.id),t]));
 const approved=new Map(cert.trades.map(t=>[String(t.transaction_id),t]));
 assert.equal(approved.size,6);
 assert.equal(new Set(updated.map(t=>String(t.id))).size,updated.length);
 const strip=t=>{const x=structuredClone(t);delete x.evidence;delete x.scoring_through_week;for(const s of x.sides){delete s.raw_starter_points;delete s.started_games}return x};
 for(const old of original){
  const next=updated.find(t=>String(t.id)===String(old.id));assert(next,'Removed existing receipt '+old.id);
  if(old.year!==2026)assert.deepEqual(next,old);
  else assert.deepEqual(strip(next),strip(old),'Existing asset or receipt metadata changed '+old.id);
 }
 for(const t of updated.filter(t=>!originalById.has(String(t.id)))){
  const a=approved.get(String(t.id));assert(a,'Unapproved addition '+t.id);
  assert.equal(t.year,2026);assert.equal(t.week,a.week);assert.equal(t.date,a.date);
  assert.equal(t.sides.length,a.sides.length);
  for(const s of a.sides){
   const v=t.sides.find(x=>x.manager===(s.manager==='Thommy'?'Tom':s.manager));assert(v);
   const faab=(a.faab_transfers||[]).filter(b=>b.receiver===s.roster_id).reduce((n,b)=>n+b.amount,0);
   assert.equal(v.assets,[...s.assets.map(x=>x.name),...(faab?[faab+' FAAB']:[])].join(' + '));
   assert.equal(v.source_status,'VERIFIED_SOURCE');
  }
  approved.delete(String(t.id));
 }
 // Support repeat validation after the same approved receipts reach main.
 for(const id of approved.keys())assert(originalById.has(id),'Approved receipt missing '+id);
 assert.equal(updated.length,57);
 assert.equal(updated.filter(t=>t.year!==2026).length,44);
 assert(updated.filter(t=>t.year===2026).every(t=>t.scoring_through_week===11&&t.comparison_status==='raw_only'));
 const html=fs.readFileSync('analytics/trade-museum.html','utf8');
 assert.deepEqual(JSON.parse(html.match(/<script id="archive-data" type="application\/json">([\s\S]*?)<\/script>/)[1]),updated);
 console.log('Certified receipt scope PASS: existing metadata preserved, approved additions only, historical receipts unchanged');
 process.exit(0);
}
assert.equal(original.length,51,'Main baseline changed; stop and rebase before approving');
assert.equal(updated.length,51,'Scoring-only release must add or remove zero trades');
assert.equal(audit.scoring_through_week,10);
const baseline=new Map(original.map(t=>[String(t.id),t]));
assert.equal(baseline.size,51);
assert.equal(new Set(updated.map(t=>String(t.id))).size,51);
const changes=new Set();
for(const current of updated){
 const old=baseline.get(String(current.id));
 assert(old,'Unknown ID in scoring-only release: '+current.id);
 if(current.year!==2026){
  assert.deepEqual(current,old,'Historical trade source changed: '+current.id);
  continue;
 }
 changes.add(String(current.id));
 assert.equal(current.scoring_through_week,10,'2026 cutoff must be explicit');
 // Limit the 2026 diff to exactly documented scorer fields. An ungraded trade
 // receipt cannot grow synthetic winner/grade/keeper/FAAB metadata here.
 const before=structuredClone(old),after=structuredClone(current);
 delete after.scoring_through_week;
 delete after.evidence;
 delete before.evidence;
 for(const t of [before,after])for(const side of t.sides){
  delete side.raw_starter_points;
  delete side.started_games;
 }
 assert.deepEqual(after,before,'Non-scoring trade metadata or received assets changed: '+current.id);
 assert(current.sides.every(s=>Number.isFinite(s.raw_starter_points)&&Number.isInteger(s.started_games)&&s.started_games>=0));
}
assert.equal(changes.size,7);
assert.deepEqual([...changes].sort(),audit.audits.map(x=>String(x.id)).sort());
const raw=fs.readFileSync('analytics/trade-museum.html','utf8');
const embedded=raw.match(/<script id="archive-data" type="application\/json">([\s\S]*?)<\/script>/);
assert(embedded,'Public Museum must embed source JSON');
assert.deepEqual(JSON.parse(embedded[1]),updated);
console.log('SCORING-ONLY RELEASE SCOPE PASS: original 51 IDs, all 44 historical trades unchanged, 7 existing 2026 sides only scorer-updated, no unapproved trades included.');
