// Historical lineup coverage validation — descriptive hindsight, never decision-quality ratings.
export function validateLineupCoverage(data,detail=null){
 if(data?.status!=='research_only_hindsight_not_decision_grade'||
    data?.teamWeeks!==830||data?.sourceCount!==83||
    data?.researchComparable!==822||data?.excludedWeeks!==8||
    !Array.isArray(data.seasons)||data.seasons.length!==6||
    !Array.isArray(data.managerSeasons)||data.managerSeasons.length!==60||
    !Array.isArray(data.managers)||data.managers.length!==12)
  throw Error('Incomplete six-season historical lineup evidence or status');
 const years=[2020,2021,2022,2023,2024,2025];
 const total=key=>data.seasons.reduce((sum,s)=>sum+s[key],0);
 if(total('teamWeeks')!==830||total('comparable')!==822||total('excluded')!==8)
  throw Error('Historical lineup year-level coverage totals disagree');
 for(const year of years){
  const season=data.seasons.find(s=>s.year===year);
  if(!season||season.weeks!==(year===2020?13:14)||
     season.teamWeeks!==10*season.weeks||
     season.comparable+season.excluded!==season.teamWeeks)
   throw Error('Invalid lineup source coverage in season '+year);
  const managers=data.managerSeasons.filter(s=>s.year===year);
  if(managers.length!==10||new Set(managers.map(m=>m.manager)).size!==10||
     managers.some(m=>m.observedWeeks!==season.weeks||
       m.comparableWeeks+m.excludedWeeks!==m.observedWeeks||
       (m.comparableWeeks>0&&!Number.isFinite(m.averageHindsightAccuracy))))
   throw Error('Missing or unreliable historical lineup manager weeks '+year);
 }
 for(const m of data.managers){
  const rows=data.managerSeasons.filter(s=>s.manager===m.manager);
  if(rows.length!==m.seasons||new Set(rows.map(r=>r.year)).size!==rows.length||
    rows.reduce((sum,r)=>sum+r.observedWeeks,0)!==m.observedWeeks||
    rows.reduce((sum,r)=>sum+r.comparableWeeks,0)!==m.comparableWeeks||
    rows.reduce((sum,r)=>sum+r.excludedWeeks,0)!==m.excludedWeeks||
    m.observedWeeks!==m.comparableWeeks+m.excludedWeeks)
   throw Error('Career lineup coverage does not match annual receipts '+m.manager);
 }
 if(detail){
  if(!Array.isArray(detail.observations)||detail.observations.length!==830||
     !Array.isArray(detail.sourceFiles)||detail.sourceFiles.length!==83||
     detail.observations.filter(x=>x.reason).length!==data.excludedWeeks)
   throw Error('Detailed historical lineup receipts are incomplete');
  const seen=new Set();
  for(const row of detail.observations){
   const key=[row.year,row.week,row.manager].join('/');
   if(seen.has(key))throw Error('Duplicate historical lineup source row '+key);
   seen.add(key);
   if(row.reason){
    if(row.accuracy!==undefined||row.optimal!==undefined)
     throw Error('Excluded lineup must never receive a fake optimizer score '+key);
   }else if(!Number.isFinite(row.accuracy)||!Number.isFinite(row.gap)||
            !Number.isFinite(row.actual)||!Number.isFinite(row.optimal)||
            row.optimal+.07<row.actual)
    throw Error('Invalid research-comparable lineup score '+key);
  }
  for(const season of data.seasons){
   const matched=detail.observations.filter(r=>r.year===season.year);
   if(matched.length!==season.teamWeeks||
      matched.filter(r=>!r.reason).length!==season.comparable)
    throw Error('Detailed roster evidence does not reconcile with season '+season.year);
  }
 }
 return data;
}
