// Fail closed on missing coverage, duplicate claims, or inflated FAAB outcome arithmetic.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const d=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
const s=read('data-integrity/faab-observed-team-season-summary-v1.json');
const b=read('data-integrity/faab-bench-relative-opportunity-v1.json');
assert.equal(d.status,'research_only_not_causal_or_skill_grade');
assert.equal(s.status,'descriptive_only_not_manager_grade');
assert.equal(b.status,'research_only_not_replacement_value_or_skill');
assert.deepEqual(d.coverage.map(x=>x.year),[2020,2021,2022,2023,2024,2025,2026]);
const round=x=>Math.round((x+Number.EPSILON)*100)/100;
const ids=new Set();const group=new Map();
for(const x of d.observations){
 const id=[x.year,x.transactionId,x.teamId,x.playerId].join('|');
 assert.ok(!ids.has(id),'Duplicate claim/player observation '+id);ids.add(id);
 assert.ok(x.weeks.every(w=>w.week>x.claimWeek),'Acquisition-week leakage '+id);
 assert.ok(x.weeks.every(w=>Number.isFinite(w.points)&&typeof w.started==='boolean'),'Bad observed week '+id);
 assert.equal(x.observedWeeks,x.weeks.length);
 assert.equal(x.startedWeeks,x.weeks.filter(w=>w.started).length);
 assert.ok(Math.abs(x.rosteredPoints-round(x.weeks.reduce((n,w)=>n+w.points,0)))<.011,'Roster point mismatch '+id);
 assert.ok(Math.abs(x.startedPoints-round(x.weeks.filter(w=>w.started).reduce((n,w)=>n+w.points,0)))<.011,'Started point mismatch '+id);
 const key=x.year+'|'+x.teamId;
 const a=group.get(key)??{count:0,points:0,started:0};
 a.count++;a.points+=x.rosteredPoints;a.started+=x.startedPoints;group.set(key,a);
}
for(const row of s.rows){
 const key=row.year+'|'+row.teamId,calc=group.get(key);
 assert.ok(calc,'Summary row absent from detail '+key);
 assert.equal(row.observedPlayerClaims,calc.count,'Claim count mismatch '+key);
 assert.ok(Math.abs(row.observedRosteredPoints-round(calc.points))<.011,'Rostered points mismatch '+key);
 assert.ok(Math.abs(row.observedStartedPoints-round(calc.started))<.011,'Started points mismatch '+key);
 group.delete(key);
}
assert.equal(group.size,0,'Missing team summary rows');
assert.equal(b.results.length,d.observations.length,'Bench detail count mismatch');
for(let i=0;i<b.results.length;i++){
 const x=b.results[i],source=d.observations[i];
 assert.equal([x.year,x.transactionId,x.teamId,x.playerId].join('|'),[source.year,source.transactionId,source.teamId,source.playerId].join('|'));
 assert.ok(x.comparableStarts<=source.startedWeeks,'Bench comparisons exceed observed starts');
 for(const w of x.comparisons){
  assert.ok(source.weeks.some(y=>y.week===w.week&&y.started),'Bench comparison not in started week');
  assert.ok(Math.abs(w.advantage-round(w.starterPoints-w.benchAlternativePoints))<.011,'Bench advantage mismatch');
 }
}
console.log('FAAB outcomes reconciled:',d.observations.length,'player-claim rows;',s.rows.length,'team seasons;',b.coverage.comparableStarts,'bench comparisons; NO SKILL GRADE');
