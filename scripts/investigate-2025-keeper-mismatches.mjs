// Source-level keeper mismatch triage. Preserve both archived totals and weekly observations.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const report=read('data-integrity/keeper-2025-weekly-lineup-reconciliation-v1.json');
assert.equal(report.rows.length,20);
const rows=report.rows.filter(r=>r.regularParityStatus!=='match').map(r=>{
 const reasons=[];
 if(r.ambiguities.length)reasons.push('ambiguous_roster_identity_or_score');
 if(r.startCountDifference)reasons.push('starter_count_disagreement');
 if(Math.abs(r.starterPointDifference)>.011)reasons.push('starting_points_disagreement');
 if(r.missingTeamWeeks)reasons.push('missing_team_snapshot');
 if(r.absentFromRosterWeeks)reasons.push('roster_absence_needs_chronology');
 return {manager:r.manager,player:r.player,teamId:r.teamId,draftSlot:r.draftSlot,
  observedStarts:r.observedStarts,archivedStarts:r.archivedRegularStarts,
  observedPoints:r.observedStarterPoints,archivedPoints:r.archivedRegularStarterPoints,
  countDifference:r.startCountDifference,pointDifference:r.starterPointDifference,
  reasons,weeklyEvidence:r.weekEvidence,
  unresolvedWeeks:r.ambiguities,
  suggestedAction:'Validate underlying player identity and weekly matchup lineups before changing historical draft data',
  archiveMutationAuthorized:false,keeperGradeAuthorized:false};
}).sort((a,b)=>Math.abs(b.pointDifference)-Math.abs(a.pointDifference)||
 Math.abs(b.countDifference)-Math.abs(a.countDifference)||a.manager.localeCompare(b.manager));
const result={schema:'fellas-2025-keeper-mismatch-investigations-v1',
 status:'unresolved_source_discrepancies_no_automatic_rewrites',
 coverage:{keeperSelections:report.rows.length,matches:report.rows.length-rows.length,investigations:rows.length},
 rows};
const path='data-integrity/keeper-2025-mismatch-investigations-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(path),result,'Keeper investigation queue stale');
else fs.writeFileSync(path,JSON.stringify(result,null,2)+'\n');
console.log('Keeper mismatch investigations:',rows.length,'of',report.rows.length);
