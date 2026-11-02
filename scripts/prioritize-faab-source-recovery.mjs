// Prioritize research recovery gaps without converting observed points into skill ratings.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const source=read('data-integrity/faab-manager-evidence-coverage-v1.json');
assert.equal(source.status,'descriptive_coverage_only_no_manager_skill_grades');
const rows=source.rows.map(x=>{
 const unmatched=x.playerClaims-x.claimsWithMatchingInterval;
 const review=x.claimsRequiringReview;
 const flagged=x.flaggedScoringPlayerWeeks;
 const gaps=[
  {type:'missing_transaction_interval',count:unmatched,action:'Recover original completed transaction identity and exact player-side records'},
  {type:'uncorroborated_player_weeks',count:flagged,action:'Inspect original weekly roster and ownership-changing transaction chronology'},
  {type:'claims_requiring_review',count:review,action:'Resolve player identity, claimed owner and subsequent observed roster mismatches'}
 ].filter(g=>g.count>0);
 return {year:x.year,manager:x.manager,identityStatus:x.identityStatus,
  playerClaims:x.playerClaims,observedScoringPlayerWeeks:x.observedScoringPlayerWeeks,
  supportedScoringPlayerWeeks:x.supportedScoringPlayerWeeks,
  uncorroboratedPlayerWeeks:flagged,unmatchedIntervals:unmatched,
  claimsRequiringReview:review,
  priorityTier:!x.manager?'identity_first':unmatched||flagged?'source_recovery':review?'manual_review':'no_current_discrepancy',
  gaps,skillGradeAuthorized:false};
}).sort((a,b)=>b.uncorroboratedPlayerWeeks-a.uncorroboratedPlayerWeeks||
 b.unmatchedIntervals-a.unmatchedIntervals||b.claimsRequiringReview-a.claimsRequiringReview||
 a.year-b.year||(a.manager??'~').localeCompare(b.manager??'~'));
for(const x of rows){
 assert.ok(x.uncorroboratedPlayerWeeks>=0&&x.unmatchedIntervals>=0);
 assert.ok(x.supportedScoringPlayerWeeks+x.uncorroboratedPlayerWeeks===x.observedScoringPlayerWeeks);
}
const report={schema:'fellas-faab-source-recovery-priority-v1',
 status:'research_triage_not_skill_grade',
 methodology:'Sort manager-season cohorts by uncorroborated scoring player-weeks, unmatched transaction intervals, and unresolved claim reviews; unknown managers remain unidentified.',
 rows};
const dest='data-integrity/faab-source-recovery-priority-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(dest),report,'FAAB source recovery priorities stale');
else fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
console.log('FAAB recovery triage:',rows.length,'cohorts,',
 rows.reduce((n,x)=>n+x.uncorroboratedPlayerWeeks,0),'flagged player-weeks');
