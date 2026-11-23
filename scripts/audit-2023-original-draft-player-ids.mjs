// 2023 draft audit bound to original Sleeper provider player IDs.
// Read-only research; grade is NOT official and no public output is modified.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const league='946275261279055872',draftId='946275261279055873';
const model=JSON.parse(fs.readFileSync('data/v9_draft_engine.json','utf8')).filter(p=>p.year===2023);
const season=JSON.parse(fs.readFileSync('data/player_starts_2023.json','utf8'));
assert.equal(model.length,150);
assert.deepEqual(season.weeks.map(w=>w.week),Array.from({length:14},(_,i)=>i+1));
const managers=new Map([[1,'Stilly'],[2,'EvansBrandon'],[3,'Tom'],[4,'Stew'],[5,'Koble'],[6,'Mitch'],[7,'Tony'],[8,'Stover'],[9,'Kuhl'],[10,'Birch']]);
const api=async url=>{
 const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('Sleeper HTTP '+response.status+' at '+url);
 return response.json();
};
const board=await api('https://api.sleeper.app/v1/draft/'+draftId+'/picks');
assert(Array.isArray(board)&&board.length===150,'Draft board missing picks');
const leagueInfo=await api('https://api.sleeper.app/v1/league/'+league);
assert.equal(String(leagueInfo.season),'2023');
const byOverall=new Map(board.map(p=>[Number(p.pick_no),p]));
assert.equal(byOverall.size,150,'Draft pick numbers must be unique');
const rosterStarts=new Map(),allStarts=new Map();
for(const week of season.weeks){
 const seen=new Set();
 for(const team of week.teams){
  const roster=Number(team.roster);
  assert(managers.has(roster)&&!seen.has(roster));
  seen.add(roster);
  for(const [playerId,name,pos,points] of team.players){
   const p=Number(points),key=String(playerId);
   assert(Number.isFinite(p));
   const receipt={week:week.week,roster,manager:managers.get(roster),points:p};
   if(!allStarts.has(key))allStarts.set(key,[]);
   allStarts.get(key).push(receipt);
   const ownerKey=roster+':'+key;
   if(!rosterStarts.has(ownerKey))rosterStarts.set(ownerKey,[]);
   rosterStarts.get(ownerKey).push(receipt);
  }
 }
 assert.equal(seen.size,10,'Incomplete score week '+week.week);
}
const roundToMoney=x=>Math.round(x*100)/100;
const review=[];
for(const pick of model){
 const p=byOverall.get(pick.overall);
 assert(p,'Original draft pick not found '+pick.overall);
 const roster=Number(p.roster_id),id=String(p.player_id);
 assert.equal(roster,Number(pick.team_id),'Original draft manager roster diverges '+pick.overall);
 assert.equal(p.round,pick.round,'Draft round divergence '+pick.overall);
 assert.equal(managers.get(roster),pick.manager,'Manager mapping divergence '+pick.overall);
 const ownerRows=rosterStarts.get(roster+':'+id)||[];
 const leagueRows=allStarts.get(id)||[];
 const ownedPoints=roundToMoney(ownerRows.reduce((s,r)=>s+r.points,0));
 const leaguePoints=roundToMoney(leagueRows.reduce((s,r)=>s+r.points,0));
 const storedMatch=Math.abs(ownedPoints-pick.reg_starter_points)<=0.011&&ownerRows.length===pick.reg_starts;
 review.push({
  pick:pick.overall,round:pick.round,manager:pick.manager,original_roster:roster,
  player_id:id,provider_name:[p.metadata?.first_name,p.metadata?.last_name].filter(Boolean).join(' ')||null,
  archive_player_name:pick.player,position:pick.position,
  is_keeper_archived:pick.keeper,
  traded_same_season:pick.traded_same_season,
  stored_reg_starter_points:pick.reg_starter_points,stored_reg_starts:pick.reg_starts,
  source_original_roster_points:ownedPoints,source_original_roster_starts:ownerRows.length,
  source_leaguewide_started_points:leaguePoints,source_leaguewide_starts:leagueRows.length,
  source_original_receipts:ownerRows,source_leaguewide_receipts:leagueRows,
  source_consistency:storedMatch?'MATCH':'MISMATCH',
  name_difference:(pick.player.toLowerCase()!==([p.metadata?.first_name,p.metadata?.last_name].filter(Boolean).join(' ').toLowerCase()))?'DISPLAY_NAME_DIFFERENCE_NEVER_USE_FOR_IDENTITY':'NONE',
  existing_pick_grade:pick.grade,
  caveat:pick.traded_same_season?'Original-roster returns must not be treated as all-season draft selection value; trade compensation tracked separately':null
 });
}
assert.equal(new Set(review.map(p=>p.player_id)).size,150,'Duplicate drafted player ID; source review required');
const mismatches=review.filter(p=>p.source_consistency!=='MATCH');
const grouped=[...new Set(review.map(p=>p.manager))].sort().map(manager=>{
 const picks=review.filter(p=>p.manager===manager);
 const nonkeeper=picks.filter(p=>!p.is_keeper_archived);
 const sum=(a,key)=>roundToMoney(a.reduce((s,p)=>s+p[key],0));
 return {manager,selection_count:picks.length,keeper_count:picks.length-nonkeeper.length,
  nonkeeper_selection_count:nonkeeper.length,traded_original_picks:picks.filter(p=>p.traded_same_season).length,
  drafted_player_started_pf_any_owner:sum(picks,'source_leaguewide_started_points'),
  original_manager_started_pf_from_drafted_players:sum(picks,'source_original_roster_points'),
  nonkeeper_player_pf_any_owner:sum(nonkeeper,'source_leaguewide_started_points'),
  nonkeeper_original_manager_pf:sum(nonkeeper,'source_original_roster_points'),
  cannot_assign_grade_yet:'Keeper opportunity cost, pick-specific ex-ante replacement baselines, traded-out player compensation, injury/availability, and playoff impact require separate verification'};
});
const report={schema:'fellas-2023-original-draft-player-id-reconciliation-v1',
 status:'RESEARCH_ONLY_PLAYER_ID_VERIFIED_NO_FINAL_GRADES',
 league_id:league,draft_id:draftId,regular_season_completed_weeks:14,
 methodology:{source:'Original Sleeper draft pick_no, roster_id and player_id crosschecked against 2023 archived weekly starter player IDs',original_manager:'Count only starts by original drafting roster; do not attribute traded-away points back to drafting manager',leaguewide:'Sum the drafted player starter points for ALL managers, including subsequent trading counterparts, separately from original owner capture',grades:'No permanent historical grade from unadjusted PF; non-keeper peer opportunity cost plus verified trade compensation required'},
 counts:{drafted:review.length,manager_count:grouped.length,stored_point_or_start_differences:mismatches.length,existing_name_differences:review.filter(p=>p.name_difference!=='NONE').length,traded_same_season:review.filter(p=>p.traded_same_season).length,keeper_picks:review.filter(p=>p.is_keeper_archived).length},
 verified_picks:review,manager_descriptive_totals:grouped};
fs.mkdirSync('data-integrity/historical-trade-draft-audits',{recursive:true});
fs.writeFileSync('data-integrity/historical-trade-draft-audits/2023-sleeper-draft-id-review.json',JSON.stringify(report,null,2)+'\n');
console.log('2023 ORIGINAL DRAFT PLAYER ID AUDIT '+JSON.stringify(report.counts));
console.log('DRAFT MISATTRIBUTIONS '+JSON.stringify(mismatches.map(x=>({pick:x.pick,manager:x.manager,player:x.archive_player_name,sourceId:x.player_id,stored:x.stored_reg_starter_points,verified:x.source_original_roster_points,storedStarts:x.stored_reg_starts,verifiedStarts:x.source_original_roster_starts}))));
console.log('MANAGER DRAFT DESCRIPTIVE SOURCE TOTALS '+JSON.stringify(grouped.map(x=>({manager:x.manager,nonkeeperPFleaguewide:x.nonkeeper_player_pf_any_owner,nonkeeperPForiginal:x.nonkeeper_original_manager_pf,traded:x.traded_original_picks,keepers:x.keeper_count}))));
console.log('No draft grade or main repository write. This audit is source-only.');
