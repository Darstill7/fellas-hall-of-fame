// Independent ZERO-SUM report of 18/24 source-rebuilt RAW received starter points.
// The generator separately rechecks all source player-start rows, including
// original five playoff-mixed trades corrected only for raw scoring.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const ledger=JSON.parse(fs.readFileSync('data/trade_raw_starter_accounting_2020_2025_v1.json','utf8'));
assert.equal(ledger.schema,'fellas-trade-raw-starter-accounting-2020-2025-v1');
assert.equal(ledger.status,'research_only_source_reconciled_raw_starter_points_not_trade_grades');
assert.equal(ledger.baselineFullyMatchedTrades,18);
assert.equal(ledger.provisionalZeroStartTrades,6);
assert.equal(ledger.postseasonStartsExcludedFromRaw,14);
assert.equal(ledger.previouslyPARContaminatedTradesRepairedForRawOnly,5);
const verified=ledger.rows.filter(row=>row.sourceCategory==='original_fully_matched');
const provisional=ledger.rows.filter(row=>row.sourceCategory==='source_checked_zero_start_provisional');
assert.equal(verified.length,18);assert.equal(provisional.length,6);assert.equal(ledger.rows.length,24);
function results(rows){
 const owners=new Map();
 for(const trade of rows){
  assert.equal(trade.sides.length,2,'Each trade needs two receiving sides');
  for(let k=0;k<2;k++){
   const a=trade.sides[k],b=trade.sides[1-k];
   assert.ok(Number.isFinite(a.receivedStarterPoints)&&Number.isFinite(b.receivedStarterPoints));
   const manager=a.manager==='Thommy'?'Tom':a.manager;
   owners.set(manager,(owners.get(manager)||0)+a.receivedStarterPoints-b.receivedStarterPoints);
  }
 }
 const total=[...owners.values()].reduce((sum,n)=>sum+n,0);
 assert.ok(Math.abs(total)<.001,'Raw received-starter point comparisons must be zero-sum across each trade');
 return owners;
}
const base=results(verified),expanded=results(ledger.rows);
assert.equal(base.size,8);assert.equal(expanded.size,8);
assert.ok(Math.abs(base.get('Kuhl')-306.60)<.001);
assert.ok(Math.abs(expanded.get('Kuhl')-336.90)<.001);
const score=value=>value===undefined?'—':(value>=0?'+':'')+value.toFixed(2);
const report=[
 '# Historical trade RAW starter production: 18 matched / 24 with research recoveries','',
 '> Source-backed fantasy points credited only after trade week and before each season’s verified playoff opening. This is NOT position- or FLEX-adjusted, does NOT infer manager skill, and does NOT assign any value to unstarted keepers, bench players, picks or alternative trades. Experimental PAR remains a separate 13/19 season-clean analysis.',
 '',
 '| Manager | 18 originally fully matched raw-point trade returns | 24-trade source-backed research preview |',
 '|---|---:|---:|',
 ...[...new Set([...base.keys(),...expanded.keys()])].sort().map(name=>'| '+name+' | '+score(base.get(name))+' | '+score(expanded.get(name))+' |'),
 '',
 '- Five original 2020–2021 trades with postseason Week 14 contamination can be corrected for **raw starter points** by removing 14 source-identified playoff starter observations; this correction cannot be applied directly to their unknown weekly replacement-adjusted PAR.',
 '- Both raw point samples are zero-sum at the trade level, but not normalized for position, opportunity, keeper or replacement.',
 '- Source rebuild in \`scripts/build-trade-raw-starter-ledger.mjs\` independently verifies these values from the year/week/manager/player starter records.'
].join('\n');
console.log(report);
if(process.argv.includes('--github-summary')&&process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,report+'\n');
