// Run: node scripts/verify-scoring-floor-research.mjs
import fs from 'node:fs';
const get=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const source=get('data/season_weekly_matchups_2016_2026_v1.json');
const output=get('data/scoring_floor_research_2016_2025_v1.json');
const rows=[];
for(const year of source.seasonYears.filter(y=>y<=2025)){
 const games=source.bySeason[String(year)].games.filter(g=>g.stage==='regular');
 const maxWeek=Math.max(...games.map(g=>g.week)),teams=new Map();
 for(const g of games){
  for(const [manager,points] of [[g.home,g.homeScore],[g.away,g.awayScore]]){
   if(!teams.has(manager))teams.set(manager,[]);
   teams.get(manager).push({week:g.week,points});
  }
 }
 for(const [manager,values] of teams){
  if(values.length!==maxWeek||new Set(values.map(x=>x.week)).size!==maxWeek)continue;
  const minScore=Math.min(...values.map(x=>x.points));
  rows.push({year,manager,weeks:maxWeek,minScore,
    weeksStrictlyOver100:values.filter(x=>x.points>100).length,
    weeksAtLeast105:values.filter(x=>x.points>=105).length});
 }
}
if(rows.length!==94||output.completeManagerSeasons!==94||
   output.excludedIncompleteManagerSeasons.length!==4)throw Error('Coverage drift');
for(const row of rows){
 const saved=output.managerSeasons.find(x=>x.year===row.year&&x.manager===row.manager);
 if(!saved||row.weeks!==saved.weeks||row.minScore!==saved.minScore||
  row.weeksStrictlyOver100!==saved.weeksStrictlyOver100||
  row.weeksAtLeast105!==saved.weeksAtLeast105)
  throw Error('Season floor or weekly count mismatch '+row.year+' '+row.manager);
}
const top=rows.slice().sort((a,b)=>b.minScore-a.minScore)[0];
if(top.year!==2025||top.manager!=='Mitch'||top.minScore!==96.2||
   top.weeksStrictlyOver100!==13||top.weeksAtLeast105!==13)
 throw Error('Historical scoring-floor headline changed');
if(rows.filter(x=>x.weeksStrictlyOver100===13).length!==3)
 throw Error('13-of-14 over-100 tie no longer supported');
if(rows.some(x=>x.year===2026))throw Error('Unfinished 2026 season entered floor ranking');
console.log('SCORING FLOOR RESEARCH VERIFIED: 94 complete manager-seasons and four excluded incomplete team-week rows');
