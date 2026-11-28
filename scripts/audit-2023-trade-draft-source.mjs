// Historical 2023 trade/draft source audit. Research-only; never modifies live Museum.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const league='946275261279055872'; // The Fellas 2023 Sleeper league ID, independently retrieved from connected league history
const museum=JSON.parse(fs.readFileSync('data/trade_museum_stage66.json','utf8')).filter(t=>t.year===2023);
const season=JSON.parse(fs.readFileSync('data/player_starts_2023.json','utf8'));
const drafts=JSON.parse(fs.readFileSync('data/v9_draft_engine.json','utf8')).filter(x=>x.year===2023);
assert.equal(museum.length,7);assert.equal(drafts.length,150);
assert.deepEqual(season.weeks.map(w=>w.week),Array.from({length:14},(_,i)=>i+1));
const managers=new Map([[1,'Stilly'],[2,'EvansBrandon'],[3,'Tom'],[4,'Stew'],[5,'Koble'],[6,'Mitch'],[7,'Tony'],[8,'Stover'],[9,'Kuhl'],[10,'Birch']]);
const starters=new Map(),idName=new Map();
for(const week of season.weeks){
 const owners=new Map();
 for(const team of week.teams){
  const roster=Number(team.roster);
  assert(managers.has(roster),'Unknown 2023 roster '+roster);
  assert(!owners.has(roster),'Duplicate roster in Week '+week.week);
  owners.set(roster,team);
  for(const [id,name,pos,p] of team.players){
   const sid=String(id);assert(Number.isFinite(p),'Incomplete started score '+week.week);
   if(!idName.has(sid))idName.set(sid,new Set());
   idName.get(sid).add(String(name));
  }
 }
 assert.equal(owners.size,10,'Incomplete Week '+week.week);
 starters.set(week.week,owners);
}
const get=async(url)=>{
 const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('Sleeper source unavailable: HTTP '+response.status+' '+url);
 return response.json();
};
const API='https://api.sleeper.app/v1/league/'+league;
const leagueInfo=await get(API);
assert.equal(String(leagueInfo.season),'2023','2023 league ID mismatch');
// Historical archived trade totals may include postseason starts. Preserve
// regular-season and Weeks 15-17 explicitly, never mix playoff PF into draft reg PF.
const playoff=new Map();
for(let w=15;w<=17;w++){
 const rows=await get(API+'/matchups/'+w);
 assert(Array.isArray(rows),'Missing playoff matchups Week '+w);
 const rosters=new Map();
 for(const r of rows){
  const roster=Number(r.roster_id);
  assert(managers.has(roster)&&!rosters.has(roster),'Duplicate or unknown playoff roster '+roster+' W'+w);
  assert(Array.isArray(r.starters)&&Array.isArray(r.starters_points)&&r.starters.length===r.starters_points.length,'Invalid playoff starters W'+w+' R'+roster);
  rosters.set(roster,{players:r.starters.map((id,index)=>[String(id),null,null,Number(r.starters_points[index])])});
 }
 playoff.set(w,rosters);
}
const all=[];
for(let week=0;week<=14;week++){
 const rows=await get(API+'/transactions/'+week);
 assert(Array.isArray(rows),'Invalid transaction response Week '+week);
 for(const t of rows)if(t.type==='trade'&&t.status==='complete')all.push({week,id:String(t.transaction_id),rosters:t.roster_ids.map(Number),adds:t.adds||{},drops:t.drops||{},faab:t.waiver_budget||[],picks:t.draft_picks||[]});
}
const byId=new Map(all.map(t=>[t.id,t]));
assert.equal(byId.size,all.length,'Duplicate trades in provider source');
const audit=[];
for(const archived of museum){
 const raw=byId.get(String(archived.id));
 assert(raw,'Museum ID has no source completed trade: '+archived.id);
 assert.equal(raw.week,archived.week,'Trade Week mismatch '+archived.id);
 const participantIds=new Set(raw.rosters);
 assert.equal(participantIds.size,archived.sides.length,'Participant count mismatch '+archived.id);
 const detail=[];
 for(const side of archived.sides){
  const roster=[...participantIds].find(id=>managers.get(id)===side.manager);
  assert(roster,'Manager roster not present on source transaction '+archived.id+'/'+side.manager);
  const received=Object.entries(raw.adds).filter(([,to])=>Number(to)===roster).map(([id])=>id);
  const displayAssets=side.assets.split(' + ');
  const warning=[];
  if(received.length!==displayAssets.length)warning.push('ASSET_COUNT_MISMATCH_OR_NONPLAYER_COMPONENT');
  const breakdown=received.map(id=>{
   const starts=[],playoffStarts=[];
   for(let w=raw.week+1;w<=17;w++){
    const lineup=w<=14?starters.get(w).get(roster):playoff.get(w).get(roster);
    if(!lineup)continue;
    for(const item of lineup.players)if(String(item[0])===id)
     (w<=14?starts:playoffStarts).push({week:w,points:Number(item[3])});
   }
   const totalPoints=xs=>Math.round(xs.reduce((a,b)=>a+b.points,0)*100)/100;
   return {player_id:id,observed_names:[...(idName.get(id)||[])].sort(),starts,playoff_starts:playoffStarts,post_trade_points:totalPoints(starts),post_trade_starts:starts.length,post_trade_playoff_points:totalPoints(playoffStarts),post_trade_playoff_starts:playoffStarts.length};
  });
  const total=Math.round(breakdown.reduce((a,b)=>a+b.post_trade_points,0)*100)/100;
  const games=breakdown.reduce((a,b)=>a+b.post_trade_starts,0);
  const playoffPoints=Math.round(breakdown.reduce((a,b)=>a+b.post_trade_playoff_points,0)*100)/100;
  const playoffGames=breakdown.reduce((a,b)=>a+b.post_trade_playoff_starts,0);
  const seasonTotal=Math.round((total+playoffPoints)*100)/100;
  const matchesRegular=Math.abs(total-Number(side.raw_starter_points))<=0.011&&games===side.started_games;
  const matchesAll=Math.abs(seasonTotal-Number(side.raw_starter_points))<=0.011&&games+playoffGames===side.started_games;
  if(!matchesRegular&&!matchesAll)warning.push('ARCHIVED_POINTS_OR_STARTS_DIFFER_AFTER_PLAYOFF_CHECK');
  if(!matchesRegular&&matchesAll)warning.push('ARCHIVED_TOTAL_INCLUDES_PLAYOFF_POINTS');

  if(breakdown.some(b=>b.observed_names.length===0))warning.push('SOME_RECEIVED_PLAYER_IDS_NOT_OBSERVED_AS_STARTER');
  detail.push({manager:side.manager,roster,assets:side.assets,provider_received_ids:received,archived_points:side.raw_starter_points,archived_starts:side.started_games,verified_post_week_points:total,verified_post_week_starts:games,verified_post_week_playoff_points:playoffPoints,verified_post_week_playoff_starts:playoffGames,verified_all_weeks_points:seasonTotal,verified_all_weeks_starts:games+playoffGames,archived_match_status:matchesRegular?'REGULAR_ONLY_MATCH':matchesAll?'REG_PLUS_PLAYOFF_MATCH':'REVIEW_MISMATCH_AFTER_PLAYOFFS',breakdown,warnings:warning});
 }
 audit.push({trade_id:archived.id,week:archived.week,date:archived.date,roster_ids:raw.rosters,faab:raw.faab,draft_picks:raw.picks,side_audits:detail});
}
const unarchived=all.filter(t=>!museum.some(m=>String(m.id)===t.id));
const picks=drafts.map(d=>{
 const roster=Number(d.team_id),manager=managers.get(roster);
 assert(manager===d.manager,'Draft manager/roster mapping differs '+d.overall);
 const seasonMatches=[];
 for(const week of season.weeks){
  for(const item of starters.get(week.week).get(roster).players)
   if(item[1]===d.player)seasonMatches.push({week:week.week,player_id:String(item[0]),points:Number(item[3])});
 }
 const summed=Math.round(seasonMatches.reduce((a,b)=>a+b.points,0)*100)/100;
 const pointsDiffer=Math.abs(summed-d.reg_starter_points)>0.011||seasonMatches.length!==d.reg_starts;
 return {overall:d.overall,round:d.round,manager:d.manager,player:d.player,keeper:d.keeper,
  traded_same_season:d.traded_same_season,stored_grade:d.grade,stored_status:d.status,
  current_reg_points:d.reg_starter_points,current_reg_starts:d.reg_starts,
  name_mapped_points:summed,name_mapped_starts:seasonMatches.length,
  name_match_receipts:seasonMatches,
  identity_quality:seasonMatches.length?'STARTER_NAME_MATCH_ONLY_NOT_DRAFT_PLAYER_ID_BOUND':'NO_STARTS_OR_NAME_NOT_MATCHED',
  status:pointsDiffer?'REVIEW_SOURCE_ATTRIBUTION_OR_NAME_MATCH':'NAME_MATCHED_WITHIN_TOLERANCE'};
});
const report={schema:'fellas-2023-trade-draft-historical-audit-v1',status:'RESEARCH_ONLY_NOT_CERTIFIED',
 league_id:String(leagueInfo.league_id||league),
 regular_season_through_week:14,playoff_weeks_checked:[15,16,17],
 methods:{trade:'Original complete Sleeper adds recipient ID credited only when that ID is a starter on receiving roster strictly after the trade week through Week 14, plus separately counted postseason Weeks 15-17',draft:'Preliminary player NAME-based original-roster regular season starter cross-check; not proof of original drafted ID or ownership continuity',grade:'Do not recalculate manager grade from raw PF; keep picks drafted, traded, keeper-cost, posttrade and waivers distinct'},
 counts:{archived_2023_trades:audit.length,source_completed_trades:all.length,unarchived_provider_trade_ids:unarchived.length,
  sides_with_discrepant_points_or_starts:audit.flatMap(x=>x.side_audits).filter(x=>x.archived_match_status==='REVIEW_MISMATCH_AFTER_PLAYOFFS').length,
  archived_sides_including_playoffs:audit.flatMap(x=>x.side_audits).filter(x=>x.archived_match_status==='REG_PLUS_PLAYOFF_MATCH').length,
  draft_picks_2023:picks.length,picks_requiring_name_or_score_review:picks.filter(p=>p.status!=='NAME_MATCHED_WITHIN_TOLERANCE').length},
 caveats:['Archived manager point totals were not presumed accurate','2023 original transaction ownership directions are checked, but all player display-name mappings are not independently ID-certified','Some archived 2023 picks might be traded or keepers; draft-grade policy should not use points after exiting original manager','Postseason Week 15-17 score attribution is distinguished from regular season, and no trade winners issued','Unarchived completed source transactions must be reconciled before claiming comprehensive trade coverage'],
 trades:audit,unarchived_completed_transactions:unarchived,draft_original_roster_name_crosscheck:picks};
