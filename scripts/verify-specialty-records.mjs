// Independently audit specialty manager record-book projections against the canonical ledger.
// Compare numeric extrema, not first-match tie order: multiple games may share the same value.
import fs from 'node:fs';
const ledger=JSON.parse(fs.readFileSync('data/unified_record_book_2016_2026.json','utf8'));
const archive=JSON.parse(fs.readFileSync('data/manager_record_books_2016_2026.json','utf8'));
const problems=[];
const check=(ok,why)=>{if(!ok)problems.push(why)};
const same=(a,b)=>Math.abs(Number(a)-Number(b))<0.000001;
const records=new Map();
for(const g of ledger.games){
  for(const [manager,opponent,points,opponentPoints] of [
    [g.home,g.away,g.homeScore,g.awayScore],
    [g.away,g.home,g.awayScore,g.homeScore]
  ]){
    if(!records.has(manager))records.set(manager,[]);
    records.get(manager).push({...g,manager,opponent,points,opponentPoints,
      differential:Math.round((points-opponentPoints)*100)/100,
      outcome:points>opponentPoints?'w':points<opponentPoints?'l':'t'});
  }
}
check(archive.managers.length===records.size,'Archive manager count differs from ledger');
const count=(games)=>({games:games.length,w:games.filter(g=>g.outcome==='w').length,
  l:games.filter(g=>g.outcome==='l').length,t:games.filter(g=>g.outcome==='t').length});
const props=['games','w','l','t'];
function compare(actual,expected,label){for(const p of props)check(actual?.[p]===expected[p],label+' '+p+' differs: '+actual?.[p]+' vs '+expected[p])}
function extreme(games,field,mode){
 if(!games.length)return null;
 return games.reduce((v,g)=>mode==='max'?Math.max(v,g[field]):Math.min(v,g[field]),mode==='max'?-Infinity:Infinity);
}
const observed=new Set();
for(const m of archive.managers){
 check(!observed.has(m.manager),'Duplicate archived manager '+m.manager);observed.add(m.manager);
 const all=records.get(m.manager)||[];
 const regular=all.filter(g=>g.stage==='regular');
 const postseason=all.filter(g=>g.stage!=='regular');
 compare(m.regular,count(regular),m.manager+' regular');
 compare(m.postseason,count(postseason),m.manager+' postseason');
 check(m.firstSeason===Math.min(...all.map(g=>g.year)),m.manager+' first season mismatch');
 check(m.lastSeason===Math.max(...all.map(g=>g.year)),m.manager+' last season mismatch');
 const categories=[
  ['bestWeek',regular,'points','max'],
  ['worstWeek',regular,'points','min'],
  ['biggestWin',regular.filter(g=>g.outcome==='w'),'differential','max'],
  ['closestWin',regular.filter(g=>g.outcome==='w'),'differential','min'],
  ['closestLoss',regular.filter(g=>g.outcome==='l'),'differential','max'],
  ['biggestLoss',regular.filter(g=>g.outcome==='l'),'differential','min'],
  ['bestScoringMatchup',postseason,'points','max']
 ];
 for(const [key,games,field,mode] of categories){
  const saved=key==='bestScoringMatchup'?m.postseason?.bestScoringMatchup:m[key];
  const expected=extreme(games,field,mode);
  check((expected===null)===(saved==null),m.manager+' '+key+' missing/unexpected entry');
  if(expected===null||!saved)continue;
  const stored=field==='differential'?saved.margin:saved.points;
  check(same(stored,expected),m.manager+' '+key+' value differs: '+stored+' vs '+expected);
  check(games.some(g=>g.year===saved.year&&g.week===saved.week&&g.opponent===saved.opponent&&same(g.points,saved.points)&&same(g.opponentPoints,saved.opponentPoints)),
    m.manager+' '+key+' points/opponent/week not found in canonical ledger');
 }
 const opponents=new Map();
 for(const g of regular){if(!opponents.has(g.opponent))opponents.set(g.opponent,[]);opponents.get(g.opponent).push(g)}
 const savedH2h=m.headToHead||[];
 check(savedH2h.length===opponents.size,m.manager+' opponent count mismatch');
 for(const h of savedH2h)compare(h,count(opponents.get(h.opponent)||[]),m.manager+' versus '+h.opponent);
 const years=new Map();
 for(const g of regular){if(!years.has(g.year))years.set(g.year,[]);years.get(g.year).push(g)}
 check((m.annual||[]).length===years.size,m.manager+' annual year count mismatch');
 for(const row of m.annual||[]){
  const expected=count(years.get(row.year)||[]);
  for(const prop of ['w','l','t'])check(row[prop]===expected[prop],m.manager+' '+row.year+' '+prop+' mismatch');
 }
}
for(const name of records.keys())check(observed.has(name),'Canonical manager not represented: '+name);
if(problems.length){console.error('Specialty record-book audit FAILED ('+problems.length+')');for(const p of problems)console.error(' - '+p);process.exit(1)}
console.log('Specialty record-book audit PASS: '+archive.managers.length+' historical managers; career/postseason totals, annual records, opponents and scoring extremes reconciled across '+ledger.games.length+' canonical games.');
