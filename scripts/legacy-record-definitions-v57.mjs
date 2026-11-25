import assert from 'node:assert/strict';
import {auditAllEraFinishes} from '../assets/all-era-final-placements.mjs';

const ledgerSource = 'data/unified_record_book_2016_2026.json';
const placementsSource = 'data/fellas_final_placements_2016_2025_verified.json';
const round = value => Number(value.toFixed(2));
const cents = value => Math.round(value * 100);
export const normalizeManager = name => ({Tom:'Thommy', Gurt:'Stover', EvansBrandon:'Evans'}[name] ?? name);

// The first two groups are source aliases. The registry retains the canonical IDs.
export const expandedAliases = {
  core: [
    'highest-score', 'lowest-score', 'highest-score-loss', 'lowest-score-win',
    'biggest-win', 'narrowest-win', 'biggest-defeat', 'narrowest-defeat', 'giant-slayer-win',
    'most-wins', 'most-games', 'career-points', 'points-against', 'high-score-losses',
    'rival-wins', 'rival-games'
  ],
  historical: ['seasons-played', 'top-three-finishes', 'top-half-finishes', 'average-finish']
};

function groupBy(rows, key) {
  const groups = new Map();
  for (const row of rows) {
    const id = key(row);
    const group = groups.get(id) ?? [];
    group.push(row);
    groups.set(id, group);
  }
  return groups;
}

function summarize(games) {
  return {
    manager: games[0].manager,
    games: games.length,
    wins: games.filter(game => game.margin > 0).length,
    losses: games.filter(game => game.margin < 0).length,
    ties: games.filter(game => game.margin === 0).length,
    points: games.reduce((sum, game) => sum + game.points, 0) / 100,
    against: games.reduce((sum, game) => sum + game.against, 0) / 100
  };
}

function compareProjection(games, weekly, archive) {
  const key = (game, year) => JSON.stringify([
    year, game.week, normalizeManager(game.home), normalizeManager(game.away),
    game.homeScore, game.awayScore
  ]);
  const projected = Object.values(weekly.bySeason).flatMap(season =>
    season.games.filter(game => game.stage === 'regular').map(game => key(game, season.year))
  );
  assert.deepEqual(projected.sort(), games.map(game => key(game, game.year)).sort(),
    'Weekly season projection does not match the regular-season ledger');
  for (const [manager, rows] of groupBy(games.flatMap(game => [game.home, game.away]), normalizeManager)) {
    assert.equal(archive.find(row => normalizeManager(row.manager) === manager)?.regular.games, rows.length, manager);
  }
}

