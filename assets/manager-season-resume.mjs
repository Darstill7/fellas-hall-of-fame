// Certified season-level résumé, not a retrospective OVR calculation.
export function seasonResume(name,careers,brackets,guide){
 const annual=careers.managers[name]?.annual||{};
 const byYear=new Map(brackets.map(b=>[Number(b.year),b]));
 return Object.entries(annual).map(([key,record])=>{
  const year=Number(key),bracket=byYear.get(year);
  const eligible=bracket?.seeds??bracket?.participants??[];
  const qualified=eligible.includes(name);
  const champion=guide[key]?.champion===name;
  const finalist=(bracket?.finalists??[]).includes(name);
  const badge=champion?'CHAMPION':finalist?'FINALIST':qualified?'PLAYOFFS':year===2026?'IN PROGRESS':'—';
  return {year,record:`${record.w}-${record.l}${record.t?'-'+record.t:''}`,badge,qualified,champion};
 }).sort((a,b)=>b.year-a.year);
}
