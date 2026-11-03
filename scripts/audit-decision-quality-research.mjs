// Cross-workstream decision-quality research gate.
// A hindsight optimization is descriptive, not evidence of ex-ante manager skill.
// Current source cutoff: completed 2026 Week 8 (Nov 3, 2026).
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const completed=read('data/sleeper_roster_snapshots_2026_week8.json');
const partial=read('data/keeper_2026_website_research_v1.json');
const faab=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
const candidate=read('data-integrity/keeper-2025-retrospective-candidate-inventory-v1.json');
const keeperDecision=read('data-integrity/keeper-2025-decision-research-index-v1.json');
const startSit=read('data-integrity/start-sit-2026-hindsight-v1.json');
const faabWeek8=read('data-integrity/faab-2026-week8-supplement-v1.json');

assert.equal(completed.season,2026);
assert.equal(completed.week,8);
assert.equal(completed.rosters.length,10);
assert.deepEqual(completed.rosters.map(r=>Number(r.teamId)).sort((a,b)=>a-b),
 Array.from({length:10},(_,i)=>i+1));
assert.ok(partial.throughWeek>=8&&partial.throughWeek<=14,'Keeper research regular-season coverage outside expected range');
if(partial.throughWeek>=9)assert.ok(Date.now()>=Date.parse('2026-11-10T06:00:00Z'),
 'Week 9 research cannot advance before MNF is complete');
assert.equal(partial.selections.length,20);
assert.ok(partial.rows.every(r=>r.researchScore===null&&r.officialKeeperDecisionGrade===null),
 'In-progress keepers cannot become official grades');
assert.equal(candidate.rows.length,10);
assert.equal(candidate.coverage.keepersMatched,20);
assert.ok(candidate.rows.every(r=>r.certifiedDeadlineChoiceSet===false),
 'Final-week snapshots are not certified keeper deadline choice sets');
assert.ok(candidate.rows.every(r=>r.candidates.every(p=>
 p.keeperDeadlineLegalEligibility===null&&p.contemporaneousKeeperAlternativeValue===null)),
 'Unproven keeper alternatives must remain unknown');
assert.ok(keeperDecision.rows.every(r=>
 r.certifiedKeeperDecisionScore===null&&r.publicReportCardKeeperGrade===null&&r.abandonmentPenalty===null),
 'Retrospective keeper production cannot be silently promoted to decision skill');

const faab2026=faab.coverage.find(r=>r.year===2026);
assert.ok(faab2026,'Missing 2026 FAAB evidence');
assert.equal(faab.status,'research_only_not_causal_or_skill_grade');
assert.equal(faab2026.regularSeasonWeekLimit,7,
 'FAAB Week 8 outcomes require their own validated refresh; never silently assume parity');
assert.ok(faab.observations.filter(r=>r.year===2026).every(r=>
 r.weeks.every(w=>w.week>r.claimWeek&&w.week<=faab2026.regularSeasonWeekLimit)),
 'FAAB result leakage into claim week or future week');

// Cross-check newly generated research reports independently of their writers.
assert.equal(startSit.status,'retrospective_scored_roster_comparison_not_decision_skill');
assert.equal(startSit.throughWeek,partial.throughWeek,'Start/sit and keeper scoring cutoffs differ');
assert.equal(startSit.weeklyRows.length,10*partial.throughWeek);
assert.equal(startSit.managers.length,10);
assert.ok(startSit.sleeperAccuracyMethod.includes('Unweighted arithmetic mean'),
 'Start/Sit research must state the weekly averaging method');
