// Historical evidence guard: closed-season record values must agree with the independently reviewed archive.
// Streaks may advance when a new week is approved, so their old archive is a floor, not a frozen ceiling.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const data=JSON.parse(fs.readFileSync('data/ledger_milestones_live_v1.json','utf8'));
const archive=JSON.parse(fs.readFileSync('data/expanded_records_verified_v1.json','utf8'));
const found=new Map(data.records.map(r=>[r.key,r]));
const known=new Map(archive.categories.map(c=>[c.key,c]));
const cases=[
 ['season-points','season-points'],['season-wins','season-wins'],
 ['season-differential','season-point-diff'],['season-140-club','season-140-club']
];
for(const [freshKey,archivedKey] of cases){
 const fresh=found.get(freshKey),prior=known.get(archivedKey);
 assert(fresh&&prior,'Missing completed-season category '+freshKey);
 assert.equal(fresh.value,prior.leaders[0].value,'Historical completed-season record drift '+freshKey);
 assert(fresh.holders.every(h=>h.year<=2025),'Unfinished 2026 season won a completed-season record');
}
for(const key of ['winning-streak','scoring-streak-100','scoring-streak-120']){
 const r=found.get(key),old=known.get(key);
 assert(r&&old,'Missing streak category '+key);
 assert(r.value>=old.leaders[0].value,'Regressed below published historical streak '+key);
 assert(r.holders.every(h=>Number.isInteger(h.endingWeek)&&Number.isInteger(h.endingYear)));
}
assert.equal(data.records.length,7);
console.log('PASS: 4 completed-season records match independently reviewed archive; 3 documented streaks preserve historical floors.');
