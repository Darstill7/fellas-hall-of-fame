// Keeper decision research: separate realized contribution from cost-adjusted decision value.
// The latter requires verified alternatives at the actual decision deadline.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const drafts=read('data/v9_draft_engine.json');
const rules=read('data-integrity/sleeper-season-rule-matrix-2020-2026.json');
const status=new Map(rules.seasons.map(x=>[x.year,x.keepersEnabled]));
const rows=[],coverage=[];
for(const year of [2025,2026]){
 assert.equal(status.get(year),true,'Keeper season not confirmed');
 const picks=drafts.filter(x=>x.year===year&&x.keeper);
 for(const p of picks){
  assert.ok(p.player&&p.manager&&p.overall>0&&p.round>0,'Keeper draft receipt incomplete');
  rows.push({year,manager:p.manager==='Tom'?'Thommy':p.manager,player:p.player,position:p.position,
   draftCostRound:p.round,draftSlot:p.overall,seasonComplete:year===2025,startedRegularPoints:p.reg_starter_points,
   regularStarts:p.reg_starts,playoffStarterPoints:p.playoff_starter_points,
   tradeOccurred:p.traded_same_season,observedToDateContribution:p.reg_starter_points+p.playoff_starter_points,contributionStatus:year===2025?'archived_completed_season':'in_progress_partial_observation',
   opportunityCostAtSelection:null,exAnteAlternativeValue:null,keeperDecisionValue:null,overallKeeperValue:null,
   grade:null,gradeStatus:'not_certified_pending_ex_ante_alternative_and_slot_cost'});
 }
 coverage.push({year,keeperSelections:picks.length,selectionReceipts:picks.length,
  costAdjustedKeeperValuesCertified:0,managerGradesCertified:0});
}
assert.equal(rows.length,40,'Keeper selection archive size changed');
const managers=[...new Set(rows.map(r=>r.manager))].sort().map(manager=>({manager,
  keeperSelections:rows.filter(r=>r.manager===manager).length,
  completedSeasonKeeperSelections:rows.filter(r=>r.manager===manager&&r.seasonComplete).length,
  decisionGrade:null,overallKeeperValue:null,
  status:'not_certified_cost_and_alternatives_missing'}));
const result={schema:'fellas-keeper-decision-value-research-v1',
 status:'research_only_not_keeper_grade',
 interpretation:'Overall Keeper Value should combine actual benefit, cost of forfeited draft position, and contemporaneous alternative choices. Raw started points are only observed contribution and are not keeper decision value.',
 coverage,managers,rows};
const path='data-integrity/keeper-decision-value-research-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(path),result,'Keeper decision report stale');
else fs.writeFileSync(path,JSON.stringify(result,null,2)+'\n');
console.log('Keeper decision research:',rows.length,'keeper selections, zero unverified grades');