if(startSit.throughWeek===8){
 const ui=read('data-integrity/sleeper-start-sit-ui-benchmarks-2026-week8.json');
 assert.equal(ui.season,2026);
 assert.equal(ui.data.length,10);
 for(const sample of ui.data){
  const row=startSit.managers.find(r=>r.manager===sample.manager);
  assert.ok(row,'Sleeper UI sample unmapped: '+sample.manager);
  // The research index is already rounded to hundredths before this
  // audit; its original weekly average (used by the browser) is not.
  // Allow half of one display tenth plus a hundredth of representation
  // headroom, consistent with the generator's independent UI check.
  assert.ok(Math.abs(row.averageWeeklyStartSitAccuracyPercent-sample.accuracyPercent)<.051,
   'Independent Sleeper Week 8 accuracy differs: '+sample.manager+
   ' reconstructed '+row.averageWeeklyStartSitAccuracyPercent+
   ' Sleeper display '+sample.accuracyPercent);
 }
}

assert.equal(new Set(startSit.managers.map(m=>m.manager)).size,10);
assert.ok(startSit.weeklyRows.every(r=>r.season===2026&&r.week>=1&&r.week<=partial.throughWeek&&r.officialStartSitGrade===null));
for(const m of startSit.managers){
 const rows=startSit.weeklyRows.filter(r=>r.manager===m.manager);
 assert.equal(rows.length,partial.throughWeek,'Incomplete start/sit coverage: '+m.manager);
 assert.equal(new Set(rows.map(r=>r.week)).size,partial.throughWeek,'Duplicate start/sit week: '+m.manager);
 assert.equal(m.officialStartSitGrade,null);
 assert.ok(rows.every(r=>r.weeklyStartSitAccuracyPercent===null||
  (Number.isFinite(r.weeklyStartSitAccuracyPercent)&&r.weeklyStartSitAccuracyPercent>=0)),
  'Invalid weekly Start/Sit accuracy '+m.manager);
 const measured=rows.every(r=>r.weeklyStartSitAccuracyPercent!==null)?
  Math.round(rows.reduce((n,r)=>n+r.weeklyStartSitAccuracyPercent,0)/rows.length*100)/100:null;
 assert.ok(measured===null?m.averageWeeklyStartSitAccuracyPercent===null:
  Math.abs(m.averageWeeklyStartSitAccuracyPercent-measured)<.011,
  'Season Start/Sit average differs from mean of weekly efficiencies '+m.manager);

 assert.ok(Math.abs(m.recordedActualPoints-rows.reduce((n,r)=>n+r.actualPoints,0))<.071);
 assert.ok(Math.abs(m.recordedRosterOptimalPoints-rows.reduce((n,r)=>n+r.recordedRosterOptimalPoints,0))<.071);
 assert.ok(Math.abs(m.hindsightGap-rows.reduce((n,r)=>n+r.hindsightGap,0))<.071);
}
assert.equal(faabWeek8.status,'research_only_week8_observation_no_skill_grade');
assert.equal(faabWeek8.week,8);
assert.equal(faabWeek8.week8TransactionCoverage,'provider_week_sample_not_crosschecked_for_completeness');
assert.equal(faabWeek8.ownershipContinuityCertified,false);
assert.equal(faabWeek8.coverage.certifiedAttributableWeek8Points,null);
const priorClaims=faab.observations.filter(r=>r.year===2026);
assert.equal(faabWeek8.rows.length,priorClaims.length);
assert.equal(faabWeek8.coverage.priorClaimRows,priorClaims.length);
const originalClaims=new Map(priorClaims.map(r=>[[r.transactionId,r.teamId,r.playerId].join('|'),r]));
assert.equal(originalClaims.size,priorClaims.length);
const observedFaabPlayerWeeks=new Set();
for(const r of faabWeek8.rows){
 const key=[r.transactionId,r.teamId,r.playerId].join('|');
 const initial=originalClaims.get(key);
 assert.ok(initial,'Week 8 FAAB observation without original claim '+key);
 assert.equal(r.claimWeek,initial.claimWeek);
 assert.equal(r.certifiedIncrementalValue,null);
 assert.equal(r.managerSkillGrade,null);
 assert.equal(r.transactionSourceCoverage,faabWeek8.week8TransactionCoverage);
 assert.equal(r.continuousOwnershipCertified,false);
 assert.ok(r.observedPoints===null||Number.isFinite(r.observedPoints));
 assert.ok(r.observedPoints===null||r.status==='observed_same_team_week8_without_recorded_intervening_event');
 if(r.observedPoints!==null){
  const playerWeek=r.playerId+'|'+r.week;
  assert.ok(!observedFaabPlayerWeeks.has(playerWeek),'Double-counted Week 8 FAAB player: '+playerWeek);
  observedFaabPlayerWeeks.add(playerWeek);
 }
 assert.ok(!(initial.firstSubsequentOwnershipEventWeek!==null&&initial.firstSubsequentOwnershipEventWeek<=8&&r.observedPoints!==null),
  'Previously censored claim was reinstated: '+key);
}
assert.equal(faabWeek8.coverage.week8ObservedWithoutInterveningTransaction,faabWeek8.rows.filter(r=>r.observedPoints!==null).length);
assert.equal(faabWeek8.coverage.week8ScoredStartedObservations,faabWeek8.rows.filter(r=>r.started===true).length);
assert.ok(Math.abs(faabWeek8.coverage.week8ObservedStartedPoints-faabWeek8.rows.filter(r=>r.started).reduce((n,r)=>n+r.observedPoints,0))<.011);

