// Historical 2023 three-manager 9-player + 49 FAAB + 2 pick exchange.
// Verify original Sleeper transaction and actual posttrade starts; never publish.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const league='946275261279055872',transactionId='1028057686711058432';
const caseStudy=JSON.parse(fs.readFileSync('data/v9_1_trade_status.json','utf8')).three_way_2023;
const archive=JSON.parse(fs.readFileSync('data/player_starts_2023.json','utf8'));
assert.equal(caseStudy.trade_id,transactionId);
const get=async url=>{
 const r=await fetch(url,{signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw Error('Source HTTP '+r.status+' '+url);
 return r.json();
};
const trades=await get('https://api.sleeper.app/v1/league/'+league+'/transactions/10');
const txn=trades.find(x=>String(x.transaction_id)===transactionId);
assert(txn&&txn.type==='trade'&&txn.status==='complete','Missing verified 2023 3-team transaction');
assert.deepEqual(new Set(txn.roster_ids.map(Number)),new Set([1,3,4]));
const received={Stilly:{roster:1,ids:['5045','5892','7526']},Tom:{roster:3,ids:['2133','5248','5967']},Stew:{roster:4,ids:['1426','2309','5850']}};
for(const [manager,side] of Object.entries(received)){
 const expected=caseStudy.managers[manager];
 assert.equal(Number(expected.team_id),side.roster);
 const actualIds=Object.keys(txn.adds||{}).filter(id=>Number(txn.adds[id])===side.roster).sort();
 assert.deepEqual(actualIds,side.ids.slice().sort(),'Sleeper receiving player IDs differ '+manager);
 const prior=Object.keys(txn.drops||{}).filter(id=>Number(txn.drops[id])===side.roster).sort();
 assert.equal(prior.length,3,'Each manager must send exactly 3 player IDs');
}
assert.equal(Object.keys(txn.adds||{}).length,9);
assert.equal(Object.keys(txn.drops||{}).length,9);
assert.equal(new Set(Object.keys(txn.adds)).size,9);
assert.deepEqual(txn.waiver_budget,[{amount:49,sender:4,receiver:3}],'Stew -> Tom 49 FAAB source mismatch');
const picks=txn.draft_picks||[];
assert.equal(picks.length,2,'Two future 2024 picks expected');
const normalized=picks.map(p=>({round:Number(p.round),season:String(p.season),original_roster:Number(p.roster_id),recipient:Number(p.owner_id),sender:Number(p.previous_owner_id)})).sort((a,b)=>a.round-b.round);
assert.deepEqual(normalized,[
 {round:3,season:'2024',original_roster:3,recipient:4,sender:3},
 {round:5,season:'2024',original_roster:4,recipient:3,sender:4}
]);
const weeks=new Map();
for(const w of archive.weeks){
 if(w.week<11||w.week>14)continue;
 weeks.set(w.week,new Map(w.teams.map(t=>[Number(t.roster),t.players.map(([id,name,pos,pts])=>[String(id),Number(pts),name])])));
}
for(let w=15;w<=17;w++){
 const rows=await get('https://api.sleeper.app/v1/league/'+league+'/matchups/'+w);
 const holders=new Map();
 for(const t of rows){
  assert(t.starters.length===t.starters_points.length,'Missing Week '+w+' starters');
  holders.set(Number(t.roster_id),t.starters.map((id,i)=>[String(id),Number(t.starters_points[i]),null]));
 }
 weeks.set(w,holders);
}
const summary=[];
for(const [manager,side] of Object.entries(received)){
 const actual=[];
 for(let w=11;w<=17;w++){
  const lineup=weeks.get(w).get(side.roster);
  if(!lineup)continue;
  for(const [id,points,name] of lineup)
   if(side.ids.includes(id))actual.push({week:w,player_id:id,points,player_name:name||null});
 }
 const regular=actual.filter(x=>x.week<=14),postseason=actual.filter(x=>x.week>=15);
 const score=list=>Math.round(list.reduce((a,b)=>a+b.points,0)*100)/100;
 const total=score(actual),prior=caseStudy.managers[manager];
 assert.equal(total,prior.sleeper_starter_points_weeks_11_17,manager+' previously reported post-trade PF mismatches Sleeper');
 assert.equal(actual.length,prior.sleeper_starts_weeks_11_17,manager+' previously reported post-trade starts mismatch Sleeper');
 summary.push({manager,roster:side.roster,received_player_ids:side.ids,
  received_names:prior.received,regular_season_points:score(regular),regular_starts:regular.length,
  postseason_points:score(postseason),postseason_starts:postseason.length,
  combined_points:total,combined_starts:actual.length,start_receipts:actual});
}
const report={schema:'fellas-2023-three-team-trade-verified-review-v1',
 status:'SOURCE_RECONCILED_NOT_CERTIFIED_NOT_PUBLISHABLE',
 year:2023,league_id:league,transaction_id:transactionId,week:10,
 provenance:'Original Sleeper complete transaction and posttrade started player IDs, compared to 2023 contemporaneous manually documented terms',
 participants:['Stilly','Tom','Stew'],players_traded:9,
 faab:[{amount:49,sender_manager:'Stew',recipient_manager:'Tom'}],
 draft_pick_transfers:[
  {season:2024,round:3,original_manager:'Tom',from:'Tom',to:'Stew'},
  {season:2024,round:5,original_manager:'Stew',from:'Stew',to:'Tom'}
 ],
 scope:'Week 11-14 regular-season credited starts plus Weeks 15-17 separately; no counterfactual grades or draft-pick value assigned',
 grades:'NONE_PENDING_PICK_VALUE_KEEPER_CONTINUITY_REVIEW',
 sides:summary};
fs.mkdirSync('data-integrity/historical-trade-draft-audits',{recursive:true});
fs.writeFileSync('data-integrity/historical-trade-draft-audits/2023-three-team-original-source-review.json',JSON.stringify(report,null,2)+'\n');
console.log('2023 3-WAY SOURCE MATCH PASS '+JSON.stringify({transaction_id:transactionId,players:9,faab:49,picks:2,sides:summary.map(s=>({manager:s.manager,regular:s.regular_season_points,playoffs:s.postseason_points,total:s.combined_points,starts:s.combined_starts}))}));
console.log('Source-reconciled researcher receipt only, not a new Museum entry or player-for-player trade grade.');
