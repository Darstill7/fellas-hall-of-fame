// Research-only, deterministic record candidate registry.
// Execute: node scripts/build-record-candidate-registry.mjs
// This does not modify any production files or certify the source ledger.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const INPUT='data/unified_record_book_2016_2026.json';
const raw=JSON.parse(fs.readFileSync(INPUT,'utf8'));
const played=raw.games.filter(g=>g.stage==='regular').map(g=>({
 year:g.year,week:g.week,home:g.home,away:g.away,
 a:Math.round(g.homeScore*100),b:Math.round(g.awayScore*100)
}));
const norm=n=>n==='Tom'?'Thommy':n;
const money=n=>Math.round(n)/100;
const groups=new Map(),rivalries=new Map();
const bump=(map,key,row)=>{if(!map.has(key))map.set(key,[]);map.get(key).push(row)};
for(const g of played){
 assert(Number.isInteger(g.a)&&Number.isInteger(g.b)&&g.home!==g.away);
 const k=g.year+'-'+g.week;
 bump(groups,k,{manager:norm(g.home),score:g.a,against:g.b,opponent:norm(g.away),year:g.year,week:g.week});
 bump(groups,k,{manager:norm(g.away),score:g.b,against:g.a,opponent:norm(g.home),year:g.year,week:g.week});
 const pair=[norm(g.home),norm(g.away)].sort().join('|');
 bump(rivalries,pair,{year:g.year,week:g.week,winner:g.a===g.b?null:norm(g.a>g.b?g.home:g.away)});
}
const by=(a,b)=>a.localeCompare(b);
const qualified=[];
const skipped=[];
for(const [key,entries] of groups){
 const [year,week]=key.split('-').map(Number);
 const expected=year===2016?8:10;
 assert.equal(new Set(entries.map(e=>e.manager)).size,entries.length,'Duplicate manager in '+key);
 if(entries.length!==expected){skipped.push({year,week,scoredParticipants:entries.length,expected});continue}
 const sorted=[...entries].sort((a,b)=>b.score-a.score||by(a.manager,b.manager));
 const max=sorted[0].score,min=sorted.at(-1).score;
 const second=sorted[1].score<max?sorted[1].score:null;
 const thresholdTop=sorted[2].score,thresholdBottom=sorted.at(-3).score;
 qualified.push({year,week,entries,high:sorted.filter(e=>e.score===max).map(e=>e.manager),
  low:sorted.filter(e=>e.score===min).map(e=>e.manager),
  second:second===null?[]:sorted.filter(e=>e.score===second).map(e=>e.manager),
  top3Loss:entries.filter(e=>e.score>=thresholdTop&&e.score<e.against).map(e=>e.manager),
  bottom3Win:entries.filter(e=>e.score<=thresholdBottom&&e.score>e.against).map(e=>e.manager)});
}
qualified.sort((a,b)=>a.year-b.year||a.week-b.week);
const counts={high:new Map(),low:new Map(),second:new Map(),top3Loss:new Map(),bottom3Win:new Map(),
 seasonHigh:new Map(),seasonLow:new Map()};
