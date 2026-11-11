// Source-backed research-only season-collapse candidates.
// node scripts/build-historic-collapse-records.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const weekly=read('data/season_weekly_matchups_2016_2026_v1.json');
const bracket=read('data/postseason_records_verified_v1.json').brackets;
const finishes=read('data/fellas_final_placements_2016_2025_verified.json').seasons;
const norm=x=>x==='Tom'?'Thommy':x;
const rows=[];
for(const season of finishes){
 const yr=season.year,year=weekly.bySeason[String(yr)],b=bracket.find(x=>x.year===yr);
 assert(year&&b,'Missing verified year '+yr);
 const games=year.games.filter(g=>g.stage==='regular');
 const lastWeek=Math.max(...games.map(x=>x.week)),midpoint=Math.floor(lastWeek/2);
 for(const owner of season.finishes){
  const manager=norm(owner.manager);
  const teamGames=games.filter(x=>norm(x.home)===manager||norm(x.away)===manager).sort((a,b)=>a.week-b.week);
  assert(teamGames.length>=12,'Incomplete regular season '+yr+'/'+manager);
  let w=0,l=0,t=0,losingRun=0,winningRun=0,maxLoss=0,maxWin=0;
  const receipts=teamGames.map(game=>{
   const score=norm(game.home)===manager?game.homeScore:game.awayScore;
   const against=norm(game.home)===manager?game.awayScore:game.homeScore;
   const opponent=norm(norm(game.home)===manager?game.away:game.home);
   const result=score>against?'W':score<against?'L':'T';
   if(result==='W'){w++;winningRun++;losingRun=0}
   else if(result==='L'){l++;losingRun++;winningRun=0}
   else{t++;losingRun=0;winningRun=0}
   maxLoss=Math.max(maxLoss,losingRun);maxWin=Math.max(maxWin,winningRun);
   return {week:game.week,opponent,result,score,against,w,l,t,recordLead:w-l,
    losingStreak:losingRun,winningStreak:winningRun};
  });
  const first=receipts.filter(x=>x.week<=midpoint),second=receipts.filter(x=>x.week>midpoint);
  const count=(a,k)=>a.filter(x=>x.result===k).length;
  const before={w:count(first,'W'),l:count(first,'L'),t:count(first,'T')};
  const after={w:count(second,'W'),l:count(second,'L'),t:count(second,'T')};
  const final=receipts.at(-1),best=[{week:0,recordLead:0},...receipts]
    .reduce((a,x)=>x.recordLead>a.recordLead?x:a);
  const afterPeak=receipts.filter(x=>x.week>best.week);
  const inPlayoffs=b.participants.map(norm).includes(manager);
  const finalist=b.finalists.map(norm).includes(manager);
  const champion=norm(b.champion)===manager;
  rows.push({manager,year:yr,midpoint,seasonWeeks:lastWeek,regularGames:teamGames.length,
    first:before,second:after,final:{w,l,t},finishRank:owner.rank,
    outcome:{playoff:inPlayoffs,finalist,champion},
    downturn:(before.w-before.l)-(after.w-after.l),lateLosses:after.l,
    leadErosion:best.recordLead-(w-l),peak:{week:best.week,lead:best.recordLead},
    lateFourLosses:receipts.slice(-4).filter(x=>x.result==='L').length,
    longestLoss:maxLoss,longestWin:maxWin,lateStreak:receipts.at(-1).losingStreak,
    noWinsSecondHalf:after.w===0&&after.l>0,receipts});
 }
}
assert.equal(rows.length,98);
const definitions=[
 {id:'collapse-half-season-swing',title:'Worst first-half to second-half W–L differential swing',test:r=>true,score:r=>r.downturn},
 {id:'collapse-half-season-swing-missed-playoffs',title:'Worst half-season slide ending outside playoffs',test:r=>!r.outcome.playoff,score:r=>r.downturn},
 {id:'collapse-half-season-swing-playoff-team',title:'Worst half-season slide despite making playoffs',test:r=>r.outcome.playoff,score:r=>r.downturn},
 {id:'collapse-lead-erosion',title:'Largest erosion of in-season W–L cushion',test:r=>r.peak.lead>=2,score:r=>r.leadErosion},
 {id:'collapse-second-half-losses',title:'Most losses in the second half of a completed season',test:r=>true,score:r=>r.lateLosses},
 {id:'collapse-second-half-winless',title:'Most second-half losses without a second-half win',test:r=>r.noWinsSecondHalf,score:r=>r.lateLosses},
 {id:'collapse-first-half-wins-missed-playoffs',title:'Most first-half wins before missing the playoffs',test:r=>!r.outcome.playoff,score:r=>r.first.w},
 {id:'collapse-early-undefeated-no-title',title:'Most wins in an undefeated first half without a championship',test:r=>r.first.l===0&&!r.outcome.champion,score:r=>r.first.w},
 {id:'collapse-last-four-losses-playoff',title:'Most losses in final four regular-season games by a playoff qualifier',test:r=>r.outcome.playoff,score:r=>r.lateFourLosses},
 {id:'collapse-longest-loss-run-missed-playoffs',title:'Longest regular-season losing run by a non-playoff team',test:r=>!r.outcome.playoff,score:r=>r.longestLoss},
 {id:'collapse-strongest-season-no-final',title:'Most regular-season wins by a playoff team that missed the championship final',test:r=>r.outcome.playoff&&!r.outcome.finalist,score:r=>r.final.w,overlap:'legendary_records:best-record-no-title (related, different finalist scope)'}
];
const categories=definitions.map(d=>{
 const ranked=rows.filter(d.test).map(r=>({
  manager:r.manager,year:r.year,value:d.score(r),
  evidence:{first:r.first,second:r.second,final:r.final,midpoint:r.midpoint,regularGames:r.regularGames,
   peak:r.peak,finalPlace:r.finishRank,playoff:r.outcome.playoff,finalist:r.outcome.finalist,
   champion:r.outcome.champion,weeklyReceipts:r.receipts.map(x=>({week:x.week,result:x.result,
    score:x.score,against:x.against,opponent:x.opponent,w:x.w,l:x.l}))}
 })).filter(x=>x.value>0)
 .sort((a,b)=>b.value-a.value||a.year-b.year||a.manager.localeCompare(b.manager));
 let prev=null,rank=0;
 for(const [i,r] of ranked.entries()){if(r.value!==prev){rank=i+1;prev=r.value}r.rank=rank}
 return {id:d.id,title:d.title,scope:'completed regular seasons 2016–2025',status:'provisional',
  ...(d.overlap?{potentialOverlap:d.overlap}:{}),
  eventCount:ranked.length,holders:ranked.filter(x=>x.rank===1),
  leaderboard:ranked.filter(x=>x.rank<=10)};
});
const out={schema:'fellas-historical-collapses-v1',status:'provisional-not-published',
 sources:['data/season_weekly_matchups_2016_2026_v1.json',
  'data/postseason_records_verified_v1.json',
  'data/fellas_final_placements_2016_2025_verified.json'],
 coverage:{from:2016,through:2025,managerSeasons:rows.length,regularWeeksByYear:Object.fromEntries(finishes.map(y=>[y.year,Math.max(...weekly.bySeason[String(y.year)].games.filter(g=>g.stage==='regular').map(g=>g.week))]))},
 definitions:[
 'Calendar midpoint is floor(final regular-season week/2), not number of played games; 2020/2021 byes are not losses.',
 'Collapse = first-half (W-L) minus second-half (W-L), and larger values are worse; compare actual W-L, not scores.',
 'Peak cushion erosion = best cumulative (W-L) during season minus final (W-L); only a positive peak of at least +2 qualifies.',
 'First-half undefeated is zero losses in the calendar first half; ties are not losses but require complete participation receipts.',
 'A playoff berth is taken only from verified championship-bracket participants; the consolation bracket does not qualify.',
 'All data exclude ongoing 2026 and postseason scores, and map Tom to Thommy without merging Schermerhorn.',
 'Tied mark holders share competition rank 1; same score can belong to different seasons or managers.',
 'The 2016 ESPN eight-team format and 2016–2019 scoring-era changes require editorial context.'
 ],categoryCount:categories.length,categories};
console.log(JSON.stringify(out,null,2));
