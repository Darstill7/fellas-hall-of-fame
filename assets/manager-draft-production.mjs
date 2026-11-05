// Observed draft-pick lineup contribution. This is not a draft skill or player-value score.
// v9_draft_engine starter points are attributed to the original drafting manager only.
// Keep completed 2020–2025 seasons separate from incomplete 2026.
export function buildDraftProduction(drafts, manager) {
 if(!Array.isArray(drafts)||!manager)throw Error('Invalid draft-production source');
 const normalized=manager==='Thommy'?'Tom':manager;
 const rows=drafts.filter(p=>p.manager===normalized&&p.year>=2020&&p.year<=2025&&!p.keeper);
 if(!rows.length)return {manager,seasonCount:0,selectionCount:0,starts:0,points:0,byYear:[],top:[],status:'no_documented_selections'};
 const seen=new Set();
 for(const pick of rows){
  const key=pick.year+':'+pick.overall;
  if(seen.has(key)||!Number.isInteger(p.year)||!Number.isInteger(p.overall)||pick.overall<1||
     !Number.isInteger(p.round)||pick.round<1||typeof pick.player!=='string'||!pick.player.trim()||
     !Number.isInteger(p.reg_starts)||p.reg_starts<0||
     !Number.isFinite(p.reg_starter_points))
   throw Error('Invalid or duplicate original-manager draft receipt: '+key);
  seen.add(key);
 }
 const round2=n=>Math.round(n*100)/100;
 const years=[...new Set(rows.map(p=>p.year))].sort((a,b)=>b-a);
 const byYear=years.map(year=>{
  const picks=rows.filter(p=>p.year===year);
  return {year,selections:picks.length,starts:picks.reduce((n,p)=>n+p.reg_starts,0),
   points:round2(picks.reduce((n,p)=>n+p.reg_starter_points,0))};
 });
 const top=[...rows].sort((a,b)=>b.reg_starter_points-a.reg_starter_points||a.year-b.year||a.overall-b.overall)
  .slice(0,5).map(p=>({year:p.year,round:p.round,player:p.player,
   starts:p.reg_starts,points:round2(p.reg_starter_points),tradedSameSeason:p.traded_same_season===true}));
 return {manager,seasonCount:years.length,selectionCount:rows.length,
  starts:rows.reduce((n,p)=>n+p.reg_starts,0),
  points:round2(rows.reduce((n,p)=>n+p.reg_starter_points,0)),
  byYear,top,status:'observed_original_manager_starts_only'};
}
