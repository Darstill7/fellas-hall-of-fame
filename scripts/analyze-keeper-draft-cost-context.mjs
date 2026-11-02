// Draft-round opportunity-cost context: compare actual keeper slots with the
// observed same-round draft board. This is NOT a decision-time available player pool.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const draft=read('data/v9_draft_engine.json');
const keeper=read('data-integrity/keeper-draft-slot-reconciliation-v1.json');
const rows=[],coverage=[];
for(const year of [2025,2026]){
 const all=draft.filter(p=>p.year===year);
 const roundMap=new Map();
 for(const p of all){if(!roundMap.has(p.round))roundMap.set(p.round,[]);roundMap.get(p.round).push(p)}
 let withPeers=0;
 for(const x of keeper.rows.filter(r=>r.year===year)){
  const peers=(roundMap.get(x.round)??[]).filter(p=>!p.keeper&&Number.isFinite(p.surplus));
  const sameRoundDraftedPlayers=(roundMap.get(x.round)??[]).filter(p=>!p.keeper).length;
  if(sameRoundDraftedPlayers)withPeers++;
  rows.push({...x,observedSameRoundNonkeeperDraftPicks:sameRoundDraftedPlayers,
   sameRoundCompletedSeasonSurplusSample:year===2025?peers.length:null,
   sameRoundCompletedSeasonMedianSurplus:year===2025&&peers.length>=3?(()=>{
    const sorted=peers.map(p=>p.surplus).sort((a,b)=>a-b);
    const mid=Math.floor(sorted.length/2);
    return Math.round((sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2)*100)/100;
   })():null,
   comparisonMeaning:'observed_same_round_drafted_peers_not_predecision_alternatives',
   keeperForegoneDraftPickValue:null,exAnteKeeperDecisionValue:null,
   overallKeeperValue:null,grade:null});
 }
 coverage.push({year,keepers:keeper.rows.filter(r=>r.year===year).length,
  keepersWithAnySameRoundNonkeeperPick:withPeers,certifiedKeeperValues:0});
}
const result={schema:'fellas-keeper-opportunity-cost-context-v1',status:'historical_draft_peer_context_no_decision_grade',
 caveats:['A realized same-round pick is not necessarily a player who was available at the managers actual pick.',
  'Realized performance is hindsight and cannot establish ex ante keeper choice quality.',
  'A keeper pick consumes draft capital, but exact foregone opportunity is unverified.',
  '2026 remains incomplete, so its peer surplus is not calculated.'],coverage,rows};
const path='data-integrity/keeper-opportunity-cost-context-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(path),result,'Keeper opportunity-cost context stale');
else fs.writeFileSync(path,JSON.stringify(result,null,2)+'\n');
console.log('Keeper opportunity-cost peer context:',rows.length,'keepers; no invented decisions or grades');
