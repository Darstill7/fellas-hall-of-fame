// Rebuild the compact Luck vs. Performance profile dataset from verified paired-week receipts.
// node scripts/build-luck-performance-profiles.mjs [--check]
import fs from 'node:fs';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const history=load('data/all_play_schedule_variance_2016_2026w8_v1.json');
const canonical=load('data/unified_record_book_2016_2026.json');
const out='data/luck_performance_profiles_2016_2026_v1.json';
const round=(n,d=3)=>Number(n.toFixed(d));
const seasons=[];
for(const s of history.allManagerSeasons.filter(s=>s.year<=2025)){
 const n=s.year===2016?8:10, possible=s.completeWeeks*(n-1);
 if(s.weeklyReceipts.length!==s.completeWeeks||possible<1)throw Error('Invalid historical coverage '+s.manager+' '+s.year);
 const beaten=s.weeklyReceipts.reduce((acc,w)=>acc+w.allPlayWins+.5*w.allPlayTies,0);
 const expected=beaten/(n-1), actual=s.actualWins+.5*s.actualTies;
 if(Math.abs(expected-s.expectedWins)>.002||Math.abs(actual-s.actualWinCredits)>.002)throw Error('Historical all-play parity failure '+s.manager+' '+s.year);
 seasons.push({manager:s.manager,year:s.year,seasonStatus:'completed',pairedWeeks:s.completeWeeks,scoringStrengthPct:round(100*beaten/possible,2),actualWinCredits:actual,expectedWins:round(expected),scheduleLuckWins:round(actual-expected),pointsPerWeek:round(s.weeklyReceipts.reduce((acc,w)=>acc+w.points,0)/s.completeWeeks,2),leagueSize:n});
}
const currentGames=canonical.games.filter(g=>g.year===2026&&g.stage==='regular');
const currentWeeks=[...new Set(currentGames.map(g=>g.week))].sort((a,b)=>a-b);
const provisional=new Map(),accepted=[];
for(const week of currentWeeks){
 const games=currentGames.filter(g=>g.week===week);
 const participants=games.flatMap(g=>[{manager:g.home,score:g.homeScore,against:g.awayScore},{manager:g.away,score:g.awayScore,against:g.homeScore}]);
 if(games.length!==5||participants.length!==10||new Set(participants.map(p=>p.manager)).size!==10)continue;
 if(participants.some(p=>!Number.isFinite(p.score)||!Number.isFinite(p.against)))throw Error('Invalid approved scores Week '+week);
 accepted.push(week);
 for(const p of participants){
  const beaten=participants.filter(x=>x.manager!==p.manager&&x.score<p.score).length;
  const tied=participants.filter(x=>x.manager!==p.manager&&x.score===p.score).length;
  const r=provisional.get(p.manager)||{manager:p.manager,year:2026,seasonStatus:'provisional',pairedWeeks:0,beaten:0,actualWinCredits:0,points:0};
  r.pairedWeeks++;r.beaten+=beaten+.5*tied;r.actualWinCredits+=p.score>p.against?1:p.score===p.against?.5:0;r.points+=p.score;provisional.set(p.manager,r);
 }
}
for(const s of provisional.values()){
 const expected=s.beaten/9;
 seasons.push({manager:s.manager,year:2026,seasonStatus:'provisional',pairedWeeks:s.pairedWeeks,scoringStrengthPct:round(100*s.beaten/(9*s.pairedWeeks),2),actualWinCredits:s.actualWinCredits,expectedWins:round(expected),scheduleLuckWins:round(s.actualWinCredits-expected),pointsPerWeek:round(s.points/s.pairedWeeks,2),leagueSize:10});
}
const byManager={};
for(const s of seasons){
 const m=byManager[s.manager]??={manager:s.manager,completedSeasons:0,completedWeeks:0,completedActualWins:0,completedExpectedWins:0,completedAllPlayWeighted:0,seasonHistory:[]};
 m.seasonHistory.push(s);
 if(s.seasonStatus==='completed'){
  m.completedSeasons++;m.completedWeeks+=s.pairedWeeks;m.completedActualWins+=s.actualWinCredits;m.completedExpectedWins+=s.expectedWins;
  m.completedAllPlayWeighted+=s.scoringStrengthPct*s.pairedWeeks;
 }
}
const managers=Object.values(byManager).map(m=>{
 m.seasonHistory.sort((a,b)=>a.year-b.year);
 const active=m.seasonHistory.find(s=>s.year===2026);
 return {manager:m.manager,completedSeasons:m.completedSeasons,completedWeeks:m.completedWeeks,
 completedScoringStrengthPct:round(m.completedAllPlayWeighted/m.completedWeeks,2),
 completedActualWins:m.completedActualWins,completedExpectedWins:round(m.completedExpectedWins),
 completedScheduleLuckWins:round(m.completedActualWins-m.completedExpectedWins),
 currentSeason:active||null,seasonHistory:m.seasonHistory};
}).sort((a,b)=>b.completedScoringStrengthPct-a.completedScoringStrengthPct);
const output={schema:'fellas-luck-performance-profiles-v1',completedThrough:2025,currentYear:2026,currentThroughWeek:accepted.length?Math.max(...accepted):null,managers,methodology:{scoringStrength:'Percent of possible same-week head-to-head opponents each weekly score would beat; ties count as half. 50% is average weekly scoring strength.',scheduleLuck:'Actual win credits minus same-week all-play expected wins. A favorable schedule is a positive value.',coverage:'Historical fully paired weeks exclude incomplete 2020 and 2021 Week 14. Current season uses approved canonical games only and is provisional.',comparability:'Compares weekly percentile scoring within each year, not raw points between eras. Historical career values exclude unfinished 2026.'}};
const text=JSON.stringify(output,null,2)+'\n';
if(process.argv.includes('--check')){
 if(!fs.existsSync(out)||fs.readFileSync(out,'utf8')!==text)throw Error('Luck vs Performance dataset stale; regenerate after approved matchups update');
 console.log('LUCK VS PERFORMANCE VERIFIED: '+managers.length+' managers through approved 2026 Week '+output.currentThroughWeek);
}else{fs.writeFileSync(out,text);console.log('Built '+out)}
