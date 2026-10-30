// Trade event reconstruction from certified archived trade sides.
// Never infer keeper value, roster fit or ex-ante fairness from direct edge.
const alias=n=>n==='Tom'?'Thommy':n;
export function tradeEvents(source){
 const qualified=source.sides.filter(x=>x.provisional===false&&String(x.confidence).startsWith('verified')&&Number.isFinite(x.direct_edge)&&x.trade_id);
 const groups=new Map();
 for(const side of qualified){const key=String(side.year)+'/'+String(side.trade_id);if(!groups.has(key))groups.set(key,[]);groups.get(key).push({...side,manager:alias(side.manager)})}
 return [...groups.entries()].map(([key,sides])=>{
  const managers=[...new Set(sides.map(x=>x.manager))];
  const complete=managers.length>=2&&sides.length===managers.length;
  return {key,year:sides[0].year,week:sides[0].week,tradeId:String(sides[0].trade_id),sides,managers,complete,qualifyingSides:sides.length,limitation:complete?'All represented participants have qualifying source sides; does not establish complete traded asset detail.':'Only part of the trade is certified in this model; no winner can be declared.'};
 }).sort((a,b)=>b.year-a.year||b.week-a.week||a.tradeId.localeCompare(b.tradeId));
}
export function tradeManagerSummary(events,name){
 const seen=events.filter(e=>e.managers.includes(name));
 const complete=seen.filter(e=>e.complete);
 const edges=seen.flatMap(e=>e.sides.filter(s=>s.manager===name).map(s=>s.direct_edge));
 const sum=edges.reduce((s,n)=>s+n,0);
 return {name,certifiedEvents:seen.length,fullyRepresentedEvents:complete.length,partialEvents:seen.length-complete.length,certifiedSides:edges.length,meanDirectEdge:edges.length?Math.round(10*sum/edges.length)/10:null,positiveSides:edges.filter(x=>x>0).length,negativeSides:edges.filter(x=>x<0).length,neutralSides:edges.filter(x=>x===0).length};
}
