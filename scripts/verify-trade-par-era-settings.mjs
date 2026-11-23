// Verify year-specific Sleeper scoring/roster settings and playoff cutoffs.
// Neither data here nor roster presence defines a fantasy replacement baseline.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const source=read('data/trade_par_era_lineup_settings_2020_2025_v1.json');
const bracket=read('data/playoff_explorer_verified_2016_2025_v1.json');
assert.equal(source.schema,'fellas-trade-par-era-lineup-and-scoring-source-v1');
assert.equal(source.status,'source_checked_not_a_replacement_benchmark');
assert.deepEqual(source.seasons.map(s=>s.year),[2020,2021,2022,2023,2024,2025]);
const expectedSlots=['QB','RB','RB','WR','WR','TE','FLEX','FLEX','DEF'];
const expectedFlex=['RB','WR','TE'];
for(const s of source.seasons){
 assert.ok(/^\d+$/.test(s.sleeperLeagueId),'Historical Sleeper league ID must be stable numeric identifier');
 assert.deepEqual(s.startingSlots,expectedSlots,'Historical lineup slots changed; confirm new rules before PAR modeling');
 assert.equal(s.benchSlots,6);
 assert.deepEqual(s.flexEligiblePositions,expectedFlex);
 assert.equal(s.pointsPerReception,.5,'League half-PPR format changed');
 assert.equal(s.pointsPerReceivingYard,.1);
 assert.equal(s.pointsPerPassingYard,.04);
 const b=bracket.seasons.find(x=>x.year===s.year);
 assert.ok(b,'Missing verified playoff bracket');
 const rounds=b.matches.filter(m=>m.round==='opening');
 assert.equal(rounds.length,2,'Missing opening-round playoff matchups');
 assert.equal(s.firstWinnersBracketWeek,Math.min(...rounds.map(m=>m.week)),'Recorded first playoff week conflicts with original verified fixtures');
 assert.equal(s.confirmedRegularSeasonWeeks,'1–'+(s.firstWinnersBracketWeek-1));
}
assert.equal(source.seasons.filter(x=>x.firstWinnersBracketWeek===14).length,2,'2020–21 begin postseason Week14');
assert.equal(source.seasons.filter(x=>x.firstWinnersBracketWeek===15).length,4,'2022–25 begin postseason Week15');
console.log('PASS: six seasons' + ' — half PPR; one QB/two RB/two WR/one TE/two FLEX/one DEF; verified playoff starts 2020–2021 Week14 and 2022–2025 Week15. These settings are not a validated PAR replacement calculation.');
if(process.argv.includes('--github-summary')&&process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n### Historical league scoring/lineup constraints\n\n2020–2025: half-PPR, QB/RB/RB/WR/WR/TE/FLEX/FLEX/DEF and six benches; Week 14 postseason begins 2020–2021 and Week 15 thereafter. This is **not** a source-approved replacement benchmark.\n');
