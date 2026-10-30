// Reconstruct contemporaneous end-of-season ratings from verified annual records.
// Never use future wins, all-play, titles or playoff finishes in earlier snapshots.
import {makeRatings} from './fellas-rating-model.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
const round=n=>Math.round(n*1000)/1000;
export function historicalOvrHistory({guide,careers,luck,endings,playoffBrackets}){
 const years=Object.keys(guide).map(Number).filter(y=>y>=2016&&y<=2025&&guide[y]?.champion).sort((a,b)=>a-b);
 const results=[];
 for(const year of years){
  const careerData=clone(careers),luckData=clone(luck),active=[];
  for(const [name,record] of Object.entries(careerData.managers)){
   const annual=Object.fromEntries(Object.entries(record.annual).filter(([y])=>Number(y)<=year));
   record.annual=annual;
   if(!Object.keys(annual).length)continue;
   active.push(name);
   const totals={games:0,w:0,l:0,t:0};
   for(const a of Object.values(annual))for(const k of Object.keys(totals))totals[k]+=a[k];
   Object.assign(record,totals);
  }
  for(const entry of luckData.ranked){
   entry.bySeason=Object.fromEntries(Object.entries(entry.bySeason||{}).filter(([y])=>Number(y)<=year));
   entry.games=Object.values(entry.bySeason).reduce((s,x)=>s+x.games,0);
   entry.actualWins=Object.values(entry.bySeason).reduce((s,x)=>s+x.actualWins,0);
   entry.expectedWins=Object.values(entry.bySeason).reduce((s,x)=>s+x.expectedWins,0);
  }
  const rows=makeRatings({guide,careers:careerData,luck:luckData,endings,playoffBrackets,asOfYear:year},active).map(r=>({
    name:r.name,ovr:r.score,rank:r.rank,career:r.career,
    titles:r.titleYears.length,playoffs:r.qualifiedYears.length,
    breakdown:r.breakdown
  }));
  if(rows.some(r=>!Number.isFinite(r.ovr)))throw Error('Invalid historical rating '+year);
  results.push({year,season:'completed',rows});
 }
 return results;
}

// Season OVR measures only one completed season; it never imports prior career success.
// The 0–100 index is independently scored and displayed using the stable Madden scale.
export function singleSeasonOvrHistory({guide,careers,luck,playoffBrackets}){
 const bracketByYear=new Map(playoffBrackets.map(s=>[s.year,s]));
 const luckBy=new Map(luck.ranked.map(x=>[x.manager,x]));
 const years=Object.keys(guide).map(Number).filter(y=>y>=2016&&y<=2025&&guide[y]?.champion).sort((a,b)=>a-b);
 return years.map(year=>{
  const bracket=bracketByYear.get(year);
  if(!bracket)throw Error('Missing certified playoff bracket for '+year);
  const rows=Object.entries(careers.managers).flatMap(([name,career])=>{
   const record=career.annual[String(year)];
   if(!record||!record.games)return [];
   const all=luckBy.get(name)?.bySeason?.[String(year)];
   if(!all||!all.games)throw Error('Missing season all-play evidence '+name+' '+year);
   const regular=(record.w+record.t*.5)/record.games;
   const allPlay=Math.max(0,Math.min(1,all.expectedWins/all.games));
   const playoff=(bracket.seeds??bracket.participants??[]).includes(name);
   const finalist=(bracket.finalists??[]).includes(name);
   const champion=bracket.champion===name;
   const score=Math.round((20*regular+20*allPlay+15*(playoff?1:0)+10*(finalist?1:0)+35*(champion?1:0))*10)/10;
   return [{name,year,score,rank:0,record:record.w+'–'+record.l+(record.t?'–'+record.t:''),playoff,finalist,champion}];
  });
  rows.sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
  rows.forEach((r,i)=>{r.rank=i+1});
  return {year,season:'completed',rows};
 });
}
