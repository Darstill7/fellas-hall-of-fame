import fs from 'node:fs';import assert from 'node:assert/strict';
const x=JSON.parse(fs.readFileSync('data-integrity/sleeper-season-rule-matrix-2020-2026.json','utf8'));
assert.deepEqual(x.seasons.map(s=>s.year),[2020,2021,2022,2023,2024,2025,2026]);
const leagues=new Set();
for(const s of x.seasons){
 assert.ok(!leagues.has(s.leagueId),'Duplicated season league ID');leagues.add(s.leagueId);
 assert.equal(s.totalRosters,10);assert.equal(s.rosterPositions.length,15);
 assert.equal(s.rosterPositions.filter(p=>p==='FLEX').length,2);
 assert.equal(s.receptionPoints,.5);
 assert.equal(s.maxKeepers,s.year<=2022?1:2);
 assert.equal(s.keepersEnabled,s.year>=2023,'Keeper participation must begin in 2023');
 assert.ok(s.keeperParticipationSource.includes('no keepers before 2023'));
 assert.equal(s.tradeDeadlineWeek,s.year<=2022?10:11);
 assert.equal(s.reserveSlots,s.year===2020?4:1);
 for(const name of ['waiverProcessingTime','waiverTieBreaker','startingFaabBudget','freeAgentClaimEligibility'])
  assert.equal(s[name],null,'No unsourced waiver configuration permitted: '+s.year+'/'+name);
}
assert.equal(x.seasons.find(s=>s.year===2023).pickTrading,true);
console.log('Historical league rules PASS: seven provider-backed seasons; waiver eligibility not inferred');
