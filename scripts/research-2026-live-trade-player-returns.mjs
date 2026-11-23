// In-season research: explicit completed-week cutoff; provider transaction IDs and ownership intervals.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const get=async p=>{const r=await fetch('https://api.sleeper.app/v1/'+p,{signal:AbortSignal.timeout(30000)});assert(r.ok,p+' '+r.status);return r.json()};
const id='1340027406009761792',year=2026;
const cutoff=Number(process.env.FELLAS_COMPLETED_WEEK);assert(Number.isInteger(cutoff)&&cutoff>=1&&cutoff<=17,'Set verified completed week explicitly');
const league=await get('league/'+id);assert.equal(String(league.season),String(year));
const deadline=11;assert.equal(Number(league.settings.trade_deadline),deadline,'Provider trade deadline differs from commissioner-confirmed Week 11');
const regularEnd=Number(league.settings.playoff_week_start)-1;assert.equal(regularEnd,14);
const state=await get('state/nfl');assert.equal(String(state.season),String(year));assert(Number(state.week)>cutoff,'Completed-week cutoff must precede provider NFL state week');
const names=new Map([[1,'Stilly'],[2,'JMid'],[3,'Tom'],[4,'Stew'],[5,'Scott'],[6,'Mitch'],[7,'Tony'],[8,'Stover'],[9,'Kuhl'],[10,'Birch']]);
const archive=JSON.parse(fs.readFileSync('data/player_starts_2026.json','utf8'));
const players=new Map(archive.weeks.flatMap(w=>w.teams.flatMap(t=>t.players.map(p=>[String(p[0]),p[1]]))));
const tx=[],weeks=new Map(),round=n=>Math.round(n*100)/100;
for(let w=0;w<=cutoff+1;w++){const rows=await get('league/'+id+'/transactions/'+w);assert(Array.isArray(rows));for(const t of rows)if(t.status==='complete')tx.push({...t,week:w});}
assert.equal(new Set(tx.map(t=>t.transaction_id)).size,tx.length);
for(let w=1;w<=cutoff;w++){const rows=await get('league/'+id+'/matchups/'+w);assert.equal(rows.length,10);const map=new Map();for(const r of rows){assert(names.has(Number(r.roster_id)));assert.equal(r.starters.length,r.starters_points.length);map.set(Number(r.roster_id),new Map(r.starters.map((p,i)=>[String(p),r.starters_points[i]])));}assert.equal(map.size,10);weeks.set(w,map);}
const lateTrades=tx.filter(t=>t.type==='trade'&&t.week>deadline);assert.equal(lateTrades.length,0,'Completed trade after confirmed deadline: review provider transaction timestamps before accepting');
const seen=new Set();
const trades=tx.filter(t=>t.type==='trade'&&t.week<=cutoff).map(t=>{
 const sides=t.roster_ids.map(r=>{
 const roster=Number(r);assert(names.has(roster));
 const acquired=Object.entries(t.adds||{}).filter(([p,to])=>Number(to)===roster).map(([p])=>{
 const exit=tx.filter(x=>Number(x.status_updated)>Number(t.status_updated)&&Number(x.drops?.[p])===roster).sort((a,b)=>Number(a.status_updated)-Number(b.status_updated))[0];
 const receipts=[],boundary=[];
 for(let w=Math.max(1,t.week);w<=cutoff;w++){
 if(exit&&w>exit.week)break;
 const points=weeks.get(w).get(roster).get(p);if(points===undefined)continue;assert(Number.isFinite(points));
 if(w===t.week||w===exit?.week){boundary.push({week:w,points,reason:w===t.week?'ACQUISITION_WEEK':'EXIT_WEEK'});continue;}
 const key=[w,roster,p].join(':');assert(!seen.has(key));seen.add(key);receipts.push({week:w,points,phase:w<=regularEnd?'regular':'postseason_calendar'});
 }
 return {player_id:p,name:players.get(p)||null,starts:receipts.length,pf:round(receipts.reduce((n,r)=>n+r.points,0)),receipts,boundary,exit_transaction:exit?.transaction_id??null};
 });
 const pf=round(acquired.reduce((n,p)=>n+p.pf,0));
 return {manager:names.get(roster),roster,pf,starts:acquired.reduce((n,p)=>n+p.starts,0),players:acquired.map(p=>({...p,package_share_pct:pf>0?round(p.pf/pf*100):null}))};
 });
 return {id:String(t.transaction_id),week:t.week,sides,nonplayer_assets:{faab:t.waiver_budget||[],draft_picks:t.draft_picks||[]}};
});
const report={status:'RESEARCH_ONLY_IN_SEASON_NOT_CERTIFIED',season:year,completed_week:cutoff,trade_deadline_week:deadline,trade_window:cutoff>=deadline?'CLOSED':'OPEN',regular_season_end_week:regularEnd,source:'Sleeper original matchups and completed transactions',trades,limitations:['Boundary weeks separately reported pending timing evidence','No bench points or points after first exit','Manager identities use archive roster mapping','Names may be unavailable for players not in archived starts']};
const dir='data-integrity/historical-trade-draft-audits';fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/2026-live-trade-player-returns-research.json',JSON.stringify(report,null,2)+'\n');
console.log('LIVE TRADE PLAYER COVERAGE '+JSON.stringify({completed_week:cutoff,trades:trades.length,strict_starts:seen.size}));
console.log('CHASE VELE TRADE '+JSON.stringify(trades.find(t=>t.id==='1413584172332654592')??null));
