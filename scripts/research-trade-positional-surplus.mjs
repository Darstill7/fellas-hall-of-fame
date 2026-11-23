// Research only: observed starter-floor surplus, not waiver replacement or causal WAR.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const years=[2020,2021,2022,2023,2024,2025];
const evidence=JSON.parse(fs.readFileSync(dir+'/boundary-kickoff-evidence-research.json','utf8'));
const career=JSON.parse(fs.readFileSync(dir+'/career-trade-return-research.json','utf8'));
const round=n=>Math.round(n*100)/100;
const key=(...x)=>x.join(':');
const supported=new Set(evidence.rows.filter(r=>r.status==='TIMING_SUPPORTS_CREDIT').map(r=>key(r.year,r.trade_id,r.roster,r.player_id,r.week)));
const quantile=(a,q)=>{const b=[...a].sort((x,y)=>x-y),i=(b.length-1)*q;return b[Math.floor(i)]+(b[Math.ceil(i)]-b[Math.floor(i)])*(i-Math.floor(i));};
const receipts=[],unresolved=[],benchmarks=[],transactions=[],managers=new Map(),seen=new Set();
for(const year of years){
 const own=JSON.parse(fs.readFileSync(dir+'/'+year+'-ownership-review.json','utf8'));
 const starts=JSON.parse(fs.readFileSync('data/player_starts_'+year+'.json','utf8'));
 const index=new Map(),groups=new Map();
 for(const w of starts.weeks.filter(w=>w.week<=own.regular_season_end)){
  for(const t of w.teams)for(const [pid,name,pos,points] of t.players){
   if(String(pid)==='0')continue;
   const k=key(w.week,t.roster,pid);assert(!index.has(k));index.set(k,{pos,points:Number(points),name});
   const g=key(w.week,pos);if(!groups.has(g))groups.set(g,[]);groups.get(g).push({key:k,pf:Number(points)});
  }
 }
 for(const [g,rows] of groups)benchmarks.push({year,week:Number(g.split(':')[0]),position:g.split(':')[1],count:rows.length,p25:round(quantile(rows.map(x=>x.pf),.25)),median:round(quantile(rows.map(x=>x.pf),.5))});
 for(const t of own.trade_results){
  const kind=career.transaction_ledger.find(x=>x.year===year&&x.id===t.id)?.kind;assert(kind);
  const sides=[];
  for(const s of t.sides){
   const ownReceipts=[],missing=[];
   for(const p of s.players){
    const rows=[...p.receipts.map(r=>({...r,boundary:false})),...p.boundary.filter(r=>supported.has(key(year,t.id,s.roster,p.player_id,r.week))).map(r=>({...r,boundary:true}))];
    for(const r of rows){
     if(r.week>own.regular_season_end)continue;
     const k=key(r.week,s.roster,p.player_id),unique=key(year,k);
     assert(!seen.has(unique),'Duplicate starter '+unique);seen.add(unique);
     const source=index.get(k);assert(source&&Math.abs(source.points-r.points)<.011,'Missing source starter '+unique);
     const peers=(groups.get(key(r.week,source.pos))||[]).filter(x=>x.key!==k).map(x=>x.pf);
     if(peers.length<4){missing.push({year,trade:t.id,manager:s.manager,week:r.week,player:p.player_id,position:source.pos,points:r.points,reason:'INSUFFICIENT_POSITION_PEERS'});continue;}
     const low=quantile(peers,.25),mid=quantile(peers,.5);
     const row={year,trade:t.id,manager:s.manager,week:r.week,player:p.player_id,name:source.name,position:source.pos,points:r.points,boundary:r.boundary,peer_count:peers.length,p25:round(low),median:round(mid),surplus_p25:round(r.points-low),surplus_median:round(r.points-mid)};
     receipts.push(row);ownReceipts.push(row);
    }
   }
   unresolved.push(...missing);
   const sum=k=>round(ownReceipts.reduce((n,r)=>n+r[k],0));
   sides.push({manager:s.manager,starts:ownReceipts.length,unresolved:missing.length,pf:sum('points'),surplus_p25:sum('surplus_p25'),surplus_median:sum('surplus_median')});
  }
  transactions.push({year,id:t.id,kind,sides});
  if(kind!=='TWO_TEAM_PLAYER_EXCHANGE'||sides.some(s=>s.unresolved))continue;
  const [a,b]=sides;
  for(const [x,y] of [[a,b],[b,a]]){
   if(!managers.has(x.manager))managers.set(x.manager,{manager:x.manager,trades:0,raw_delta:0,p25_delta:0,median_delta:0});
   const m=managers.get(x.manager);m.trades++;m.raw_delta+=x.pf-y.pf;m.p25_delta+=x.surplus_p25-y.surplus_p25;m.median_delta+=x.surplus_median-y.surplus_median;
  }
 }
}
const rows=[...managers.values()].map(m=>({...m,raw_delta:round(m.raw_delta),p25_delta:round(m.p25_delta),median_delta:round(m.median_delta)})).sort((a,b)=>b.p25_delta-a.p25_delta);
for(const k of ['raw_delta','p25_delta','median_delta'])assert.equal(round(rows.reduce((n,m)=>n+m[k],0)),0);
const coverage={credited_regular_starts:seen.size,benchmarked:receipts.length,unresolved:unresolved.length,eligible_two_team_trades:rows.reduce((n,m)=>n+m.trades,0)/2};
const report={status:'RESEARCH_ONLY_OBSERVED_STARTER_SURPLUS_NOT_TRUE_REPLACEMENT',coverage,manager_summary:rows,transactions,receipts,benchmarks,unresolved,limitations:['Uses actual same-week positional starter scores excluding focal start; p25 and median are descriptive proxies, not available waiver replacement','Includes scheduled-kickoff-supported boundary starts, not certified actual locks','Negative surplus retained','No bench or waiver counterfactual, keeper or nonplayer valuation','Multi-team trades excluded from pairwise ranking']};
fs.writeFileSync(dir+'/trade-positional-surplus-research.json',JSON.stringify(report,null,2)+'\n');
console.log('POSITIONAL SURPLUS COVERAGE '+JSON.stringify(coverage));
console.log('POSITIONAL SURPLUS MANAGERS '+JSON.stringify(rows));