fs.mkdirSync('data-integrity/historical-trade-draft-audits',{recursive:true});
fs.writeFileSync('data-integrity/historical-trade-draft-audits/2023-original-sleeper-review.json',JSON.stringify(report,null,2)+'\n');
console.log('2023 TRADE AUDIT '+JSON.stringify(report.counts));
for(const t of audit)console.log('TRADE '+t.trade_id+' W'+t.week+' '+t.side_audits.map(s=>s.manager+' '+s.archived_points+'/'+s.archived_starts+' → '+s.verified_post_week_points+'/'+s.verified_post_week_starts+' + playoffs '+s.verified_post_week_playoff_points+'/'+s.verified_post_week_playoff_starts+' = '+s.verified_all_weeks_points+'/'+s.verified_all_weeks_starts+' '+s.archived_match_status).join(' | '));
assert.equal(report.counts.sides_with_discrepant_points_or_starts,0,
 '2023 source PF divergence cannot be considered verified');
assert.equal(audit.reduce((sum,t)=>sum+t.side_audits.length,0),14,'Expected fourteen 2023 receiving sides');
console.log('2023 UNARCHIVED COMPLETE TRADE IDS '+JSON.stringify(unarchived.map(x=>({id:x.id,week:x.week,rosters:x.rosters,adds:x.adds,drops:x.drops,faab:x.faab,picks:x.picks}))));
console.log('DRAFT PICK NAME CROSSCHECK REVIEW QUEUE '+JSON.stringify(picks.filter(p=>p.status!=='NAME_MATCHED_WITHIN_TOLERANCE').map(p=>({
 pick:p.overall,round:p.round,manager:p.manager,player:p.player,
 keeper:p.keeper,traded:p.traded_same_season,reported_points:p.current_reg_points,
 lineup_name_points:p.name_mapped_points,reported_starts:p.current_reg_starts,lineup_starts:p.name_mapped_starts
}))));
console.log('IMPORTANT research-only: no production Trade Museum or official manager draft grades were changed.');
