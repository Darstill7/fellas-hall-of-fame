// Reproducible source reconciliation: node scripts/verify-regular-season-close-calls.mjs
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const raw=read('data/season_weekly_matchups_2016_2026_v1.json');
const r=read('data/regular_season_close_calls_2016_2026w8_v1.json');
const matches=raw.seasonYears.flatMap(year=>raw.bySeason[String(year)].games.filter(x=>x.stage==='regular').map(x=>({year,...x})));
const decided=matches.filter(x=>x.winner==='HOME'||x.winner==='AWAY').map(x=>{
 const h=x.winner==='HOME';
 return {year:x.year,week:x.week,winner:h?x.home:x.away,loser:h?x.away:x.home,
 winnerPoints:h?x.homeScore:x.awayScore,loserPoints:h?x.awayScore:x.homeScore,margin:x.margin};
});
const complete=decided.filter(x=>x.year<=2025);
if(matches.length!==700||complete.length!==659||decided.length!==699||
   matches.filter(x=>x.winner==='TIE').length!==1||
   r.coverage.allRegularGames!==700||r.coverage.completedDecidedRegularGames!==659||
   r.coverage.provisional2026DecidedGames!==40)throw Error('Regular season source coverage changed');
const hit=(x)=>complete.find(y=>y.year===x.year&&y.week===x.week&&y.winner===x.winner&&y.loser===x.loser);
for(const [category,sort] of Object.entries({
 closestGames:(a,b)=>a.margin-b.margin||a.year-b.year,
 highestScoringLosses:(a,b)=>b.loserPoints-a.loserPoints||a.year-b.year,
 lowestScoringWins:(a,b)=>a.winnerPoints-b.winnerPoints||a.year-b.year,
 largestMargins:(a,b)=>b.margin-a.margin||a.year-b.year
})){
 const expected=complete.slice().sort(sort).slice(0,r.completedSeason[category].length);
 for(let i=0;i<expected.length;i++){
  const saved=r.completedSeason[category][i],src=hit(saved);
  if(!src||saved.year!==expected[i].year||saved.week!==expected[i].week||
     saved.winner!==expected[i].winner||saved.loser!==expected[i].loser||
     Math.abs(saved.winnerPoints-src.winnerPoints)>.005||
     Math.abs(saved.loserPoints-src.loserPoints)>.005||
     Math.abs(saved.margin-src.margin)>.005)
    throw Error('Historical record ranking or source drift '+category+' #'+i);
 }
}
const {closestGames,highestScoringLosses,lowestScoringWins,largestMargins}=r.completedSeason;
if(closestGames[0].margin!==.16||closestGames[0].winner!=='Thommy'||
   highestScoringLosses[0].loserPoints!==164.8||highestScoringLosses[0].loser!=='Stew'||
   lowestScoringWins[0].winnerPoints!==64||lowestScoringWins[0].winner!=='Stilly'||
   largestMargins[0].margin!==101.38||largestMargins[0].winner!=='Scott')
 throw Error('Historical headline needs fresh editorial review');
if(r.currentManagerMoments.length!==10||new Set(r.currentManagerMoments.map(x=>x.manager)).size!==10)throw Error('Manager moment coverage changed');
if(r.coverage.ties[0].homeScore!==121||r.coverage.ties[0].awayScore!==121)
 throw Error('2016 tie not preserved');
console.log('REGULAR-SEASON CLOSE CALLS VERIFIED: 700 paired games; 659 decided completed-season games; one tie; 2026 Weeks 1–8 isolated.');
