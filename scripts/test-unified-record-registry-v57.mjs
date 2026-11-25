import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildLegacyRecords} from './legacy-record-definitions-v57.mjs';

const read = file => JSON.parse(readFileSync(file, 'utf8'));
const inputs = {
  ledger:read('data/unified_record_book_2016_2026.json'),
  weekly:read('data/season_weekly_matchups_2016_2026_v1.json'),
  archive:read('data/manager_record_books_2016_2026.json'),
  placements:read('data/fellas_final_placements_2016_2025_verified.json'),
  catalog:read('data/expanded_records_verified_v1.json')
};
const registry = read('data-integrity/unified-record-registry-v57.json');
assert.equal(registry.status, 'legacy-reviewed-candidate-registry');
assert.equal(registry.asOf, inputs.ledger.updated);
assert.deepEqual(registry.legacyReview.mappings.map(row => row.legacyId),
  inputs.catalog.categories.map(category => category.key));
assert.equal(registry.legacyReview.mappings.filter(row => row.decision === 'alias').length, 20);
assert.equal(registry.legacyReview.mappings.filter(row => row.decision === 'integrated').length, 24);
const records = new Map(registry.records.map(record => [record.id, record]));
assert.equal(records.size, registry.categoryCount);

const threshold = (id, owner) => records.get('legacy:' + id).holders.find(row => row.ownerId === owner);
const mitch = records.get('legacy:win-rate').holders[0].evidence[0];
assert.ok(mitch.games >= 60);
assert.equal(records.get('legacy:win-rate').value,
  Number((100 * (mitch.wins + mitch.ties / 2) / mitch.games).toFixed(2)));
const centuryHolder = records.get('legacy:hundred-club').holders[0].ownerId;
const hundred = threshold('hundred-club', centuryHolder).evidence[0];
assert.equal(hundred.count, hundred.matchups.length);
assert.ok(hundred.matchups.every(game => game.points >= 100));
const exact = structuredClone(inputs);
const receipt = hundred.matchups.find(game => game.points > 100);
const changed = exact.ledger.games.find(game => game.stage === 'regular' && game.year === receipt.year &&
  game.week === receipt.week && [game.home, game.away].includes(centuryHolder));
const projection = exact.weekly.bySeason[receipt.year].games.find(game =>
  game.stage === 'regular' && game.week === receipt.week && game.home === changed.home && game.away === changed.away);
const scoreKey = changed.home === centuryHolder ? 'homeScore' : 'awayScore';
changed[scoreKey] = projection[scoreKey] = 100;
const exactHundred = buildLegacyRecords(exact).records.find(row => row.id === 'hundred-club');
assert.ok(exactHundred.holders.find(holder => holder.manager === centuryHolder).evidence[0].matchups
  .some(game => game.year === receipt.year && game.week === receipt.week && game.points === 100),
  'The exact-threshold score must count');
const narrow = records.get('legacy:nailbiters');
assert.equal(narrow.shared, narrow.holders.length > 1);
assert.ok(narrow.holders.every(holder => holder.evidence.every(row =>
  row.matchups.every(game => game.points > game.against &&
    Math.round((game.points - game.against) * 100) <= 300))));
const winningRun = threshold('winning-streak', 'Mitch').evidence[0];
assert.ok(winningRun.endingYear > winningRun.startingYear, 'Career runs can cross seasons');
const season140 = threshold('season-140-club', 'Mitch');
assert.ok(season140.evidence.length > 1, 'One owner can have multiple record-tying seasons');
assert.equal(registry.managerPortfolios.find(row => row.ownerId === 'Mitch').recordIds
  .filter(id => id === 'legacy:season-140-club').length, 1);
for (const record of registry.records.filter(record => record.family === 'legacy' && record.category === 'Season')) {
  for (const holder of record.holders) {
    assert.ok(holder.evidence.every(row => inputs.placements.seasons.some(season => season.year === row.year) && row.games >= 12));
  }
}
for (const record of registry.records.filter(record => record.family === 'legacy' && record.category === 'Rivalries')) {
  const minimum = record.sourceId === 'rival-percentage' ? 6 : 5;
  assert.ok(record.holders.every(holder => holder.evidence.every(row => row.games >= minimum)));
}

const legacyIds = new Set(registry.legacyReview.mappings.map(row => row.canonicalId));
for (const owner of registry.legacyReview.managerPortfolios) {
  assert.deepEqual(new Set(owner.recordIds), new Set(registry.managerPortfolios
    .find(row => row.ownerId === owner.ownerId).recordIds.filter(id => legacyIds.has(id))));
}

const managerCredits = new Map(registry.managerPortfolios.map(row => [row.ownerId, new Set(row.recordIds)]));
const playerCredits = new Map(registry.playerPortfolios.map(row => [row.ownerId, new Set(row.recordIds)]));
for (const record of registry.records) {
  const credits = record.ownerType === 'manager' ? managerCredits : playerCredits;
  const owners = new Set(record.holders.map(holder => holder.ownerId));
  assert.equal(record.shared, owners.size > 1);
  assert.ok(owners.size);
  for (const [id, recordIds] of credits) assert.equal(recordIds.has(record.id), owners.has(id), record.id + ' ' + id);
}
assert.ok(managerCredits.has('Evans') && managerCredits.has('JMid') && managerCredits.has('Thommy'));
assert.ok(!managerCredits.has('Tom') && !managerCredits.has('EvansBrandon'));
assert.ok([...managerCredits.values()].every(ids => [...ids].every(id => records.get(id).ownerType === 'manager')));
assert.ok([...playerCredits.values()].every(ids => [...ids].every(id => records.get(id).ownerType === 'player')));

const bad = structuredClone(inputs);
const invalidYear = bad.ledger.games.find(game => game.stage === 'regular').year;
const badProjection = bad.weekly.bySeason[invalidYear].games.find(game => game.stage === 'regular');
badProjection.homeScore = null;
assert.throws(() => buildLegacyRecords(bad), /Weekly season projection does not match/);
const badLedger = bad.ledger.games.find(game => game.stage === 'regular' && game.year === invalidYear &&
  game.week === badProjection.week && game.home === badProjection.home && game.away === badProjection.away);
badLedger.homeScore = null;
assert.throws(() => buildLegacyRecords(bad), /Missing team score/);
console.log('PASS: 44 legacy mappings, thresholds, archived appearances, completed seasons, owner credits, and missing scores');
