// Build Schedule Luck only from verified historical all-play receipts and approved canonical matchups.
// Usage: node scripts/build-schedule-luck.mjs [--check]
// --check fails CI when the committed output is missing or stale; it never writes files.
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const outputPath='data/schedule_luck_current_v1.json';
const history=read('data/all_play_schedule_variance_2016_2026w8_v1.json');
const ledger=read('data/unified_record_book_2016_2026.json');
const completed=history.allManagerSeasons.filter(s=>s.year<=2025);
const round=(x,d=3)=>Number(x.toFixed(d));
const career=new Map();
for(const s of completed){
 const row=career.get(s.manager)||{manager:s.manager,seasons:0,pairedWeeks:0,actualWinCredits:0,expectedWins:0};
 row.seasons++;row.pairedWeeks+=s.completeWeeks;
 row.actualWinCredits+=s.actualWinCredits;row.expectedWins+=s.expectedWins;
 career.set(s.manager,row);
}
const allTime=[...career.values()].map(r=>({...r,expectedWins:round(r.expectedWins),scheduleLuckWins:round(r.actualWinCredits-r.expectedWins),scheduleLuckPerWeek:round((r.actualWinCredits-r.expectedWins)/r.pairedWeeks,4)}))
 .sort((a,b)=>b.scheduleLuckPerWeek-a.scheduleLuckPerWeek||a.manager.localeCompare(b.manager));
const record=[...allTime].sort((a,b)=>b.scheduleLuckWins-a.scheduleLuckWins)[0];
if(record?.manager!=='Birch'||Math.abs(record.scheduleLuckWins-6.335)>.002)
 throw Error('Historical Schedule Luck record drifted: review source archive before publication');
const year=2026;
const games=ledger.games.filter(g=>g.year===year&&g.stage==='regular');
const weeks=[...new Set(games.map(g=>g.week))].sort((a,b)=>a-b);
const current=new Map(),included=[],excluded=[];
for(const week of weeks){
 const pair=games.filter(g=>g.week===week);
 const teams=pair.flatMap(g=>[{manager:g.home,score:g.homeScore,against:g.awayScore},{manager:g.away,score:g.awayScore,against:g.homeScore}]);
 if(pair.length!==5||teams.length!==10||new Set(teams.map(t=>t.manager)).size!==10){
  excluded.push({week,reason:'Incomplete or duplicated pairings'});continue;
 }
 if(teams.some(t=>!Number.isFinite(t.score)||!Number.isFinite(t.against)||t.score<0||t.against<0))
  throw Error('Invalid published score in Week '+week);
 for(const t of teams){
  const beat=teams.filter(o=>o.manager!==t.manager&&t.score>o.score).length;
  const tie=teams.filter(o=>o.manager!==t.manager&&t.score===o.score).length;
  const expected=(beat+.5*tie)/9;
  const actual=t.score>t.against?1:t.score===t.against?.5:0;
  const row=current.get(t.manager)||{manager:t.manager,pairedWeeks:0,actualWinCredits:0,expectedWins:0};
  row.pairedWeeks++;row.actualWinCredits+=actual;row.expectedWins+=expected;
  current.set(t.manager,row);
 }
 included.push(week);
}
const provisional=[...current.values()].map(r=>({...r,expectedWins:round(r.expectedWins),scheduleLuckWins:round(r.actualWinCredits-r.expectedWins),scheduleLuckPerWeek:round((r.actualWinCredits-r.expectedWins)/r.pairedWeeks,4)})).sort((a,b)=>b.scheduleLuckWins-a.scheduleLuckWins);
const combined=allTime.map(c=>{
 const y=current.get(c.manager);
 const currentWins=y?y.actualWinCredits:0,currentExpected=y?y.expectedWins:0;
 return {manager:c.manager,completedSeasons:c.seasons,completedWeeks:c.pairedWeeks,completedScheduleLuckWins:c.scheduleLuckWins,currentWeeks:y?.pairedWeeks||0,currentScheduleLuckWins:round(currentWins-currentExpected),combinedScheduleLuckWins:round(c.actualWinCredits+currentWins-(c.expectedWins+currentExpected))};
});
const output={
 schema:'fellas-schedule-luck-current-v1',
 basis:'historical completed-season all-play receipts + approved 2026 canonical matchups',
 sourceFiles:['data/all_play_schedule_variance_2016_2026w8_v1.json','data/unified_record_book_2016_2026.json'],
 completedSeasonsThrough:2025,currentSeason:year,
 currentThroughWeek:included.length?Math.max(...included):null,
 includedCurrentWeeks:included,excludedCurrentWeeks:excluded,
 record:{manager:record.manager,scheduleLuckWins:record.scheduleLuckWins,seasons:record.seasons,pairedWeeks:record.pairedWeeks},
 careerCompleted:allTime,currentSeasonProvisional:provisional,careerPlusCurrentProvisional:combined,
 definition:'Schedule Luck = actual win credits (win=1, tie=.5) minus same-week all-play expected wins. Cross-season completed career records exclude 2026; provisional totals shown separately. Not proof of managerial skill or causal luck.',
 coverageNote:'2016 eight teams; 2017 onward ten. Historical archive excludes incomplete 2020/2021 Week 14 and is fixed until historically reverified. Only fully paired approved current-season weeks are included.'
};
const serialized=JSON.stringify(output,null,2)+'\n';
if(process.argv.includes('--check')){
 if(!fs.existsSync(outputPath)||fs.readFileSync(outputPath,'utf8')!==serialized)
  throw Error('Schedule Luck current dataset is stale: run node scripts/build-schedule-luck.mjs after approved archive changes');
 console.log('SCHEDULE LUCK VERIFIED: completed leader '+record.manager+' '+record.scheduleLuckWins+'; current W'+output.currentThroughWeek);
}else{
 fs.writeFileSync(outputPath,serialized);
 console.log('Built '+outputPath+' through approved week '+output.currentThroughWeek);
}
