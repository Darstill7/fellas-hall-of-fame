// Generated, current-season record pulse. Never changes audited all-time history.
// Usage: node scripts/build-current-2026-records.mjs [--check]
import fs from 'node:fs';
const source='data/unified_record_book_2016_2026.json';
const dest='data/current_2026_records_v1.json';
const ledger=JSON.parse(fs.readFileSync(source,'utf8'));
const season=ledger.games.filter(g=>g.year===2026&&g.stage==='regular');
const week=Math.max(0,...season.map(g=>g.week));
if(week<1||week>14)throw Error('Invalid current season week');
for(let w=1;w<=week;w++){
 const rows=season.filter(g=>g.week===w);
 if(rows.length!==5||new Set(rows.flatMap(g=>[g.home,g.away])).size!==10)
  throw Error('Incomplete 2026 Week '+w+' (expected five pairings and ten distinct managers)');
}
const rounded=n=>Math.round((n+Number.EPSILON)*100)/100;
const scoring=season.flatMap(g=>[
 {manager:g.home,opponent:g.away,points:g.homeScore,opponentPoints:g.awayScore,week:g.week},
 {manager:g.away,opponent:g.home,points:g.awayScore,opponentPoints:g.homeScore,week:g.week}
]);
const matchups=season.map(g=>({
 week:g.week,home:g.home,away:g.away,homeScore:g.homeScore,awayScore:g.awayScore,
 total:rounded(g.homeScore+g.awayScore),margin:rounded(Math.abs(g.homeScore-g.awayScore))
}));
const by=(rows,fn)=>rows.slice().sort(fn)[0];
const seasonHigh=by(scoring,(a,b)=>b.points-a.points||a.week-b.week);
const seasonLow=by(scoring,(a,b)=>a.points-b.points||a.week-b.week);
const highestTotal=by(matchups,(a,b)=>b.total-a.total||a.week-b.week);
const closest=by(matchups,(a,b)=>a.margin-b.margin||a.week-b.week);
const widest=by(matchups,(a,b)=>b.margin-a.margin||a.week-b.week);
const weeklyScoringTitles=[];
for(let w=1;w<=week;w++){
 const weekScores=scoring.filter(x=>x.week===w);
 const high=Math.max(...weekScores.map(x=>x.points));
 const winners=weekScores.filter(x=>x.points===high);
 for(const row of winners)weeklyScoringTitles.push({week:w,manager:row.manager,points:row.points,tied:winners.length>1});
}
const counts=Object.fromEntries([...new Set(scoring.map(x=>x.manager))].sort().map(manager=>[
 manager,weeklyScoringTitles.filter(x=>x.manager===manager).length
]));
const out={
 schema:'fellas-current-season-records-v1',year:2026,verified_through_week:week,
 scope:'2026 approved regular-season scores only; excludes postseason and all-time historical rankings',
 source,number_of_games:season.length,
 records:{highest_team_score:seasonHigh,lowest_team_score:seasonLow,highest_matchup_total:highestTotal,closest_matchup:closest,widest_margin:widest},
 weeklyScoringTitles,weeklyScoringTitleCounts:counts
};
const output=JSON.stringify(out,null,2)+'\n';
if(process.argv.includes('--check')){
 if(!fs.existsSync(dest)||fs.readFileSync(dest,'utf8')!==output)
  throw Error('2026 record pulse stale; regenerate after the approved weekly import');
 console.log('CURRENT SEASON RECORDS VERIFIED through Week '+week);
}else{
 fs.writeFileSync(dest,output);
 console.log('Generated '+dest+' through Week '+week);
}
