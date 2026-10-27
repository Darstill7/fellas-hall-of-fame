// Phase 2: independent ledger-to-projection audit.
// Read-only by design. Run: node scripts/verify-ledger-projections.mjs
import fs from 'node:fs';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ledger=load('data/unified_record_book_2016_2026.json');
const careers=load('data/manager_record_books_2016_2026.json');
const seasons=load('data/season_weekly_matchups_2016_2026_v1.json');
const guide=load('data/season_guide.json');
const errors=[];
const assert=(condition,message)=>{if(!condition)errors.push(message)};
const names=new Map();
const byYear=new Map();
const score=(a,b)=>a>b?'w':a<b?'l':'t';
for(const game of ledger.games){
 const year=game.year;
 const bucket=byYear.get(year)||[];bucket.push(game);byYear.set(year,bucket);
 assert(game.home!==game.away,year+' W'+game.week+' self-match');
 assert(Number.isFinite(game.homeScore)&&Number.isFinite(game.awayScore),year+' W'+game.week+' invalid score');
 if(game.stage!=='regular')continue;
 for(const [manager,points,against] of [[game.home,game.homeScore,game.awayScore],[game.away,game.awayScore,game.homeScore]]){
  const x=names.get(manager)||{games:0,w:0,l:0,t:0,annual:new Map()};
  x.games++;x[score(points,against)]++;
  const y=x.annual.get(year)||{games:0,w:0,l:0,t:0};
  y.games++;y[score(points,against)]++;x.annual.set(year,y);
  names.set(manager,x);
 }
}
for(const [year,counts] of Object.entries(ledger.counts||{})){\n const games=byYear.get(Number(year))||[];\n assert(games.filter(x=>x.stage==='regular').length===counts.regular,year+' ledger count metadata differs');\n assert(games.filter(x=>x.stage!=='regular').length===counts.postseason,year+' postseason count metadata differs');\n}
assert(careers.managers.length===names.size,'Manager count differs from ledger identities');
for(const manager of careers.managers){
 const actual=names.get(manager.manager);
 assert(!!actual,'Missing ledger manager '+manager.manager);
 if(!actual)continue;
 for(const prop of ['games','w','l','t'])assert(manager.regular[prop]===actual[prop],manager.manager+' career '+prop+' differs: '+manager.regular[prop]+' vs '+actual[prop]);
 const annual=seasons.managerAnnual[manager.manager]||[];
 for(const s of annual){
  const a=actual.annual.get(s.year);
  assert(!!a,manager.manager+' season '+s.year+' absent from ledger');
  if(a)for(const prop of ['games','w','l','t'])assert(s[prop]===a[prop],manager.manager+' '+s.year+' '+prop+' mismatch');
 }
 assert(annual.length===actual.annual.size,manager.manager+' annual season count differs');
}
for(const year of seasons.seasonYears){
 const archived=byYear.get(year)||[];
 const grouped=seasons.bySeason[year];
 assert(!!grouped,'Missing annual weekly view '+year);
 if(!grouped)continue;
 assert(grouped.games.length===archived.length,year+' total games differ: '+grouped.games.length+' vs '+archived.length);
 const regular=archived.filter(x=>x.stage==='regular').length;
 assert(grouped.regularGames===regular,year+' regular count mismatch');
 assert(guide[year]?.games===regular,year+' public season guide game count mismatch');
 const historicalStandings=guide[year]?.standings||[];
 assert(historicalStandings.length===grouped.standings.length,year+' guide standings incomplete');
 for(const s of grouped.standings){
  const g=historicalStandings.find(x=>x.name===s.manager);
  assert(!!g,year+' missing guide franchise '+s.manager);
  if(g)for(const prop of ['w','l','t','games','pf','pa'])assert(g[prop]===s[prop],year+' '+s.manager+' '+prop+' guide mismatch');
 }
}
assert(!Object.values(guide).some(x=>x.standings.some(y=>/Roster [0-9]+ \(prior owner\)/.test(y.name))),'Superseded placeholder appears in season guide');
assert(!names.has('Tom')&&!names.has('Roster 8 (prior owner)'),'Unresolved manager key in canonical ledger');
const total=[...byYear.values()].reduce((n,g)=>n+g.length,0);
if(errors.length){console.error('Ledger projection audit FAILED ('+errors.length+')');for(const error of errors)console.error(' - '+error);process.exit(1)}
console.log('Ledger projection audit PASS: '+names.size+' manager identities, '+total+' archived games and '+seasons.seasonYears.length+' seasons reconciled.');
