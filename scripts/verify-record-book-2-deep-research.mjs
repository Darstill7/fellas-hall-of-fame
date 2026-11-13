#!/usr/bin/env node
// Record Book 2.0 independent deep-research reproducibility gate.
// Research-only: no public site artifacts, category registry, or trophy ownership written.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ledger=read('data/unified_record_book_2016_2026.json');
const regular=ledger.games.filter(g=>g.stage==='regular');
const es=read('data/verified_espn_playoff_brackets_2016_2019.json');
const sl=read('data/verified_sleeper_playoff_brackets_2020_2025.json');
const placement=read('data/fellas_final_placements_2016_2025_verified.json');
const receipts=read('data/postseason_winners_bracket_record_receipts_2016_2025_v1.json');
const luck=read('data/all_time_luck_ratings_v1.json');
const norm=n=>n==='Tom'?'Thommy':n;
const cents=n=>Math.round(Number(n)*100);
const put=(map,k,x)=>{if(!map.has(k))map.set(k,[]);map.get(k).push(x)};
const teamWeeks=new Map(),managerGames=new Map(),seasonGames=new Map(),pairings=new Map();
for(const g of regular){
 const entries=[[g.home,g.away,g.homeScore,g.awayScore],[g.away,g.home,g.awayScore,g.homeScore]];
 for(const [m,o,p,q] of entries){
  const e={manager:norm(m),opponent:norm(o),score:cents(p),other:cents(q),year:g.year,week:g.week};
  put(teamWeeks,`${g.year}|${g.week}`,e);
  put(managerGames,e.manager,e);
  put(seasonGames,`${g.year}|${e.manager}`,e);
 }
 const k=[norm(g.home),norm(g.away)].sort().join('|');
 put(pairings,k,{year:g.year,week:g.week,margin:Math.abs(cents(g.homeScore)-cents(g.awayScore))});
}
assert.equal(regular.length,705);
const complete=[...teamWeeks.entries()].filter(([k,g])=>{
 const year=Number(k.slice(0,4));
 return g.length===(year===2016?8:10)&&new Set(g.map(x=>x.manager)).size===g.length;
});
assert.equal(complete.length,142);
assert.deepEqual([...teamWeeks.entries()].filter(([k,g])=>!complete.some(x=>x[0]===k)).map(([k,g])=>[k,g.length]),
 [['2020|14',8],['2021|14',8]]);
