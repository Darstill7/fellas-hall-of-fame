// Build a live Trade Museum + Front Office trade summary from verified ownership receipts.
// Historical inputs must be produced by the historical ownership audit; no historical recalculation here.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='data-integrity/historical-trade-draft-audits/';
const read=n=>JSON.parse(fs.readFileSync(root+n+'.json','utf8'));
const historical=read('career-trade-return-research'),live=read('2026-live-trade-player-returns-research'),career=read('full-era-career-statistics');
const cutoff=live.completed_week;
assert.equal(career.live_watermark.completed_regular_week,Math.min(cutoff,14));assert.equal(live.season,2026);
assert.equal(live.trade_deadline_week,11);assert.equal(live.trade_window,cutoff>=11?'CLOSED':'OPEN');
assert.equal(live.regular_season_end_week,14);
const norm=n=>n==='Tom'?'Thommy':n;
const cents=n=>{assert(Number.isFinite(n));return Math.round(n*100)};
const ledger=historical.transaction_ledger.map(t=>({...t,sides:t.sides.map(s=>({...s,manager:norm(s.manager)}))}));
const historicalIds=new Set(ledger.map(t=>t.id));assert.equal(historicalIds.size,ledger.length);assert.equal(ledger.length,48);
const receipts=new Set();let starts=0;
for(const t of live.trades){
 assert(!historicalIds.has(t.id));historicalIds.add(t.id);assert(t.week<=Math.min(cutoff,live.trade_deadline_week)&&t.sides.length>=2);
 const sides=t.sides.map(s=>{
  const manager=norm(s.manager);assert(career.seasons.find(x=>x.year===2026).managers[manager]);
  let pf=0,count=0,regular=0,postseason=0,regularStarts=0,postseasonStarts=0;
  for(const p of s.players){
   let sum=0;
   for(const r of p.receipts){assert(r.week>t.week&&r.week<=cutoff);const key=[manager,p.player_id,r.week].join('|');assert(!receipts.has(key));receipts.add(key);sum+=cents(r.points);if(r.week<=14){regular+=cents(r.points);regularStarts++;}else{postseason+=cents(r.points);postseasonStarts++;}}
   assert.equal(sum,cents(p.pf));assert.equal(p.receipts.length,p.starts);pf+=sum;count+=p.starts;
  }
  assert.equal(pf,cents(s.pf));assert.equal(count,s.starts);starts+=count;
  return {manager,regular:regular/100,postseason:postseason/100,starts:regularStarts,postseason_starts:postseasonStarts,boundary:s.players.reduce((n,p)=>n+p.boundary.length,0),player_count:s.players.length,players:s.players};
 });
 assert.equal(new Set(sides.map(s=>s.manager)).size,sides.length);
 const has=sides.some(s=>s.player_count>0),kind=!has?'NONPLAYER_ONLY':sides.length!==2?'MULTI_TEAM':sides.some(s=>!s.player_count)?'PLAYER_FOR_NONPLAYER':'TWO_TEAM_PLAYER_EXCHANGE';
 ledger.push({year:2026,id:t.id,week:t.week,kind,sides,nonplayer_assets:t.nonplayer_assets});
}
const managers={},pairs={};
for(const t of ledger){
 for(const s of t.sides){const m=managers[s.manager]??={manager:s.manager,transactions:0,strict_regular_cents:0,strict_starts:0,live_postseason_cents:0,live_postseason_starts:0,pair_eligible:0,raw_delta_cents:0};m.transactions++;m.strict_regular_cents+=cents(s.regular);m.strict_starts+=s.starts;if(t.year===2026){m.live_postseason_cents+=cents(s.postseason);m.live_postseason_starts+=s.postseason_starts;}}
 if(t.kind!=='TWO_TEAM_PLAYER_EXCHANGE')continue;
 const [a,b]=t.sides.slice().sort((a,b)=>a.manager.localeCompare(b.manager)),key=JSON.stringify([a.manager,b.manager]),p=pairs[key]??={a:a.manager,b:b.manager,trades:0,a_cents:0,b_cents:0,receipts:[]};
 const ac=cents(a.regular),bc=cents(b.regular);p.trades++;p.a_cents+=ac;p.b_cents+=bc;p.receipts.push({year:t.year,id:t.id,a_cents:ac,b_cents:bc});
 managers[a.manager].pair_eligible++;managers[b.manager].pair_eligible++;managers[a.manager].raw_delta_cents+=ac-bc;managers[b.manager].raw_delta_cents+=bc-ac;
}
assert.equal(Object.values(managers).reduce((n,m)=>n+m.raw_delta_cents,0),0);
assert.equal(Object.values(managers).reduce((n,m)=>n+m.pair_eligible,0),2*Object.values(pairs).reduce((n,p)=>n+p.trades,0));
const report={status:'RESEARCH_ONLY_NOT_DEPLOYABLE',completedThrough:{year:2026,week:cutoff},trade_deadline:{week:live.trade_deadline_week,status:live.trade_window,returns_continue_after_close:true},historical_scope:[2020,2025],coverage:{historical_transactions:48,live_transactions:live.trades.length,live_strict_starts:starts},transaction_ledger:ledger,manager_summary:Object.values(managers).sort((a,b)=>b.raw_delta_cents-a.raw_delta_cents),pairwise:Object.values(pairs).map(p=>({...p,a_minus_b_cents:p.a_cents-p.b_cents})),limitations:['Strict received starter points only, not causal trade value or a grade.','Acquisition and exit boundary weeks excluded consistently.','Multi-team and player-for-nonplayer deals excluded from pairwise comparison.','Historical inputs remain research receipts pending immutable artifact certification.','Draft, waiver and keeper results not included.']};
fs.writeFileSync(root+'combined-trade-front-office-preview.json',JSON.stringify(report,null,2)+'\n');
console.log('COMBINED TRADE FRONT OFFICE PASS '+JSON.stringify({completedThrough:report.completedThrough,coverage:report.coverage,managers:Object.keys(managers).length,pairs:Object.keys(pairs).length}));
