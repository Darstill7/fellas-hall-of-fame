// Composite keeper evidence report: realized production, nominal draft costs,
// retrospective positional peers, and limits of postseason source coverage.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const weekly=read('data-integrity/keeper-2025-started-week-positional-context-v1.json');
const roundPeer=read('data-integrity/keeper-2025-round-peer-production-v1.json');
const positionPeer=read('data-integrity/keeper-2025-position-peer-context-v1.json');
const drafted=read('data/v9_draft_engine.json').filter(x=>x.year===2025&&x.keeper);
const playoffs=read('data/playoff_matchups_2020_2025.json').filter(x=>x.year===2025);
const postseason=read('data-integrity/keeper-2025-postseason-verification-v1.json');
assert.equal(postseason.rows.length,20);
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const rows=weekly.rows.map(k=>{
 const match=arr=>{const x=arr.filter(y=>y.manager===k.manager&&y.player===k.player);assert.equal(x.length,1);return x[0]};
 const draft=drafted.filter(y=>(y.manager==='Tom'?'Thommy':y.manager)===k.manager&&y.player===k.player);
 assert.equal(draft.length,1);
 const a=match(roundPeer.rows),b=match(positionPeer.rows),proof=match(postseason.rows);
 assert.ok(Math.abs(proof.verifiedPoints-draft[0].playoff_starter_points)<.011);
 assert.equal(proof.verifiedStarts,draft[0].playoff_starts);
 assert.equal(draft[0].round,a.draftRound);
 assert.equal(draft[0].position,b.position);
 const comparison=k.weeklyEvidence.reduce((s,x)=>s+x.observedLeagueStarterMedian,0);
 const delta=round(k.verifiedStartedPoints-comparison);
 assert.ok(Math.abs(delta-k.observedMedianDifferenceTotal)<.12);
 return {manager:k.manager,player:k.player,position:k.position,keeperRound:k.round,
  starts:k.verifiedStarts,verifiedRegularStarterPoints:k.verifiedStartedPoints,
  correspondingObservedStarterMedianPoints:round(comparison),
  differenceFromObservedStarterMedians:delta,
  sameRoundNonkeeperMedian:a.sameRoundMedianObservedStarterPoints,
  sameRoundObservedDifference:a.retrospectivePointDifference,
  samePositionNonkeeperMedian:b.observedNonkeeperPositionMedianStartedPoints,
  samePositionObservedDifference:b.descriptiveDifferenceFromPositionMedian,
  verifiedPlayoffStartedPoints:proof.verifiedPoints,
  verifiedCombinedStartedPoints:round(k.verifiedStartedPoints+proof.verifiedPoints),
  playoffIndividualScoringVerified:true,
  rosterEligibleAlternativesVerified:false,
  exAnteDraftCostOpportunityValue:null,
  positionAdjustedReplacementValue:null,keeperDecisionGrade:null};
});
const managers=[...new Set(rows.map(x=>x.manager))].sort().map(manager=>{
 const picks=rows.filter(x=>x.manager===manager);
 assert.equal(picks.length,2,'Expected two keepers: '+manager);
 return {manager,keepers:picks.map(x=>({player:x.player,position:x.position,round:x.keeperRound})),
  totalStartedWeeks:picks.reduce((s,x)=>s+x.starts,0),
  verifiedRegularStarterPoints:round(picks.reduce((s,x)=>s+x.verifiedRegularStarterPoints,0)),
  expectedPointsAtObservedLeagueStarterMedians:round(picks.reduce((s,x)=>s+x.correspondingObservedStarterMedianPoints,0)),
  descriptiveDifferenceFromLeagueStarterMedians:round(picks.reduce((s,x)=>s+x.differenceFromObservedStarterMedians,0)),
  verifiedPlayoffStarterPoints:round(picks.reduce((s,x)=>s+x.verifiedPlayoffStartedPoints,0)),
  verifiedCombinedStartedPoints:round(picks.reduce((s,x)=>s+x.verifiedCombinedStartedPoints,0)),
  opportunityCostCertified:false,postseasonPlayerProductionCertified:true,
  keeperValue:null,keeperDecisionGrade:null};
}).sort((a,b)=>b.descriptiveDifferenceFromLeagueStarterMedians-a.descriptiveDifferenceFromLeagueStarterMedians);
assert.equal(managers.length,10);assert.equal(rows.length,20);
for(const manager of managers){
 assert.ok(Math.abs(manager.verifiedCombinedStartedPoints-round(manager.verifiedRegularStarterPoints+manager.verifiedPlayoffStarterPoints))<.011);
}
assert.equal(managers.reduce((a,b)=>a+b.totalStartedWeeks,0),rows.reduce((a,b)=>a+b.starts,0));
const result={schema:'fellas-2025-keeper-composite-evidence-v1',
 status:'verified_regular_starts_observational_comparisons_uncertified_keeper_value',
 playoffEvidence:{archivedPlayoffMatchupWeeks:playoffs.map(x=>x.week),
  archivedPlayerPointsPresent:true,individualPlayerWeekPostseasonLineupsAvailable:true,
  note:'Archived individual keeper postseason totals match recovered Sleeper week 15–17 starter receipts; team-level matchups alone were insufficient.'},
 positionalOpportunityCost:{sameRoundPeerContextAvailable:true,samePositionPeerContextAvailable:true,
  actualKeeperDeadlineAlternativePoolAvailable:false,
  trueRoundSpecificReplacementValueAvailable:false,
  note:'Observed same-round and same-position nonkeeper cohorts are retrospective, not contemporaneously available alternatives. No causal surplus can be assigned.'},
 caveats:['Weekly positional median comparison only counts keeper starts for the original drafting team.',
 'No penalty is assigned for missed starts, traded keeper departures, injuries or managerial bench decisions.',
 'Observational positional benchmark includes occupied FLEX starters, not free agents.',
 'This table must not be labeled overall Keeper Value or a Manager Report Card grade.'],
 managers,players:rows};
const target='data-integrity/keeper-2025-composite-evidence-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),result);
else fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');
console.log('Composite keeper audit PASS: '+managers.length+' managers, '+rows.length+' selections, postseason receipts verified');
