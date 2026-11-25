import assert from 'node:assert/strict';
import {expandedAliases, normalizeManager} from './legacy-record-definitions-v57.mjs';

const expandedSource = 'data/expanded_records_verified_v1.json';

// Decisions are about measured events, credited owners, eligibility, and source
// coverage. A coincidental match in the computed value is irrelevant.
export function reviewLegacyDefinitions(catalog, records, archivedLegacy) {
  const byId = new Map(records.map(record => [record.id, record]));
  const aliases = new Map(Object.entries(expandedAliases).flatMap(([family, ids]) =>
    ids.map(id => [id, family + ':' + id])
  ));
  const checkpoints = new Map(archivedLegacy.map(record => [record.id, record]));
  assert.equal(new Set(catalog.categories.map(category => category.key)).size, catalog.categoryCount);
  assert.equal(catalog.categories.length, catalog.categoryCount);

  const mappings = catalog.categories.map(category => {
    const id = category.key;
    const canonicalId = aliases.get(id) ?? 'legacy:' + id;
    const record = byId.get(canonicalId);
    assert.equal(record?.ownerType, 'manager', 'Missing legacy mapping ' + id);
    assert.equal(record.sourceId, id);
    const isAlias = aliases.has(id);
    if (!isAlias) {
      const checkpoint = checkpoints.get(id);
      const rankedFirst = category.leaders.filter(row => row.rank === 1);
      assert.ok(rankedFirst.length);
      assert.equal(checkpoint?.value, rankedFirst[0].value, 'Archived value mismatch ' + id);
      assert.deepEqual(checkpoint.holders.map(holder => holder.manager).sort(),
        [...new Set(rankedFirst.map(holder => normalizeManager(holder.manager)))].sort(),
        'Archived holder mismatch ' + id);
    }
    const rationale = isAlias
      ? id === 'rival-wins' || id === 'rival-games'
        ? 'Same all-manager opponent pairing and maximum; use the legacy five-meeting minimum in the canonical computation.'
        : canonicalId.startsWith('core:')
          ? 'Same paired regular-season statistic, credited manager role and eligibility; canonical feed refreshes the archival cutoff.'
          : 'Same official finishing-rank statistic and completed-season eligibility across ESPN and Sleeper.'
      : 'Recomputed from the current authoritative sources; historical first-place marks and distinct holders reconcile at the archived cutoff.';
    return {source:expandedSource, legacyId:id, canonicalId,
      decision:isAlias ? 'alias' : 'integrated', rationale};
  });
  assert.equal(mappings.filter(mapping => mapping.decision === 'alias').length, aliases.size);
  assert.equal(mappings.filter(mapping => mapping.decision === 'integrated').length, checkpoints.size);
  assert.equal(new Set(mappings.map(mapping => mapping.canonicalId)).size, mappings.length);

  // The established public panel is a separate, smaller publication surface.
  // These decisions prevent its presentations being appended to the candidate counts.
  const establishedPanel = [
    ['Highest regular-season weekly score', 'core:highest-score', 'alias', 'Same recovered individual team score.'],
    ['Largest regular-season victory', 'core:biggest-win', 'alias', 'Same largest positive margin credited to the winner.'],
    ['Most career regular-season wins', 'core:most-wins', 'alias', 'Same count of recovered victories.'],
    ['Most wins in a completed regular season', 'legacy:season-wins', 'scoped-variant', 'The registry uses paired data and a minimum of 12 recorded games.'],
    ['Most championships', 'historical:championships', 'alias', 'Same verified title seasons.'],
    ['Most points in a completed regular season', 'legacy:season-points', 'scoped-variant', 'The panel uses season-guide totals. The registry uses paired scores and a minimum of 12 recorded games.'],
    ['Closest regular-season victory', 'core:narrowest-win', 'alias', 'Same strictly positive winning margin.'],
    ['Highest career regular-season winning percentage (50+ games)', 'legacy:win-rate', 'scoped-variant', 'The panel uses 50 games and the registry uses 60. Keep the established view labeled and tally only the 60-game definition in the registry.'],
    ['Most regular-season wins against a single opponent', 'core:rival-wins', 'scoped-variant', 'The registry explicitly requires five meetings.'],
    ['Most championship-bracket playoff appearances', 'historical:playoff-berths', 'alias', 'Same championship-bracket entrants, including byes.'],
    ['Most championship-game appearances', 'historical:finals', 'alias', 'Same verified finalists across completed seasons.'],
    ['Best average final finish (all six Sleeper seasons)', 'historical:sleeper-best_average_six', 'alias', 'Same raw average rank among managers present for all six seasons.'],
    ['Most top-three final finishes (2020–2025)', 'historical:sleeper-most_top_three', 'alias', 'Same Sleeper-only verified podiums.'],
    ['Most top-five final finishes (2020–2025)', 'historical:sleeper-most_top_five', 'alias', 'Same Sleeper-only verified top-five finishes.'],
    ['Best normalized career final finish (6+ seasons, 2016–2025)', 'historical:average-finish', 'alias', 'Same field-size normalization and six-season minimum.'],
    ['Most top-three finishes across 2016–2025', 'historical:top-three-finishes', 'alias', 'Same verified podiums across both platforms.']
  ].map(([label, canonicalId, decision, rationale]) => ({label, canonicalId, decision, rationale}));

  const distinct = [
    ['core:biggest-win', 'core:biggest-defeat', 'Same matchup margin, different roles. Victory credits the winner and defeat credits the loser.'],
    ['core:narrowest-win', 'core:narrowest-defeat', 'Same matchup margin, different roles. The defeated manager owns the loss record.'],
    ['core:highest-score-loss', 'core:giant-slayer-win', 'The losing scorer and the manager who overcame that score are different credited roles.'],
    ['legacy:nailbiters', 'legacy:one-score-drama', 'Wins require a positive margin. Close games also credit losses and ties.'],
    ['legacy:winning-streak', 'team-scoring:season-win-streak', 'Consecutive recorded appearances can span years or archive gaps. Consecutive weekly streaks stop at both.'],
    ['legacy:scoring-streak-100', 'data/scoring_streak_research_2016_2026w8_v1.json#topOver100', 'Legacy includes exactly 100 and spans seasons. The exhibit requires strictly over 100 in consecutive weeks within one season.'],
    ['legacy:scoring-streak-120', 'data/scoring_streak_research_2016_2026w8_v1.json#topAtLeast105', 'Different points threshold and different meaning of consecutive.'],
    ['legacy:hundred-club', 'historical:season-weeks-over100', 'Career games at least 100 versus complete-season weeks strictly above 100.'],
    ['legacy:one-forty-club', 'legacy:season-140-club', 'Career count versus best individual completed season.'],
    ['legacy:season-wins', 'legacy:season-win-rate', 'Count versus ratio with ties, with different season lengths.'],
    ['legacy:season-points', 'legacy:season-average', 'Total versus per-game scoring with unequal numbers of appearances.'],
    ['legacy:rival-percentage', 'core:rival-wins', 'Six meetings and wins divided by meetings versus five meetings and raw win count.'],
    ['core:rival-games', 'data/regular_season_rivalry_receipts_2016_2026w8_v1.json#mostMeetings', 'The exhibit is limited to current managers. The canonical record includes historical managers.'],
    ['historical:sleeper-most_top_three', 'historical:top-three-finishes', '2020–2025 Sleeper-only scope versus 2016–2025 across both platforms.'],
    ['historical:sleeper-best_average_six', 'historical:average-finish', 'Fixed Sleeper cohort and raw ordinal rank versus any six completed seasons and field-size normalization.'],
    ['legacy:season-win-rate', 'historical:legendary-best-record-no-title', 'The legendary category excludes champions and has a different eligibility condition.'],
    ['historical:postseason-biggest-win', 'historical:legendary-largest-championship-margin', 'All eligible single-week postseason games versus championship finals, including verified two-week finals.']
  ].map(([first, second, rationale]) => ({first, second, decision:'distinct', rationale}));
  for (const choice of establishedPanel) assert.ok(byId.has(choice.canonicalId), choice.canonicalId);
  for (const pair of distinct) {
    assert.ok(byId.has(pair.first), pair.first);
    assert.ok(byId.has(pair.second) || pair.second.startsWith('data/'), pair.second);
  }
  return {mappings, establishedPanel, distinct};
}
