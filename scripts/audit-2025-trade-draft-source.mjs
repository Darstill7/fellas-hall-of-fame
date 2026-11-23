// Historical 2025 trade/draft source audit. Research-only; never modifies live Museum.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const league='1181421235163095040'; // The Fellas 2025 Sleeper league ID, independently retrieved from connected league history
const museum=JSON.parse(fs.readFileSync('data/trade_museum_stage66.json','utf8')).filter(t=>t.year===2025);
const season=JSON.parse(fs.readFileSync('data/player_starts_2025.json','utf8'));
const drafts=JSON.parse(fs.readFileSync('data/v9_draft_engine.json','utf8')).filter(x=>x.year===2025);
assert.equal(museum.length,8);assert.equal(drafts.length,150);
assert.deepEqual(season.weeks.map(w=>w.week),Array.from({length:14},(_,i)=>i+1));
const managers=new Map([[1,'Stilly'],[2,'JMid'],[3,'Tom'],[4,'Stew'],[5,'Scott'],[6,'Mitch'],[7,'Tony'],[8,'Stover'],[9,'Kuhl'],[10,'Birch']]);
const starters=new Map(),idName=new Map();
for(const week of season.weeks){
 const owners=new Map();
 for(const team of week.teams){
  const roster=Number(team.roster);
  assert(managers.has(roster),'Unknown 2025 roster '+roster);
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
assert.equal(String(leagueInfo.season),'2025','2025 league ID mismatch');
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
   const starts=[];
   for(let w=raw.week+1;w<=14;w++){
    const lineup=starters.get(w).get(roster);
    for(const item of lineup.players)if(String(item[0])===id)
     starts.push({week:w,points:Number(item[3])});
   }
   return {player_id:id,observed_names:[...(idName.get(id)||[])].sort(),starts,post_trade_points:Math.round(starts.reduce((a,b)=>a+b.points,0)*100)/100,post_trade_starts:starts.length};
  });
  const total=Math.round(breakdown.reduce((a,b)=>a+b.post_trade_points,0)*100)/100;
  const games=breakdown.reduce((a,b)=>a+b.post_trade_starts,0);
  if(Math.abs(total-Number(side.raw_starter_points))>0.011||games!==side.started_games)warning.push('ARCHIVED_POINTS_OR_STARTS_DIFFER');
  if(breakdown.some(b=>b.observed_names.length===0))warning.push('SOME_RECEIVED_PLAYER_IDS_NOT_OBSERVED_AS_STARTER');
  detail.push({manager:side.manager,roster,assets:side.assets,provider_received_ids:received,archived_points:side.raw_starter_points,archived_starts:side.started_games,verified_post_week_points:total,verified_post_week_starts:games,breakdown,warnings:warning});
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
const report={schema:'fellas-2025-trade-draft-historical-audit-v1',status:'RESEARCH_ONLY_NOT_CERTIFIED',
 league_id:String(leagueInfo.league_id||league),
 regular_season_through_week:14,
 methods:{trade:'Original complete Sleeper adds recipient ID credited only when that ID is a starter on receiving roster strictly after the trade week through Week 14',draft:'Preliminary player NAME-based original-roster regular season starter cross-check; not proof of original drafted ID or ownership continuity',grade:'Do not recalculate manager grade from raw PF; keep picks drafted, traded, keeper-cost, posttrade and waivers distinct'},
 counts:{archived_2025_trades:audit.length,source_completed_trades:all.length,unarchived_provider_trade_ids:unarchived.length,
  sides_with_discrepant_points_or_starts:audit.flatMap(x=>x.side_audits).filter(x=>x.warnings.includes('ARCHIVED_POINTS_OR_STARTS_DIFFER')).length,
  draft_picks_2025:picks.length,picks_requiring_name_or_score_review:picks.filter(p=>p.status!=='NAME_MATCHED_WITHIN_TOLERANCE').length},
 caveats:['Archived manager point totals were not presumed accurate','2025 original transaction ownership directions are checked, but all player display-name mappings are not independently ID-certified','Some archived 2025 picks might be traded or keepers; draft-grade policy should not use points after exiting original manager','No playoffs scored here and no trade winners issued','Unarchived completed source transactions must be reconciled before claiming comprehensive trade coverage'],
 trades:audit,unarchived_completed_transactions:unarchived,draft_original_roster_name_crosscheck:picks};
fs.mkdirSync('data-integrity/historical-trade-draft-audits',{recursive:true});
fs.writeFileSync('data-integrity/historical-trade-draft-audits/2025-original-sleeper-review.json',JSON.stringify(report,null,2)+'\n');
console.log('2025 TRADE AUDIT '+JSON.stringify(report.counts));
for(const t of audit)console.log('TRADE '+t.trade_id+' W'+t.week+' '+t.side_audits.map(s=>s.manager+' '+s.archived_points+'/'+s.archived_starts+' → '+s.verified_post_week_points+'/'+s.verified_post_week_starts+' '+s.warnings.join(',')).join(' | '));
console.log('IMPORTANT research-only: no production Trade Museum or official manager draft grades were changed.');
