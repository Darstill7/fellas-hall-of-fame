// Research-only, future-source contract for position- and dual-FLEX-aware
// PRELOCK roster replacement. Does not grade any actual Fellas trade.
// No historical projections are invented by this module.
const eligiblePositions={QB:['QB'],RB:['RB'],WR:['WR'],TE:['TE'],FLEX:['RB','WR','TE'],DEF:['DEF']};
const time=(value,label)=>{
 const parsed=Date.parse(value);
 if(typeof value!=='string'||!Number.isFinite(parsed)||!/Z$|[+-]\d\d:\d\d$/.test(value))throw Error(label+' needs offset-aware ISO timestamp');
 return parsed;
};
function assertNonempty(x,label){if(typeof x!=='string'||!x.trim())throw Error(label+' must be a sourced nonempty string')}
export function assessPrelockReplacements({owner,decisionTime,holes,candidates,sourceVersion}){
 assertNonempty(owner,'receiving owner');assertNonempty(sourceVersion,'projection source/version');
 const decision=time(decisionTime,'decisionTime');
 if(!Array.isArray(holes)||!holes.length||holes.length>9)throw Error('One to nine exact starting-slot holes required');
 if(!Array.isArray(candidates)||candidates.length>30)throw Error('Bench candidate list must be explicit, max 30');
 const holeIds=new Set();
 for(const h of holes){
  assertNonempty(h.id,'hole ID');
  if(holeIds.has(h.id))throw Error('Duplicate lineup hole');
  holeIds.add(h.id);
  if(!eligiblePositions[h.slot])throw Error('Unknown starting slot '+h.slot);
  if(!(time(h.lockAt,'hole lockAt')>decision))throw Error('Lineup slot already locked at decision time');
 }
 const benchIds=new Set();
 for(const p of candidates){
  assertNonempty(p.id,'candidate player ID');assertNonempty(p.position,'candidate position');
  if(benchIds.has(p.id))throw Error('Duplicate bench candidate player ID');
  benchIds.add(p.id);
  assertNonempty(p.projectionSource,'candidate forecast source');
  if(p.projectionSource!==sourceVersion)throw Error('Projection source/version mismatch');
  if(p.owner!==owner)throw Error('Candidate must be owned by same roster at decision time');
  if(p.activeAtDecision!==true)throw Error('Candidate lacks verified active-at-decision source state');
  if(!Number.isFinite(p.projectedPoints)||p.projectedPoints<0)throw Error('Missing valid forecast points');
  if(time(p.projectionIssuedAt,'projection issuedAt')>decision)throw Error('Future projection leaks into decision');
  if(time(p.ownershipVerifiedAt,'ownership verifiedAt')>decision)throw Error('Future roster evidence leaks into decision');
  if(!(time(p.gameLockAt,'candidate gameLockAt')>decision))throw Error('Candidate game already locked');
 }
 // Options use the player's ORIGINAL position. FLEX eligibility does not
 // allow QB/DEF. A player can never be assigned to two different holes.
 const options=holes.map(h=>candidates.map((p,j)=>eligiblePositions[h.slot].includes(p.position)?j:-1).filter(j=>j>=0));
 const memo=new Map();
 const solve=(i,mask)=>{
  if(i===holes.length)return {covered:0,projected:0,choices:[]};
  const key=i+'|'+mask;
  if(memo.has(key))return memo.get(key);
  let tail=solve(i+1,mask);
  let best={covered:tail.covered,projected:tail.projected,choices:[null,...tail.choices]};
  for(const j of options[i]){
   if((mask & (1n<<BigInt(j)))!==0n)continue;
   tail=solve(i+1,mask|(1n<<BigInt(j)));
   const choice={covered:tail.covered+1,projected:tail.projected+candidates[j].projectedPoints,choices:[candidates[j].id,...tail.choices]};
   if(choice.covered>best.covered||choice.covered===best.covered&&choice.projected>best.projected)best=choice;
  }
  memo.set(key,best);return best;
 };
 const result=solve(0,0n);
 const assignments=holes.map((h,i)=>({holeId:h.id,slot:h.slot,benchPlayerId:result.choices[i]}));
 return {
  status:result.covered===holes.length?'source_gated_full_prelock_assignment':'incomplete_prelock_substitution_evidence',
  researchOnly:true,
  owner,sourceVersion,decisionTime,
  covered:result.covered,required:holes.length,uncovered:holes.length-result.covered,
  projectedBenchPointsForCoveredSlots:+result.projected.toFixed(2),
  assignments,
  limitations:['Sourced projections are not causally validated trade value','No waiver acquisition simulation','Only positions already sourced on the receiving team bench','Owner and health status require an authentic decision-time source']
 };
}
