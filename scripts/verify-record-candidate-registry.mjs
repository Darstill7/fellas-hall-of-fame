// Deliberately small, fast, browser-free research gate. Provisional records remain unpublished.
// Run: node scripts/verify-record-candidate-registry.mjs
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const data=JSON.parse(execFileSync(process.execPath,['scripts/build-record-candidate-registry.mjs'],{encoding:'utf8',maxBuffer:15*1024*1024}));
assert.equal(data.status,'provisional-not-published');
assert.equal(data.categoryCount,11);
assert.equal(data.coverage.regularGames,705);
assert.equal(data.coverage.qualifiedWeeklySets,142);
assert.deepEqual(data.coverage.excludedWeeklySets.map(x=>[x.year,x.week,x.scoredParticipants]),[[2020,14,8],[2021,14,8]]);
const category=id=>{
 const c=data.categories.find(x=>x.id===id);
 assert(c,'Missing category '+id);
 assert(c.leaders.length>=1,'Empty leaderboard '+id);
 assert(c.holders.length>=1,'No record holders '+id);
 assert(c.holders.every(h=>h.rank===1),'Missing tied holder in '+id);
 assert(c.leaders.every(h=>Number.isFinite(h.value)&&Number.isInteger(h.rank)&&h.rank>=1));
 return c;
};
const leader=(id,expected,value)=>{
 const c=category(id);
 assert.equal(c.holders[0].manager,expected,id+' leader');
 assert.equal(c.holders[0].value,value,id+' value');
};
leader('weekly-highs-career','Mitch',22);
leader('weekly-lows-career','Stilly',20);
leader('weekly-seconds-career','Tony',19);
leader('top-three-scoring-losses','Stilly',8);
leader('bottom-three-scoring-wins','Stover',8);
leader('weekly-highs-season','Mitch',5);
assert.equal(category('weekly-highs-season').holders[0].year,2025);
leader('weekly-lows-season','Thommy',6);
assert.equal(category('weekly-lows-season').holders[0].year,2019);
leader('weekly-high-streak','Evans',3);
leader('weekly-low-streak','Stew',4);
const rival=category('rivalry-consecutive-meeting-wins');
assert.equal(rival.holders[0].value,6);
const unique= new Set(rival.holders.map(x=>x.manager+'|'+x.opponent));
assert.equal(unique.size,6,'Six different six-meeting rival winning runs expected');
const combined=category('combined-matchup-points');
assert.equal(combined.holders[0].value,332.62);
assert.equal(combined.holders[0].year,2025);
assert.equal(combined.holders[0].week,10);
assert(new Set(data.categories.map(c=>c.id)).size===11);
assert(data.managerIndex.Mitch?.some(e=>e.categoryId==='weekly-highs-career'&&e.rank===1));
assert(data.managerIndex.Stilly?.some(e=>e.categoryId==='weekly-lows-career'&&e.rank===1));
assert(!data.categories.some(c=>c.scope==='completed-season'&&c.leaders.some(x=>x.year===2026)));
console.log('PASS: provisional registry 11 categories, 705 games, 142 complete scored weeks, evidence-backed shared holders and manager indexing.');
