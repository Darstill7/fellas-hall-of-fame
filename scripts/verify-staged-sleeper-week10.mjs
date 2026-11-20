// Independent Week 10 final-score reconciliation, with no writes to canonical data.
// Usage: node scripts/verify-staged-sleeper-week10.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ledger=read('data/unified_record_book_2016_2026.json');
const candidate=read('data-integrity/sleeper-sync-candidates/2026-week10.json');
const receipt=read('data-integrity/sleeper-sync-candidates/2026-week10-standings-receipt.json');
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
assert.equal(candidate.status,'REVIEW_REQUIRED');
assert.equal(candidate.league,'1340027406009761792');
assert.equal(receipt.league,candidate.league);
assert.equal(candidate.week,10);
assert.equal(receipt.throughWeek,10);
assert.equal(candidate.matchupCount,5);
assert.equal(candidate.games.length,5);
const prior=ledger.games.filter(g=>g.year===2026&&g.stage==='regular');
assert.equal(prior.length,45,'45 canonical 2026 regular games through Week 9 expected');
assert.equal(Math.max(...prior.map(g=>g.week)),9);
for(const week of Array.from({length:9},(_,i)=>i+1))
 assert.equal(prior.filter(g=>g.week===week).length,5,'Prior week '+week+' incomplete');
const rosterNames=new Map(Object.entries(receipt.rosterManagerMap).map(([id,name])=>[+id,name]));
assert.equal(rosterNames.size,10);
assert.equal(new Set(rosterNames.values()).size,10);
const expectedNames=new Set(rosterNames.values());
const seen=new Set();
for(const game of candidate.games){
 assert.equal(game.year,2026);
 assert.equal(game.week,10);
 assert.equal(game.stage,'regular');
 assert.equal(game.era,'Sleeper');
 assert.equal(game.source,'sleeper_api_staged_week_10');
 assert.notEqual(game.home,game.away);
 for(const who of [game.home,game.away]){
  assert(expectedNames.has(who),'Unknown manager '+who);
  assert(!seen.has(who),'Duplicate Week 10 manager '+who);
  seen.add(who);
 }
 for(const p of [game.homeScore,game.awayScore])
  assert(Number.isFinite(p)&&p>=0&&p===round(p),'Invalid score '+p);
 assert.equal(game.winner,game.homeScore>game.awayScore?'HOME':game.homeScore<game.awayScore?'AWAY':'TIE');
 assert.equal(game.margin,round(Math.abs(game.homeScore-game.awayScore)));
}
assert.equal(seen.size,10);
const stats=new Map([...expectedNames].map(manager=>[manager,{manager,wins:0,losses:0,ties:0,pointsFor:0,pointsAgainst:0}]));
for(const game of [...prior,...candidate.games]){
 for(const [name,points,against] of [[game.home,game.homeScore,game.awayScore],[game.away,game.awayScore,game.homeScore]]){
  const row=stats.get(name);assert(row,'Unrecognized manager '+name);
  row.pointsFor=round(row.pointsFor+points);
  row.pointsAgainst=round(row.pointsAgainst+against);
  if(points>against)row.wins++;
  else if(points<against)row.losses++;
  else row.ties++;
 }
}
assert.equal(receipt.standings.length,10);
const receivedIds=new Set();
for(const row of receipt.standings){
 assert(!receivedIds.has(row.rosterId),'Duplicate roster ID');
 receivedIds.add(row.rosterId);
 const manager=rosterNames.get(row.rosterId);
 assert(manager,'Unknown Sleeper roster '+row.rosterId);
 const got=stats.get(manager);
 assert.equal(got.wins,row.wins,manager+' wins disagree with Sleeper standings');
 assert.equal(got.losses,row.losses,manager+' losses disagree with Sleeper standings');
 assert.equal(got.ties,0,manager+' unexpected tie');
 assert.equal(got.pointsFor,row.pointsFor,manager+' point total disagrees with Sleeper standings');
 assert.equal(got.wins+got.losses+got.ties,10,manager+' does not have 10 completed games');
}
console.log('PASS: Week 10 staged five final pairs, all ten owners, scores and outcomes; independent Sleeper 10-week standings match 10/10 owners. Canonical source files untouched.');
