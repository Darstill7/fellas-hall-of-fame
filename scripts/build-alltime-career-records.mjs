// Rebuild career counting marks from approved regular-season matchup history.
// Do not treat incomplete 2026 season totals as completed-season records.
// Usage: node scripts/build-alltime-career-records.mjs [--check]
import fs from 'node:fs';
const source='data/unified_record_book_2016_2026.json';
const target='data/alltime_career_records_live_v1.json';
const ledger=JSON.parse(fs.readFileSync(source,'utf8'));
const regular=ledger.games.filter(g=>g.stage==='regular');
if(!regular.length)throw Error('No approved regular-season matchups');
const entries=regular.flatMap(g=>[
 {manager:g.home,opponent:g.away,year:g.year,week:g.week,points:g.homeScore,against:g.awayScore},
 {manager:g.away,opponent:g.home,year:g.year,week:g.week,points:g.awayScore,against:g.homeScore}
]);
const rows=new Map();
for(const x of entries){
 if(!Number.isFinite(x.points)||!Number.isFinite(x.against))throw Error('Invalid score '+x.year+' Week '+x.week);
 const r=rows.get(x.manager)||{manager:x.manager,games:0,wins:0,losses:0,ties:0,
  pointsFor:0,pointsAgainst:0,score100:0,score120:0,score140:0,score160:0,
  winsBelow100:0,highScoringLosses:0};
 r.games++;r.pointsFor+=x.points;r.pointsAgainst+=x.against;
 if(x.points>x.against)r.wins++;else if(x.points<x.against)r.losses++;else r.ties++;
 if(x.points>=100)r.score100++;
 if(x.points>=120)r.score120++;
 if(x.points>=140)r.score140++;
 if(x.points>=160)r.score160++;
 if(x.points<x.against&&x.points>=130)r.highScoringLosses++;
 if(x.points>x.against&&x.points<100)r.winsBelow100++;
 rows.set(x.manager,r);
}
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const profiles=[...rows.values()].map(x=>({...x,
 pointsFor:round(x.pointsFor),pointsAgainst:round(x.pointsAgainst),
 ppg:round(x.pointsFor/x.games),winPercentage:round((x.wins+.5*x.ties)*100/x.games)
})).sort((a,b)=>a.manager.localeCompare(b.manager));
const definitions=[
 ['games','Most regular-season games','games',0],
 ['wins','Most regular-season wins','wins',0],
 ['pointsFor','Most career points scored','pointsFor',0],
 ['pointsAgainst','Most career points allowed','pointsAgainst',0],
 ['score100','Most 100+ scoring weeks','100+ weeks',0],
 ['score120','Most 120+ scoring weeks','120+ weeks',0],
 ['score140','Most 140+ scoring weeks','140+ weeks',0],
 ['score160','Most 160+ scoring weeks','160+ weeks',0],
 ['highScoringLosses','Most losses scoring 130+','130+ point losses',0],
 ['winsBelow100','Most wins below 100 points','sub-100 wins',0],
 ['ppg','Highest career scoring average (40+ games)','points/game',40]
];
const records=definitions.map(([key,title,unit,minGames])=>{
 const eligible=profiles.filter(x=>x.games>=minGames);
 if(!eligible.length)throw Error('No eligible managers for '+key);
 const best=Math.max(...eligible.map(x=>x[key]));
 return {key,title,unit,minGames,value:best,holders:eligible.filter(x=>x[key]===best).map(x=>({manager:x.manager,value:best,games:x.games})),holderCount:eligible.filter(x=>x[key]===best).length};
});
const currentWeek=Math.max(0,...regular.filter(g=>g.year===2026).map(g=>g.week));
for(let w=1;w<=currentWeek;w++){
 const games=regular.filter(g=>g.year===2026&&g.week===w);
 if(games.length!==5||new Set(games.flatMap(g=>[g.home,g.away])).size!==10)throw Error('2026 Week '+w+' incomplete');
}
const result={schema:'fellas-ledger-career-records-v1',source,
 verified2026ThroughWeek:currentWeek,sourceRegularGames:regular.length,managerCount:profiles.length,
 scope:'Only career regular-season counting and scoring-average categories sourced from approved matchups',
 caveats:['Scoring rules changed between ESPN and Sleeper; scores are not normalized','Career leaders include active players with partial 2026 seasons; not completed-season records','Threshold categories count regular-season team performances only; no postseason or overlapping cumulative scoring'],
 records,profiles};
const output=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check')){
 if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==output)throw Error('Career records stale versus canonical matchup ledger');
 console.log('CAREER RECORD PARITY PASS: '+profiles.length+' managers, '+records.length+' categories through 2026 Week '+currentWeek);
}else{
 fs.writeFileSync(target,output);
 console.log('Generated '+target+' from '+regular.length+' approved regular-season games');
}
