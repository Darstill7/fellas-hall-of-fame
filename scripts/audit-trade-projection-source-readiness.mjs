// Read-only provenance audit for projection-related artifacts already in this
// repository. Do NOT promote editorial receipts or historical final scores into
// authentic decision-time trade replacement forecasts.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const editorial=read('shitter/2026-week-10/projection-receipts.json');
const trade=read('data/trade_par_preview.json');
const bench=read('data/trade_par_slot_feasibility_2020_2025_v1.json');
const historical=read('data/war_2025_starter_benchmark_audit.json');
assert.equal(editorial.season,2026);
assert.equal(editorial.week,10);
assert.equal(editorial.asOf,'2026-11-12');
assert.equal(typeof editorial.source,'string');
assert.ok(editorial.source.startsWith('https://'));
assert.equal(typeof editorial.asOf,'string');
assert.ok(!/[T ]\d\d:\d\d/.test(editorial.asOf),'Editorial as-of is date-only, not verified before individual NFL lock');
assert.ok(editorial.method.includes('These are third-party estimates'),'Editorial projection methodology must remain distinct from league-scoring source');
const playerRows=Object.values(editorial.lineupProjections||{}).flatMap(x=>x.players||[]);
assert.ok(playerRows.length>0);
assert.ok(playerRows.every(x=>Number.isFinite(x.halfPprProjection)),'Every editorial projection must be numeric');
assert.ok(playerRows.every(x=>!Object.hasOwn(x,'issuedAt')&&!Object.hasOwn(x,'lockAt')&&!Object.hasOwn(x,'historicalOwnerAtDecision')),'Editorial player projections are not per-player timestamped lock snapshots');
assert.equal(bench.creditedAcquiredPlayerStarts,254);
assert.equal(bench.status,'research_input_coverage_not_replacement_baseline_or_trade_grade');
assert.equal(historical.status,'experimental_not_certified_WAR');
assert.ok(trade.records.some(t=>t.year===2020)&&trade.records.some(t=>t.year===2025));
const checks=[
 {source:'2020–2025 historical final lineup/bench snapshots',coverage:'254 source-clean acquired-player starts',beforeLock:'not_verified',ownerStatus:'postgame observation',allowed:'starter-point and retrospective FLEX source coverage'},
 {source:'2025 experimental starter benchmark audit',coverage:'2025 player/weekly starting scores',beforeLock:'not_a_projection_feed',ownerStatus:'historical scoring source',allowed:'experimental descriptive benchmark only'},
 {source:'2026 Week 10 Weekly Shitter editorial projection receipts',coverage:playerRows.length+' editorial starter projections, dated 2026-11-12',beforeLock:'per_player_lock_time_not_verified',ownerStatus:'editorial current-lineup snapshot',allowed:'2026 editorial analysis only; NOT 2020–2025 trading-skill evidence'}
];
const report=[
 '# Existing Fellas projection source readiness audit','',
 '> Source qualification requires **per-player historical forecast issuance time prior to each individual game lock**, a league-scoring-compatible prediction, decision-time receiving-team ownership, bench and healthy/active availability. No currently identified repo evidence meets the full contract for 2020–2025 acquired-player starts.','',
 '| Existing source | Coverage | Historical prelock qualification | Permitted interpretation |',
 '|---|---|---|---|',
 ...checks.map(x=>'| '+x.source+' | '+x.coverage+' | '+x.beforeLock+' | '+x.allowed+' |'),
 '',
 '- 2026 Week 10 editorial projections are independently dated but the dataset supplies no timestamped issuance/lock for each individual player, and is for a different season. It must never silently backfill the 2020–2025 trade analysis.',
 '- The historical 2025 starter benchmark is explicitly **experimental**, based on scoring after the games; it is not an archived decision-time forecast.',
 '- Final starter points and 246 individual/238 simultaneous recorded bench substitutions remain historical retrospective observations only.',
 '',
 '**Decision-time model status: blocked on external source provenance.** The synthetic prelock matching engine may run fixture tests; it may not generate official season-by-season trade advantages from these data.',
 ''
].join('\n');
console.log(report);
if(process.argv.includes('--github-summary')&&process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,report);
