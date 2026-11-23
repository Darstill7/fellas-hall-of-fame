// Research only: 2024 original provider identity and ownership intervals.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const get=async path=>{const r=await fetch('https://api.sleeper.app/v1/'+path,{signal:AbortSignal.timeout(30000)});assert(r.ok,'Sleeper HTTP '+r.status+' '+path);return r.json()};
const target=Number(process.env.FELLAS_OWNERSHIP_YEAR||2024);
assert([2020,2021,2022,2023,2024,2025].includes(target));
const newer=await get('league/1181421235163095040');
assert.equal(String(newer.season),'2025');
let id='1181421235163095040',cursor=newer;
for(let year=2025;year>target;year--){id=String(cursor.previous_league_id);cursor=await get('league/'+id);assert.equal(String(cursor.season),String(year-1));}
const league=await get('league/'+id);
assert.equal(String(league.season),String(target));
const playoffStart=Number(league.settings.playoff_week_start);
assert.equal(playoffStart,target<=2021?14:15);
const seasonEnd=target===2020?16:17;
const names=new Map([[1,'Stilly'],[2,target<=2023?'EvansBrandon':'JMid'],[3,'Tom'],[4,'Stew'],[5,target<=2023?'Koble':'Scott'],[6,'Mitch'],[7,'Tony'],[8,'Stover'],[9,'Kuhl'],[10,'Birch']]);
const archive=JSON.parse(fs.readFileSync('data/trade_museum_stage66.json','utf8')).filter(t=>t.year===target);
const starts=JSON.parse(fs.readFileSync('data/player_starts_'+target+'.json','utf8'));
assert.equal(archive.length,({2020:5,2021:10,2022:6,2023:7,2024:8,2025:8})[target]);
assert.deepEqual(starts.weeks.map(w=>w.week),Array.from({length:14},(_,i)=>i+1));
const transactions=[];
for(let w=0;w<=seasonEnd;w++){
 const rows=await get('league/'+id+'/transactions/'+w);
 assert(Array.isArray(rows));
 for(const t of rows)if(t.status==='complete')transactions.push({...t,week:w});
}
const ids=new Set();for(const t of transactions){assert(!ids.has(String(t.transaction_id)),'Duplicate transaction ID');ids.add(String(t.transaction_id));}
const trades=transactions.filter(t=>t.type==='trade');
const matchups=new Map();
const sourceDifferences=[];
for(let w=1;w<=17;w++){
 const rows=await get('league/'+id+'/matchups/'+w);
 assert(Array.isArray(rows));
 const rosters=new Map();
 for(const r of rows){
  assert(names.has(Number(r.roster_id))&&!rosters.has(Number(r.roster_id)));
  assert.equal(r.starters.length,r.starters_points.length);
  const m=new Map();
  for(let i=0;i<r.starters.length;i++){const p=String(r.starters[i]);if(p==='0')continue;assert(Number.isFinite(r.starters_points[i]));assert(!m.has(p));m.set(p,r.starters_points[i]);}
  rosters.set(Number(r.roster_id),m);
 }
 matchups.set(w,rosters);
 if(w<=14){
  assert.equal(rosters.size,10);
  const historical=starts.weeks[w-1].teams;
  assert.equal(new Set(historical.map(t=>Number(t.roster))).size,10);
  for(const team of historical){
   const actual=rosters.get(Number(team.roster));
   const saved=new Map(team.players.filter(p=>String(p[0])!=='0').map(p=>[String(p[0]),Number(p[3])]));
   for(const p of new Set([...actual.keys(),...saved.keys()])){
    if(!actual.has(p)||!saved.has(p)||Math.abs(actual.get(p)-saved.get(p))>0.011)sourceDifferences.push({week:w,roster:team.roster,player_id:p,provider:actual.get(p)??null,archive:saved.get(p)??null});
   }
  }
 }
}
const round=n=>Math.round(n*100)/100;
const results=[];
const missing=trades.filter(t=>!archive.some(a=>String(a.id)===String(t.transaction_id)));
const recovered=missing.map(t=>({id:String(t.transaction_id),week:t.week,sides:t.roster_ids.map(r=>({manager:names.get(Number(r)),assets:null,raw_starter_points:null,started_games:null}))}));
for(const a of [...archive,...recovered]){
 const t=trades.find(x=>String(x.transaction_id)===String(a.id));
 assert(t,'Missing archived transaction '+a.id);
 assert.equal(t.week,a.week);
 assert.equal(t.roster_ids.length,a.sides.length);
 const sideAudits=[];
 for(const side of a.sides){
  const roster=t.roster_ids.find(r=>names.get(Number(r))===side.manager);
  assert(roster,'Unknown recipient '+side.manager);
  const players=[];
  for(const [pid,to] of Object.entries(t.adds||{})){
   if(Number(to)!==Number(roster))continue;
   // End attribution at the first subsequent completed exit, even if reacquired later.
   const exit=transactions.filter(x=>String(x.transaction_id)!==String(t.transaction_id)&&Number(x.status_updated)>Number(t.status_updated)&&Number(x.drops?.[pid])===Number(roster)).sort((a,b)=>Number(a.status_updated)-Number(b.status_updated))[0];
   const receipts=[],boundary=[];
   for(let w=Math.max(1,t.week);w<=17;w++){
    if(exit&&w>exit.week)break;
    const p=matchups.get(w)?.get(Number(roster))?.get(pid);
    if(p===undefined)continue;
    const receipt={week:w,points:p};
    if(w===t.week||w===exit?.week)boundary.push({...receipt,reason:w===t.week?'ACQUISITION_WEEK_LOCK_PROOF_REQUIRED':'EXIT_WEEK_LOCK_PROOF_REQUIRED'});
    else receipts.push(receipt);
   }
   players.push({player_id:pid,acquired_transaction:String(t.transaction_id),acquired_status_updated:t.status_updated,exit_transaction:exit?String(exit.transaction_id):null,exit_week:exit?.week??null,receipts,boundary});
  }
  const receipts=players.flatMap(p=>p.receipts),regular=receipts.filter(r=>r.week<playoffStart),post=receipts.filter(r=>r.week>=playoffStart);
  sideAudits.push({manager:side.manager,roster,archive_assets:side.assets,archive_points:side.raw_starter_points,archive_starts:side.started_games,regular_pf:round(regular.reduce((n,r)=>n+r.points,0)),regular_starts:regular.length,postseason_calendar_pf:round(post.reduce((n,r)=>n+r.points,0)),postseason_calendar_starts:post.length,players});
 }
 results.push({id:String(t.transaction_id),week:t.week,source_only:!archive.some(a=>String(a.id)===String(t.transaction_id)),sides:sideAudits,nonplayer_assets:{faab:t.waiver_budget||[],draft_picks:t.draft_picks||[]}});
}
const report={status:'RESEARCH_ONLY_NOT_CERTIFIED',league_id:id,season:target,regular_season_end:playoffStart-1,archive_trades:archive.length,source_completed_trades:trades.length,unarchived_trades:trades.filter(t=>!archive.some(a=>String(a.id)===String(t.transaction_id))).map(t=>({id:String(t.transaction_id),week:t.week})),regular_lineup_source_differences:sourceDifferences,trade_results:results,limitations:['Acquisition and exit weeks excluded pending lock-time evidence','Postseason calendar points not necessarily championship-bracket points','No replacement-adjusted grades','Roster identity mapping must be crosschecked with provider usernames before publication']};
fs.mkdirSync('data-integrity/historical-trade-draft-audits',{recursive:true});
fs.writeFileSync('data-integrity/historical-trade-draft-audits/'+target+'-ownership-review.json',JSON.stringify(report,null,2)+'\n');
console.log(target+' SOURCE RESEARCH '+JSON.stringify({league:id,trades:trades.length,archived:archive.length,unarchived:report.unarchived_trades,sourceDifferences:sourceDifferences.length,boundaryStarts:results.flatMap(t=>t.sides).flatMap(s=>s.players).reduce((n,p)=>n+p.boundary.length,0)}));
for(const t of results.filter(t=>t.source_only))console.log('RECOVERED SOURCE TRADE '+JSON.stringify(t));
for(const t of results)console.log('TRADE '+t.id+' '+JSON.stringify(t.sides.map(s=>({manager:s.manager,archive:s.archive_points,regular:s.regular_pf,postseason:s.postseason_calendar_pf,players:s.players.map(p=>({id:p.player_id,exit:p.exit_transaction,boundary:p.boundary}))}))));
