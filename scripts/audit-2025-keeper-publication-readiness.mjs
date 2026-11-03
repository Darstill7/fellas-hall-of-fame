// Readiness gate for public keeper-decision ratings. Refuse to mistake retrospective
// output for a keeper-deadline decision or to double-charge an abandoned keeper.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const score=read('data-integrity/keeper-2025-decision-research-index-v1.json');
const scenarios=read('data-integrity/keeper-2025-score-sensitivity-v1.json');
const roster=read('data-integrity/keeper-2025-predeadline-roster-recovery-v1.json');
const keeperDrops=read('data-integrity/keeper-2025-abandonment-receipts-v1.json');
const direct=read('data-integrity/keeper-2025-abandonment-direct-replacements-v1.json');
const downstream=read('data-integrity/keeper-2025-abandonment-downstream-evidence-v1.json');
const composite=read('data-integrity/keeper-2025-composite-evidence-v1.json');
const candidates=read('data-integrity/keeper-2025-retrospective-candidate-inventory-v1.json');
const bracket=read('data-integrity/keeper-2025-championship-bracket-contribution-v1.json');
const websiteResearch=read('data/keeper_2025_website_research_v1.json');
assert.equal(candidates.rows.length,10);
assert.equal(candidates.coverage.keepersMatched,20);
assert.equal(bracket.rows.length,10);
assert.equal(score.rows.length,10);
assert.equal(scenarios.stability.length,10);
assert.equal(composite.players.length,20);
assert.equal(keeperDrops.rows.length,2);
assert.equal(direct.rows.length,2);
assert.equal(downstream.rows.length,2);
assert.equal(websiteResearch.rows.length,10);
const birchWebsite=websiteResearch.rows.find(x=>x.manager==='Birch');
const kuhlWebsite=websiteResearch.rows.find(x=>x.manager==='Kuhl');
assert.equal(birchWebsite?.verifiedDropContext?.[0]?.transactionId,'1276366260652736512');
assert.equal(kuhlWebsite?.verifiedDropContext?.[0]?.transactionId,'1278720074449977344');
assert.match(birchWebsite.verifiedDropContext[0].transaction,/Kareem Hunt/);
assert.match(kuhlWebsite.verifiedDropContext[0].transaction,/Arizona Cardinals/);
assert.equal(birchWebsite.verifiedDropContext[0].penaltyStatus,'verified_context_no_numeric_penalty_yet');
assert.equal(kuhlWebsite.verifiedDropContext[0].penaltyStatus,'verified_context_no_numeric_penalty_yet');
// Independently reconcile each published drop description to completed
// original-provider receipts. A failed claim, unrelated player or guessed
// winning bid must never appear as a verified keeper release.
const publicDropCases=[
 {manager:'Birch',week:3,id:'1276366260652736512',team:'10',
  keeperId:'8154',addedId:'4098',bid:2},
 {manager:'Kuhl',week:4,id:'1278720074449977344',team:'9',
  keeperId:'3163',addedId:'ARI',bid:5}
];
for(const entry of publicDropCases){
 const provider=read('data-integrity/provider-recovered-transactions-2025-week'+entry.week+'.json');
 const hits=provider.transactions.filter(t=>String(t.transactionId)===entry.id);
 assert.equal(hits.length,1,'Keeper release receipt must match exactly one provider transaction');
 const receipt=hits[0];
 assert.equal(receipt.status,'complete');
 assert.equal(receipt.type,'waiver');
 assert.equal(receipt.faabBid,entry.bid);
 assert.equal(receipt.week,entry.week);
 assert.ok(receipt.teamIds.map(String).includes(entry.team));
 assert.ok(receipt.dropped.some(p=>String(p.id)===entry.keeperId),
  'Original keeper was not the player dropped');
 assert.ok(receipt.added.some(p=>String(p.id)===entry.addedId),
  'Published replacement was not the acquired player');
 const publicRow=websiteResearch.rows.find(x=>x.manager===entry.manager);
 const context=publicRow?.verifiedDropContext?.[0];
 assert.equal(context?.transactionId,entry.id);
 assert.equal(context?.week,entry.week);
 assert.equal(context?.penaltyStatus,'verified_context_no_numeric_penalty_yet');
 assert.equal(publicRow.officialKeeperDecisionGrade,null);
}
const rosterProof=roster.checks.find(x=>x.week===17);
assert.equal(rosterProof.keepersFoundOnOriginalManagerRoster,20);
assert.equal(roster.keeperDeadlineRosterVerified,false);
assert.equal(roster.eligibleAlternativePoolVerified,false);
// A verified completed outright drop is an event, not automatically a mistake.
// Guard against duplicates, misclassified trades, and speculative penalty values.
const seenDropReceipts=new Set();
for(const drop of keeperDrops.rows){
 const key=drop.manager+'|'+drop.playerId+'|'+drop.transactionId;
 assert.ok(!seenDropReceipts.has(key),'Duplicate keeper abandonment receipt '+key);
 seenDropReceipts.add(key);
 assert.equal(drop.verifiedDisposition,'completed_drop_not_trade');
 assert.equal(drop.dropTimingEvidenceVerified,true);
 assert.equal(drop.injuryOrRosterNecessityVerified,false);
 assert.equal(drop.netOpportunityCost,null);
 assert.equal(drop.suggestedPenaltyPoints,null);
 assert.equal(drop.keeperDecisionGrade,null);
 assert.ok(!drop.replacementAdded.some(p=>String(p.id)===String(drop.playerId)),
  'A drop and reacquisition cannot be treated as a simple keeper abandonment');
}
const managers=score.rows.map(m=>{
 const baseline=scenarios.scenarios.find(x=>x.id==='baseline').rows.find(x=>x.manager===m.manager);
 const stability=scenarios.stability.find(x=>x.manager===m.manager);
 assert.ok(baseline&&stability);
 assert.equal(m.observedResearchIndex,baseline.score);
 const bracketProof=bracket.rows.find(x=>x.manager===m.manager);
 assert.ok(bracketProof);
 assert.ok(Math.abs(m.verifiedChampionshipBracketStartedPoints-bracketProof.verifiedChampionshipBracketKeeperStartedPoints)<.011);
 assert.ok(Math.abs(m.otherWeek15To17StartedPoints-bracketProof.otherWeek15To17KeeperStartedPoints)<.011);
 assert.equal(m.championshipBracketQualifier,bracketProof.qualifiedFor2025ChampionshipBracket);
 const drops=keeperDrops.rows.filter(x=>x.manager===m.manager);
 assert.equal(drops.length,m.verifiedDropCount);
 for(const d of drops){
  const observed=downstream.rows.find(x=>x.manager===m.manager&&x.player===d.keeper);
  const replacement=direct.rows.find(x=>x.manager===m.manager&&x.droppedKeeper===d.keeper);
  assert.ok(observed&&replacement,'Drop evidence incomplete: '+d.keeper);
  assert.equal(observed.abandonmentPenalty,null);
  assert.equal(replacement.abandonmentPenalty,null);
 }
 assert.equal(m.abandonmentPenalty,null);
 assert.equal(m.certifiedKeeperDecisionScore,null);
 assert.equal(m.publicReportCardKeeperGrade,null);
 return {manager:m.manager,researchIndex:m.observedResearchIndex,
  bestRankAcrossWeights:stability.bestRank,worstRankAcrossWeights:stability.worstRank,
  verifiedAbandonmentEvents:drops.map(d=>({keeper:d.keeper,providerWeek:d.providerWeek,
   transactionId:d.transactionId,penaltyCertified:false})),
  gates:{retrospectiveStartedProductionVerified:true,postseasonStartedProductionVerified:true,
   championshipBracketOnlyScoringVerified:true,historicalCandidateRosterComparedByPlayerId:true,
   originalManagerDropReceiptsVerified:true,keeperDeadlineEligibilityVerified:false,
   decisionTimeAlternativePoolVerified:false,causalReplacementValueVerified:false,
   abandonmentNecessityVerified:drops.length===0?null:false,
   doubleCountingCleared:false},
  publicKeeperDecisionGrade:null,publicOvrAdjustment:null};
});
const report={schema:'fellas-2025-keeper-publication-readiness-v1',
 status:'do_not_publish_research_score_as_decision_skill',
 decisionRules:[
  'The research index may be displayed only with a research-only label and component provenance.',
  'A public Keeper Decision score requires verified keeper-deadline eligibility and an actual alternative set.',
  'Do not add a generic early-drop penalty to an outcome score already reduced by the missing player starts.',
  'Any abandonment adjustment must be justified by evidence of timing, contemporaneous necessity, and replacement choices; cap once per season.',
  'Downstream production by other managers is hindsight, not lost opportunity assigned to the original manager.',
  'Only championship bracket starts are credited in the research playoff component; non-playoff games must not be counted.',
  'Cross-team conflicts in prior-year roster snapshots are not certified keeper alternatives.',
  'Verified playoff points are observed contribution, not proven leverage or incremental fantasy wins.',
  'No public OVR mutation or manager report-card rating is permitted by this report.'
 ],
 blockers:['Historical final-week candidate roster has at least one duplicate cross-team identity','No certified deadline roster/keeper eligibility','No contemporaneous eligible player alternative pool',
  'Drop justification and direct replacement utility are not yet causally established',
  'Proposed weighting not prospectively calibrated; overlapping production and abandonment mechanisms need de-duplication'],
 managers,publicKeeperDecisionScoresCertified:0,ovrUpdatesAuthorized:false};
const target='data-integrity/keeper-2025-publication-readiness-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),report);
else fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
console.log('Keeper publication readiness PASS: 10/10 research-only, 0 OVR updates; all original-manager drops flagged');
