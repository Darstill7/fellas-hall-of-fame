// Rebuild regular fixtures from verified ledgers; preserve archived postseason and explicit scopes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='data-integrity/historical-trade-draft-audits/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const old=read('data/unified_record_book_2016_2026.json');
const stats=read(root+'full-era-career-statistics.json');
const sources=[...read('data-integrity/frozen-regular-matchups-2016-2019-v1.json').seasons,...read('data-integrity/frozen-regular-matchups-2020-2025-v1.json').seasons,read(root+'live-completed-regular-2026.json')];
const review=read('data-integrity/regular-season-week14-classification-review-20261123.json');
const key=g=>[g.year,g.week,...[g.home,g.away].sort()].join('|');
const original=new Map(old.games.map(g=>[key(g),g]));
assert.equal(original.size,old.games.length);
const regular=sources.flatMap(s=>s.games.map(g=>{
 const base=original.get(key({...g,year:s.year}));
 const homeScore=g.home_cents/100,awayScore=g.away_cents/100;
 if(base){assert.equal(base.stage,'regular');assert.equal(Math.round((base.home===g.home?base.homeScore:base.awayScore)*100),g.home_cents);assert.equal(Math.round((base.home===g.home?base.awayScore:base.homeScore)*100),g.away_cents);}
 return {...(base||{}),year:s.year,week:g.week,home:g.home,away:g.away,homeScore,awayScore,winner:g.home_cents>g.away_cents?'HOME':g.home_cents<g.away_cents?'AWAY':'TIE',margin:Math.abs(g.home_cents-g.away_cents)/100,stage:'regular',era:s.year<2020?'ESPN':'Sleeper',source:base?.source||'verified_live_sleeper'};
}));
const corrected=review.reports.flatMap(s=>s.week14.map(g=>{const prior=original.get(key({...g,year:s.year}));assert(prior&&prior.stage==='regular');return {...prior,stage:g.verifiedWinnersBracket?'championship_bracket':'consolation'};}));
assert.equal(corrected.length,8);
const regularKeys=new Set(regular.map(key)),correctedKeys=new Set(corrected.map(key));
for(const g of old.games.filter(g=>g.stage==='regular'))assert(regularKeys.has(key(g))||correctedKeys.has(key(g)),'Unexplained removed regular fixture '+key(g));
const postseason=[...old.games.filter(g=>g.stage!=='regular'),...corrected];
const games=[...regular,...postseason].sort((a,b)=>a.year-b.year||a.week-b.week||key(a).localeCompare(key(b)));
assert.equal(new Set(games.map(key)).size,games.length);
const counts=Object.fromEntries(sources.map(s=>[s.year,{regular:regular.filter(g=>g.year===s.year).length,postseason:postseason.filter(g=>g.year===s.year).length}]));
for(const s of stats.seasons){const r=regular.filter(g=>g.year===s.year);assert.equal(r.length*2,Object.values(s.managers).reduce((n,x)=>n+x.games,0));}
assert.equal(regular.length,652+5*stats.live_watermark.completed_regular_week);
const scores=regular.flatMap(g=>[{year:g.year,week:g.week,manager:g.home,opponent:g.away,points:g.homeScore,era:g.era},{year:g.year,week:g.week,manager:g.away,opponent:g.home,points:g.awayScore,era:g.era}]);
const rankings={highScores:scores.slice().sort((a,b)=>b.points-a.points).slice(0,100),lowScores:scores.slice().sort((a,b)=>a.points-b.points).slice(0,100),biggestWins:regular.slice().sort((a,b)=>b.margin-a.margin).slice(0,100),closestGames:regular.slice().sort((a,b)=>a.margin-b.margin).slice(0,100)};
const output={...old,updated:null,coverage:'2016–2025 reconciled regular seasons and archived postseason; 2026 through completed Week '+stats.live_watermark.completed_regular_week,cautions:[...old.cautions.filter(c=>!c.includes('regular-season archive may include')),'Regular-season rankings only; postseason aggregates and cumulative scores excluded. Archived postseason coverage is not certified complete.'],counts,games,rankings,duplicatesFound:0,completedThrough:{year:2026,week:stats.live_watermark.completed_regular_week},status:'RESEARCH_ONLY'};
fs.writeFileSync(root+'unified-record-book-preview.json',JSON.stringify(output,null,2)+'\n');
console.log('UNIFIED RECORD BOOK PROJECTION PASS '+JSON.stringify({regular:regular.length,postseason:postseason.length,reclassified:corrected.length,counts}));
