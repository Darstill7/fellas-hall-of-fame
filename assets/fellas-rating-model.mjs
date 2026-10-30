// Fellas living 0–100 rating v1. Never derive a championship from regular season standings.
// Last completed championship season is 2025; 2026 Week 7 is provisional.
export const WEIGHTS=Object.freeze({titles:30,finals:5,playoffs:10,regular:20,allPlay:15,recent:5,peak:10,tenure:5});
const round=n=>Math.round((n+Number.EPSILON)*10)/10;
const clamp=n=>Math.max(0,Math.min(1,n));
const pct=(wins,ties,games,prior=14)=>clamp((wins+ties*.5+prior*.5)/(games+prior));
export function makeRatings({guide,careers,luck,endings,playoffBrackets,asOfYear=null},names=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott','Koble','Halderman','Evans','Schermerhorn']){
 const asOf=asOfYear??Math.max(...Object.keys(guide).map(Number));
 const latestFinished=Math.max(...Object.entries(guide).filter(([year,season])=>Number(year)<=asOf&&season.champion).map(([year])=>Number(year)));
 const luckBy=new Map(luck.ranked.map(x=>[x.manager,x]));
 const rows=names.map(name=>{
  const c=careers.managers[name],lk=luckBy.get(name);
  if(!c||!lk)throw Error('Missing canonical rating input: '+name);
  const years=Object.keys(c.annual).map(Number).filter(y=>y<=asOf).sort((a,b)=>a-b);
  const titleYears=Object.entries(guide).filter(([year,g])=>Number(year)<=latestFinished&&g.champion===name).map(([year])=>Number(year));
  const runnerYears=(endings.managers[name]||[]).filter(x=>x.year<=latestFinished&&/runner.up/i.test(x.ending)).map(x=>x.year);
  const decay=year=>.25+.75*Math.pow(.5,(latestFinished-year)/3.5);
  const qualifiedYears=playoffBrackets?playoffBrackets.filter(s=>s.year<=latestFinished&&(s.seeds??s.participants??[]).includes(name)).map(s=>s.year):[];
  const qualifiedEquivalent=qualifiedYears.reduce((total,year)=>total+decay(year),0);
  const playoffPoints=WEIGHTS.playoffs*(1-Math.exp(-qualifiedEquivalent/3));
  const titleEquivalent=titleYears.reduce((s,y)=>s+decay(y),0);
  const runnerEquivalent=runnerYears.reduce((s,y)=>s+decay(y),0);
  const titlePoints=WEIGHTS.titles*(1-Math.exp(-titleEquivalent/1.7));
  const finalsPoints=WEIGHTS.finals*(1-Math.exp(-runnerEquivalent/1.2));
  const observed=years.reduce((x,year)=>{const v=c.annual[year];x.w+=v.w;x.l+=v.l;x.t+=v.t;x.games+=v.games;return x},{w:0,l:0,t:0,games:0});
  const regPoints=WEIGHTS.regular*pct(observed.w,observed.t,observed.games);
  const allPoints=WEIGHTS.allPlay*clamp((lk.expectedWins+7)/(lk.games+14));
  const seasonRows=years.map(year=>{
   const v=c.annual[year], completeness=year===asOf?.5:1;
   const age=asOf-year;
   const weight=completeness*Math.pow(.5,age/2.3)*v.games;
   const all=lk.bySeason[String(year)];
   const actualPct=pct(v.w,v.t,v.games,5);
   const allPct=all?clamp((all.expectedWins+2.5)/(all.games+5)):actualPct;
   return {year,weight,mix:.5*actualPct+.5*allPct,w:v.w,l:v.l,games:v.games};
  });
  const totalWeight=seasonRows.reduce((s,v)=>s+v.weight,0);
  const form=totalWeight?seasonRows.reduce((s,v)=>s+v.mix*v.weight,0)/totalWeight:.5;
  const latestActive=Math.max(...years);
  const inactiveYears=Math.max(0,asOf-latestActive-1);
  const recentPoints=WEIGHTS.recent*form*Math.pow(.5,inactiveYears/2.3);
  const completed=seasonRows.filter(x=>x.year<=latestFinished&&x.games>=10);
  const best=completed.length?Math.max(...completed.map(v=>(v.w+2.5)/(v.games+5))):.5;
  const peakPoints=WEIGHTS.peak*clamp(best);
  const seasons=years.filter(y=>y<=latestFinished).length;
  const tenurePoints=WEIGHTS.tenure*(1-Math.exp(-seasons/5));
  const breakdown={titles:round(titlePoints),finals:round(finalsPoints),playoffs:round(playoffPoints),regular:round(regPoints),allPlay:round(allPoints),recent:round(recentPoints),peak:round(peakPoints),tenure:round(tenurePoints)};
  const score=round(titlePoints+finalsPoints+playoffPoints+regPoints+allPoints+recentPoints+peakPoints+tenurePoints);
  return {name,score,rank:0,breakdown,career:`${observed.w}–${observed.l}${observed.t?'–'+observed.t:''}`,titleYears,sevenYearTitles:titleYears.filter(y=>y>=latestFinished-6).length,runnerYears,qualifiedYears,tenure:seasons,form:round(form*100),effectiveTitles:round(titleEquivalent),historical:!['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'].includes(name),provisional2026:true};
 });
 rows.sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
 rows.forEach((x,i)=>{x.rank=i+1});
 return rows;
}
