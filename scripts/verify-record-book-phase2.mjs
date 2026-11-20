// Standalone browser-free audit for Phase 2 proposed record categories.
// Run: node scripts/verify-record-book-phase2.mjs
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const result=JSON.parse(execFileSync(process.execPath,['scripts/build-record-book-phase2.mjs'],{encoding:'utf8',maxBuffer:20*1024*1024}));
assert.equal(result.status,'provisional-not-published');
assert.equal(result.categoryCount,23);
assert.equal(result.categories.length,23);
assert.equal(result.coverage.games,705);
assert.equal(result.coverage.weeklyScoringSets,142);
assert.equal(result.coverage.latest2026Week,9);
assert.deepEqual(result.coverage.excludedPartialWeeks,[
 {year:2020,week:14,scoredTeams:8},{year:2021,week:14,scoredTeams:8}
]);
assert.equal(new Set(result.categories.map(c=>c.id)).size,23);
const get=id=>{const category=result.categories.find(c=>c.id===id);assert(category,'Missing '+id);return category};
const leader=(id,name,val,year,week)=>{
 const c=get(id);
 assert(c.holders.length,'No holder: '+id);
 assert.equal(c.holders[0].manager,name,id+' name');
 assert.equal(c.holders[0].value,val,id+' value');
 if(year!==undefined)assert.equal(c.holders[0].year,year,id+' year');
 if(week!==undefined)assert.equal(c.holders[0].week,week,id+' week');
 return c;
};
leader('weekly-highs','Mitch',22);
leader('weekly-lows','Stilly',20);
leader('weekly-runnerups','Tony',19);
leader('top-three-losses','Stilly',8);
leader('bottom-three-wins','Stover',8);
leader('season-weekly-highs','Mitch',5,2025);
leader('season-weekly-lows','Thommy',6,2019);
leader('high-streak','Evans',3,2016);
leader('low-streak','Stew',4,2023);
// Both managers share one combined-score game: reject one-sided portfolio attribution.
for(const manager of ['Mitch','Stew']){
 const c=get('combined-high');
 assert(c.holders.some(x=>x.manager===manager&&x.value===332.62&&x.year===2025&&x.week===10));
}
for(const manager of ['Thommy','Tony']){
 const c=get('combined-low');
 assert(c.holders.some(x=>x.manager===manager&&x.value===119&&x.year===2017&&x.week===1));
}
const closeRivals=get('rival-one-point');
for(const manager of ['Stover','Tony'])
 assert(closeRivals.holders.some(x=>x.manager===manager&&x.value===3&&
  x.opponent===(manager==='Stover'?'Tony':'Stover')));
const rivalry=get('rival-win-run');
assert.equal(rivalry.holders[0].value,6);
assert.equal(new Set(rivalry.holders.map(x=>x.manager+'|'+x.opponent)).size,6);
assert(rivalry.holders.every(x=>x.rank===1),'All six holders should share first rank');
assert(get('combined-low').direction==='low');
assert(get('combined-low').leaders.every(x=>x.value>0),'Combined scores must be positive');
for(const category of result.categories){
 assert(category.leaders.length>0,'No leaders: '+category.id);
 assert(category.leaders.length<=category.count,'Invalid count: '+category.id);
 assert(category.holders.length>0,'No shared holder: '+category.id);
 assert(category.holders.every(x=>x.rank===1),'Unranked co-holder: '+category.id);
 const distinct=new Set(category.leaders.map(x=>JSON.stringify([x.manager,x.year??null,x.week??null,x.opponent??null,x.value,x.evidence])));
 assert.equal(distinct.size,category.leaders.length,'Duplicate ranked event: '+category.id);
 const dir=category.direction==='low'?1:-1;
 for(let i=1;i<category.leaders.length;i++){
  assert(dir*(category.leaders[i].value-category.leaders[i-1].value)>=0,'Leaderboard out of order: '+category.id);
  assert(category.leaders[i].rank>=category.leaders[i-1].rank,'Bad rank order: '+category.id);
  if(category.leaders[i].value===category.leaders[i-1].value)
   assert.equal(category.leaders[i].rank,category.leaders[i-1].rank,'Competition tie mismatch: '+category.id);
 }
 if(category.scope==='Completed season'){
  assert(!category.leaders.some(x=>x.year===2026),'Incomplete 2026 in completed-season record: '+category.id);
 }
}
console.log('PASS Phase 2: 23 deterministic provisional categories; 705 games; 142 scored weeks; tie, source and ranking guards.');
