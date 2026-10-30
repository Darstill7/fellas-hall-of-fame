import fs from 'node:fs';
const seasons=[2020,2021,2022,2023,2024,2025];
const summary={version:'sleeper-player-roster-coverage-v1',scope:'Regular-season weekly roster snapshots, 2020-2025',seasons:[],totalTeamWeeks:0,totalBenchPlayerEntries:0,limitations:['Source archive completeness does not certify lineup eligibility, locked-player status, pregame projections, or counterfactual trade value.','Week 14 2021 has two rosters without corresponding documented head-to-head matchup pairs.']};
for(const year of seasons){
 const weeks=year===2020?13:14;
 const season={year,weeksExpected:weeks,weeksArchived:0,teamWeeks:0,benchEntries:0,matchupTeamsMissing:0};
 const matchups=JSON.parse(fs.readFileSync('data/sleeper_matchups_'+year+'.json','utf8'));
 for(let week=1;week<=weeks;week++){
  const filename='data/sleeper_roster_snapshots_'+year+'_week'+week+'.json';
  const source=year===2025&&(week===1||week===7)?'data/war_rosters_2025_week'+week+'.json':filename;
  if(!fs.existsSync(source))throw Error('Missing archive '+source);
  const raw=JSON.parse(fs.readFileSync(source,'utf8'));
  const rosters=Array.isArray(raw)?raw:raw.rosters;
  if(!Array.isArray(rosters)||rosters.length!==10)throw Error('Missing ten team rosters '+source);
  const matchup=matchups.find(x=>x.week===week);
  if(!matchup)throw Error('Missing historical matchup week '+year+'/'+week);
  const recorded=new Set(matchup.games.flatMap(g=>[g.home[0],g.away[0]]));
  const rosterOwners=new Set(rosters.map(x=>x.owner));
  if(recorded.size>10||[...recorded].some(x=>!rosterOwners.has(x)))throw Error('Unmatched historical matchup ownership '+year+'/'+week);
  season.matchupTeamsMissing+=10-recorded.size;
  for(const row of rosters){if(!Array.isArray(row.starters)||!Array.isArray(row.bench))throw Error('Incomplete roster '+year+'/'+week);season.benchEntries+=row.bench.length;}
  season.teamWeeks+=rosters.length;season.weeksArchived++;
 }
 summary.totalTeamWeeks+=season.teamWeeks;summary.totalBenchPlayerEntries+=season.benchEntries;summary.seasons.push(season);
}
if(summary.totalTeamWeeks!==830)throw Error('Unexpected six-season archive coverage '+summary.totalTeamWeeks);
if(summary.seasons.find(s=>s.year===2021).matchupTeamsMissing!==2)throw Error('2021 historical pairing gap changed');
console.log(JSON.stringify(summary,null,2));
