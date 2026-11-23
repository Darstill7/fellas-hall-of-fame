// Read-only comparison of recovered normalized Sleeper trade history to Museum.
// Snapshot is evidence for human review, NOT a commissioner certificate or raw receipt.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const review=JSON.parse(fs.readFileSync('data-integrity/trade-recovery/2026-weeks1-12-provider-review-20261123.json','utf8'));
const museum=JSON.parse(fs.readFileSync('data/trade_museum_stage66.json','utf8'));
assert.equal(review.schema,'fellas-recovered-trade-provider-comparison-v1');
assert.equal(review.status,'RESEARCH_ONLY_NOT_CERTIFIED');
assert.equal(review.league_id,'1340027406009761792');
assert.equal(review.season_year,2026);
assert.deepEqual(review.queried_weeks,Array.from({length:12},(_,i)=>i+1));
assert.deepEqual(review.unqueried_weeks,[0],'Do not claim preseason completion');
const names=new Map([[1,'Stilly'],[2,'JMid'],[3,'Thommy'],[4,'Stew'],[5,'Scott'],[6,'Mitch'],[7,'Tony'],[8,'Stover'],[9,'Kuhl'],[10,'Birch']]);
const existing=new Map(museum.map(t=>[String(t.id),t]));
const providerIds=new Set(),missing=[],archived=[];
for(const t of review.trades){
 assert.match(t.id,/^\d+$/,'Stable provider transaction IDs required');
 assert(!providerIds.has(t.id),'Duplicate recovered trade ID '+t.id);providerIds.add(t.id);
 assert.equal(t.status,'complete','Only completed provider trades should be researched');
 assert(Number.isInteger(t.week)&&t.week>=1&&t.week<=12);
 assert(Array.isArray(t.participants)&&t.participants.length>=2);
 const managers=new Set(),rosters=new Set(),received=new Map(),sent=new Map();
 for(const side of t.participants){
  assert.equal(side.manager,names.get(side.roster_id),'Current 2026 roster ownership changed; re-review '+t.id);
  assert(!rosters.has(side.roster_id));rosters.add(side.roster_id);
  assert(!managers.has(side.manager));managers.add(side.manager);
  for(const p of side.received){
   assert(typeof p.player_id==='string'&&p.player_id.length>0&&p.reported_name?.trim());
   assert(!received.has(p.player_id),'Duplicate receiver for '+p.player_id);
   received.set(p.player_id,side.roster_id);
  }
  for(const p of side.sent){
   assert(typeof p.player_id==='string'&&p.player_id.length>0);
   assert(!sent.has(p.player_id),'Duplicate sending roster for '+p.player_id);
   sent.set(p.player_id,side.roster_id);
  }
 }
 assert(received.size>0,'Raw transfer-free transaction cannot enter player Museum');
 assert.equal(received.size,sent.size,'Received and sent ID counts differ '+t.id);
 for(const [player,recipient] of received){
  assert(sent.has(player),'Missing provider sender for '+player);
  assert.notEqual(recipient,sent.get(player),'Self-transfer '+player);
 }
 assert.equal(t.has_draft_pick_fields,false,'Forbidden draft field must trigger manual adjudication');
 if(existing.has(t.id)){
  archived.push(t);
  assert.equal(t.museum_status,'ARCHIVED');
  const prior=existing.get(t.id);
  const priorSides=new Set(prior.sides.map(s=>s.manager==='Tom'?'Thommy':s.manager));
  assert.equal(priorSides.size,managers.size,'Archived participant count drift '+t.id);
  for(const m of managers)assert(priorSides.has(m),'Archived identity drift '+t.id+' '+m);
 }else{
  missing.push(t);assert.equal(t.museum_status,'NOT_IN_MUSEUM');
  assert.equal(t.certification_status,'NOT_CERTIFIED');
 }
}
assert.equal(review.provider_completed_trade_count,review.trades.length);
assert.equal(review.already_archived,archived.length);
assert.equal(review.new_ids_needing_manual_review,missing.length);
assert.equal(review.trades.length,review.reported_week_counts.reduce((sum,w)=>sum+w.count,0));
assert.equal(missing.length,6,'The Nov 23 evidence snapshot contains six missing trade IDs; review before changing');
assert.deepEqual(missing.map(t=>t.id).sort(),[
 '1424524291990450196','1427488044335788032','1428829144581406720',
 '1428878310045151232','1428887570439245824','1428927046507069440'
].sort());
const faab=missing.filter(t=>t.participants.some(p=>p.faab_acquired!==null||p.faab_gave_up!==null));
assert.equal(faab.length,1,'All provider-reported FAAB side markers need a manual review flag');
assert.equal(faab[0].id,'1424524291990450196');
const stew=faab[0].participants.find(p=>p.manager==='Stew'),mitch=faab[0].participants.find(p=>p.manager==='Mitch');
assert.equal(stew.faab_acquired,2);
assert.equal(mitch.faab_gave_up,2);
assert.equal(review.trades.filter(t=>t.week===12).length,0,'This is a dated snapshot; do not infer future absence');
const precert=JSON.parse(fs.readFileSync('data-integrity/trade-recovery/2026-week11-precertification-20261123.json','utf8'));
assert.equal(precert.status,'PENDING_COMMISSIONER_REVIEW_NOT_PUBLISHABLE','No unapproved certification may be imported');
assert.equal(precert.trades.length,missing.length);
assert.deepEqual(precert.trades.map(t=>t.transaction_id).sort(),missing.map(t=>t.id).sort());
assert.equal(precert.provider_raw_crosscheck.source_integrity_issues,0);
for(const c of precert.trades){
 const t=missing.find(row=>row.id===c.transaction_id);
 assert(t);
 assert.equal(c.review_status,'NEEDS_COMMISSIONER_SIGNOFF');
 assert.equal(c.faab_reviewed,false,'Do not silently approve FAAB');
 assert.equal(c.sides.length,t.participants.length);
 for(const side of c.sides){
  const rawSide=t.participants.find(p=>p.roster_id===side.roster_id);
  assert(rawSide&&side.manager===rawSide.manager);
  assert.deepEqual(side.assets.map(a=>a.player_id).sort(),rawSide.received.map(a=>a.player_id).sort());
  assert(side.assets.every(a=>a.identity_status==='PROVIDER_REPORTED_NOT_COMMISSIONER_VERIFIED'));
 }
}
console.log('TRADE GAP EVIDENCE PASS: '+review.trades.length+' normalized completed provider trades, '+archived.length+' archived, '+missing.length+' unapproved missing. Week 0 and live Week 12 not certified.');
