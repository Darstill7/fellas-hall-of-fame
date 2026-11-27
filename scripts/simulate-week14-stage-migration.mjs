// Research only: read-only projection; never write canonical data.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ledger=read('data/unified_record_book_2016_2026.json');
const audit=read('data/week14_2020_2021_stage_classification_audit_v1.json');
const projection=read('data/corrected_2020_2021_regular_standings_projection_v1.json');
const snapshot=JSON.stringify(ledger);
const key=(y,w,a,b)=>JSON.stringify([y,w,...[a,b].sort()]);
const evidence=new Map();
for(const y of audit.years)for(const g of y.week14Games){
 const k=key(y.year,g.week,g.home,g.away);assert(!evidence.has(k));
 evidence.set(k,{...g,year:y.year});
}
const id=g=>key(g.year,g.week,g.home,g.away);
const removed=ledger.games.filter(g=>g.stage==='regular'&&evidence.has(id(g)));
assert.equal(evidence.size,8);assert.equal(removed.length,8);
for(const g of removed){
 const e=evidence.get(id(g));
 assert.equal(g.home,e.home);assert.equal(g.away,e.away);
 assert.equal(g.homeScore,e.homeScore);assert.equal(g.awayScore,e.awayScore);
}
assert.equal(removed.filter(g=>evidence.get(id(g)).verifiedWinnersBracket).length,4);
const before=ledger.games.filter(g=>g.stage==='regular');
const after=before.filter(g=>!evidence.has(id(g)));
assert.equal(before.length-after.length,8);
const cents=n=>{assert(Number.isFinite(n));return Math.round(n*100)};
function summarize(games,byOpponent=false){
 const out=new Map();
 for(const g of games)for(const [manager,opponent,pf,pa] of [[g.home,g.away,g.homeScore,g.awayScore],[g.away,g.home,g.awayScore,g.homeScore]]){
  const k=JSON.stringify(byOpponent?[manager,opponent]:[manager]);
  const a=out.get(k)??{games:0,w:0,l:0,t:0,pf:0,pa:0};
  a.games++;a.w+=Number(pf>pa);a.l+=Number(pf<pa);a.t+=Number(pf===pa);a.pf+=cents(pf);a.pa+=cents(pa);out.set(k,a);
 }
 return out;
}
function changes(a,b){
 const zero={games:0,w:0,l:0,t:0,pf:0,pa:0};
 return [...new Set([...a.keys(),...b.keys()])].sort().flatMap(k=>{
  const old=a.get(k)??zero,next=b.get(k)??zero;
  const delta=Object.fromEntries(Object.keys(zero).map(f=>[f,next[f]-old[f]]));
  if(!Object.values(delta).some(Boolean))return [];
  const pct=v=>v.games?(v.w+v.t/2)/v.games:null;
  return [{identity:JSON.parse(k),before:old,after:next,delta,winPercentageBefore:pct(old),winPercentageAfter:pct(next)}];
 });
}
for(const y of projection.years){
 const rows=summarize(after.filter(g=>g.year===y.year));
 assert.equal(rows.size,10);
 for(const p of y.rows){
  const a=rows.get(JSON.stringify([p.manager]));
  assert(a);for(const f of ['games','w','l','t'])assert.equal(a[f],p.corrected[f],y.year+' '+p.manager+' '+f);
  for(const f of ['pf','pa'])assert.equal(a[f],cents(p.corrected[f]),y.year+' '+p.manager+' '+f);
 }
}
const awards=[2020,2021].map(year=>{
 const games=removed.filter(g=>g.year===year);
 const participants=games.flatMap(g=>[{manager:g.home,score:g.homeScore},{manager:g.away,score:g.awayScore}]);
 const byes=ledger.confirmedByes.find(b=>b.year===year&&b.week===14).managers;
 assert.equal(new Set(participants.map(p=>p.manager)).size,8);assert.equal(byes.length,2);
 assert(byes.every(b=>!participants.some(p=>p.manager===b)));
 return {year,week:14,eligible:participants.sort((a,b)=>b.score-a.score||a.manager.localeCompare(b.manager)),excludedByes:byes};
});
const career=changes(summarize(before),summarize(after));
const headToHead=changes(summarize(before,true),summarize(after,true));
assert.equal(career.reduce((s,r)=>s+r.delta.games,0),-16);
assert.equal(career.reduce((s,r)=>s+r.delta.w,0),-8);
assert.equal(career.reduce((s,r)=>s+r.delta.l,0),-8);
assert.equal(career.reduce((s,r)=>s+r.delta.pf,0),career.reduce((s,r)=>s+r.delta.pa,0));
// Full paired weeks only for all-play; streaks reset each season, ties break both.
const archivedAllPlay=read('data/all_play_schedule_variance_2016_2026w8_v1.json');
function seasonMetrics(games,year){
 const weeks=new Map(), rows=new Map();
 for(const g of games.filter(g=>g.year===year)){
  const w=weeks.get(g.week)??new Map();
  for(const [n,p,o,q] of [[g.home,g.homeScore,g.away,g.awayScore],[g.away,g.awayScore,g.home,g.homeScore]]){
   assert(!w.has(n),'Duplicate weekly participant');
   w.set(n,{points:cents(p),opponent:o,against:cents(q)});
  }
  weeks.set(g.week,w);
 }
 for(const [week,w] of [...weeks].sort((a,b)=>a[0]-b[0])){
  for(const [n,v] of w){
   const a=rows.get(n)??{games:0,winRun:0,lossRun:0,longestWin:0,longestLoss:0,lastWeek:null,opponentPoints:0,completeWeeks:0,actualWins:0,actualTies:0,allPlayWins:0,allPlayTies:0};
   if(a.lastWeek!==null&&week!==a.lastWeek+1){a.winRun=0;a.lossRun=0;}
   a.games++;a.lastWeek=week;a.opponentPoints+=v.against;
   a.winRun=v.points>v.against?a.winRun+1:0;
   a.lossRun=v.points<v.against?a.lossRun+1:0;
   a.longestWin=Math.max(a.longestWin,a.winRun);a.longestLoss=Math.max(a.longestLoss,a.lossRun);
   if(w.size===10){
    a.completeWeeks++;a.actualWins+=Number(v.points>v.against);a.actualTies+=Number(v.points===v.against);
    for(const [other,q] of w)if(other!==n){a.allPlayWins+=Number(v.points>q.points);a.allPlayTies+=Number(v.points===q.points);}
   }
   rows.set(n,a);
  }
 }
 return Object.fromEntries([...rows].map(([n,a])=>{
  const expectedWins=(a.allPlayWins+a.allPlayTies/2)/9;
  return [n,{...a,expectedWins,scheduleDrawSurplus:a.actualWins+a.actualTies/2-expectedWins,meanOpponentPoints:a.opponentPoints/a.games/100}];
 }));
}
const seasonImpact=[2020,2021].map(year=>{
 const a=seasonMetrics(before,year),b=seasonMetrics(after,year);
 assert.equal(Object.keys(b).length,10);
 for(const [n,v] of Object.entries(b)){
  const old=a[n],ref=archivedAllPlay.allManagerSeasons.find(r=>r.year===year&&r.manager===n);
  assert(ref);assert.equal(v.games,13);assert.equal(v.completeWeeks,13);
  for(const f of ['completeWeeks','actualWins','actualTies','allPlayWins','allPlayTies']){
   assert.equal(v[f],old[f]);assert.equal(v[f],ref[f],year+' '+n+' '+f);
  }
  assert(Math.abs(v.expectedWins-ref.expectedWins)<=0.00051);
  assert(Math.abs(v.scheduleDrawSurplus-ref.scheduleDrawSurplus)<=0.00051);
  assert(v.longestWin<=old.longestWin&&v.longestLoss<=old.longestLoss);
 }
 return {year,streakDefinition:'within-season consecutive observed regular weeks; ties and gaps break runs',scheduleDefinition:'mean actual opponent weekly points, not future schedule forecast',before:a,after:b};
});
// Research policy only: offseason continuity requires adjacent seasons and
// the manager's last/first games to coincide with observed league boundaries.
// Missing weeks, missing seasons and ties break runs. No publication implied.
function careerRuns(games,bridgeOffseason){
 const bounds=new Map(), histories=new Map();
 for(const g of games){
  const b=bounds.get(g.year)??{first:g.week,last:g.week};
  b.first=Math.min(b.first,g.week);b.last=Math.max(b.last,g.week);bounds.set(g.year,b);
  for(const [manager,pf,pa] of [[g.home,g.homeScore,g.awayScore],[g.away,g.awayScore,g.homeScore]]){
   const h=histories.get(manager)??[];
   h.push({year:g.year,week:g.week,result:pf>pa?'W':pf<pa?'L':'T'});
   histories.set(manager,h);
  }
 }
 return Object.fromEntries([...histories].sort((a,b)=>a[0].localeCompare(b[0])).map(([manager,h])=>{
  h.sort((a,b)=>a.year-b.year||a.week-b.week);
  let prev=null,run=[],best={W:[],L:[]};
  const finish=()=>{
   if(!run.length)return;
   const result=run[0].result;
   const longest=best[result][0]?.length??0;
   if(run.length>longest)best[result]=[];
   if(run.length>=longest)best[result].push(run);
   run=[];
  };
  for(const g of h){
   if(prev)assert(prev.year!==g.year||prev.week!==g.week,'Duplicate manager week '+manager);
   const adjacent=prev&&(g.year===prev.year&&g.week===prev.week+1||
    bridgeOffseason&&g.year===prev.year+1&&prev.week===bounds.get(prev.year).last&&g.week===bounds.get(g.year).first);
   if(!adjacent||g.result!==prev?.result||g.result==='T')finish();
   if(g.result!=='T')run.push(g);
   prev=g;
  }
  const terminal=run.slice();finish();
  return [manager,{longestWin:best.W[0]?.length??0,longestLoss:best.L[0]?.length??0,winReceipts:best.W,lossReceipts:best.L,lastObservedGame:prev,terminalRun:terminal}];
 }));
}
const fixture=(year,week,win)=>({year,week,home:'A',away:'B',homeScore:win?2:1,awayScore:win?1:2});
const toy=[fixture(2020,13,true),fixture(2021,1,true),fixture(2021,3,true)];
assert.equal(careerRuns(toy,true).A.longestWin,2);
assert.equal(careerRuns(toy,false).A.longestWin,1);
assert.equal(careerRuns([fixture(2020,13,true),fixture(2022,1,true)],true).A.longestWin,1);
const careerStreaks=[false,true].map(bridgeOffseason=>{
 const old=careerRuns(before,bridgeOffseason),next=careerRuns(after,bridgeOffseason);
 return {bridgeOffseason,policy:'observed regular-game continuity; ties and gaps break; offseason bridges only adjacent seasons at observed league boundaries; research not certified',changed:Object.keys(old).filter(n=>JSON.stringify(old[n])!==JSON.stringify(next[n])).map(manager=>({manager,before:old[manager],after:next[manager]})),before:old,after:next};
});
assert.equal(JSON.stringify(ledger),snapshot);
console.log(JSON.stringify({status:'research_projection_not_certified',pointUnits:'integer cents',scope:'legacy regular-labeled ledger including active season; excludes only eight known anomalies; not full stage certification',allGameCountUnchanged:ledger.games.length,regularBefore:before.length,regularAfter:after.length,career,headToHead,awards,seasonImpact,careerStreaks,unverified:['exact non-winners bracket labels','official PF/PA versus weekly sums','career cross-season streak policy and consumer parity','future strength of schedule','personal best ranks','record watch and production consumer parity']},null,2));
