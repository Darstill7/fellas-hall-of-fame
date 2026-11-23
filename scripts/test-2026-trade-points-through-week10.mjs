// Verify recovered 2026 source-backed scoring and preserve all historical values.
// This reads only files; no network or writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('data/trade_museum_stage66.json','utf8'));
const audit=JSON.parse(fs.readFileSync('data-integrity/trade-point-recalculations/2026-through-week10.json','utf8'));
const html=fs.readFileSync('analytics/trade-museum.html','utf8');
assert.equal(audit.schema,'fellas-2026-trade-starter-point-refresh-v1');
assert.equal(audit.status,'RESEARCH_RECALCULATED_REQUIRES_REVIEW');
assert.equal(audit.scoring_through_week,10);
assert.equal(data.length,51);
assert.equal(data.filter(t=>t.year===2026).length,7);
assert.equal(audit.audits.length,7);
const matched=new Set();
let differing=0;
for(const receipt of audit.audits){
 const trade=data.find(t=>String(t.id)===String(receipt.id));
 assert(trade&&trade.year===2026&&!matched.has(receipt.id),'Duplicate/unmatched 2026 source audit');
 matched.add(receipt.id);
 assert.equal(trade.week,receipt.week);
 assert.equal(trade.scoring_through_week,10);
 assert.match(trade.evidence,/completed Week 10|finalized Week 10/);
 for(const side of receipt.sides){
  const publicSide=trade.sides.find(s=>s.manager===side.manager);
  assert(publicSide,'Receiving side missing '+receipt.id+'/'+side.manager);
  const starts=side.starts;
  assert.equal(starts.length,side.current.starts);
  assert.equal(publicSide.started_games,starts.length);
  assert.equal(publicSide.raw_starter_points,side.current.points);
  assert(starts.every(s=>Number.isInteger(s.week)&&s.week>trade.week&&s.week<=10),'No pre-trade or provisional starts allowed');
  assert(starts.every(s=>side.received_ids.includes(s.player_id)),'Unreceived asset cannot earn credited starts');
  const sum=Math.round(starts.reduce((total,s)=>total+s.points,0)*100)/100;
  assert.equal(sum,publicSide.raw_starter_points,'Individual credited player weeks must reconcile exactly');
  if(side.prior.points!==side.current.points)differing++;
 }
}
assert.equal(matched.size,7);
assert(differing>=5,'Audit should visibly repair at least five outdated 2026 manager-side amounts');
assert.equal(data.filter(t=>t.year!==2026&&t.scoring_through_week!==undefined).length,0,'Historical finished seasons must not be rewritten');
assert.equal(data.filter(t=>t.year!==2026).length,44);
const embedded=html.match(/<script id="archive-data" type="application\/json">([\s\S]*?)<\/script>/);
assert(embedded);
assert.deepEqual(JSON.parse(embedded[1]),data,'Public HTML must precisely mirror reviewed source');
assert(html.includes('scoringLabel(t)'),'Trade cards and details must show scored-through-week');
assert(html.includes('starter pts verified through W'));
assert(!data.some(t=>t.year===2026&&t.comparison_status!=='raw_only'),'Existing trades remain ungraded');
console.log('W10 TRADE POINT PARITY PASS: 7 previously documented 2026 trades; '+differing+' manager sides with new values; 44 historical entries unchanged; complete per-player weekly attribution.');
