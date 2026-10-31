// Research-only position/week baseline computed from observed opposing-team BENCH players.
// This is not a proven unowned free-agent replacement level or a causal skill score.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const outcomes=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
assert.equal(outcomes.status,'research_only_not_causal_or_skill_grade');
const rosterId=r=>r.teamId??r.id;
const cache=new Map();
function load(year,week){
 const key=year+'|'+week;
 if(cache.has(key))return cache.get(key);
 const alt='data/war_rosters_'+year+'_week'+week+'.json';
 const fallback='data/sleeper_roster_snapshots_'+year+'_week'+week+'.json';
 const path=year===2025&&(week===1||week===7)&&fs.existsSync(alt)?alt:fallback;
 if(!fs.existsSync(path)){cache.set(key,null);return null;}
 const raw=read(path);const rosters=Array.isArray(raw)?raw:raw.rosters;
 cache.set(key,Array.isArray(rosters)?rosters:null);
 return cache.get(key);
}
const rows=[];let comparable=0,missing=0;
for(const acquisition of outcomes.observations){
 for(const w of acquisition.weeks){
  if(!w.started)continue;
  const rosters=load(acquisition.year,w.week);
  if(!rosters){missing++;continue;}
  // Opponents' benches are an observed distribution, NOT a contemporaneous free-agent pool.
  const candidates=rosters.filter(r=>String(rosterId(r))!==acquisition.teamId)
   .flatMap(r=>r.bench??[])
   .filter(p=>p.position===acquisition.position&&String(p.id)!==acquisition.playerId&&Number.isFinite(p.points));
  // One distinct player per sample; duplicated player IDs across rosters indicate unreliable evidence.
  const distinct=new Map();
  for(const p of candidates){if(!distinct.has(String(p.id)))distinct.set(String(p.id),p.points);}
  const scores=[...distinct.values()].sort((a,b)=>a-b);
  if(scores.length<3){missing++;continue;}
  const mid=Math.floor(scores.length/2);
  const median=scores.length%2?scores[mid]:(scores[mid-1]+scores[mid])/2;
  rows.push({year:acquisition.year,week:w.week,transactionId:acquisition.transactionId,
   playerId:acquisition.playerId,teamId:acquisition.teamId,position:acquisition.position,
   actualStartedPoints:w.points,comparisonSampleSize:scores.length,
   opposingBenchMedian:+median.toFixed(2),observedBenchMedianSurplus:+(w.points-median).toFixed(2)});
  comparable++;
 }
}
const report={schema:'fellas-faab-opposing-bench-baseline-v1',
 status:'research_only_noncausal_not_free_agent_replacement',
 interpretation:'Median points of same-position players observed on OTHER teams benches during a subsequent week when the acquired player started; no actual waiver availability is established.',
 caveats:['Hindsight scores cannot support ex-ante acquisition quality','Opposing-team bench players were generally rostered, not available free agents','Position-only comparisons ignore FLEX and lineup optimization','Negative surpluses are retained','Fewer than three independent comparison players means ungraded'],
 coverage:{comparedStarterWeeks:comparable,ungradedStarterWeeks:missing},
 rows};
const target='data-integrity/faab-opposing-bench-baseline-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),report,'FAAB opposing-bench research stale');
else fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
console.log('FAAB opposing-bench baseline research',JSON.stringify(report.coverage));
