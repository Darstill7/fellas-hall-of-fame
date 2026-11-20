// Research-only: completed-season comeback and postseason-resilience records.
// node scripts/build-season-turnaround-records.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const weekly=read('data/season_weekly_matchups_2016_2026_v1.json');
const verified=read('data/postseason_records_verified_v1.json');
const placements=read('data/fellas_final_placements_2016_2025_verified.json');
const norm=name=>name==='Tom'?'Thommy':name;
const seasons=[];
for(const yearData of placements.seasons){
 const year=yearData.year,calendar=weekly.bySeason[String(year)];
 const bracket=verified.brackets.find(b=>b.year===year);
 assert(calendar&&bracket,'Missing source season '+year);
 const all=calendar.games.filter(g=>g.stage==='regular');
 const lastWeek=Math.max(...all.map(g=>g.week));
 // Calendar midpoint, NOT a bye manager's last played week.
 const midpoint=Math.floor(lastWeek/2);
 for(const placement of yearData.finishes){
  const manager=norm(placement.manager);
  const games=all.filter(g=>norm(g.home)===manager||norm(g.away)===manager)
   .sort((a,b)=>a.week-b.week);
  assert(games.length>0,'Missing team season '+year+'/'+manager);
  let w=0,l=0,t=0,winRun=0,lossRun=0,longestWin=0,longestLoss=0;
  const results=games.map(g=>{
   const points=norm(g.home)===manager?g.homeScore:g.awayScore;
   const opponentPoints=norm(g.home)===manager?g.awayScore:g.homeScore;
   const result=points>opponentPoints?'W':points<opponentPoints?'L':'T';
   if(result==='W'){w++;winRun++;lossRun=0}
   else if(result==='L'){l++;lossRun++;winRun=0}
   else{t++;winRun=0;lossRun=0}
   longestWin=Math.max(longestWin,winRun);longestLoss=Math.max(longestLoss,lossRun);
   return {week:g.week,result,w,l,t,points,opponentPoints,opponent:norm(norm(g.home)===manager?g.away:g.home),
    deficit:l-w,winningStreak:winRun,losingStreak:lossRun};
  });
  const half=results.filter(r=>r.week<=midpoint),late=results.filter(r=>r.week>midpoint);
  const count=(rows,value)=>rows.filter(r=>r.result===value).length;
  const first={w:count(half,'W'),l:count(half,'L'),t:count(half,'T'),throughWeek:midpoint};
  const second={w:count(late,'W'),l:count(late,'L'),t:count(late,'T'),afterWeek:midpoint};
  const low=[{week:0,w:0,l:0,t:0,deficit:0},...results].sort((a,b)=>b.deficit-a.deficit||a.week-b.week)[0];
  const outcomes={
   playoff:bracket.participants.map(norm).includes(manager),
   finalist:bracket.finalists.map(norm).includes(manager),
   champion:norm(bracket.champion)===manager
  };
  const last4=results.slice(-4);
  seasons.push({manager,year,yearGames:games.length,seasonRegularWeeks:lastWeek,
   midpoint,final:{w,l,t},first,second,worstHole:{week:low.week,deficit:Math.max(0,low.deficit),w:low.w,l:low.l},
   longestWin,longestLoss,lateFour:{w:count(last4,'W'),l:count(last4,'L'),weeks:last4.map(r=>r.week)},
   turnaround:(second.w-second.l)-(first.w-first.l),
   remainingWinsFromLow:count(results.filter(r=>r.week>low.week),'W'),
   outcomes,finish:placement.rank,results});
 }
}
assert.equal(seasons.length,98);
assert.equal(seasons.filter(s=>s.year===2026).length,0);
const definitions=[
 {id:'turnaround-largest-half-swing',title:'Biggest first-half to second-half W–L differential swing',scope:'all completed seasons',value:s=>s.turnaround},
 {id:'turnaround-largest-half-swing-playoff',title:'Biggest halftime-season turnaround by a playoff qualifier',scope:'official playoff participants',value:s=>s.outcomes.playoff?s.turnaround:null},
 {id:'turnaround-largest-half-swing-finalist',title:'Biggest halftime-season turnaround by a finalist',scope:'official finalists',value:s=>s.outcomes.finalist?s.turnaround:null},
 {id:'turnaround-deepest-hole-playoff',title:'Deepest losing-record hole survived to qualify',scope:'official playoff participants',value:s=>s.outcomes.playoff?s.worstHole.deficit:null,overlap:'legendary_records:deepest-playoff-qualifier-hole'},
 {id:'turnaround-deepest-hole-finalist',title:'Deepest losing-record hole survived to reach the final',scope:'official finalists',value:s=>s.outcomes.finalist?s.worstHole.deficit:null},
 {id:'turnaround-deepest-hole-champion',title:'Deepest losing-record hole survived to win the championship',scope:'official champions',value:s=>s.outcomes.champion?s.worstHole.deficit:null,overlap:'legendary_records:deepest-champion-hole'},
 {id:'turnaround-loss-streak-playoff',title:'Longest losing streak in a playoff-qualifying season',scope:'official playoff participants',value:s=>s.outcomes.playoff?s.longestLoss:null},
 {id:'turnaround-win-streak-finalist',title:'Longest regular-season winning streak by a finalist',scope:'official finalists',value:s=>s.outcomes.finalist?s.longestWin:null},
 {id:'turnaround-most-late-half-wins-finalist',title:'Most second-half wins in a finalist season',scope:'official finalists',value:s=>s.outcomes.finalist?s.second.w:null},
 {id:'turnaround-most-late-half-wins-playoff',title:'Most second-half wins in a playoff season',scope:'official playoff participants',value:s=>s.outcomes.playoff?s.second.w:null},
 {id:'turnaround-perfect-second-half-playoff',title:'Most second-half wins without a loss by a playoff qualifier',scope:'official playoff participants and undefeated second halves',value:s=>s.outcomes.playoff&&s.second.l===0?s.second.w:null},
 {id:'turnaround-last-four-wins-champion',title:'Most wins in the final four regular-season games by a champion',scope:'official champions',value:s=>s.outcomes.champion?s.lateFour.w:null},
 {id:'turnaround-last-four-losses-finalist',title:'Most losses in the final four regular-season games by a finalist',scope:'official finalists',value:s=>s.outcomes.finalist?s.lateFour.l:null},
 {id:'turnaround-wins-after-low-point-champion',title:'Most wins following a four-game-deficit low point by an eventual champion',scope:'official champions who reached at least four losses below .500',value:s=>s.outcomes.champion&&s.worstHole.deficit>=4?s.remainingWinsFromLow:null}
];
const categories=definitions.map(d=>{
 const candidates=seasons.map(s=>({manager:s.manager,year:s.year,value:d.value(s),
 evidence:{first:s.first,second:s.second,final:s.final,low:s.worstHole,
  longestWin:s.longestWin,longestLoss:s.longestLoss,lastFour:s.lateFour,
  finish:s.finish,playoff:s.outcomes.playoff,finalist:s.outcomes.finalist,champion:s.outcomes.champion,
  playedWeeks:s.results.map(r=>({week:r.week,result:r.result,record:`${r.w}-${r.l}`}))}}))
  .filter(s=>s.value!==null&&s.value!==undefined&&s.value>0)
  .sort((a,b)=>b.value-a.value||a.year-b.year||a.manager.localeCompare(b.manager));
 let last=null,rank=0;
 for(const [i,r] of candidates.entries()){if(last!==r.value){rank=i+1;last=r.value}r.rank=rank}
 return {id:d.id,title:d.title,scope:d.scope,status:'provisional',
  ...(d.overlap?{overlap:d.overlap}:{}),
  count:candidates.length,leaders:candidates.filter(x=>x.rank<=5),holders:candidates.filter(x=>x.rank===1)};
});
const output={schema:'fellas-turnaround-playoff-resilience-v1',status:'provisional-not-published',
 asOf:'2026-11-11',sources:['data/season_weekly_matchups_2016_2026_v1.json',
 'data/postseason_records_verified_v1.json','data/fellas_final_placements_2016_2025_verified.json'],
 coverage:{seasons:10,teamSeasons:seasons.length,from:2016,through:2025},
 rules:[
 'A season midpoint is floor(last official regular-season week / 2), never derived from a bye-manager last played game.',
 'Halftime swing = second-half (wins-losses) minus first-half (wins-losses), not merely wins after halftime.',
 '2016 has 8 teams; 2017 onward 10; verified playoff participants, finalists and champions are taken from official bracket source.',
 '2020 and 2021 Week 14 byes yield 13 games for some managers; do not credit an unpaired bye as a win or loss.',
 'Worst hole is the largest losses-minus-wins deficit (minimum zero), starting at 0–0 and comparing cumulative records.',
 'Last four games means last four played matchups, not necessarily a fixed week number.',
 'Ties count neither a win nor a loss in differential or streaks; a tied game breaks win and loss streaks.',
 'Managers who did not participate in a given season are never assigned a phantom 0-win record.',
 '2026 excluded entirely from completed-season records.',
 'Overlap IDs require consolidation with existing legendary records, not double counting.'
 ],categoryCount:categories.length,categories};
assert.equal(output.categoryCount,14);
console.log(JSON.stringify(output,null,2));