// Independently verify Week 8 lineup feasibility using positional slot assignment.
// This is the maximum retrospectively possible from scored starters + recorded bench;
// absent injury, pre-kickoff availability and start/sit lock evidence, it is NOT a grade.
const slots=['QB','RB','RB','WR','WR','TE','FLEX','FLEX','DEF'];
const eligible=(p,slot)=>slot==='FLEX'?['RB','WR','TE'].includes(p.position):p.position===slot;
function optimum(players){
 let states=new Map([[0,0]]);
 for(const player of players){
  assert.ok(Number.isFinite(player.points),'Missing recorded player score');
  const next=new Map(states);
  for(const [mask,score] of states){
   for(let i=0;i<slots.length;i++){
    if((mask&(1<<i))||!eligible(player,slots[i]))continue;
    const key=mask|(1<<i),value=score+player.points;
    if(!next.has(key)||next.get(key)<value)next.set(key,value);
   }
  }
  states=next;
 }
 return states.get((1<<slots.length)-1)??null;
}
assert.equal(optimum([{position:'QB',points:50}]),null,'Incomplete lineup must not be scored');
let possible=0,totalGap=0;
for(const team of completed.rosters){
 const pool=[...team.starters,...team.bench];
 assert.equal(team.starters.length,9,'Incomplete Week 8 starter roster');
 assert.equal(new Set(pool.map(p=>String(p.id))).size,pool.length,'Duplicate player in roster');
 const real=team.starters.reduce((sum,p)=>sum+p.points,0);
 assert.ok(Number.isFinite(team.points)&&Math.abs(real-team.points)<.07,
  'Week 8 starter score fails team-score parity: '+team.teamId);
 const max=optimum(pool);
 assert.ok(Number.isFinite(max)&&max+.07>=real,
  'Week 8 positional eligibility/optimal lineup failure: '+team.teamId);
 possible++;
 totalGap+=Math.max(0,max-real);
}
assert.equal(possible,10);
assert.ok(totalGap>=0);
const reportCards=fs.readFileSync('assets/manager-report-card.mjs','utf8');
assert.ok(reportCards.includes('lineups')&&reportCards.includes('waivers')&&reportCards.includes('keepers'),
 'Report card must expose the three decision-quality categories');
console.log('DECISION RESEARCH GATE PASS:',JSON.stringify({
 scoringCutoff:'2026 Week 8',week8LineupTeamChecks:possible,
 week8HindsightGapAllTeamsPoints:Math.round(totalGap*100)/100,
 keeper2026Choices:partial.selections.length,keeper2025LegalAlternativeSetsCertified:0,
 faab2026OutcomeThroughWeek:faab2026.regularSeasonWeekLimit,
 keeperDecisionGradePublished:false,faabSkillGradePublished:false,startSitSkillGradePublished:false,
 qualification:'Observed outcomes and roster hindsight are not causal decision quality.'
}));
