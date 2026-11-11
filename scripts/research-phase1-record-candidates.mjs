// Research-only deterministic Phase 1 record audit. Do not publish resulting holders
// without cross-checking provider receipts, scoring eras, and historical manager identity.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const book = JSON.parse(fs.readFileSync('data/unified_record_book_2016_2026.json','utf8'));
const games = book.games.filter(g=>g.stage==='regular');
const key = (g)=>`${g.year}-${g.week}`;
const round = n=>Math.round((n+Number.EPSILON)*100)/100;
const weekly = new Map();
const rivalries = new Map();
const combined=[];
const first=new Map(), last=new Map(), second=new Map(), top3Loss=new Map(), bottom3Win=new Map();
const highStreaks=new Map(),lowStreaks=new Map();
const bump=(map,k,n=1)=>map.set(k,(map.get(k)||0)+n);
for(const g of games) {
  assert(Number.isInteger(g.year)&&Number.isInteger(g.week));
  assert(g.home!==g.away);
  assert(Number.isFinite(g.homeScore)&&Number.isFinite(g.awayScore));
  combined.push({year:g.year,week:g.week,pair:[g.home,g.away].sort(),points:round(g.homeScore+g.awayScore)});
  const k=key(g);
  if(!weekly.has(k))weekly.set(k,[]);
  weekly.get(k).push({manager:g.home,opponent:g.away,points:g.homeScore,oppPoints:g.awayScore});
  weekly.get(k).push({manager:g.away,opponent:g.home,points:g.awayScore,oppPoints:g.homeScore});
  const pair=[g.home,g.away].sort().join('|');
  if(!rivalries.has(pair))rivalries.set(pair,[]);
  rivalries.get(pair).push({year:g.year,week:g.week,winner:g.homeScore===g.awayScore?null:g.homeScore>g.awayScore?g.home:g.away,
    loser:g.homeScore===g.awayScore?null:g.homeScore<g.awayScore?g.home:g.away,margin:Math.abs(g.homeScore-g.awayScore)});
}
assert.equal(games.filter(g=>g.year===2026).length,45,'2026 ledger must have 45 matchups through Week 9');
const weeklySummary=[];
for(const [k,entries] of weekly){
  const [year,week]=k.split('-').map(Number);
  const distinct=new Set(entries.map(e=>e.manager));
  assert.equal(distinct.size,entries.length,'Duplicate manager in '+k);
  // Only score weeks where every participating league member is accounted for.
  // 2016 was eight-team; 2020/2021 Week 14 contain byes and are excluded
  // from weekly scoring ranks until full scored-team provider receipts are verified.
  const eligible=year===2016?entries.length===8:entries.length===10;
  if(!eligible)continue;
  const ordered=[...entries].sort((a,b)=>b.points-a.points);
  const top=ordered[0].points, bottom=ordered.at(-1).points;
  const distinctPoints=[...new Set(ordered.map(e=>e.points))].sort((a,b)=>b-a);
  const runnerUp=distinctPoints[1]; const third=distinctPoints[2];
  const high=entries.filter(e=>e.points===top).map(e=>e.manager);
  const low=entries.filter(e=>e.points===bottom).map(e=>e.manager);
  for(const e of entries){
    if(e.points===top)bump(first,e.manager);
    if(e.points===bottom)bump(last,e.manager);
    if(e.points===runnerUp)bump(second,e.manager);
    if(e.points>=third && e.points<e.oppPoints)bump(top3Loss,e.manager);
    const lowThreshold=distinctPoints.at(-3);
    if(e.points<=lowThreshold && e.points>e.oppPoints)bump(bottom3Win,e.manager);
  }
  weeklySummary.push({year,week,high,low});
}
for(const [manager,side,output] of [['high','high',highStreaks],['low','low',lowStreaks]]){
  const m=new Map();
  for(const w of weeklySummary.sort((a,b)=>a.year-b.year||a.week-b.week)){
    for(const name of w[side]){
      const k=`${w.year}|${name}`, prev=m.get(k);
      const count=prev&&prev.week===w.week-1?prev.count+1:1;
      m.set(k,{week:w.week,count,start:count===1?w.week:prev.start});
      if(count>(output.get(k)?.count||0))output.set(k,{name,year:w.year,start:m.get(k).start,end:w.week,count});
    }
  }
}
const rivalryRuns=[];
for(const [pair,meetings] of rivalries){
  meetings.sort((a,b)=>a.year-b.year||a.week-b.week);
  let prior=null,count=0,start=null;
  for(const m of meetings){
    if(!m.winner){prior=null;count=0;start=null;continue}
    if(m.winner!==prior){count=0;start={year:m.year,week:m.week}}
    count++;prior=m.winner;
    if(count>1)rivalryRuns.push({pair,winner:m.winner,count,start,end:{year:m.year,week:m.week}});
  }
}
const leaders=m=>[...m.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,10).map(([manager,value])=>({manager,value}));
const output={
  source:{updated:book.updated,pairings:games.length,qualifiedWeeklySets:weeklySummary.length,
    excludedPartialScoredWeeks:[...weekly.keys()].filter(k=>!weeklySummary.some(w=>`${w.year}-${w.week}`===k))},
  highestCombined:combined.sort((a,b)=>b.points-a.points).slice(0,10),
  mostWeeklyHighs:leaders(first),mostWeeklyLows:leaders(last),
  mostRunnerUpWeeks:leaders(second),topThreeScoringLosses:leaders(top3Loss),
  bottomThreeScoringWins:leaders(bottom3Win),
  longestHighStreak:[...highStreaks.values()].sort((a,b)=>b.count-a.count).slice(0,10),
  longestLowStreak:[...lowStreaks.values()].sort((a,b)=>b.count-a.count).slice(0,10),
  rivalryMeetingWinStreaks:rivalryRuns.sort((a,b)=>b.count-a.count).slice(0,15),
};
console.log(JSON.stringify(output,null,2));
