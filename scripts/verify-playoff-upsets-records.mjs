// Zero-browser validation for source-receipted historic playoff upsets.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const d=JSON.parse(execFileSync(process.execPath,['scripts/build-playoff-upsets-records.mjs'],
 {encoding:'utf8',maxBuffer:8*1024*1024}));
assert.equal(d.status,'provisional-not-published');
assert.equal(d.coverage.verifiedChampionshipBracketGames,41);
assert.equal(d.coverage.officialSeeds,10);
assert.equal(d.coverage.seedUpsets,15);
assert.equal(d.coverage.oneSeedEliminations,8);
assert.equal(d.categoryCount,10);
const get=id=>{const c=d.categories.find(x=>x.id===id);assert(c,'Missing category '+id);return c};
function mark(id,value,names){const c=get(id);assert.equal(c.holders[0].value,value,id);
 assert.deepEqual([...new Set(c.holders.map(x=>x.manager))].sort(),names.sort(),id+' holders');return c}
const largest=mark('playoff-upset-largest-seed-gap',5,['Koble']);
assert.equal(largest.holders[0].year,2020);
assert.equal(largest.holders[0].round,'final');
assert.equal(largest.holders[0].evidence.winnerSeed,6);
assert.equal(largest.holders[0].evidence.loserSeed,1);
mark('playoff-upset-largest-semifinal',4,['Birch','Koble','Evans','Mitch']);
mark('playoff-upset-largest-opening',3,['Birch','Mitch']);
mark('playoff-upset-most-career',4,['Thommy']);
mark('playoff-upset-most-top-two',4,['Thommy']);
mark('playoff-elimination-most-one-seeds',3,['Thommy']);
mark('playoff-elimination-most-one-seed-exits',2,['Tony','Mitch']);
const closest=mark('playoff-elimination-narrowest',0.72,['Tony']);
assert.equal(closest.holders[0].year,2025);
assert.equal(closest.holders[0].opponent,'Birch');
const blowout=mark('playoff-elimination-biggest-margin',90.42,['Stilly']);
assert.equal(blowout.holders[0].year,2024);
const topSeed=mark('playoff-elimination-top-seed-closest',7.98,['Mitch']);
assert.equal(topSeed.holders[0].year,2025);
for(const c of d.categories){
 assert(c.holders.length>0&&c.leaders.length>0);
 assert(c.holders.every(x=>x.rank===1));
 for(const x of c.leaders){
  assert(x.manager!=='Tom','Unnormalized Tom identity');
  assert(x.value>0);
  if(x.evidence.twoWeekAggregate!==undefined&&c.id.includes('narrowest'))
   assert(!x.evidence.twoWeekAggregate,'Two-week score marked single-week');
 }
 for(let i=1;i<c.leaders.length;i++){
  assert(c.leaders[i].rank>=c.leaders[i-1].rank);
  if(c.leaders[i].value===c.leaders[i-1].value)
   assert.equal(c.leaders[i].rank,c.leaders[i-1].rank);
 }
}
console.log('PASS: 41 seeded postseason games; 15 seed upsets; 10 categories; source-consistent margins and tied holders.');
