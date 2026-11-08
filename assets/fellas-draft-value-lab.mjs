// Evidence-scoped 2026 draft returns: draft selection receipts + historical
// starter points credited to the original drafting manager.
// Descriptive after-the-fact contribution, not projected talent or manager skill.
const norm=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const round2=x=>Math.round((x+Number.EPSILON)*100)/100;
const median=values=>{const a=values.slice().sort((x,y)=>x-y);return !a.length?null:a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2;};
const mgr=x=>x==='Tom'?'Thommy':x;
export function computeDraftValue(board,engine){
 if(board?.draftId!=='1340027406018150400'||board.picks?.length!==150||!Array.isArray(engine))throw Error('Incomplete Fellas 2026 draft/value data');
 const source=engine.filter(x=>x.year===2026),seen=new Set();
 if(source.length!==150)throw Error('Original-manager starter receipt count is incomplete');
 const picks=board.picks.map(p=>{
  const sourceRow=source.find(x=>x.overall===p.overall),key=String(p.overall);
  if(seen.has(key)||!sourceRow||p.manager!==mgr(sourceRow.manager)||p.round!==sourceRow.round||
    norm(p.player)!==norm(sourceRow.player)||p.keeper!==sourceRow.keeper||p.placement!=='confirmed')
   throw Error('Draft/started-point identity mismatch at pick '+p.overall);
  seen.add(key);
  if(!Number.isFinite(sourceRow.reg_starter_points)||!Number.isInteger(sourceRow.reg_starts)||sourceRow.reg_starts<0)
   throw Error('Unverified started-point receipt at pick '+p.overall);
  return {...p,startedPoints:round2(sourceRow.reg_starter_points),starts:sourceRow.reg_starts,
   wasTraded:sourceRow.traded_same_season===true,originalManagerOnly:true};
 });
 const rows=picks.map(p=>{
  // Compare every pick to OTHER nonkeeper selections from its same draft round.
  // Keeper costs represent historical draft slots, never inferred alternative decisions.
  const peers=picks.filter(x=>x.overall!==p.overall&&x.round===p.round&&!x.keeper);
  const peerMedian=peers.length>=3?median(peers.map(x=>x.startedPoints)):null;
  return {...p,peerCount:peers.length,peerMedian:peerMedian===null?null:round2(peerMedian),
    valuePoints:peerMedian===null?null:round2(p.startedPoints-peerMedian),
    valueStatus:p.keeper?'keeper_slot_comparison_not_decision':'original_drafting_manager_round_surplus'};
 });
 const names=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
 const managers=names.map(manager=>{
  const own=rows.filter(p=>p.manager===manager),normal=own.filter(p=>!p.keeper),kept=own.filter(p=>p.keeper);
  const comparable=normal.filter(p=>p.valuePoints!==null),keeperComparable=kept.filter(p=>p.valuePoints!==null);
  return {manager,picks:own.length,nonkeeperPicks:normal.length,keeperPicks:kept.length,
   totalStartedPoints:round2(own.reduce((n,p)=>n+p.startedPoints,0)),
   draftedStartedPoints:round2(normal.reduce((n,p)=>n+p.startedPoints,0)),
   keeperStartedPoints:round2(kept.reduce((n,p)=>n+p.startedPoints,0)),
   nonkeeperComparable:comparable.length,
   totalDraftValuePoints:round2(comparable.reduce((n,p)=>n+p.valuePoints,0)),
   valuePointsPerNonkeeperPick:comparable.length?round2(comparable.reduce((n,p)=>n+p.valuePoints,0)/comparable.length):null,
   positiveValuePicks:comparable.filter(p=>p.valuePoints>0).length,
   keeperSlotComparisons:keeperComparable.length,
   totalKeeperSlotSurplus:round2(keeperComparable.reduce((n,p)=>n+p.valuePoints,0))};
 });
 return {draftId:board.draftId,year:2026,scope:'2026 draft engine archival starter snapshot; season incomplete; not player full-season scoring',picks:rows,managers,
  definitions:{starterPoints:'Fantasy points from documented starting-lineup appearances credited to the team that originally drafted the player; excludes points scored for other teams, bench and free agents.',
   draftValue:'For non-keeper picks: original-manager starter points minus the median started points of other nonkeeper picks in the same round. Value Points per Pick is the average across comparable picks.',
   keeperValue:'For keeper picks: original-manager started points minus the median started points from other nonkeeper selections in the same draft round. This measures realized slot return, not keeper-choice quality.',
   keeperDecision:'A keeper decision score requires proof of the managers eligible alternatives and keeper costs at the deadline; this snapshot does not provide those counterfactuals.',
   caution:'Keeper slots are excluded from drafted-value ranking, scoring formats vary across years, traded players only credit original-manager starts, and draft value may change after future games.'}};
}
