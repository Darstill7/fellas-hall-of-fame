// Independently reconcile recovered Sleeper Week 14 provider pairings with legacy weekly scores.
// Matchup IDs are not reliable bracket labels: only match independently proven winners fixtures.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const source=json('data/provider_week14_2020_2021_pairing_recovery_v1.json');
const weekly=json('data/season_weekly_matchups_2016_2026_v1.json').bySeason;
const recovered=json('data/recovered_winners_bracket_2020_2021_v1.json').records;
const brackets=json('data/verified_sleeper_playoff_brackets_2020_2025.json').seasons;
const projection=json('data/corrected_2020_2021_regular_standings_projection_v1.json');
assert.equal(source.schema,'fellas-provider-week14-2020-2021-pairing-recovery-v1');
assert.equal(source.years.length,2);
let pairings=0,proven=0,unproven=0;
for(const y of source.years){
 const b=brackets.find(x=>x.year===y.year),legacy=weekly[y.year];
 assert(b&&legacy);
 assert.equal(y.pairs.length,4);
 assert.equal(y.byes.length,2);
 const identity=new Set();
 for(const pairing of y.pairs){
  const g=legacy.games.find(x=>x.week===14&&x.home===pairing.home&&x.away===pairing.away);
  assert(g,'Missing original Week 14 matchup '+y.year);
  assert.equal(g.stage,'regular','Current source classification unexpectedly changed; update audit first');
  assert.equal(g.homeScore,pairing.homeScore);assert.equal(g.awayScore,pairing.awayScore);
  identity.add(pairing.home);identity.add(pairing.away);
  const receipt=recovered.find(x=>x.year===y.year&&x.round==='opening'&&
   ((x.winner===pairing.home&&x.loser===pairing.away)||(x.winner===pairing.away&&x.loser===pairing.home)));
  if(pairing.stageProvenance==='independently_verified_winners_bracket'){
   assert(receipt,'Confirmed winner fixture lacks bracket receipt');
   assert(!b.byes.includes(pairing.home)&&!b.byes.includes(pairing.away));
   proven++;
  }else{
   assert(!receipt,'Nonwinners pairing actually belongs to verified winners bracket');
   assert(pairing.stageProvenance.includes('inferred_not_proven_by_group_id_alone'));
   unproven++;
  }
  pairings++;
 }
 for(const singleton of y.byes){
  assert(b.byes.includes(singleton.manager),'Singleton disagrees with bracket verified bye');
  identity.add(singleton.manager);
 }
 assert.equal(identity.size,10,'Week 14 unique active teams plus singletons must cover league');
 assert.deepEqual(legacy.games.filter(x=>x.stage==='regular'&&x.week===14).length,4);
 assert(projection.years.some(x=>x.year===y.year&&x.reclassifiedWeek14Games===4));
}
assert.equal(pairings,8);assert.equal(proven,4);assert.equal(unproven,4);
console.log('PASS original Sleeper Week 14 pairings: 8 H2H, 4 independently verified winners games, 4 nonwinner games with bracket-classification caveat, 4 verified first-round singleton byes.');
