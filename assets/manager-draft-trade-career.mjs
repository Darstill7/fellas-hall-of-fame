// Shared career résumé aggregation. Activity and source coverage only, never skill.
// Operates on the same archive rows used in every manager's season timeline.
export function buildDraftTradeCareer(rows,manager){
 if(!Array.isArray(rows)||typeof manager!=='string'||!manager)throw Error('Invalid career source');
 const seasons=rows.filter(x=>x.manager===manager).sort((a,b)=>b.year-a.year);
 if(!seasons.length)throw Error('Manager lacks documented draft seasons');
 if(new Set(seasons.map(x=>x.year)).size!==seasons.length)throw Error('Duplicate career season');
 const total=key=>seasons.reduce((n,x)=>n+x[key],0);
 for(const s of seasons){
  if(!Number.isInteger(s.year)||s.year<2016||s.year>2026||
     !Number.isInteger(s.recordedSelections)||s.recordedSelections<1||
     !Number.isInteger(s.recordedKeeperSelections)||s.recordedKeeperSelections<0||
     s.recordedKeeperSelections>s.recordedSelections||
     !Number.isInteger(s.unresolvedNames)||s.unresolvedNames<0||
     s.unresolvedNames>s.recordedSelections||
     !Array.isArray(s.earlySelections)||s.earlySelections.length>3||
     !s.earlySelections.every(p=>Number.isInteger(p.round)&&Number.isInteger(p.overall)&&
       (p.player===null||typeof p.player==='string'))||
     !s.trades||!Number.isInteger(s.trades.representedEvents)||
     !Number.isInteger(s.trades.fullyRepresentedEvents)||
     !Number.isInteger(s.trades.partialEvents)||
     s.trades.representedEvents<0||s.trades.fullyRepresentedEvents<0||
     s.trades.partialEvents<0||
     s.trades.fullyRepresentedEvents+s.trades.partialEvents!==s.trades.representedEvents)
   throw Error('Invalid career evidence '+manager+' '+s.year);
 }
 const latestPicks=seasons.filter(s=>s.earlySelections.some(p=>p.player))
  .slice(0,3).map(s=>({
   year:s.year,platform:s.platform,
   picks:s.earlySelections.filter(p=>p.player).slice(0,2).map(p=>({round:p.round,player:p.player}))
  }));
 return {
  manager,seasons:seasons.length,firstYear:seasons[seasons.length-1].year,
  lastYear:seasons[0].year,documentedPicks:total('recordedSelections'),
  keeperSlots:total('recordedKeeperSelections'),
  unresolvedNames:total('unresolvedNames'),
  espnSeasons:seasons.filter(s=>s.platform==='ESPN').length,
  sleeperSeasons:seasons.filter(s=>s.platform==='Sleeper').length,
  representedTrades:seasons.reduce((n,s)=>n+s.trades.representedEvents,0),
  fullyRepresentedTrades:seasons.reduce((n,s)=>n+s.trades.fullyRepresentedEvents,0),
  partialTrades:seasons.reduce((n,s)=>n+s.trades.partialEvents,0),
  latestPicks
 };
}
