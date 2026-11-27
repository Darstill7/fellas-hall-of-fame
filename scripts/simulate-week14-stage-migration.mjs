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
assert.equal(JSON.stringify(ledger),snapshot);
console.log(JSON.stringify({status:'research_projection_not_certified',pointUnits:'integer cents',scope:'legacy regular-labeled ledger including active season; excludes only eight known anomalies; not full stage certification',allGameCountUnchanged:ledger.games.length,regularBefore:before.length,regularAfter:after.length,career,headToHead,awards,unverified:['exact non-winners bracket labels','official PF/PA versus weekly sums','streaks','all-play','strength of schedule','personal best ranks','record watch and production consumer parity']},null,2));