export function buildLegacyRecords({ledger, weekly, archive, placements, catalog}, through) {
  const allGames = ledger.games.filter(game => game.stage === 'regular');
  const latest = allGames.reduce((max, game) =>
    game.year > max.year || (game.year === max.year && game.week > max.week) ? game : max);
  through ??= latest;
  assert.equal(ledger.duplicatesFound, 0);
  assert.equal(archive.asOf, ledger.updated);
  compareProjection(allGames, weekly, archive.managers);

  const games = allGames.filter(game =>
    game.year < through.year || (game.year === through.year && game.week <= through.week));
  const auditedFinishes = auditAllEraFinishes(placements);
  const completedYears = new Set(placements.seasons.map(season => season.year));
  const identities = new Set(archive.managers.map(row => normalizeManager(row.manager)));
  const seasonsByIdentity = new Map(auditedFinishes.managers.map(row => [
    normalizeManager(row.manager), new Set(row.history.map(season => season.year))
  ]));
  const seen = new Set();
  const rows = games.flatMap(game => {
    const {year, week, era, homeScore, awayScore} = game;
    const [home, away] = [game.home, game.away].map(normalizeManager);
    assert.ok(Number.isInteger(year) && Number.isInteger(week));
    assert.ok(Number.isFinite(homeScore) && Number.isFinite(awayScore), 'Missing team score');
    assert.notEqual(home, away);
    return [[home, away, homeScore, awayScore], [away, home, awayScore, homeScore]]
      .map(([manager, opponent, scored, conceded]) => {
        const key = [year, week, manager].join(':');
        assert.ok(!seen.has(key), 'Duplicate manager appearance ' + key);
        seen.add(key);
        assert.ok(identities.has(manager), 'Unknown ledger manager ' + manager);
        if (completedYears.has(year)) {
          assert.ok(seasonsByIdentity.get(manager)?.has(year), 'Wrong historical identity ' + key);
        }
        return {manager, opponent, year, week, era, points:cents(scored), against:cents(conceded),
          margin:cents(scored) - cents(conceded)};
      });
  }).sort((a,b) => a.year - b.year || a.week - b.week);
  const careers = [...groupBy(rows, row => row.manager).values()];
  const seasons = [...groupBy(rows.filter(row => completedYears.has(row.year)),
    row => row.manager + ':' + row.year).values()]
    .filter(group => group.length >= 12);
  const rivalries = [...groupBy(rows, row => row.manager + ':' + row.opponent).values()]
    .filter(group => group.length >= 5)
    .map(group => ({...summarize(group), opponent:group[0].opponent}));
  const summaries = careers.map(summarize).filter(row => row.games >= 60);
  const byId = new Map(catalog.categories.map(category => [category.key, category]));
  const firstYear = rows[0].year;
  const lastCompleted = Math.max(...completedYears);
  const liveScope = 'Recovered paired regular-season games ' + firstYear + '–' + through.year +
    ' Week ' + through.week + '; all historical managers eligible; incomplete archives and scoring-era differences apply.';
  const seasonScope = 'Officially completed seasons ' + firstYear + '–' + lastCompleted +
    '; recovered paired regular-season scores, including incomplete historical samples; raw scores are not era-normalized.';
  const finishScope = 'Verified official final placements ' + firstYear + '–' + lastCompleted;
  const seasonQualification = 'Minimum 12 recovered regular-season appearances in an officially completed season';
  const records = [];
  function add(id, eligible, metric, qualification, scope = liveScope, source = ledgerSource) {
    const definition = byId.get(id);
    assert.ok(definition, 'Missing source definition ' + id);
    assert.equal(definition.direction, 'high', id);
    assert.ok(eligible.length && eligible.every(row => Number.isFinite(metric(row))), id);
    const score = row => round(metric(row));
    const value = Math.max(...eligible.map(score));
    const winners = groupBy(eligible.filter(row => score(row) === value), row => row.manager);
    const holders = [...winners].sort(([a],[b]) => a.localeCompare(b))
      .map(([manager, evidence]) => ({manager, evidence}));
    records.push({id, label:definition.label, value, unit:definition.unit, scope,
      qualification, source, category:definition.group, holders});
  }

  const winRate = row => 100 * (row.wins + row.ties / 2) / row.games;
  add('win-rate', summaries, winRate, 'At least 60 recovered games; ties count as half a win; rounded to two decimals');
  add('career-ppg', summaries, row => row.points / row.games,
    'At least 60 recovered games; rounded to two decimals');

  for (const [id, predicate, qualification] of [
    ['hundred-club', row => row.points >= 10000, 'Score of at least 100.00'],
    ['one-twenty-club', row => row.points >= 12000, 'Score of at least 120.00'],
    ['one-forty-club', row => row.points >= 14000, 'Score of at least 140.00'],
    ['one-sixty-club', row => row.points >= 16000, 'Score of at least 160.00'],
    ['wins-vs-130', row => row.margin > 0 && row.against >= 13000, 'Win against at least 130.00 opposing points'],
    ['wins-below-100', row => row.margin > 0 && row.points < 10000, 'Win while scoring strictly below 100.00'],
    ['nailbiters', row => row.margin > 0 && row.margin <= 300, 'Winning margin from 0.01 through 3.00 points'],
    ['one-score-drama', row => Math.abs(row.margin) <= 300, 'Absolute margin at most 3.00 points, including ties; both participants are eligible'],
    ['thirty-plus-wins', row => row.margin >= 3000, 'Winning margin at least 30.00 points']
  ]) {
    const counts = careers.map(group => {
      const matchups = group.filter(predicate);
      return {...summarize(group), count:matchups.length,
        matchups:matchups.map(({year, week, opponent, points, against}) =>
          ({year, week, opponent, points:points / 100, against:against / 100}))};
    });
    add(id, counts, row => row.count, qualification);
  }

  for (const [id, predicate, result] of [
    ['winning-streak', row => row.margin > 0, 'wins'],
    ['scoring-streak-100', row => row.points >= 10000, 'scores at least 100.00'],
    ['scoring-streak-120', row => row.points >= 12000, 'scores at least 120.00']
  ]) {
    const runs = careers.flatMap(group => {
      const finished = [];
      let run = [];
      for (const row of group) {
        if (predicate(row)) run.push(row);
        else if (run.length) {
          finished.push(run);
          run = [];
        }
      }
      if (run.length) finished.push(run);
      return finished.map(run => {
        const start = run[0], end = run.at(-1);
        return {manager:start.manager, length:run.length, games:group.length,
          startingYear:start.year, startingWeek:start.week, endingYear:end.year, endingWeek:end.week};
      });
    });
    add(id, runs, row => row.length, 'Consecutive recovered appearances with ' + result +
      '; runs may cross seasons and missing NFL weeks');
  }

  const seasonRows = seasons.map(group => ({...summarize(group), year:group[0].year,
    margin:group.reduce((sum, game) => sum + game.margin, 0) / 100,
    atLeast140:group.filter(row => row.points >= 14000).length}));
  for (const [id, metric, detail] of [
    ['season-points', row => row.points, ''],
    ['season-average', row => row.points / row.games, '; rounded to two decimals'],
    ['season-wins', row => row.wins, ''],
    ['season-win-rate', winRate, '; ties count as half a win; rounded to two decimals'],
    ['season-point-diff', row => row.margin, ''],
    ['season-140-club', row => row.atLeast140, '; scores at least 140.00']
  ]) add(id, seasonRows, metric, seasonQualification + detail, seasonScope);

  add('rival-percentage', rivalries.filter(row => row.games >= 6), row => 100 * row.wins / row.games,
    'At least six meetings against one opponent; wins divided by meetings; rounded to two decimals');
  add('rival-margin', rivalries, row => row.points - row.against, 'At least five meetings against one opponent');
  add('rival-scoring', rivalries, row => row.points / row.games,
    'At least five meetings against one opponent; rounded to two decimals');

  const rebounds = auditedFinishes.managers.flatMap(({manager, history}) => history.slice(1)
    .flatMap((to, index) => {
      const from = history[index];
      if (to.year !== from.year + 1) return [];
      const normalized = row => (row.teams - row.rank) / (row.teams - 1);
      return [{manager:normalizeManager(manager), from, to, improvement:100 * (normalized(to) - normalized(from))}];
    }));
  assert.ok(rebounds.some(row => row.improvement > 0), 'No documented improvement');
  add('bounceback', rebounds, row => row.improvement,
    'Consecutive completed seasons; improvement in official normalized finish (100 first, 0 last); rounded to two decimals',
    finishScope, placementsSource);

  return {records, through:{year:through.year, week:through.week}, regularGames:games.length};
}