const receipts={};
function add(kind,manager,year,week){
 const key=['seasonHigh','seasonLow'].includes(kind)?manager+'|'+year:manager;
 counts[kind].set(key,(counts[kind].get(key)||0)+1);
 (receipts[kind+'|'+key]??=[]).push({year,week});
}
for(const w of qualified){
 for(const kind of ['high','low','second','top3Loss','bottom3Win'])
  for(const manager of w[kind]){
   add(kind,manager,w.year,w.week);
   if(w.year<2026&&kind==='high')add('seasonHigh',manager,w.year,w.week);
   if(w.year<2026&&kind==='low')add('seasonLow',manager,w.year,w.week);
  }
}
const scoringStreaks={high:[],low:[]};
for(const kind of ['high','low']){
 const prior=new Map();
 for(const w of qualified)for(const manager of w[kind]){
  const key=manager+'|'+w.year,old=prior.get(key);
  const length=old&&old.week===w.week-1?old.length+1:1;
  const start=length===1?w.week:old.start;
  scoringStreaks[kind].push({manager,year:w.year,startWeek:start,endWeek:w.week,value:length});
  prior.set(key,{week:w.week,length,start});
 }
}
const meetingStreaks=[];
for(const [pair,rows] of rivalries){
 const [a,b]=pair.split('|');
 const games=[...rows].sort((x,y)=>x.year-y.year||x.week-y.week);
 let prev=null,run=0,start=null;
 for(const g of games){
  if(g.winner===null){prev=null;run=0;start=null;continue}
  if(g.winner!==prev){run=0;start={year:g.year,week:g.week}}
  prev=g.winner;run++;
  meetingStreaks.push({manager:prev,opponent:prev===a?b:a,value:run,
   startYear:start.year,startWeek:start.week,endYear:g.year,endWeek:g.week});
 }
}
const combined=played.map(g=>({manager:norm(g.home),opponent:norm(g.away),year:g.year,week:g.week,value:money(g.a+g.b)}));
const candidate=[];
function addCount(id,title,kind,scope='career'){
 candidate.push({id,title,scope,unit:'weeks',direction:'high',
  entries:[...counts[kind]].map(([key,value])=>{
   const [manager,year]=key.split('|');return {manager,year:year?Number(year):undefined,value,evidence:receipts[kind+'|'+key]}
  })});
}
addCount('weekly-highs-career','Most weekly highest scores','high');
addCount('weekly-lows-career','Most weekly lowest scores','low');
addCount('weekly-seconds-career','Most weekly second-highest scores','second');
addCount('top-three-scoring-losses','Most top-three weekly scores in a loss','top3Loss');
addCount('bottom-three-scoring-wins','Most bottom-three weekly scores in a win','bottom3Win');
addCount('weekly-highs-season','Most weekly highest scores in a completed season','seasonHigh','completed-season');
addCount('weekly-lows-season','Most weekly lowest scores in a completed season','seasonLow','completed-season');
for(const [kind,title,id] of [
 ['high','Longest consecutive weekly highest-score streak','weekly-high-streak'],
 ['low','Longest consecutive weekly lowest-score streak','weekly-low-streak']]){
 candidate.push({id,title,scope:'same-season-consecutive-calendar-weeks',unit:'weeks',direction:'high',entries:scoringStreaks[kind]});
}
candidate.push({id:'rivalry-consecutive-meeting-wins',title:'Most consecutive wins against one rival',
 scope:'regular-season-head-to-head-meetings',unit:'meetings',direction:'high',entries:meetingStreaks});
candidate.push({id:'combined-matchup-points',title:'Most combined points in a regular-season game',
 scope:'single-game-raw-era-scores',unit:'points',direction:'high',entries:combined});
const tieKey=x=>Math.round(x.value*1e5);
for(const c of candidate){
 assert(c.entries.length,'Empty research category '+c.id);
 c.entries.sort((a,b)=>b.value-a.value||by(a.manager,b.manager)||
  (a.year??0)-(b.year??0)||(a.week??a.startWeek??0)-(b.week??b.startWeek??0));
 let prevValue=null,position=0,currentRank=0;
 for(const entry of c.entries){
  position++;
  if(tieKey(entry)!==prevValue){currentRank=position;prevValue=tieKey(entry)}
  entry.rank=currentRank;
  entry.manager=norm(entry.manager);
 }
 c.holders=c.entries.filter(e=>e.rank===1);
 c.leaders=c.entries.filter(e=>e.rank<=10);
 c.totalEntries=c.entries.length;
 delete c.entries;
}
const index={};
for(const c of candidate){
 for(const entry of c.leaders){
  (index[entry.manager]??=[]).push({categoryId:c.id,rank:entry.rank,value:entry.value,
    year:entry.year??null,week:entry.week??null,opponent:entry.opponent??null});
 }
}
const output={schema:'fellas-research-record-candidates-v1',status:'provisional-not-published',
 createdFrom:INPUT,sourceUpdated:raw.updated,
 coverage:{regularGames:played.length,qualifiedWeeklySets:qualified.length,excludedWeeklySets:skipped,
  activeSeason:2026,verifiedThroughWeek:9,weeklyRankRule:'complete scored-team week: 8 in 2016; 10 thereafter',
  ties:'competition ranks: 1,1,3; all tied best holders retained',
  sourceCautions:['Original provider validation is separate from internal ledger integrity.',
   '2020 and 2021 Week 14 exclude unpaired bye teams and are excluded from weekly ranks.',
   'ESPN and Sleeper scoring eras are not normalized; all-point totals are descriptive.',
   'Tom/Thommy are one person; former Schermerhorn is distinct.',
   '2026 ongoing, not eligible for completed-season titles.']},
 categoryCount:candidate.length,categories:candidate,managerIndex:index};
assert.equal(output.coverage.regularGames,705);
assert.equal(output.coverage.qualifiedWeeklySets,142);
assert.equal(candidate.length,11);
assert.equal(new Set(candidate.map(c=>c.id)).size,candidate.length);
console.log(JSON.stringify(output,null,2));
