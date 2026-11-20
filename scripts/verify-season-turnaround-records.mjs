// Browser-free independent contract test for historical comeback record candidates.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const d=JSON.parse(execFileSync(process.execPath,['scripts/build-season-turnaround-records.mjs'],
 {encoding:'utf8',maxBuffer:12*1024*1024}));
assert.equal(d.schema,'fellas-turnaround-playoff-resilience-v1');
assert.equal(d.status,'provisional-not-published');
assert.equal(d.coverage.teamSeasons,98);
assert.equal(d.categoryCount,14);
assert.equal(new Set(d.categories.map(c=>c.id)).size,14);
const cat=id=>{const result=d.categories.find(x=>x.id===id);assert(result,'Missing category '+id);return result};
function holders(id,value,expectedNames){
 const c=cat(id);
 assert.equal(c.holders[0].value,value,'Record mark: '+id);
 assert.deepEqual([...new Set(c.holders.map(h=>h.manager))].sort(),[...expectedNames].sort(),'Co-holders: '+id);
 assert(c.holders.every(h=>h.rank===1));
}
holders('turnaround-largest-half-swing',8,['Koble','Stilly','Stew']);
holders('turnaround-largest-half-swing-playoff',8,['Stilly','Stew']);
holders('turnaround-largest-half-swing-finalist',8,['Stilly']);
holders('turnaround-deepest-hole-playoff',5,['Thommy','Stew']);
holders('turnaround-deepest-hole-finalist',4,['Evans','Stilly']);
holders('turnaround-deepest-hole-champion',4,['Stilly']);
holders('turnaround-loss-streak-playoff',5,['Stew']);
holders('turnaround-win-streak-finalist',7,['Mitch']);
holders('turnaround-most-late-half-wins-playoff',7,['Mitch']);
holders('turnaround-perfect-second-half-playoff',7,['Mitch']);
holders('turnaround-last-four-wins-champion',4,['Birch','Stilly']);
holders('turnaround-last-four-losses-finalist',4,['Thommy']);
holders('turnaround-wins-after-low-point-champion',8,['Stilly']);
const finals=cat('turnaround-most-late-half-wins-finalist');
assert.equal(finals.holders[0].value,6);
assert(new Set(finals.holders.map(h=>h.manager)).has('Stilly'));
for(const c of d.categories){
 assert(c.holders.length&&c.leaders.length,'Missing record entries '+c.id);
 assert(c.holders.every(h=>h.rank===1),'Incorrect shared rank '+c.id);
 for(const h of c.leaders){
  assert(h.year<=2025&&h.year>=2016,'Incomplete season leak '+c.id);
  assert(h.manager!=='Tom','Incorrect current historical manager identity');
  assert(h.evidence.first.throughWeek===Math.floor(h.year<=2017?(h.year===2017?12:13)/2:h.year<=2019?13/2:14/2),
   'League-calendar midpoint error '+c.id);
  assert(h.evidence.first.w+h.evidence.second.w===h.evidence.final.w,'Wins inconsistent '+c.id);
  assert(h.evidence.first.l+h.evidence.second.l===h.evidence.final.l,'Losses inconsistent '+c.id);
 }
 for(let i=1;i<c.leaders.length;i++){
  assert(c.leaders[i].value<=c.leaders[i-1].value,'Out-of-order scoring '+c.id);
  if(c.leaders[i].value===c.leaders[i-1].value)
   assert.equal(c.leaders[i].rank,c.leaders[i-1].rank,'Co-holder rank mismatch '+c.id);
 }
}
assert(cat('turnaround-deepest-hole-playoff').overlap,'Must disclose already published deep-hole definition');
assert(cat('turnaround-deepest-hole-champion').overlap,'Must disclose already published champion deep-hole definition');
const low=cat('turnaround-largest-half-swing').holders;
const Koble=low.find(h=>h.manager==='Koble'&&h.year===2022);
assert(Koble);assert.equal(Koble.evidence.first.w,1);assert.equal(Koble.evidence.first.l,6);
assert.equal(Koble.evidence.second.w,5);assert.equal(Koble.evidence.second.l,2);
console.log('PASS: 14 comeback and playoff-resilience categories, 98 completed manager-seasons, tied co-holders and midpoint audit.');
