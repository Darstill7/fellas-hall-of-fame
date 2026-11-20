// Read-only crosswalk between incomplete PAR receiving sides and historical v9 side snapshots.
// Never promotes a trade: the archived raw starter points and observed PAR have different
// windows, identity requirements, ownership attribution, and replacement baselines.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const load=file=>JSON.parse(fs.readFileSync(path.join(process.cwd(),file),'utf8'));
const par=load('data/trade_par_preview.json');
const historical=load('data/v9_trade_engine.json');
assert.ok(Array.isArray(par.records)&&Array.isArray(historical.sides));
const key=(id,manager)=>String(id)+'|'+String(manager);
const historicalSides=new Map();
for(const side of historical.sides){
 const k=key(side.trade_id,side.manager);
 assert.ok(!historicalSides.has(k),'Duplicate historical side '+k);
 historicalSides.set(k,side);
}
const eligible=t=>t.year>=2020&&t.year<=2025&&t.complete===true&&t.sides.length===2&&t.sides.every(s=>s.fullyMatched===true&&Number.isFinite(s.postTradePAR));
const pending=par.records.filter(t=>t.year>=2020&&t.year<=2025&&t.sides.length===2&&!eligible(t));
const rows=[],missingHistorical=[];
for(const trade of pending)for(const side of trade.sides.filter(s=>!s.fullyMatched)){
 const original=historicalSides.get(key(trade.id,side.manager));
 if(!original){missingHistorical.push(key(trade.id,side.manager));continue}
 assert.equal(original.year,trade.year,'Historical side year mismatch: '+trade.id);
 const snapshot=Number.isFinite(original.starter_points)?original.starter_points:null;
 const starts=Number.isFinite(original.starts)?original.starts:null;
 const count=side.unresolved?.length??0;
 rows.push({
  id:String(trade.id),year:trade.year,week:trade.week,manager:side.manager,
  unresolved:[...(side.unresolved||[])],historicalStarterPoints:snapshot,
  historicalStarts:starts,sourceConfidence:original.confidence||'not stated',
  evidenceState:snapshot===null?'No historical numeric snapshot':snapshot>0?'Historical raw points present — window unverified':'Historical raw snapshot zero — NOT measured PAR',
  requires:'Exact Sleeper player identity, transaction chronology, starter week and owner, scoring, and PAR replacement baseline'
 });
}
const single=pending.filter(t=>t.sides.reduce((n,s)=>n+(s.unresolved?.length||0),0)===1);
const singleIds=new Set(single.map(t=>String(t.id)));
const singleRows=rows.filter(r=>singleIds.has(r.id));
const positive=singleRows.filter(r=>r.historicalStarterPoints>0);
const zero=singleRows.filter(r=>r.historicalStarterPoints===0);
const noData=singleRows.filter(r=>r.historicalStarterPoints===null);
assert.equal(single.length,14,'Single-asset queue changed: re-audit');
assert.equal(singleRows.length,14,'Each single-asset case needs one original receiving side');
assert.equal(positive.length+zero.length+noData.length,14);
assert.deepEqual(missingHistorical,[],'Pending source side absent from historical side ledger');
const lines=[
 '# Trade PAR — historical evidence crosswalk','',
 '> **Not a recalculation.** The historical raw starter-point snapshots are not interchangeable with strictly later-week, owned-player, position-relative post-trade PAR. Even a positive raw snapshot does not prove a qualified PAR contribution. No incomplete trade may enter +/- based on this crosswalk.','',
 '## One-unresolved-asset priority','',
 '- '+positive.length+' historical snapshots with positive raw starter points; investigate date, ownership, player ID, and score provenance.',
 '- '+zero.length+' zero raw snapshots; these mean no positive value in that snapshot, **not** verified zero later-week PAR.',
 '- '+noData.length+' historical snapshots without numeric data.',
 '',
 '| Season | Trade | Manager | Unmatched received asset | Prior raw starter points | Prior starts | Provenance label |',
 '|---|---|---|---|---:|---:|---|'
];
const esc=s=>String(s).replaceAll('|','\\|').replaceAll('\n',' ');
for(const row of singleRows.sort((a,b)=>b.year-a.year||a.week-b.week)){
 lines.push('| '+row.year+' | ['+row.id+'](../analytics/trade-museum.html?trade='+row.id+') | '+esc(row.manager)+' | '+esc(row.unresolved.join(', '))+' | '+(row.historicalStarterPoints??'Unavailable')+' | '+(row.historicalStarts??'Unavailable')+' | '+esc(row.sourceConfidence)+' |');
}
lines.push('','## Review gate','','Before changing a source grade: verify the stable player ID for **each** incoming asset, the exact transaction timestamp and receiving owner, which weeks the player started **after** that transaction while owned by that manager, the scored points in those weeks, and the applicable replacement baseline. Re-run complete two-side tests and zero-sum cross-manager checks. Do not add prior raw points directly to measured PAR.');
const report=lines.join('\n')+'\n';
console.log(report);
if(process.argv.includes('--github-summary')&&process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,report);
