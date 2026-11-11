// Research-only postseason record generator contract.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const d=JSON.parse(execFileSync(process.execPath,['scripts/build-postseason-phase3-candidates.mjs'],{encoding:'utf8',maxBuffer:6*1024*1024}));
assert.equal(d.status,'provisional-not-published');
assert.equal(d.categoryCount,8);
assert.equal(new Set(d.categories.map(c=>c.id)).size,8);
const lookup=id=>{const c=d.categories.find(x=>x.id===id);assert(c);return c};
function champion(id,manager,value){
 const c=lookup(id);
 assert.equal(c.holders[0].manager,manager,id+' holder');
 assert.equal(c.holders[0].value,value,id+' mark');
 assert(c.holders.every(x=>x.rank===1));
}
champion('postseason-consecutive-finals','Thommy',3);
champion('postseason-consecutive-semifinals','Birch',4);
champion('postseason-consecutive-byes','Birch',3);
champion('postseason-final-conversion','Thommy',71.429);
champion('postseason-title-conversion','Thommy',57.143);
const byeNoFinal=lookup('postseason-byes-no-final');
assert.equal(byeNoFinal.holders[0].value,2);
assert.deepEqual(new Set(byeNoFinal.holders.map(x=>x.manager)),new Set(['Birch','Stover','Tony']));
const finalsNoBye=lookup('postseason-finals-without-bye');
assert.equal(finalsNoBye.holders[0].value,2);
assert.deepEqual(new Set(finalsNoBye.holders.map(x=>x.manager)),new Set(['Stilly','Thommy']));
const semifinalsNoFinal=lookup('postseason-semis-no-final');
assert.equal(semifinalsNoFinal.holders[0].value,3);
assert.deepEqual(new Set(semifinalsNoFinal.holders.map(x=>x.manager)),
 new Set(['Birch','Evans','Mitch','Stover','Tony']));
for(const c of d.categories){
 assert(c.leaders.length&&c.holders.length);
 assert(c.holders.every(x=>x.rank===1),'Incorrect tie rank '+c.id);
 assert(!c.leaders.some(x=>x.manager==='Tom'),'Legacy alias leaked '+c.id);
 for(let i=1;i<c.leaders.length;i++){
  assert(c.leaders[i].value<=c.leaders[i-1].value,'Out-of-order values '+c.id);
  if(c.leaders[i].value===c.leaders[i-1].value)
   assert.equal(c.leaders[i].rank,c.leaders[i-1].rank,'Broken tie '+c.id);
 }
}
console.log('PASS: eight postseason research categories; verified bracket source; era-aware byes and ownership; all tied leaders.');
