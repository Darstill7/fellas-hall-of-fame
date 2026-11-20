// Validate each historical Sleeper roster proof against the still-ungraded PAR preview.
// This protects source provenance and does NOT promote transactions or compute PAR.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=process.cwd();
const preview=JSON.parse(fs.readFileSync(path.join(base,'data/trade_par_preview.json'),'utf8')).records;
const files=fs.readdirSync(path.join(base,'data')).filter(f=>/^trade_par_recovery_\d{4}_[a-z0-9_-]+_source_v1\.json$/.test(f)).sort();
assert.ok(files.length>=4,'Expected historical roster audit evidence for four source-researched assets');
let totalWeeks=0;
const rows=[];
for(const file of files){
 const d=JSON.parse(fs.readFileSync(path.join(base,'data',file),'utf8'));
 assert.equal(d.schema,'fellas-par-missing-starter-evidence-v1');
 assert.equal(d.status,'source_checked_pending_integration','Proof cannot bypass commissioner scoring review');
 assert.equal(d.sourcePlatform,'Sleeper');
 assert.ok(/^\d+$/.test(d.player.sleeperPlayerId),'Stable provider player ID required');
 const t=preview.find(t=>String(t.id)===d.tradeId);
 assert.ok(t,'Roster proof references an unknown trade');
 assert.equal(t.year,d.season);
 assert.equal(t.week,d.tradeWeek);
 assert.equal(t.date,d.tradeDate,'Trade date must match source exactly');
 assert.equal(t.complete,false,'Proof must not silently promote a trade');
 assert.equal(t.sides.length,2,'Current proof scope only supports two-manager trade');
 assert.ok(t.sides.some(s=>s.manager===d.manager&&s.unresolved.includes(d.player.name)),'Incoming unresolved asset and manager mismatch');
 const weeks=d.evidence.weeklyRosterObservations.filter(x=>x.week>d.tradeWeek).sort((a,b)=>a.week-b.week);
 const expected=Array.from({length:14-d.tradeWeek},(_,i)=>d.tradeWeek+i+1);
 assert.deepEqual(weeks.map(x=>x.week),expected,'Missing or duplicate later regular-season roster snapshot');
 assert.ok(weeks.every(x=>x.slot==='bench'||x.slot==='absent_from_roster_snapshot'),'Post-trade starter proof must be re-audited');
 assert.ok(weeks.every(x=>x.slot==='bench'?Number.isFinite(x.points):x.points===null),'Bench scores must be source numbers; absent roster cannot have player points');
 assert.equal(d.evidence.verifiedPostTradeStarts,0);
 assert.equal(d.evidence.verifiedPostTradeStarterPoints,0);
 totalWeeks+=weeks.length;
 rows.push({asset:d.player.name,manager:d.manager,trade:d.tradeId,weeks:weeks.length,bench:weeks.filter(x=>x.slot==='bench').length,absent:weeks.filter(x=>x.slot==='absent_from_roster_snapshot').length});
}
assert.equal(new Set(rows.map(r=>r.trade)).size,rows.length,'Duplicate source proofs for the same unresolved case need an explicit multi-asset model');
const summary='Historical PAR starter-proof audit: '+rows.length+' distinct source-backed zero-start cases across '+totalWeeks+' later-week roster snapshots; NONE promoted to qualified trade +/-.\n'+rows.map(r=>r.asset+' / '+r.manager+' / '+r.weeks+' checked / '+r.bench+' bench / '+r.absent+' absent').join('\n');
console.log(summary);
if(process.argv.includes('--github-summary')&&process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n### Historical player-starter proof\n\n'+summary.replaceAll('\n','  \n')+'\n');
