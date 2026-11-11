// Phase 2 record candidates: deterministic, research-only. No site data is modified.
// node scripts/build-record-book-phase2.mjs > /tmp/fellas-phase2.json
import fs from 'node:fs';
import assert from 'node:assert/strict';
const source='data/unified_record_book_2016_2026.json';
const ledger=JSON.parse(fs.readFileSync(source,'utf8'));
const games=ledger.games.filter(g=>g.stage==='regular');
const norm=n=>n==='Tom'?'Thommy':n;
const cents=n=>Math.round(Number(n)*100);
const fromCents=n=>n/100;
const weeks=new Map(),rivalries=new Map(),seasonEntries=new Map();
const add=(map,k,v)=>{if(!map.has(k))map.set(k,[]);map.get(k).push(v)};
for(const g of games){
 const a=norm(g.home),b=norm(g.away),sa=cents(g.homeScore),sb=cents(g.awayScore);
 assert(a!==b&&Number.isInteger(sa)&&Number.isInteger(sb));
 const k=g.year+'|'+g.week;
 const home={manager:a,opponent:b,score:sa,against:sb,year:g.year,week:g.week,win:sa>sb,loss:sa<sb};
 const away={manager:b,opponent:a,score:sb,against:sa,year:g.year,week:g.week,win:sb>sa,loss:sb<sa};
 add(weeks,k,home);add(weeks,k,away);
 add(seasonEntries,g.year+'|'+a,home);add(seasonEntries,g.year+'|'+b,away);
 add(rivalries,[a,b].sort().join('|'),{year:g.year,week:g.week,a,b,sa,sb});
}
const qualified=[],excluded=[];
for(const [k,entries] of weeks){
 const [year,week]=k.split('|').map(Number),expected=year===2016?8:10;
 assert.equal(entries.length,new Set(entries.map(e=>e.manager)).size,'Duplicate team score '+k);
 if(entries.length!==expected){excluded.push({year,week,scoredTeams:entries.length});continue}
 const s=[...entries].sort((a,b)=>b.score-a.score||a.manager.localeCompare(b.manager));
 const top=s[0].score,bottom=s.at(-1).score;
 const top3=s[2].score,bottom3=s.at(-3).score;
 qualified.push({year,week,entries,top,bottom,top3,bottom3,second:s[0].score===s[1].score?null:s[1].score,
   secondLow:s.at(-1).score===s.at(-2).score?null:s.at(-2).score});
}
qualified.sort((a,b)=>a.year-b.year||a.week-b.week);
const defs=[
 ['weekly-highs','Career weekly scoring titles','Weekly league rank','weeks'],
 ['weekly-lows','Career weekly lowest scores','Weekly league rank','weeks'],
 ['weekly-runnerups','Career weekly second-highest scores','Weekly league rank','weeks'],
 ['weekly-top-three','Career top-three weekly scores','Weekly league rank','weeks'],
 ['weekly-bottom-three','Career bottom-three weekly scores','Weekly league rank','weeks'],
 ['top-three-losses','Top-three scoring weeks lost','Weekly league rank','weeks'],
 ['bottom-three-wins','Bottom-three scoring weeks won','Weekly league rank','weeks'],
 ['runnerup-losses','Second-highest score yet lost','Weekly league rank','weeks'],
 ['second-lowest-wins','Second-lowest score yet won','Weekly league rank','weeks'],
 ['season-top-three','Most top-three scoring weeks in a completed season','Completed season','weeks'],
 ['season-bottom-three','Most bottom-three scoring weeks in a completed season','Completed season','weeks'],
 ['season-weekly-highs','Most weekly scoring titles in a completed season','Completed season','weeks'],
 ['season-weekly-lows','Most weekly lowest scores in a completed season','Completed season','weeks'],
 ['career-150-plus','Most 150+ point games','Career regular season','games'],
 ['career-sub-80','Most games scoring below 80','Career regular season','games'],
 ['season-150-plus','Most 150+ point games in a completed season','Completed season','games'],
 ['season-sub-80','Most games scoring below 80 in a completed season','Completed season','games'],
 ['high-streak','Consecutive weekly league-high scores in one season','Consecutive calendar weeks','weeks'],
 ['low-streak','Consecutive weekly league-low scores in one season','Consecutive calendar weeks','weeks'],
 ['combined-high','Highest combined score in a matchup','Single regular-season matchup','points'],
 ['combined-low','Lowest combined score in a matchup','Single regular-season matchup','points'],
 ['rival-win-run','Most consecutive head-to-head wins versus one rival','Consecutive head-to-head meetings','meetings'],
 ['rival-one-point','Most meetings within 1 point against one rival','Rivalry','games']
];
const records=new Map(defs.map(([id,title,scope,unit])=>[id,{id,title,scope,unit,rows:[]}]));
const push=(id,manager,value,evidence,extra={})=>records.get(id).rows.push({manager,value,evidence,...extra});
const tally=new Map();
const key=(id,name,year)=>id+'|'+name+(year?'|'+year:'');
const increase=(id,name,ev,year=null)=>{const k=key(id,name,year),r=tally.get(k)||{id,name,year,value:0,evidence:[]};r.value++;r.evidence.push(ev);tally.set(k,r)};
const currentWeek=qualified.filter(w=>w.year===2026).at(-1)?.week;
for(const w of qualified){
 for(const e of w.entries){
  const ev={year:w.year,week:w.week,points:fromCents(e.score),opponent:e.opponent,opponentPoints:fromCents(e.against)};
  if(e.score===w.top)increase('weekly-highs',e.manager,ev);
  if(e.score===w.bottom)increase('weekly-lows',e.manager,ev);
  if(w.second!==null&&e.score===w.second)increase('weekly-runnerups',e.manager,ev);
  if(e.score>=w.top3)increase('weekly-top-three',e.manager,ev);
  if(e.score<=w.bottom3)increase('weekly-bottom-three',e.manager,ev);
  if(e.score>=w.top3&&e.loss)increase('top-three-losses',e.manager,ev);
  if(e.score<=w.bottom3&&e.win)increase('bottom-three-wins',e.manager,ev);
  if(w.second!==null&&e.score===w.second&&e.loss)increase('runnerup-losses',e.manager,ev);
  if(w.secondLow!==null&&e.score===w.secondLow&&e.win)increase('second-lowest-wins',e.manager,ev);
  if(w.year<2026){
   if(e.score>=w.top3)increase('season-top-three',e.manager,ev,w.year);
   if(e.score<=w.bottom3)increase('season-bottom-three',e.manager,ev,w.year);
   if(e.score===w.top)increase('season-weekly-highs',e.manager,ev,w.year);
   if(e.score===w.bottom)increase('season-weekly-lows',e.manager,ev,w.year);
  }
 }
}
for(const [k,entries] of seasonEntries){
 const [year,name]=k.split('|');const yr=Number(year);
 for(const e of entries){
  const ev={year:yr,week:e.week,points:fromCents(e.score),opponent:e.opponent};
  if(e.score>=15000){increase('career-150-plus',name,ev);if(yr<2026)increase('season-150-plus',name,ev,yr)}
  if(e.score<8000){increase('career-sub-80',name,ev);if(yr<2026)increase('season-sub-80',name,ev,yr)}
 }
}
for(const item of tally.values())push(item.id,item.name,item.value,item.evidence,{...(item.year?{year:item.year}:{})});
for(const [id,side] of [['high-streak','top'],['low-streak','bottom']]){
 const state=new Map();
 for(const w of qualified){
  const group=w.entries.filter(e=>e.score===w[side]);
  for(const e of group){
   const k=w.year+'|'+e.manager,p=state.get(k),count=p&&p.week===w.week-1?p.count+1:1,start=count===1?w.week:p.start;
   state.set(k,{week:w.week,count,start});
   push(id,e.manager,count,{year:w.year,startWeek:start,endWeek:w.week},{year:w.year});
  }
 }
}
for(const g of games){
 const a=norm(g.home),b=norm(g.away),sum=fromCents(cents(g.homeScore)+cents(g.awayScore));
 const ev={year:g.year,week:g.week,home:a,away:b,homeScore:g.homeScore,awayScore:g.awayScore};
 push('combined-high',a,sum,ev,{opponent:b,year:g.year,week:g.week});
 push('combined-low',a,sum,ev,{opponent:b,year:g.year,week:g.week});
}
for(const [pair,games] of rivalries){
 const [a,b]=pair.split('|');
 const sorted=[...games].sort((x,y)=>x.year-y.year||x.week-y.week);
 let last=null,run=0,start=null,near=0,close=[];
 for(const g of sorted){
  const win=g.sa===g.sb?null:(g.sa>g.sb?g.a:g.b);
  if(win===null){last=null;run=0;start=null}
  else{
   if(win!==last){run=0;start={year:g.year,week:g.week}}
   last=win;run++;
   push('rival-win-run',win,run,{from:start,to:{year:g.year,week:g.week}},{opponent:win===a?b:a});
  }
  if(Math.abs(g.sa-g.sb)<=100){
   near++;close.push({year:g.year,week:g.week,pointsA:fromCents(g.sa),pointsB:fromCents(g.sb)});
  }
 }
 push('rival-one-point',a,near,close,{opponent:b});
}
const out=[];
for(const c of records.values()){
 let rows=c.rows.filter(r=>r.value>0);
 const direction=c.id==='combined-low'?'low':'high';
 rows.sort((a,b)=>(direction==='low'?a.value-b.value:b.value-a.value)||a.manager.localeCompare(b.manager)||(a.year??0)-(b.year??0));
 let previous=null,rank=0;
 rows=rows.map((r,i)=>{if(previous!==r.value){rank=i+1;previous=r.value}return {...r,rank}});
 const leaders=rows.filter(r=>r.rank<=5);
 // All tied top marks are retained; no arbitrary truncation at first place.
 const holders=rows.filter(r=>r.rank===1);
 out.push({id:c.id,title:c.title,scope:c.scope,unit:c.unit,direction,
  count:rows.length,leaders,holders});
}
const schema={schema:'fellas-phase2-record-research-v1',status:'provisional-not-published',
 source,sourceUpdated:ledger.updated,updated:'2026-11-11',
 rules:['Regular season only; 2026 W9 is the active incomplete season.',
  '2016 has eight scored managers; ordinary subsequent weeks have ten.',
  '2020 and 2021 Week 14 excluded from weekly-ranking categories, but played matches retained for scoring and rivalry categories.',
  'A tie for first shares rank 1, and the next distinct rank is 3 when two people tie for first.',
  'Raw fantasy points across ESPN and Sleeper scoring eras are not normalized.',
  'Head-to-head rivalry streaks mean consecutive meetings, not league weeks.',
  'A zero count is not an earned record; unresolved tied scoring placements are excluded from runner-up/second-lowest titles.',
  'Completed season records exclude all of 2026; verified provider finality of W9 does not make the season complete.'],
 coverage:{games:games.length,weeklyScoringSets:qualified.length,excludedPartialWeeks:excluded,latest2026Week:currentWeek},
 categoryCount:out.length,categories:out};
assert.equal(schema.coverage.games,705);
assert.equal(schema.coverage.weeklyScoringSets,142);
assert.equal(schema.categoryCount,23);
console.log(JSON.stringify(schema,null,2));
