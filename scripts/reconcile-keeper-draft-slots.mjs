// Reconcile archived keeper receipts with the draft board, then measure
// realized lineup production without claiming keeper opportunity-cost value.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const draft=read('data/v9_draft_engine.json');
const keeper=read('data-integrity/keeper-decision-value-research-v1.json');
const rows=[],coverage=[];
for(const year of [2025,2026]){
 const all=draft.filter(x=>x.year===year);
 const picks=all.filter(x=>x.keeper);
 const slotKeys=new Set();
 for(const p of all){
  const k=String(p.overall);
  assert.ok(!slotKeys.has(k),'Duplicate draft slot '+year+'/'+k);
  slotKeys.add(k);
 }
 const managers=new Map();
 for(const p of picks){
  const name=p.manager==='Tom'?'Thommy':p.manager;
  const key=[year,name,p.player,p.overall].join('|');
  const matching=keeper.rows.filter(x=>[x.year,x.manager,x.player,x.draftSlot].join('|')===key);
  assert.equal(matching.length,1,'Keeper receipt mismatch '+key);
  if(!managers.has(name))managers.set(name,[]);
  managers.get(name).push(p);
  assert.ok(p.round>=1&&p.round<=15);
  const regular=Number(p.reg_starter_points),playoffs=Number(p.playoff_starter_points);
  assert.ok(Number.isFinite(regular)&&Number.isFinite(playoffs));
  rows.push({year,manager:name,player:p.player,round:p.round,overall:p.overall,
    regularStartedPoints:regular,playoffStartedPoints:playoffs,
    totalObservedStartedPoints:Math.round((regular+playoffs)*100)/100,
    verifiedDraftSlot:true,keeperAlternativeSetVerified:false,
    decisionGrade:null,overallKeeperValue:null});
 }
 coverage.push({year,keeperRows:picks.length,managersWithKeeperRows:managers.size,
  managerKeeperCounts:[...managers].map(([manager,x])=>({manager,count:x.length})).sort((a,b)=>a.manager.localeCompare(b.manager)),
  draftSlotCollisions:0,gradedKeepers:0});
}
const result={schema:'fellas-keeper-draft-slot-reconciliation-v1',status:'observed_outcomes_not_keeper_decision_value',
 limitations:['Draft slot and observed lineup points are not proof that keeping was optimal at decision time.',
 '2026 is incomplete and must never be compared as a complete season.',
 'Keeper cost in rounds is observed; cost in foregone player value remains unknown.'],coverage,rows};
const path='data-integrity/keeper-draft-slot-reconciliation-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(path),result,'Keeper draft reconciliation stale');
else fs.writeFileSync(path,JSON.stringify(result,null,2)+'\n');
console.log('Keeper slot reconciliation:',rows.length,'verified keeper draft entries; zero grades');
