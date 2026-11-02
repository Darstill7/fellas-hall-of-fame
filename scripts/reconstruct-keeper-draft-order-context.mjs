// Historical draft-order availability: identify players actually selected after
// a consumed keeper slot. This cannot recover a keeper-deadline choice set.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const board=read('data/v9_draft_engine.json');
const keeper=read('data-integrity/keeper-draft-slot-reconciliation-v1.json');
const rows=[],coverage=[];
for(const year of [2025,2026]){
 const season=board.filter(x=>x.year===year).sort((a,b)=>a.overall-b.overall);
 assert.equal(season.length,150,'Incomplete historical draft board '+year);
 const slots=new Set(season.map(x=>x.overall));assert.equal(slots.size,150,'Duplicate draft positions '+year);
 let withLater=0;
 for(const k of keeper.rows.filter(x=>x.year===year)){
  const later=season.filter(p=>p.overall>k.overall&&!p.keeper);
  if(later.length)withLater++;
  const near=later.slice(0,10).map(p=>({player:p.player,position:p.position,overall:p.overall,round:p.round,
   observedAfterKeeperSlot:true,actualKeeperDeadlineAlternativeVerified:false}));
  rows.push({year,manager:k.manager,keptPlayer:k.player,usedSlot:k.overall,usedRound:k.round,
   totalLaterDraftedNonkeepers:later.length,firstTenLaterSelectedNonkeepers:near,
   atDraftSlotCandidateEvidence:'selected_after_keeper_slot_only',
   decisionTimeAlternativeSetVerified:false,
   expectedKeeperSurplus:null,decisionGrade:null,overallKeeperValue:null});
 }
 coverage.push({year,keepers:keeper.rows.filter(x=>x.year===year).length,
  keeperSlotsWithSubsequentNonkeeperSelections:withLater,verifiedKeeperDeadlineAlternatives:0});
}
const result={schema:'fellas-keeper-draft-order-context-v1',
 status:'historical_draft_order_not_decision_time_availability',
 notes:['Later-selected nonkeeper players demonstrate draft sequence, not roster eligibility or keeper-deadline options.',
 'This analysis does not assume a manager could replace a keeper with any specific later player.',
 'Scored 2026 production is incomplete and never used to grade decisions.',
 'Keeper eligibility, protected assets and deadline valuations require a separate verified source.'],coverage,rows};
const path='data-integrity/keeper-draft-order-context-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(path),result,'Keeper draft order context stale');
else fs.writeFileSync(path,JSON.stringify(result,null,2)+'\n');
console.log('Keeper draft-order context:',rows.length,'slots; no certified choice sets');
