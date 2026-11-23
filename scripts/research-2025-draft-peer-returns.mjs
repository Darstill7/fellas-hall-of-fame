// Preliminary 2025 draft selection-return benchmark; NEVER a final GM skill grade.
// Uses original Sleeper player IDs and full regular-season leaguewide started PF.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const target=Number(process.env.FELLAS_DRAFT_YEAR||2025);
assert([2022,2023,2024,2025].includes(target));
const expectedKeepers=target===2025?2:0;
const expectedNonkeepers=15-expectedKeepers;
const source=process.env.FELLAS_2025_DRAFT_ID_AUDIT||'data-integrity/historical-trade-draft-audits/'+target+'-sleeper-draft-id-review.json';
const j=JSON.parse(fs.readFileSync(source,'utf8'));
assert.equal(j.status,'RESEARCH_ONLY_PLAYER_ID_VERIFIED_NO_FINAL_GRADES');
assert.equal(j.season,target);
assert.equal(j.counts.drafted,150);
assert.equal(j.counts.stored_point_or_start_differences,0);
const picks=j.verified_picks;
const nonkeeper=picks.filter(p=>!p.is_keeper_archived);
assert.equal(nonkeeper.length,10*expectedNonkeepers,'Season-specific archived keeper count mismatch');
const managers=[...new Set(picks.map(p=>p.manager))].sort();
assert.equal(managers.length,10);
const median=values=>{
 const sorted=[...values].sort((a,b)=>a-b),m=Math.floor(sorted.length/2);
 return sorted.length%2?sorted[m]:(sorted[m-1]+sorted[m])/2;
};
const round=x=>Math.round((x+Number.EPSILON)*100)/100;
const compare=nonkeeper.map(p=>{
 let peers=[],band=0;
 for(let distance=1;distance<=14;distance++){
  peers=nonkeeper.filter(other=>other.pick!==p.pick&&other.position===p.position&&Math.abs(other.round-p.round)<=distance);
  band=distance;
  if(peers.length>=4)break;
 }
 if(peers.length<4){
  return {pick:p.pick,manager:p.manager,position:p.position,round:p.round,grade_eligible:false,
   issue:'FEWER_THAN_FOUR_SAME_POSITION_PEERS',peer_count:peers.length,window_rounds:band};
 }
 const actual=p.source_leaguewide_started_points,baseline=round(median(peers.map(x=>x.source_leaguewide_started_points)));
 return {pick:p.pick,manager:p.manager,player_id:p.player_id,player_name:p.archive_player_name,
  position:p.position,round:p.round,grade_eligible:true,
  source_leaguewide_started_points:actual,original_manager_started_points:p.source_original_roster_points,
  keeper:false,traded:p.traded_same_season,
  reference:'Same-position, non-keeper, nearby draft rounds, minimum 4 *other* '+target+' picks',
  peer_count:peers.length,window_rounds:band,peer_median_points:baseline,
  realized_selection_surplus:round(actual-baseline),
  note:'Observed season-specific production, not pre-draft projection, manager skill, or counterfactual impact'};
});
const unresolved=compare.filter(x=>!x.grade_eligible);
const totalByManager=managers.map(manager=>{
 const own=compare.filter(p=>p.manager===manager);
 assert.equal(own.length,expectedNonkeepers,'Unexpected nonkeeper selections for '+manager);
 const eligible=own.filter(p=>p.grade_eligible);
 return {manager,total_nonkeeper_selections:own.length,eligible:eligible.length,
  uncovered_picks:own.filter(x=>!x.grade_eligible).map(x=>x.pick),
  observed_player_leaguewide_pf:round(eligible.reduce((sum,x)=>sum+x.source_leaguewide_started_points,0)),
  total_peer_baseline:round(eligible.reduce((sum,x)=>sum+x.peer_median_points,0)),
  realized_selection_surplus:round(eligible.reduce((sum,x)=>sum+x.realized_selection_surplus,0)),
  original_roster_pf_from_nonkeepers:round(eligible.reduce((sum,x)=>sum+x.original_manager_started_points,0)),
  confidence:eligible.length===expectedNonkeepers?'COMPLETE_NONKEEPER_PEER_COVERAGE':'PARTIAL_DO_NOT_RANK'};
});
const fullyCovered=unresolved.length===0;
const ordered=fullyCovered?[...totalByManager].sort((a,b)=>b.realized_selection_surplus-a.realized_selection_surplus):[];
const ranked=ordered.map((x,index)=>({...x,
 observed_return_rank:index+1,
 observed_return_tier:index<2?'A':index<4?'B':index<6?'C':index<8?'D':'F',
 tier_warning:'Season-specific observed realized draft selection return tier ONLY, not career GM ability, ex ante skill or official site grade'}));
const report={schema:'fellas-'+target+'-draft-peer-surplus-research-v1',season:target,
 status:fullyCovered?'RESEARCH_ONLY_OBSERVED_RETURN_TIERS_NOT_OFFICIAL':'RESEARCH_ONLY_INCOMPLETE_PEER_COVERAGE_NO_TIERS',
 source:'Original Sleeper draft IDs + complete season-specific regular season lineup player IDs',
 grading_scope:expectedNonkeepers+' nonkeeper selections per manager; selected year only; player started anywhere after being drafted regardless of team',
 baseline:'Median leaguewide season starter PF among >=4 different picks of same position within nearest expanding round window; no keepers; focal pick excluded from peers',
 adjustments_not_included:['Injury risk and pre-draft expectations','Trade counterpart compensation or transaction opportunity cost','Keeper cost vs alternate keepers','Waiver pickups and lineup choices','Playoff production','Past seasons and career sample','Lineup replacement-level counterfactual'],
 coverage:{picks_compared:compare.length,picks_without_four_peers:unresolved.length,full_grade_coverage:fullyCovered},
 manager_summary:totalByManager,experimental_season_ranking:ranked,unresolved_picks:unresolved,selection_evidence:compare};
fs.mkdirSync('data-integrity/historical-trade-draft-audits',{recursive:true});
fs.writeFileSync('data-integrity/historical-trade-draft-audits/'+target+'-draft-peer-return-research.json',JSON.stringify(report,null,2)+'\n');
console.log(target+' PEER BENCHMARK '+JSON.stringify(report.coverage));
console.log(target+' EXPERIMENTAL RETURN ORDER '+JSON.stringify(ranked.map(x=>({rank:x.observed_return_rank,manager:x.manager,tier:x.observed_return_tier,surplus:x.realized_selection_surplus,pf:x.observed_player_leaguewide_pf,baseline:x.total_peer_baseline}))));
console.log('No official draft or GM grades assigned.');
