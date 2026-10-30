// Playoff success based only on user-supplied certified championship brackets.
// Sample is 2020–2025 Sleeper era; ESPN playoff brackets remain outstanding.
export function playoffRecord(name,brackets,guide){
 const lastCompleted=2025;
 const years=brackets.seasons.filter(s=>s.year<=lastCompleted&&guide[s.year]?.standings?.some(x=>x.name===name));
 const age=y=>Math.pow(.5,(lastCompleted-y)/3.5);
 let exposure=0,qualified=0,byes=0,semis=0,finals=0,titles=0;
 let wExposure=0,wQualified=0;
 for(const s of years){
  const w=age(s.year);exposure++;wExposure+=w;
  if(s.seeds.includes(name)){qualified++;wQualified+=w}
  if(s.byes.includes(name))byes++;
  if(s.semifinalists.includes(name))semis++;
  if(s.finalists.includes(name))finals++;
  if(s.champion===name)titles++;
 }
 // One neutral season stabilizes smaller samples; not credited as a real appearance.
 const score=exposure?Math.round(1000*(wQualified+.5)/(wExposure+1))/10:null;
 return {score,eligible:exposure,qualified,byes,semis,finals,titles,window:'2020–2025',coverage:'Verified championship brackets only; ESPN 2016–2019 not included',recencyHalfLifeSeasons:3.5};
}
