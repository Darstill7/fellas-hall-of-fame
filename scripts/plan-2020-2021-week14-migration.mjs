// 2020–2021 Week 14 canonical correction preflight. Read-only.
// Run: node scripts/plan-2020-2021-week14-migration.mjs
// Optional: --check (assert stored audit parity); --json (print detailed patch).
import fs from 'node:fs';
import assert from 'node:assert/strict';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ledger=load('data/unified_record_book_2016_2026.json');
const weekly=load('data/season_weekly_matchups_2016_2026_v1.json');
const recovered=load('data/recovered_winners_bracket_2020_2021_v1.json').records;
const source=load('data/provider_week14_2020_2021_pairing_recovery_v1.json').years;
const standings=load('data/corrected_2020_2021_regular_standings_projection_v1.json').years;
const careers=load('data/week14_2020_2021_career_record_impact_v1.json');
const scoreKey=g=>[g.year,g.week,g.home,g.away,g.homeScore,g.awayScore].join('|');
const round=n=>Number(n.toFixed(2));
const proposed=[],notes=[];
for(const year of [2020,2021]){
 const yearSource=source.find(x=>x.year===year);
 assert(yearSource);
 const old=ledger.games.filter(x=>x.year===year&&x.week===14&&x.stage==='regular');
 const weeklyOld=weekly.bySeason[year].games.filter(x=>x.week===14&&x.stage==='regular');
 const projected=standings.find(x=>x.year===year);
 assert.equal(old.length,4);assert.equal(weeklyOld.length,4);
 assert.equal(projected.regularSeasonGames,65);
 const legacySet=new Set(weeklyOld.map(x=>scoreKey({...x,year})));
 assert(old.every(x=>legacySet.has(scoreKey(x))),'Weekly ledger and unified records disagree');
 for(const game of old){
  const pair=yearSource.pairs.find(x=>x.home===game.home&&x.away===game.away);
  assert(pair&&pair.homeScore===game.homeScore&&pair.awayScore===game.awayScore,'Original Sleeper pairing mismatch');
  const receipt=recovered.find(x=>x.year===year&&x.week===14&&
   ((x.winner===game.home&&x.loser===game.away)||(x.winner===game.away&&x.loser===game.home)));
  const stage=receipt?'championship_bracket':'postseason_unclassified';
  if(receipt){
   assert.equal(pair.stageProvenance,'independently_verified_winners_bracket');
   assert.equal(receipt.winningMargin,round(Math.abs(game.homeScore-game.awayScore)));
  }else{
   assert(pair.stageProvenance.includes('consolation_inferred_not_proven'),'Nonwinners provenance unexpectedly changed');
   notes.push(year+' Week 14 '+game.home+' vs '+game.away+': lower-bracket pairing; safe stage is postseason_unclassified, not assumed consolation.');
  }
  proposed.push({year,week:14,home:game.home,away:game.away,
   homeScore:game.homeScore,awayScore:game.awayScore,from:'regular',to:stage,
   provenance:receipt?'verified_sleeper_winners_bracket':'verified_non_winners_pairing_exact_round_unknown',
   key:scoreKey(game)});
 }
 assert.equal(projected.rows.length,10);
 assert(projected.rows.every(x=>x.corrected.games===13));
}
assert.equal(proposed.length,8);
assert.equal(proposed.filter(x=>x.to==='championship_bracket').length,4);
assert.equal(proposed.filter(x=>x.to==='postseason_unclassified').length,4);
assert.equal(new Set(proposed.map(x=>x.key)).size,8);
assert.equal(careers.summary.impactedManagers,9);
assert.equal(careers.summary.totalRemovedWinCredits,8);
assert.equal(careers.summary.totalRemovedLossCredits,8);
// Simulate paired source updates in memory and verify their invariants before touching data files.
const simulatedLedger=structuredClone(ledger);
const simulatedWeekly=structuredClone(weekly);
for(const change of proposed){
 const original=simulatedLedger.games.filter(x=>scoreKey(x)===change.key&&x.stage==='regular');
 const annual=simulatedWeekly.bySeason[change.year].games.filter(x=>scoreKey({...x,year:change.year})===change.key&&x.stage==='regular');
 assert.equal(original.length,1,'Unified ledger target not unique '+change.key);
 assert.equal(annual.length,1,'Annual ledger target not unique '+change.key);
 original[0].stage=change.to;annual[0].stage=change.to;
}
for(const year of [2020,2021]){
 const annual=simulatedWeekly.bySeason[year];
 simulatedLedger.counts[year].regular=simulatedLedger.games.filter(g=>g.year===year&&g.stage==='regular').length;
 simulatedLedger.counts[year].postseason=simulatedLedger.games.filter(g=>g.year===year&&g.stage!=='regular').length;
 annual.regularGames=annual.games.filter(g=>g.stage==='regular').length;
 annual.postseasonGames=annual.games.filter(g=>g.stage!=='regular').length;
 assert.equal(simulatedLedger.counts[year].regular,65);
 assert.equal(annual.regularGames,65);
 assert.equal(simulatedLedger.counts[year].regular,annual.regularGames);
 assert.equal(simulatedLedger.counts[year].postseason,annual.postseasonGames);
 const expected=standings.find(x=>x.year===year);
 for(const x of expected.rows){
  const row=annual.standings.find(r=>r.manager===x.manager);
  assert(row,'Annual standings manager missing '+year+' '+x.manager);
  for(const field of ['games','w','l','t','pf','pa'])row[field]=x.corrected[field];
  const managerYear=simulatedWeekly.managerAnnual[x.manager]?.find(y=>y.year===year);
  assert(managerYear,'Manager annual record missing '+year+' '+x.manager);
  for(const field of ['games','w','l','t','pf','pa'])if(field in managerYear)managerYear[field]=x.corrected[field];
 }
 assert.equal(annual.standings.filter(x=>x.games!==13).length,0);
 assert.equal(annual.games.length,weekly.bySeason[year].games.length,'No games may be dropped during migration');
}
assert.deepEqual(simulatedLedger.games.map(g=>scoreKey(g)),ledger.games.map(g=>scoreKey(g)),'No game score, manager or week may be modified');
assert.deepEqual(simulatedWeekly.seasonYears,weekly.seasonYears,'Season coverage may not change');
const before=ledger.games.filter(x=>[2020,2021].includes(x.year)&&x.stage==='regular').length;
const after=before-proposed.length;
assert.equal(before,138);assert.equal(after,130);
const plan={schema:'fellas-2020-2021-week14-canonical-migration-plan-v1',
 status:'preflight_passed_source_mutation_not_applied',
 regularGamesBefore:before,regularGamesAfter:after,
 changed:proposed,
 managerSeasonChanges:careers.summary.totalRemovedManagerGameCredits,
 impactedManagers:careers.summary.impactedManagers,
 postseasonStageClassification:{verifiedWinners:4,lowerBracketUnclassified:4},
 sourceDataToRegenerate:['data/unified_record_book_2016_2026.json','data/season_weekly_matchups_2016_2026_v1.json'],
 dependentRecordsToRegenerate:[
  'data/manager_record_books_2016_2026.json','data/career_core_generated.json',
  'data/season_guide.json','data/league.json','data/postseason_records_verified_v1.json',
  'analytics/records.html','analytics/records-archive.html',
  'manager profile fallbacks, streaks, rivalries and historical story references'
 ],
 controls:['Preserve all game scores, participants, weeks and source receipts.',
  'Do not infer consolation from Sleeper matchup group IDs.',
  'Recompute all generated regular-season totals, head-to-head records and embedded fallbacks together.',
  'Reconcile separate PF discrepancies before altering the already-correct 2020–2021 season pages.',
  'Require strict canonical CI, independent visual CI, browser tests and Pages deployment before merging.'],
 notes};
if(process.argv.includes('--json'))console.log(JSON.stringify(plan,null,2));
else console.log('Week 14 migration preflight PASS: '+proposed.length+' source games identified; '+before+' -> '+after+' regular games (2020+2021); 4 verified championship, 4 lower-bracket unclassified; '+plan.impactedManagers+' careers affected. No files mutated.');
