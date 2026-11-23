// Research only: observed received starter PF, NOT trade value or WAR.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const years=[2020,2021,2022,2023,2024,2025],round=n=>Math.round(n*100)/100;
const ledger=[],seen=new Set(),manager=new Map(),pairs=new Map();
const get=(m,k,init)=>{if(!m.has(k))m.set(k,init());return m.get(k)};
for(const year of years){
 const r=JSON.parse(fs.readFileSync(dir+'/'+year+'-ownership-review.json','utf8'));
 assert.equal(r.season,year);assert.equal(r.regular_lineup_source_differences.length,0);assert.equal(r.trade_results.length,r.source_completed_trades);
 for(const t of r.trade_results){
  assert(!seen.has(t.id));seen.add(t.id);assert(t.sides.length>=2);
  const hasPlayers=t.sides.some(s=>s.players.length>0);
  const sides=t.sides.map(s=>({manager:s.manager,regular:s.regular_pf,postseason:s.postseason_calendar_pf,starts:s.regular_starts,boundary:s.players.reduce((n,p)=>n+p.boundary.length,0),player_count:s.players.length}));
  const kind=!hasPlayers?'NONPLAYER_ONLY':sides.length!==2?'MULTI_TEAM':sides.some(s=>!s.player_count)?'PLAYER_FOR_NONPLAYER':'TWO_TEAM_PLAYER_EXCHANGE';
  ledger.push({year,id:t.id,week:t.week,kind,sides,nonplayer_assets:t.nonplayer_assets});
  for(const s of sides){
   const m=get(manager,s.manager,()=>({manager:s.manager,transactions:0,player_transactions:0,regular_pf:0,postseason_pf:0,boundary_starts:0,pair_eligible:0,raw_regular_delta:0}));
   m.transactions++;m.player_transactions+=hasPlayers?1:0;m.regular_pf+=s.regular;m.postseason_pf+=s.postseason;m.boundary_starts+=s.boundary;
  }
  // Only two-party player-for-player exchanges enter pairwise comparisons.
  // No arbitrary allocation of three-team production or dollar-to-point conversion.
  if(kind!=='TWO_TEAM_PLAYER_EXCHANGE')continue;
  const [a,b]=[...sides].sort((x,y)=>x.manager.localeCompare(y.manager));
  const key=JSON.stringify([a.manager,b.manager]);
  const p=get(pairs,key,()=>({a:a.manager,b:b.manager,trades:0,a_regular:0,b_regular:0,a_postseason:0,b_postseason:0,boundary_starts:0,receipts:[]}));
  p.trades++;p.a_regular+=a.regular;p.b_regular+=b.regular;p.a_postseason+=a.postseason;p.b_postseason+=b.postseason;p.boundary_starts+=a.boundary+b.boundary;
  p.receipts.push({year,id:t.id,a_regular:a.regular,b_regular:b.regular,a_postseason:a.postseason,b_postseason:b.postseason,boundary_starts:a.boundary+b.boundary,nonplayer_assets:t.nonplayer_assets});
  manager.get(a.manager).pair_eligible++;manager.get(b.manager).pair_eligible++;
  manager.get(a.manager).raw_regular_delta+=a.regular-b.regular;manager.get(b.manager).raw_regular_delta+=b.regular-a.regular;
 }
}
const pairRows=[...pairs.values()].map(p=>({...p,a_regular:round(p.a_regular),b_regular:round(p.b_regular),a_postseason:round(p.a_postseason),b_postseason:round(p.b_postseason),a_minus_b_regular:round(p.a_regular-p.b_regular)}));
const rows=[...manager.values()].map(m=>({...m,regular_pf:round(m.regular_pf),postseason_pf:round(m.postseason_pf),raw_regular_delta:round(m.raw_regular_delta)})).sort((a,b)=>b.raw_regular_delta-a.raw_regular_delta);
assert.equal(round(rows.reduce((n,m)=>n+m.raw_regular_delta,0)),0);
assert.equal(rows.reduce((n,m)=>n+m.pair_eligible,0),2*pairRows.reduce((n,p)=>n+p.trades,0));
const coverage={transactions:ledger.length,kinds:Object.fromEntries([...new Set(ledger.map(t=>t.kind))].map(k=>[k,ledger.filter(t=>t.kind===k).length])),boundary_starts:rows.reduce((n,m)=>n+m.boundary_starts,0)};
const report={status:'RESEARCH_ONLY_RAW_STARTER_PF_NOT_TRADE_VALUE',years,coverage,manager_summary:rows,pairwise:pairRows,transaction_ledger:ledger,limitations:['No replacement adjustment or grade','Acquisition and exit week candidates excluded','Postseason calendar includes consolation games','Nonplayer assets not priced','Three-team and nonplayer-only trades excluded from pairwise deltas','Two-party player exchanges with additional nonplayer components retain raw PF comparison only']};
fs.writeFileSync(dir+'/career-trade-return-research.json',JSON.stringify(report,null,2)+'\n');
console.log('CAREER TRADE COVERAGE '+JSON.stringify(coverage));
console.log('CAREER RAW TRADE RETURNS '+JSON.stringify(rows));
console.log('CAREER PAIRWISE RAW TRADE RETURNS '+JSON.stringify(pairRows.map(({receipts,...p})=>p)));