const counts=new Map();
const increment=(key,ev)=>{
 const z=counts.get(key)||{count:0,examples:[]};z.count++;z.examples.push(ev);counts.set(key,z);
};
for(const [key,games] of complete){
 const ranked=[...games].sort((a,b)=>b.score-a.score);
 const high=ranked[0].score,low=ranked.at(-1).score,top3=ranked[2].score,bottom3=ranked.at(-3).score;
 const second=ranked[0].score!==ranked[1].score?ranked[1].score:null;
 const secondLow=ranked.at(-1).score!==ranked.at(-2).score?ranked.at(-2).score:null;
 for(const x of games){
  const ev={year:x.year,week:x.week,score:x.score/100,opponent:x.opponent};
  if(x.score===high){increment(`weekly-highs|${x.manager}`,ev);if(x.year<2026)increment(`season-highs|${x.year}|${x.manager}`,ev);}
  if(x.score===low){increment(`weekly-lows|${x.manager}`,ev);if(x.year<2026)increment(`season-lows|${x.year}|${x.manager}`,ev);}
  if(x.score>=top3)increment(`top-three|${x.manager}`,ev);
  if(x.score<=bottom3)increment(`bottom-three|${x.manager}`,ev);
  if(x.score>=top3&&x.score<x.other)increment(`top-three-loss|${x.manager}`,ev);
  if(x.score<=bottom3&&x.score>x.other)increment(`bottom-three-win|${x.manager}`,ev);
  if(second!==null&&x.score===second){
   increment(`runnerup|${x.manager}`,ev);
   if(x.score<x.other)increment(`runnerup-loss|${x.manager}`,ev);
  }
  if(secondLow!==null&&x.score===secondLow&&x.score>x.other)increment(`second-lowest-win|${x.manager}`,ev);
 }
}
for(const [manager,games] of managerGames)for(const g of games){
 if(g.score>=15000){
  increment(`career-150|${manager}`,{year:g.year,week:g.week});
  if(g.year<2026)increment(`season-150|${g.year}|${manager}`,{week:g.week});
 }
 if(g.score<8000){
  increment(`career-sub80|${manager}`,{year:g.year,week:g.week});
  if(g.year<2026)increment(`season-sub80|${g.year}|${manager}`,{week:g.week});
 }
}
const check=(key,value)=>assert.equal(counts.get(key)?.count,value,key);
for(const [key,value] of Object.entries({
 'weekly-highs|Mitch':22,'weekly-lows|Stilly':20,
 'top-three|Mitch':50,'bottom-three|Stew':50,
 'runnerup|Tony':19,'runnerup-loss|Stilly':4,'second-lowest-win|Thommy':3,
 'top-three-loss|Stilly':8,'bottom-three-win|Stover':8,
 'season-highs|2025|Mitch':5,'season-lows|2019|Thommy':6,
 'career-150|Mitch':15,'season-150|2025|Mitch':4,'season-150|2021|Tony':4,
 'career-sub80|Stover':20,'season-sub80|2017|Halderman':7
}))check(key,value);
const series=[...es.seasons,...sl.seasons].sort((a,b)=>a.year-b.year);
assert.equal(series.length,10);
for(const s of series){
 const p=placement.seasons.find(y=>y.year===s.year);
 const finals=receipts.receipts.filter(r=>r.year===s.year&&r.round==='final');
 assert.equal(finals.length,1,`final evidence for ${s.year}`);
 assert.equal(p?.champion,s.champion,`placement champion ${s.year}`);
 assert.equal(finals[0].winner,s.champion,`final result ${s.year}`);
}
assert.equal(receipts.receipts.length,41);
const pair=pairings.get('Stover|Tony');
assert.equal(pair.filter(g=>g.margin<=100).length,3);
assert.deepEqual(pair.filter(g=>g.margin<=100).map(g=>[g.year,g.week,g.margin]),[[2020,8,92],[2024,11,24],[2026,7,92]]);
const birch=luck.ranked.find(x=>x.manager==='Birch');
const tony=luck.ranked.find(x=>x.manager==='Tony');
assert(Math.abs(birch.luckWins-6.67)<0.01);
assert(Math.abs((birch.bySeason['2021'].actualWins-birch.bySeason['2021'].expectedWins)-3.5555555555555)<0.001);
assert(Math.abs((tony.bySeason['2020'].actualWins-tony.bySeason['2020'].expectedWins)+2.7142857142857)<0.001);
console.log(JSON.stringify({
 status:'reproduced-from-repository-source-not-independent-provider-certified',
 coverage:{regularPairings:regular.length,completeLeagueWeeks:complete.length,verifiedFinals:series.length,postseasonWinnersBracketReceipts:receipts.receipts.length},
 checkedCategoryMarks:Object.keys({
  'weekly-highs|Mitch':1,'weekly-lows|Stilly':1,'top-three|Mitch':1,'bottom-three|Stew':1,
  'runnerup|Tony':1,'runnerup-loss|Stilly':1,'second-lowest-win|Thommy':1,
  'top-three-loss|Stilly':1,'bottom-three-win|Stover':1,
  'season-highs|2025|Mitch':1,'season-lows|2019|Thommy':1,'career-150|Mitch':1,
  'season-150|2025|Mitch':1,'season-150|2021|Tony':1,'career-sub80|Stover':1,
  'season-sub80|2017|Halderman':1
 }).length,
 source:'data/unified_record_book_2016_2026.json'
},null,2));
