// Audit observed FAAB production against source-backed ownership intervals.
// Never silently discard research data or convert ownership support into skill ratings.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const outcomes=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
const intervals=read('data-integrity/faab-interval-roster-corroboration-v1.json');
assert.equal(outcomes.status,'research_only_not_causal_or_skill_grade');
assert.equal(intervals.status,'research_only_weekly_observations_not_continuous_ownership');
const lookup=new Map();
for(const row of intervals.rows){
 const key=[row.year,row.startTransactionId,row.teamId,row.playerId].join('|');
 assert.ok(!lookup.has(key),'Duplicate interval corroboration: '+key);
 lookup.set(key,row);
}
const rows=[],coverage=[];
for(const year of [2020,2021,2022,2023,2024,2025,2026]){
 let matched=0,missing=0,conflicting=0,supportedWeeks=0,unmatchedWeeks=0;
 for(const outcome of outcomes.observations.filter(x=>x.year===year)){
  const key=[outcome.year,outcome.transactionId,outcome.teamId,outcome.playerId].join('|');
  const interval=lookup.get(key);
  if(interval)matched++;else missing++;
  const observed=new Map((interval?.observations??[]).map(w=>[w.week,w]));
  const flagged=[];
  for(const week of outcome.weeks){
   const check=observed.get(week.week);
   if(check?.status==='observed_on_another_team'){
    flagged.push({week:week.week,reason:'another_team_observed'});conflicting++;
   } else if(check?.status==='observed_on_acquiring_team'&&week.week>outcome.claimWeek){
    supportedWeeks++;
   } else {
    unmatchedWeeks++;
    flagged.push({week:week.week,reason:check?.status??'no_matching_interval_week'});
   }
  }
  rows.push({year,transactionId:outcome.transactionId,teamId:outcome.teamId,playerId:outcome.playerId,
   intervalMatch:!!interval,observedScoringWeeks:outcome.weeks.length,
   sameTeamSupportedScoringWeeks:outcome.weeks.length-flagged.length,
   reviewRequired:!interval||flagged.length>0,
   flaggedWeeks:flagged,eligibleForCertifiedSkillGrade:false});
 }
 coverage.push({year,outcomeClaims:matched+missing,matchedIntervals:matched,unmatchedIntervals:missing,
  sameTeamSupportedWeeks:supportedWeeks,conflictingOwnerWeeks:conflicting,
  uncorroboratedScoringWeeks:unmatchedWeeks,certifiedSkillClaims:0});
}
const report={schema:'fellas-faab-outcome-ownership-review-v1',
 status:'research_only_no_certified_faab_skill',
 rules:['Player-week scoring requires independent matching roster evidence for reporting only.',
  'Unmatched and conflicting observations are flagged for review, not rewritten as zero.',
  'Matching roster evidence does not certify uninterrupted ownership or legal free-agent alternatives.',
  'Public manager skill grades are not modified.'],
 coverage,rows};
const file='data-integrity/faab-outcome-ownership-review-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(file),report,'FAAB ownership review stale');
else fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
console.log('FAAB ownership scoring review:',rows.length,'claims;',coverage.reduce((n,r)=>n+r.unmatchedIntervals,0),'unmatched intervals;',coverage.reduce((n,r)=>n+r.conflictingOwnerWeeks,0),'conflicting player-weeks');
