// Verified championship outcomes only. Career rings never disappear from coverage.
// A 3.5-season half-life reflects recent success; each past ring retains a 25% floor.
// No 2026 title or finalist credit until the season is complete.
export const SUCCESS_WEIGHTS={championships:20,finals:8,playoffs:12};
export const HALF_LIFE=3.5;
export const LAST_COMPLETED_SEASON=2025;
export function postseasonReport(name,endings){
 const rows=(endings.managers[name]||[]).filter(x=>x.year<=LAST_COMPLETED_SEASON);
 const champions=rows.filter(x=>x.ending==='Champion');
 const finalists=rows.filter(x=>x.ending==='Runner-up');
 const ageWeight=year=>.25+.75*Math.pow(.5,(LAST_COMPLETED_SEASON-year)/HALF_LIFE);
 const effectiveTitles=champions.reduce((sum,x)=>sum+ageWeight(x.year),0);
 const effectiveRunners=finalists.reduce((sum,x)=>sum+ageWeight(x.year),0);
 const f=n=>Math.round(1000*(1-Math.exp(-n)))/10;
 return {
  titles:champions.length,runners:finalists.length,finalsAppearances:champions.length+finalists.length,minimumPlayoffs:champions.length+finalists.length,
  effectiveTitles:Math.round(effectiveTitles*1000)/1000,
  effectiveRunners:Math.round(effectiveRunners*1000)/1000,
  titleYears:champions.map(x=>x.year),runnerYears:finalists.map(x=>x.year),
  scores:{championships:f(effectiveTitles/1.8),finals:f(effectiveRunners/1.5)},
  limited:true,recencyHalfLifeSeasons:HALF_LIFE
 };
}
