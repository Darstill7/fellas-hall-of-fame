// Source-backed, zero-sum RECEIVED STARTER POINTS trade accounting.
// NOT PAR, a fair QB-vs-WR replacement comparison, a causal trade grade,
// keeper valuation, or an all-time assessment. No source file is mutated.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const research=read('data/trade_par_preview.json').records;
const bracket=read('data/playoff_explorer_verified_2016_2025_v1.json').seasons;
const first=Object.fromEntries(bracket.filter(s=>s.year>=2020&&s.year<=2025).map(s=>[s.year,Math.min(...s.matches.filter(m=>m.round==='opening').map(m=>m.week))]));
const complete=t=>t.year>=2020&&t.year<=2025&&t.complete&&t.sides.length===2&&t.sides.every(s=>s.fullyMatched);
const clean=research.filter(t=>complete(t)&&t.sides.every(s=>s.matched.every(p=>p.sourceWeeks.every(w=>w<first[t.year]))));
assert.equal(clean.length,13,'Verified period-clean baseline changed');
const previewFiles=['2025_ertz','2024_mostert','2024_aiyuk','2025_tuten','2024_dowdle','2024_ridley'];
const additions=[];
for(const slug of previewFiles){
 const proof=read('data/trade_par_recovery_'+slug+'_source_v1.json');
 assert.equal(proof.status,'source_checked_pending_integration');
 assert.equal(proof.evidence.verifiedPostTradeStarts,0);
 assert.equal(proof.evidence.verifiedPostTradeStarterPoints,0);
 const trade=research.find(t=>String(t.id)===proof.tradeId);
 assert.ok(trade&&trade.sides.length===2&&!complete(trade),'Research-only candidate must remain incomplete in original source');
 const unresolved=trade.sides.flatMap(s=>(s.unresolved||[]).map(asset=>({manager:s.manager,asset})));
 assert.deepEqual(unresolved,[{manager:proof.manager,asset:proof.player.name}],'Only one source-backed asset can be inferred as zero started points');
 const weeks=proof.evidence.weeklyRosterObservations.filter(x=>x.week>trade.week).map(x=>x.week);
 const expected=Array.from({length:first[trade.year]-trade.week-1},(_,i)=>trade.week+i+1);
 assert.deepEqual(weeks,expected,'Recovered proof does not cover entire postseason-clean observation window');
 for(const s of trade.sides){
  assert.ok(s.matched.every(p=>p.sourceWeeks.every(w=>w>trade.week&&w<first[trade.year])),'Other received-asset starts cross season cutoff');
  assert.ok(Math.abs(s.matched.reduce((v,p)=>v+p.points,0)-s.postTradePoints)<.03,'Received asset raw fantasy point components do not reconcile');
 }
 additions.push(trade);
}
assert.equal(additions.length,6);
const canonical=s=>s==='Thommy'?'Tom':s;
function tally(trades){
 const manager=new Map(),pairs=new Map();
 for(const t of trades){
  assert.equal(t.sides.length,2);
  for(let i=0;i<2;i++){
   const a=t.sides[i],b=t.sides[1-i],name=canonical(a.manager);
   assert.ok(Number.isFinite(a.postTradePoints)&&Number.isFinite(b.postTradePoints));
   const entry=manager.get(name)||{net:0,count:0};
   entry.net+=a.postTradePoints-b.postTradePoints;entry.count++;
   manager.set(name,entry);
  }
  const pair=t.sides.map(s=>canonical(s.manager)).sort();
  const key=pair.join('|'),firstSide=t.sides.find(s=>canonical(s.manager)===pair[0]),secondSide=t.sides.find(s=>canonical(s.manager)===pair[1]);
  const r=pairs.get(key)||{net:0,count:0};
  r.net+=firstSide.postTradePoints-secondSide.postTradePoints;r.count++;
  pairs.set(key,r);
 }
 const total=[...manager.values()].reduce((sum,s)=>sum+s.net,0);
 assert.ok(Math.abs(total)<.001,'Transaction point differences must sum to zero across all manager sides');
 return [...manager].map(([name,v])=>({name,net:+v.net.toFixed(2),trades:v.count})).sort((a,b)=>b.net-a.net);
}
const defaultRows=tally(clean),previewRows=tally([...clean,...additions]);
const lines=[
 '# Source-backed raw starter-point trade accounting','',
 '> This is an **observed production ledger only**. Acquired players credited after trade week and before the season-specific first playoff week. It is zero-sum by receiving manager but does **not** equate one QB point to one RB/WR opportunity, value an unstarted acquisition, estimate bench/waiver replacement, or measure managerial skill. Keeper and playoff values excluded.','',
 '| Manager | 13 originally fully matched period-clean trades: net raw points | 19-trade expanded research scenario: net raw points |',
 '|---|---:|---:|',
 ...[...new Set([...defaultRows.map(x=>x.name),...previewRows.map(x=>x.name)])].sort().map(name=>{
  const a=defaultRows.find(r=>r.name===name),b=previewRows.find(r=>r.name===name);
  const fmt=v=>v==null?'—':(v>=0?'+':'')+v.toFixed(2);
  return '| '+name+' | '+fmt(a?.net)+' | '+fmt(b?.net)+' |';
 }),
 '',
 'The 13-trade original sample uses verified received-player starter points. All 611 inherited source starter points were already reconciled separately with the season lineup ledgers; this view includes only period-clean observations. Six additional zero-start receiving-side receipts are expressly provisional, and the opponent must have complete source-matched points. The remaining historical transactions are not treated as zeros.',
 '',
 'This table is often easier to reproduce than PAR because no replacement-level assumption is required; it is also **less comparable across positions and starter opportunities**. Never label a positive raw net as “won the trade” without context.'
].join('\n');
console.log(lines);
if(process.argv.includes('--github-summary')&&process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines);
