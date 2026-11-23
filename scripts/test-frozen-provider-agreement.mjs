// Compare independently generated provider report and immutable statistics.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='data-integrity/historical-trade-draft-audits/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const stats=read(root+'frozen-regular-statistics-v1.json');
const provider=read(root+'regular-season-source-reconciliation.json');
const ledger=read('data-integrity/frozen-regular-matchups-2020-2025-v1.json');
const key=(w,a,b)=>w+'|'+[a,b].sort().join('|');
const cents=n=>Math.round(n*100);
let checks=0;
const eq=(a,b,msg)=>{checks++;assert.deepEqual(a,b,msg)};
eq(provider.coverage.fixtures,410,'provider fixture count');
eq(provider.coverage.team_scores,820,'provider score count');
eq(provider.coverage.differences,0,'provider discrepancies');
for(const p of provider.reports){
 const s=stats.seasons.find(x=>x.year===p.year);
 const l=ledger.seasons.find(x=>x.year===p.year);
 eq(s.regular_weeks,p.cutoff,'season cutoff '+p.year);
 const fixtures=new Map(l.games.map(g=>[key(g.week,g.home,g.away),g]));
 eq(fixtures.size,l.games.length,'unique frozen fixtures');
 for(const g of p.source_games){
  const f=fixtures.get(key(g.week,g.home,g.away));assert(f,'provider fixture not frozen');
  eq(f.home===g.home?f.home_cents:f.away_cents,cents(g.homeScore),'home score '+p.year+' '+g.week);
  eq(f.home===g.away?f.home_cents:f.away_cents,cents(g.awayScore),'away score '+p.year+' '+g.week);
  fixtures.delete(key(g.week,g.home,g.away));
 }
 eq(fixtures.size,0,'unmatched frozen fixtures');
 for(const [m,r] of Object.entries(p.standings)){
  const x=s.managers[m];
  eq([x.games,x.w,x.l,x.t,x.pf_cents,x.pa_cents],[r.games,r.w,r.l,r.t,cents(r.pf),cents(r.pa)],p.year+' '+m+' standings');
 }
}
console.log('FROZEN PROVIDER AGREEMENT PASS '+JSON.stringify({checks,fixtures:410,team_scores:820,manager_seasons:60}));
