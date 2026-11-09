// Standalone verification: node scripts/verify-scoring-streak-research.mjs
import fs from 'node:fs';
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const ledger=read('data/season_weekly_matchups_2016_2026_v1.json');
const report=read('data/scoring_streak_research_2016_2026w8_v1.json');
const find=({year,manager})=>report.seasons.find(row=>row.year===year&&row.manager===manager);
function best(rows,span,test){
 const byWeek=new Map(rows.map(x=>[x.week,x.score]));
 let max={length:0,start:null,end:null},run={length:0,start:null,end:null};
 for(let week=1;week<=span;week++){
  if(byWeek.has(week)&&test(byWeek.get(week))){
   if(!run.length)run.start=week;
   run.length++;run.end=week;
  }else{
   if(run.length>max.length)max={...run};
   run={length:0,start:null,end:null};
  }
 }
 return run.length>max.length?run:max;
}
for(const record of report.seasons){
 const games=ledger.bySeason[String(record.year)]?.games?.filter(x=>x.stage==='regular');
 if(!games)throw Error('Missing source season '+record.year);
 const weeks=games.flatMap(g=>[
  {week:g.week,manager:g.home,score:g.homeScore},
  {week:g.week,manager:g.away,score:g.awayScore}
 ]).filter(x=>x.manager===record.manager);
 const span=Math.max(...games.map(g=>g.week));
 if(weeks.length!==record.recordedWeeks||record.scheduledSeasonWeeksObserved!==span||
    new Set(weeks.map(x=>x.week)).size!==weeks.length)
  throw Error('Season weekly coverage mismatch '+record.year+' '+record.manager);
 for(const [property,predicate] of [
  ['bestStrictlyOver100',n=>n>100],
  ['bestAtLeast105',n=>n>=105]
 ]){
  const derived=best(weeks,span,predicate),existing=record[property];
  if(JSON.stringify(derived)!==JSON.stringify(existing))
   throw Error('Scoring streak mismatch '+property+' '+record.year+' '+record.manager);
 }
 const all=weeks.length===span&&weeks.every(x=>x.score>=105);
 if(record.everyObservedWeekAtLeast105!==all)
  throw Error('All-105 mismatch '+record.year+' '+record.manager);
}
const byLength=(a,b)=>b.bestStrictlyOver100.length-a.bestStrictlyOver100.length;
const top=[...report.seasons].sort(byLength)[0];
const ste=find({year:2026,manager:'Stew'});
const mitch=find({year:2025,manager:'Mitch'});
if(report.seasons.length!==108||top.manager!=='JMid'||top.year!==2024||
   top.bestStrictlyOver100.length!==13||mitch.bestAtLeast105.length!==12||
   !ste.everyObservedWeekAtLeast105||ste.bestAtLeast105.length!==8||
   Math.min(...ste.weekScores2026.map(x=>x.score))!==105.98)
 throw Error('Research release headline changed; review against latest source');
if(report.missingScoreWeeks.length!==4)throw Error('Four 2020-2021 historical score gaps must remain explicit');
if(report.seasons.some(x=>x.year===2026&&x.scheduledSeasonWeeksObserved!==8))
 throw Error('Provisional Week 8 reporting scope drift');
console.log('SCORING STREAK RESEARCH VERIFIED: 108 manager-seasons, strict >100 and >=105, no unverified Week 9.');
