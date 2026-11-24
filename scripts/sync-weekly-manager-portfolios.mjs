// Refresh regular-season portfolios from approved canonical data; preserve postseason.
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const path='data/manager_record_books_2016_2026.json',doc=read(path);
const ledger=read('data/unified_record_book_2016_2026.json');
const core=read('data/career_core_generated.json').managers;
const games=ledger.games.filter(g=>g.stage==='regular');
const week=Math.max(...games.filter(g=>g.year===2026).map(g=>g.week));
const assert=(x,m)=>{if(!x)throw Error(m)};
assert(doc.managers.length===Object.keys(core).length,'Portfolio identity coverage mismatch');
for(const m of doc.managers){
 const c=core[m.manager];assert(c,'Unknown manager '+m.manager);
 const rows=games.filter(g=>g.home===m.manager||g.away===m.manager).map(g=>{
  const home=g.home===m.manager,points=home?g.homeScore:g.awayScore,opponentPoints=home?g.awayScore:g.homeScore;
  return {...g,margin:Math.round((points-opponentPoints)*100)/100,points,opponentPoints,opponent:home?g.away:g.home,outcome:points>opponentPoints?'W':points<opponentPoints?'L':'T'};
 });
 assert(rows.length===c.games,'Career games mismatch '+m.manager);
 // Preserve tie selection and historical receipts unless a strictly better result is found.
 const metrics={bestWeek:[r=>r.points,r=>true,1],worstWeek:[r=>r.points,r=>true,-1],biggestWin:[r=>r.margin,r=>r.outcome==='W',1],closestWin:[r=>r.margin,r=>r.outcome==='W',-1],biggestLoss:[r=>r.margin,r=>r.outcome==='L',-1],closestLoss:[r=>r.margin,r=>r.outcome==='L',1]};
 for(const [key,[value,eligible,dir]] of Object.entries(metrics)){
  let best=m[key];for(const row of rows.filter(eligible))if(!best||dir*(value(row)-value(best))>0.000001)best=row;
  if(best)m[key]=best;
 }
 m.regular={...m.regular,games:c.games,w:c.w,l:c.l,t:c.t};
 m.annual=Object.entries(c.annual).map(([year,r])=>({year:Number(year),w:r.w,l:r.l,t:r.t}));
 const priorOrder=new Map(m.headToHead.map((r,i)=>[r.opponent,i]));
 m.headToHead=Object.entries(c.h2h).map(([opponent,r])=>({opponent,w:r.w,l:r.l,t:r.t,games:r.games})).sort((a,b)=>b.games-a.games||(priorOrder.get(a.opponent)??999)-(priorOrder.get(b.opponent)??999)||a.opponent.localeCompare(b.opponent));
}
doc.asOf=ledger.updated;
doc.scope=doc.scope.replace(/2026 Week \d+/,'2026 Week '+week);
doc.caveats=doc.caveats.map(s=>/2026 is incomplete through final Week/.test(s)?'2026 is incomplete through final Week '+week+'; no later games are included.':s);
fs.writeFileSync(path,JSON.stringify(doc,null,2)+'\n');
console.log('Regular-season manager portfolios regenerated through Week '+week+'; postseason preserved.');
