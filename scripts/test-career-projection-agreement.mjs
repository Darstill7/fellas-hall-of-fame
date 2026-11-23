// Cross-check all public-shaped research projections against independently summed fixtures.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='data-integrity/historical-trade-draft-audits/';
const read=n=>JSON.parse(fs.readFileSync(root+n+'.json','utf8'));
const book=read('unified-record-book-preview'),guide=read('season-guide-preview'),core=read('career-core-preview'),profiles=read('manager-profile-career-preview'),stats=read('full-era-career-statistics');
let checks=0;const eq=(a,b,msg)=>{checks++;assert.deepEqual(a,b,msg)};
const blank=()=>({games:0,w:0,l:0,t:0,pf:0,pa:0});
const annual={},career={},rivals={},seen=new Set();
const regular=book.games.filter(g=>g.stage==='regular');
const key=g=>[g.year,g.week,...[g.home,g.away].sort()].join('|');
const fields=r=>({games:r.games,w:r.w,l:r.l,t:r.t});
function add(r,pf,pa){r.games++;r[pf>pa?'w':pf<pa?'l':'t']++;r.pf+=pf;r.pa+=pa;}
for(const g of book.games){eq(seen.has(key(g)),false,'unique fixture');seen.add(key(g));}
for(const g of regular){
 eq(g.twoWeekAggregate===true,false,'no aggregates');
 for(const [m,o,pf,pa] of [[g.home,g.away,g.homeScore,g.awayScore],[g.away,g.home,g.awayScore,g.homeScore]]){
  const p=Math.round(pf*100),a=Math.round(pa*100);
  add((annual[g.year]??={})[m]??=blank(),p,a);
  add(career[m]??=blank(),p,a);
  add((rivals[m]??={})[o]??=blank(),p,a);
 }
}
eq(regular.length,core.regularSeasonGames,'record book vs core count');
eq(core.completedThrough,profiles.completedThrough,'profile/core watermark');
eq(book.completedThrough,core.completedThrough,'book/core watermark');
for(const [year,rows] of Object.entries(annual)){
 eq(guide[year].games,regular.filter(g=>g.year===Number(year)).length,'guide count');
 eq(book.counts[year].regular,guide[year].games,'book count');
 for(const [m,r] of Object.entries(rows)){
  const g=guide[year].standings.find(x=>x.name===m);
  const s=stats.seasons.find(x=>x.year===Number(year)).managers[m];
  eq(fields(g),fields(r),m+' guide '+year);eq(Math.round(g.pf*100),r.pf);eq(Math.round(g.pa*100),r.pa);
  eq(fields(core.managers[m].annual[year]),fields(r),m+' annual core');
  eq(fields(s),fields(r),m+' annual engine');
 }
}
for(const [m,r] of Object.entries(career)){
 eq(fields(core.managers[m]),fields(r),m+' core');
 eq(fields(profiles.managers[m].record),fields(r),m+' profile');
 eq(profiles.managers[m].regularSeasonMetrics.pf_cents,r.pf,m+' profile PF');
 eq(profiles.managers[m].regularSeasonMetrics.pa_cents,r.pa,m+' profile PA');
 for(const [o,v] of Object.entries(rivals[m]))eq(core.managers[m].h2h[o],fields(v),m+' vs '+o);
}
for(const [year,expected] of [[2020,65],[2021,65]]){eq(book.counts[year].regular,expected);eq(regular.filter(g=>g.year===year&&g.week===14).length,0);}
const ranked=new Map(regular.flatMap(g=>[[g.year+'|'+g.week+'|'+g.home+'|'+g.away,g.homeScore],[g.year+'|'+g.week+'|'+g.away+'|'+g.home,g.awayScore]]));
for(const name of ['highScores','lowScores'])for(const r of book.rankings[name])eq(ranked.get(r.year+'|'+r.week+'|'+r.manager+'|'+r.opponent),r.points,'eligible weekly score');
for(const name of ['biggestWins','closestGames'])for(const g of book.rankings[name])eq(g.stage,'regular','eligible regular matchup');
console.log('CROSS DATASET CAREER AGREEMENT PASS '+JSON.stringify({checks,regular:regular.length,managers:Object.keys(career).length,manager_seasons:Object.values(annual).reduce((n,r)=>n+Object.keys(r).length,0),completedThrough:core.completedThrough}));
