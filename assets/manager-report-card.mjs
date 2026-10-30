// Manager Report Card v1 — category scores from documented archived evidence.
// Waiver and start/sit remain unrated until full decision-level source coverage exists.
export const WEIGHTS={drafting:25,trading:25,regular:20,allPlay:15,waivers:10,lineups:5};
const round=n=>Math.round(n*10)/10,clamp=n=>Math.max(0,Math.min(100,n));
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const percentile=(x,xs)=>xs.length?100*(xs.filter(y=>y<x).length+.5*xs.filter(y=>y===x).length)/xs.length:50;
export function makeReportCards({drafts,trades,careers,luck,waivers}){
 const names=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
 const alias=n=>n==='Tom'?'Thommy':n;
 const qualifyingDrafts=drafts.filter(d=>!d.keeper&&Number.isFinite(d.surplus)&&d.year<=2025);
 const draftGroups=new Map();
 for(const d of qualifyingDrafts){const n=alias(d.manager);if(!draftGroups.has(n))draftGroups.set(n,[]);draftGroups.get(n).push(d)}
 const tradeGroups=new Map();
 for(const t of trades.sides.filter(t=>!t.provisional&&t.confidence.startsWith('verified')&&Number.isFinite(t.direct_edge))){
  const n=alias(t.manager);if(!tradeGroups.has(n))tradeGroups.set(n,[]);tradeGroups.get(n).push(t)
 }
 const rawDraft=names.map(n=>({name:n,rows:draftGroups.get(n)||[]}));
 const draftPeers=rawDraft.filter(x=>x.rows.length>=12).map(x=>mean(x.rows.map(d=>d.surplus)));
 const rawTrade=names.map(n=>({name:n,rows:tradeGroups.get(n)||[]}));
 const tradePeers=rawTrade.filter(x=>x.rows.length>=4).map(x=>mean(x.rows.map(t=>t.direct_edge)));
 return names.map(name=>{
  const c=careers.managers[name],a=luck.ranked.find(x=>x.manager===name),dr=draftGroups.get(name)||[],tr=tradeGroups.get(name)||[];
  if(!c||!a)throw Error('Missing canonical report-card record: '+name);
  const draft=dr.length>=12?round(percentile(mean(dr.map(x=>x.surplus)),draftPeers)):null;
  const trade=tr.length>=4?round(percentile(mean(tr.map(x=>x.direct_edge)),tradePeers)):null;
  const regular=round(clamp(100*(c.w+.5*c.t+7)/(c.games+14)));
  const allPlay=round(clamp(100*(a.expectedWins+7)/(a.games+14)));
  const scores={drafting:draft,trading:trade,regular,allPlay,waivers:null,lineups:null};
  const supported=Object.entries(scores).filter(([,score])=>score!==null);
  const availableWeight=supported.reduce((s,[k])=>s+WEIGHTS[k],0);
  const provisional=round(supported.reduce((s,[k,v])=>s+WEIGHTS[k]*v,0)/availableWeight);
  return {name,provisional,scores,availableWeight,coverage:{draftPicks:dr.length,verifiedTradeSides:tr.length,waiverHighlights:(waivers.managers[name==='Thommy'?'Tom':name]||[]).length,careerGames:c.games},ungraded:['waivers','lineups'],scope:'Provisional score from graded categories only; not a complete manager-skill grade.'};
 }).sort((a,b)=>b.provisional-a.provisional||a.name.localeCompare(b.name)).map((x,i)=>({...x,rank:i+1}));
}
