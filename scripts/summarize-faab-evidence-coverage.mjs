// Cohort coverage matrix combining handle attribution and independent roster evidence.
// Descriptive research only: no replacement value, causality, or skill grade.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const outcomes=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
const reviews=read('data-integrity/faab-outcome-ownership-review-v1.json');
const identities=read('data-integrity/faab-identity-attribution-v1.json');
assert.equal(reviews.status,'research_only_no_certified_faab_skill');
const key=x=>[x.year,x.transactionId,x.teamId,x.playerId].join('|');
const byReview=new Map(reviews.rows.map(x=>[key(x),x]));
const byIdentity=new Map(identities.observations.map(x=>[key(x),x]));
assert.equal(byReview.size,reviews.rows.length,'Duplicate review receipt');
assert.equal(byIdentity.size,identities.observations.length,'Duplicate manager attribution receipt');
const groups=new Map();
for(const claim of outcomes.observations){
 const k=key(claim),review=byReview.get(k),identity=byIdentity.get(k);
 assert.ok(review&&identity,'Incomplete coverage join '+k);
 const manager=identity.manager??null;
 const groupKey=claim.year+'|'+(manager??'__UNRESOLVED__');
 const g=groups.get(groupKey)??{year:claim.year,manager,identityStatus:manager?'verified_handle':'unresolved',
  playerClaims:0,claimsWithObservedPoints:0,claimsWithMatchingInterval:0,
  claimsRequiringReview:0,observedScoringPlayerWeeks:0,supportedScoringPlayerWeeks:0,
  flaggedScoringPlayerWeeks:0,observedStartedPoints:0,observedRosteredPoints:0};
 g.playerClaims++;
 if(claim.observedWeeks)g.claimsWithObservedPoints++;
 if(review.intervalMatch)g.claimsWithMatchingInterval++;
 if(review.reviewRequired)g.claimsRequiringReview++;
 g.observedScoringPlayerWeeks+=claim.weeks.length;
 g.supportedScoringPlayerWeeks+=review.sameTeamSupportedScoringWeeks;
 g.flaggedScoringPlayerWeeks+=review.flaggedWeeks.length;
 g.observedStartedPoints+=claim.startedPoints;
 g.observedRosteredPoints+=claim.rosteredPoints;
 groups.set(groupKey,g);
}
const round=x=>Math.round(x*100)/100;
const rows=[...groups.values()].map(g=>{
 assert.equal(g.observedScoringPlayerWeeks,g.supportedScoringPlayerWeeks+g.flaggedScoringPlayerWeeks);
 return {...g,observedStartedPoints:round(g.observedStartedPoints),
  observedRosteredPoints:round(g.observedRosteredPoints),
  supportedWeekSharePercent:g.observedScoringPlayerWeeks?round(100*g.supportedScoringPlayerWeeks/g.observedScoringPlayerWeeks):null,
  skillGradeStatus:'not_certified'};
}).sort((a,b)=>a.year-b.year||(a.manager??'~').localeCompare(b.manager??'~'));
const report={schema:'fellas-faab-manager-evidence-coverage-v1',
 status:'descriptive_coverage_only_no_manager_skill_grades',
 caution:'Manager is mapped only with verified Sleeper handle; unknown groups must not be assigned to a manager by team ID.',
 rows};
const dest='data-integrity/faab-manager-evidence-coverage-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(dest),report,'FAAB manager coverage report stale');
else fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
console.log('FAAB manager coverage',rows.length,'manager-season cohorts;',
 rows.reduce((n,x)=>n+x.playerClaims,0),'claims;',
 rows.reduce((n,x)=>n+x.flaggedScoringPlayerWeeks,0),'flagged scoring weeks');
