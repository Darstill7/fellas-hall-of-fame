// Require all nine research projections to agree before staging.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='data-integrity/historical-trade-draft-audits/';
const read=n=>JSON.parse(fs.readFileSync(root+n+'.json','utf8'));
const book=read('unified-record-book-preview'),guide=read('season-guide-preview'),core=read('career-core-preview'),profiles=read('manager-profile-career-preview'),mirror=read('weekly-matchup-mirror-preview'),luck=read('all-time-luck-preview'),personal=read('manager-record-books-preview'),endings=read('manager-season-endings-preview'),results=read('manager-season-results-preview');
let checks=0;const eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)};
const fields=r=>({games:r.games,w:r.w,l:r.l,t:r.t});
for(const d of [profiles,book,mirror,luck,personal,endings,results])eq(d.completedThrough,core.completedThrough,'shared cutoff');
for(const [name,r] of Object.entries(core.managers)){
 const p=personal.managers.find(x=>x.manager===name),l=luck.ranked.find(x=>x.manager===name);
 eq(p.regular,fields(r),name+' personal record');
 eq(l.games,r.games,name+' luck games');eq(l.actualWins,r.w+r.t/2,name+' luck actual');
 for(const [year,a] of Object.entries(r.annual)){
  const g=guide[year].standings.find(x=>x.name===name);
  const m=mirror.bySeason[year].standings.find(x=>x.manager===name);
  const e=endings.managers[name].find(x=>x.year===Number(year));
  const s=results.rows.find(x=>x.manager===name&&x.year===Number(year));
  eq(fields(m),fields(a));eq(m.pf,g.pf);eq(m.pa,g.pa);
  eq(e.regular,a.w+'-'+a.l+(a.t?'-'+a.t:''));
  eq({games:s.games,w:s.wins,l:s.losses,t:s.ties},fields(a));eq(s.pf,g.pf);
  eq(s.finalRank,e.finalRank);eq(s.ending,e.ending);
  eq(p.annual.find(x=>x.year===Number(year)),{year:Number(year),w:a.w,l:a.l,t:a.t});
  eq(l.bySeason[year].games,a.games);
  eq(mirror.managerAnnual[name].find(x=>x.year===Number(year)),{year:Number(year),...m});
 }
 for(const h of p.headToHead){const {opponent,...r}=h;eq(r,core.managers[name].h2h[opponent]);}
}
for(const [year,s] of Object.entries(mirror.bySeason)){
 eq(s.regularGames,book.counts[year].regular);eq(s.postseasonGames,book.counts[year].postseason);eq(s.games.length,book.games.filter(g=>g.year===Number(year)).length);
 const expected=book.games.filter(g=>g.year===Number(year)).map(({year,source,...g})=>({...g,weeksCovered:g.weeksCovered??null,twoWeekAggregate:g.twoWeekAggregate??false}));
 eq(s.games,expected,'fixture mirror '+year);
}
eq(results.rows.length,108);eq(personal.managers.length,14);eq(luck.ranked.length,14);
console.log('NINE DATASET AGREEMENT PASS '+JSON.stringify({checks,datasets:9,completedThrough:core.completedThrough}));
