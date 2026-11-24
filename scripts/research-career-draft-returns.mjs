// Research-only aggregation of six independently reconciled draft seasons.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const years=[2020,2021,2022,2023,2024,2025];
const round=n=>Math.round(n*100)/100;
const managers=new Map();
let selections=0;
for(const year of years){
 const d=JSON.parse(fs.readFileSync(dir+'/'+year+'-draft-peer-return-research.json','utf8'));
 const source=JSON.parse(fs.readFileSync(dir+'/'+year+'-sleeper-draft-id-review.json','utf8'));
 assert.equal(d.season,year);assert.equal(source.season,year);
 assert.equal(source.counts.stored_point_or_start_differences,0);
 assert.equal(source.counts.drafted,150);
 assert.equal(source.regular_season_completed_weeks,year<=2021?13:14);
 assert(d.coverage.full_grade_coverage);
 assert.equal(d.experimental_season_ranking.length,10);
 const seen=new Set();
 for(const x of d.experimental_season_ranking){
  assert(!seen.has(x.manager));seen.add(x.manager);
  const n=x.total_nonkeeper_selections;
  assert.equal(n,year===2025?13:15);assert.equal(x.eligible,n);
  selections+=n;
  const row={season:year,regular_weeks:source.regular_season_completed_weeks,picks:n,rank:x.observed_return_rank,tier:x.observed_return_tier,surplus:x.realized_selection_surplus,baseline:x.total_peer_baseline,leaguewide_pf:x.observed_player_leaguewide_pf,original_roster_pf:x.original_roster_pf_from_nonkeepers};
  if(!managers.has(x.manager))managers.set(x.manager,[]);
  managers.get(x.manager).push(row);
 }
}
assert.equal(selections,880);
const rows=[...managers].map(([manager,seasons])=>{
 const sum=k=>seasons.reduce((n,s)=>n+s[k],0);
 const picks=sum('picks'),surplus=sum('surplus'),baseline=sum('baseline'),pf=sum('leaguewide_pf');
 const relative=baseline>0?100*surplus/baseline:null;
 return {manager,seasons:seasons.length,nonkeeper_picks:picks,career_surplus:round(surplus),surplus_per_pick:round(surplus/picks),surplus_pct_of_peer_baseline:relative===null?null:round(relative),average_season_rank:round(sum('rank')/seasons.length),positive_surplus_seasons:seasons.filter(s=>s.surplus>0).length,top_two_finishes:seasons.filter(s=>s.rank<=2).length,leaguewide_pf:round(pf),original_roster_pf:round(sum('original_roster_pf')),best_season:[...seasons].sort((a,b)=>b.surplus-a.surplus)[0],worst_season:[...seasons].sort((a,b)=>a.surplus-b.surplus)[0],season_receipts:seasons,sample_note:seasons.length<3?'LIMITED_SAMPLE':'THREE_OR_MORE_SEASONS'};
});
const rankings={by_surplus_per_pick:[...rows].sort((a,b)=>b.surplus_per_pick-a.surplus_per_pick),by_total_surplus:[...rows].sort((a,b)=>b.career_surplus-a.career_surplus),by_relative_surplus:[...rows].sort((a,b)=>b.surplus_pct_of_peer_baseline-a.surplus_pct_of_peer_baseline)};
const report={status:'RESEARCH_ONLY_NOT_OFFICIAL_CAREER_GRADES',years,verified_draft_picks:900,nonkeeper_picks:selections,manager_seasons:60,manager_count:rows.length,methodology:'Season-specific same-position draft peer benchmarks; separate original-roster capture from leaguewide drafted-player returns; rank per pick and show sample sizes and baseline-relative returns; no keeper economics, trades, waivers or postseason impact.',rankings};
fs.writeFileSync(dir+'/career-draft-return-research.json',JSON.stringify(report,null,2)+'\n');
console.log('CAREER DRAFT RETURNS '+JSON.stringify(rankings.by_surplus_per_pick.map(({manager,seasons,nonkeeper_picks,career_surplus,surplus_per_pick,surplus_pct_of_peer_baseline,positive_surplus_seasons,top_two_finishes})=>({manager,seasons,nonkeeper_picks,career_surplus,surplus_per_pick,surplus_pct_of_peer_baseline,positive_surplus_seasons,top_two_finishes}))));
