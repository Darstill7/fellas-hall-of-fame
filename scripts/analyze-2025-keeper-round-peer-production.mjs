// Completed 2025 keeper production relative to realized draft-round peers.
// Context only: neither the same-round peers nor their hindsight production
// establish which players were available at keeper deadline.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const draft=read('data/v9_draft_engine.json').filter(p=>p.year===2025);
const keepers=draft.filter(p=>p.keeper),regular=draft.filter(p=>!p.keeper);
assert.equal(keepers.length,20);assert.equal(draft.length,150);
const median=arr=>{const s=[...arr].sort((a,b)=>a-b),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2};
const round=n=>Math.round(n*100)/100;
const rows=keepers.map(k=>{
 const peers=regular.filter(p=>p.round===k.round&&Number.isFinite(p.reg_starter_points));
 const medianPts=peers.length>=3?round(median(peers.map(p=>p.reg_starter_points))):null;
 return {manager:k.manager==='Tom'?'Thommy':k.manager,player:k.player,position:k.position,
  draftRound:k.round,draftSlot:k.overall,verifiedRegularStarterPoints:k.reg_starter_points,
  sameRoundObservedNonkeeperCount:peers.length,
  sameRoundMedianObservedStarterPoints:medianPts,
  retrospectivePointDifference:medianPts===null?null:round(k.reg_starter_points-medianPts),
  exAnteAvailableCandidatesVerified:false,positionAdjustedReplacementValue:null,
  keeperDecisionGrade:null,overallKeeperValue:null};
}).sort((a,b)=>a.manager.localeCompare(b.manager)||a.draftSlot-b.draftSlot);
const report={schema:'fellas-2025-keeper-round-peer-production-v1',status:'descriptive_hindsight_peer_context_not_keeper_value',
 warnings:['The nonkeeper same-round comparison is retrospective, not a counterfactual available player or an ex ante valuation.',
 'No positional replacement value or true forgone selection opportunity is established.',
 'Playoff contributions remain excluded pending weekly source validation.',
 'Missing comparison peers produce null rather than a synthetic value.'],
 coverage:{keeperSelections:rows.length,sufficientPeerSamples:rows.filter(x=>x.sameRoundMedianObservedStarterPoints!==null).length,
 certifiedKeeperDecisionGrades:0,certifiedOverallKeeperValues:0},rows};
const path='data-integrity/keeper-2025-round-peer-production-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(path),report);
else fs.writeFileSync(path,JSON.stringify(report,null,2)+'\n');
console.log('2025 keeper same-round hindsight production: '+rows.length+' keepers, '+report.coverage.sufficientPeerSamples+' with round peer samples');
