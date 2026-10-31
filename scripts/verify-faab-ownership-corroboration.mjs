import fs from 'node:fs';
import assert from 'node:assert/strict';
const d=JSON.parse(fs.readFileSync('data-integrity/faab-ownership-weekly-corroboration-v1.json','utf8'));
assert.equal(d.status,'research_only_no_transaction_time_certification');
assert.deepEqual(d.coverage.map(x=>x.year),[2020,2021,2022,2023,2024,2025,2026]);
let n=0;const keys=new Set();
for(const x of d.observations){
 assert.equal(x.ownershipCertified,false);
 assert.ok(x.week>=1&&x.year>=2020&&x.year<=2026);
 assert.ok(['observed_same_team','different_team_observed','not_observed_on_scored_roster'].includes(x.observation));
 const key=[x.year,x.week,x.playerId].join('|');
 assert.ok(!keys.has(key),'Duplicate weekly ownership observation '+key);keys.add(key);n++;
}
assert.equal(d.coverage.reduce((s,x)=>s+x.matchingObservations+x.differentTeamObservations+x.notObserved,0),n);
console.log('Weekly ownership research corroboration PASS:',n,'observations, no certified availability');
