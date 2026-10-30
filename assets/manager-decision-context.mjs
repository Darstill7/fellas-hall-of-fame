// Descriptive, auditable context for observed pick/trade outcomes.
// These are within-cohort comparisons, NOT estimates of ex-ante decision quality.
const alias=n=>n==='Tom'?'Thommy':n;
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
const round=x=>Math.round(x*10)/10;
export function draftContext(drafts){
 const valid=drafts.filter(x=>!x.keeper&&x.year<=2025&&Number.isInteger(x.year)&&Number.isFinite(x.surplus)&&Number.isFinite(x.round)&&x.position);
 return valid.map(x=>{
  const cohort=valid.filter(y=>y.year===x.year&&y.round===x.round&&y.position===x.position&&y!==x);
  return {...x,canonicalManager:alias(x.manager),peerCount:cohort.length,peerMeanSurplus:cohort.length?round(mean(cohort.map(y=>y.surplus))):null,peerAdjusted:cohort.length>=2?round(x.surplus-mean(cohort.map(y=>y.surplus))):null};
 });
}
export function tradeContext(trades){
 const valid=trades.sides.filter(x=>x.provisional===false&&String(x.confidence).startsWith('verified')&&Number.isFinite(x.direct_edge));
 return valid.map(x=>({...x,canonicalManager:alias(x.manager),edgePerStart:Number.isFinite(x.starts)&&x.starts>0?round(x.direct_edge/x.starts):null,hasKnownAssets:Array.isArray(x.assets)&&x.assets.length>0}));
}
export function managerDecisionSummary(name,draftRows,tradeRows){
 const picks=draftRows.filter(x=>x.canonicalManager===name);
 const comparable=picks.filter(x=>x.peerAdjusted!==null);
 const deals=tradeRows.filter(x=>x.canonicalManager===name);
 const perStart=deals.filter(x=>x.edgePerStart!==null);
 return {name,picks:picks.length,comparablePicks:comparable.length,unmatchedPicks:picks.length-comparable.length,avgPeerAdjusted:comparable.length?round(mean(comparable.map(x=>x.peerAdjusted))):null,verifiedTradeSides:deals.length,tradesWithStarts:perStart.length,avgTradeEdge:deals.length?round(mean(deals.map(x=>x.direct_edge))):null,avgEdgePerRecordedStart:perStart.length?round(mean(perStart.map(x=>x.edgePerStart))):null,disclaimer:'Observed within-season/round/position outcomes and verified trade-side edges, not ex-ante player availability, cost-adjusted trade value, or causal skill.'};
}
