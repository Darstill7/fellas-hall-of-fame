// Rebuild streak and completed-season milestones from approved regular-season matchups.
// Streaks mean consecutive DOCUMENTED appearances; unrecorded weeks are not claimed.
// Completed seasons only for season trophies; 2026 is excluded until independently closed.
// Usage: node scripts/build-ledger-milestone-records.mjs [--check]
import fs from 'node:fs';
const source='data/unified_record_book_2016_2026.json',target='data/ledger_milestones_live_v1.json';
const games=JSON.parse(fs.readFileSync(source,'utf8')).games.filter(g=>g.stage==='regular');
const score=games.flatMap(g=>[
 {manager:g.home,opponent:g.away,year:g.year,week:g.week,points:g.homeScore,against:g.awayScore},
 {manager:g.away,opponent:g.home,year:g.year,week:g.week,points:g.awayScore,against:g.homeScore}
]);
const byManager=new Map();
for(const row of score){
 if(!Number.isFinite(row.points)||!Number.isFinite(row.against))throw Error('Invalid approved source points');
 if(!byManager.has(row.manager))byManager.set(row.manager,[]);
 byManager.get(row.manager).push(row);
}
for(const rows of byManager.values())rows.sort((a,b)=>a.year-b.year||a.week-b.week);
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const streakDefs=[
 ['winning-streak','Longest regular-season winning streak',x=>x.points>x.against],
 ['scoring-streak-100','Longest consecutive documented 100+ scoring appearances',x=>x.points>=100],
 ['scoring-streak-120','Longest consecutive documented 120+ scoring appearances',x=>x.points>=120]
];
const records=streakDefs.map(([key,title,qualifies])=>{
 const candidates=[];
 for(const [manager,rows] of byManager){
  let length=0,last=null;
  for(const x of rows){
   if(qualifies(x)){length++;last=x;candidates.push({manager,value:length,endingYear:x.year,endingWeek:x.week,endingOpponent:x.opponent});}
   else length=0;
  }
 }
 const best=Math.max(...candidates.map(x=>x.value));
 const holders=candidates.filter(x=>x.value===best).sort((a,b)=>a.manager.localeCompare(b.manager)||a.endingYear-b.endingYear||a.endingWeek-b.endingWeek);
 return {key,title,value:best,unit:'consecutive documented games',holders,holderCount:holders.length};
});
const seasonMap=new Map();
for(const x of score){
 const key=x.manager+'|'+x.year;
 const r=seasonMap.get(key)||{manager:x.manager,year:x.year,games:0,wins:0,losses:0,ties:0,points:0,against:0,score140:0};
 r.games++;r.points+=x.points;r.against+=x.against;
 if(x.points>x.against)r.wins++;else if(x.points<x.against)r.losses++;else r.ties++;
 if(x.points>=140)r.score140++;
 seasonMap.set(key,r);
}
const completed=[...seasonMap.values()].filter(r=>r.year<=2025).map(r=>({...r,
 points:round(r.points),against:round(r.against),average:round(r.points/r.games),
 winPercentage:round(100*(r.wins+.5*r.ties)/r.games),differential:round(r.points-r.against)
}));
const seasonDefs=[
 ['season-points','Most points in a completed regular season',x=>x.points,'points'],
 ['season-wins','Most wins in a completed regular season',x=>x.wins,'wins'],
 ['season-differential','Largest point differential in a completed regular season',x=>x.differential,'points'],
 ['season-140-club','Most 140+ weeks in a completed regular season',x=>x.score140,'weeks']
];
for(const [key,title,selector,unit] of seasonDefs){
 const best=Math.max(...completed.map(selector));
 const holders=completed.filter(x=>selector(x)===best).map(x=>({
  manager:x.manager,year:x.year,games:x.games,value:selector(x)
 })).sort((a,b)=>a.year-b.year||a.manager.localeCompare(b.manager));
 records.push({key,title,value:best,unit,holders,holderCount:holders.length,seasonClosedOnly:true});
}
const currentWeek=Math.max(0,...games.filter(g=>g.year===2026).map(g=>g.week));
for(let w=1;w<=currentWeek;w++){
 const pair=games.filter(g=>g.year===2026&&g.week===w);
 if(pair.length!==5||new Set(pair.flatMap(g=>[g.home,g.away])).size!==10)throw Error('Incomplete 2026 Week '+w);
}
const result={
 schema:'fellas-ledger-milestones-v1',source,verified2026ThroughWeek:currentWeek,
 sourceGames:games.length,records,
 scope:'Regular-season matchup evidence only; completed-season awards exclude ongoing 2026',
 caveats:[
  'Streaks count consecutive DOCUMENTED manager appearances, not necessarily consecutive NFL weeks; missing games must not be inferred.',
  'ESPN pre-2019 integer-rounded scores and historical PPR variations are not normalized.',
  'Season awards are restricted to completed seasons through 2025; 2026 ongoing totals never compete with full seasons.',
  'Ties and equal values preserve all historical record holders.'
 ]
};
const output=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check')){
 if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==output)throw Error('Ledger milestones stale vs approved games');
 console.log('MILESTONE PARITY PASS: '+records.length+' categories, 2026 Week '+currentWeek);
}else{fs.writeFileSync(target,output);console.log('Built '+target+' ('+records.length+' verified categories)');}
