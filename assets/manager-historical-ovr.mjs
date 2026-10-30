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
