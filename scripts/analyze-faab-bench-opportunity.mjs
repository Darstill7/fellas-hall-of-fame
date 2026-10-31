// Observed FAAB starter vs same-position *bench* alternative, NOT true waiver replacement, WAR, or causal wins.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const outcomes=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
assert.equal(outcomes.status,'research_only_not_causal_or_skill_grade');
const rosterId=r=>r.teamId??r.id;
const eligible=(acquired,candidate)=>acquired==='DEF'?candidate==='DEF':acquired===candidate;
const results=[];
let compared=0,unavailable=0;
for(const row of outcomes.observations){
 const pairs=[];
 for(const weekRow of row.weeks){
  if(!weekRow.started)continue;
  const week=weekRow.week,year=row.year;
  const alternate='data/war_rosters_'+year+'_week'+week+'.json';
  const fallback='data/sleeper_roster_snapshots_'+year+'_week'+week+'.json';
  const path=year===2025&&(week===1||week===7)&&fs.existsSync(alternate)?alternate:fallback;
  if(!fs.existsSync(path)){unavailable++;continue;}
  const json=read(path),rosters=Array.isArray(json)?json:json.rosters;
  const roster=rosters?.find(r=>String(rosterId(r))===row.teamId);
  if(!roster){unavailable++;continue;}
  const bench=(roster.bench??[]).filter(p=>eligible(row.position,p.position)&&String(p.id)!==row.playerId&&Number.isFinite(p.points));
  if(!bench.length){unavailable++;continue;}
  const best=bench.reduce((a,b)=>b.points>a.points?b:a);
  const advantage=+(weekRow.points-best.points).toFixed(2);
  pairs.push({week,starterPoints:weekRow.points,benchAlternativePlayerId:String(best.id),benchAlternativePoints:best.points,advantage});
  compared++;
 }
 results.push({year:row.year,transactionId:row.transactionId,teamId:row.teamId,playerId:row.playerId,
  position:row.position,bid:row.bid,startedWeeks:row.startedWeeks,comparableStarts:pairs.length,
  netBenchRelativePoints:pairs.length?+pairs.reduce((n,x)=>n+x.advantage,0).toFixed(2):null,
  comparisonStatus:pairs.length?'research_only_observed_bench_comparison':'insufficient_eligible_bench',
  comparisons:pairs});
}
const report={schema:'fellas-faab-bench-relative-opportunity-v1',status:'research_only_not_replacement_value_or_skill',
 method:'Same-position, same-team observed bench high scorer in weeks the acquired player started. Negative differentials retained. This is a hindsight descriptive comparison, not a feasible ex-ante lineup choice, free-agent baseline, or marginal points/wins.',
 coverage:{playerAcquisitions:results.length,comparableStarts:compared,unavailableStarterComparisons:unavailable},
 results};
fs.writeFileSync('data-integrity/faab-bench-relative-opportunity-v1.json',JSON.stringify(report,null,2)+'\n');
console.log('FAAB bench-relative opportunity pilot',JSON.stringify(report.coverage));
