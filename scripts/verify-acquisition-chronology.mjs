import fs from 'node:fs';
import assert from 'node:assert/strict';
const report=JSON.parse(fs.readFileSync('data-integrity/faab-acquisition-chronology-v1.json','utf8'));
assert.equal(report.status,'date_level_only_no_free_agent_certification');
assert.deepEqual(report.coverage.map(x=>x.year),[2020,2021,2022,2023,2024,2025,2026]);
const unique=new Set(),counts=new Map();
for(const e of report.events){
 const k=e.year+'|'+e.transactionId;
 assert.ok(!unique.has(k),'Duplicate archived transaction '+k);unique.add(k);
 assert.ok(e.eventType==='add'||e.eventType==='waiver');
 assert.equal(e.exactProcessingOrder,'unknown');
 assert.equal(e.dropInformation,'not_in_acquisition_archive');
 assert.ok(e.date===null||/^\d{4}-\d{2}-\d{2}$/.test(e.date));
 assert.ok(Array.isArray(e.players)&&Array.isArray(e.acquiringTeamIds));
 const day=e.year+'|'+e.date;counts.set(day,(counts.get(day)??0)+1);
}
for(const e of report.events)assert.equal(e.sameDayEventCount,counts.get(e.year+'|'+e.date));
assert.equal(report.coverage.reduce((n,y)=>n+y.events,0),report.events.length);
console.log('Acquisition chronology PASS:',report.events.length,'archived day-level events; no invented order');
