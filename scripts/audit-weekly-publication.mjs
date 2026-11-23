// Audit what the public site can actually show after a weekly Sleeper review.
// This is a READ-ONLY report: it never changes, certifies or publishes league results.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => JSON.parse(fs.readFileSync(path,'utf8'));
const games = read('data/unified_record_book_2016_2026.json').games.filter(
  x => x.year === 2026 && x.stage === 'regular'
);
const canonicalWeek = Math.max(0,...games.map(x=>x.week));
const race = read('data/playoff_race_v1.json');
const museum = read('data/trade_museum_stage66.json');
const museumHTML = fs.readFileSync('analytics/trade-museum.html','utf8');
const raceHTML = fs.readFileSync('analytics/playoff-race.html','utf8');
const embedded = museumHTML.match(/<script id="archive-data" type="application\/json">([\s\S]*?)<\/script>/);
assert.ok(embedded,'Trade Museum must contain the embedded audit snapshot');
const browserMuseum = JSON.parse(embedded[1]);
assert.ok(Array.isArray(museum) && Array.isArray(browserMuseum));
assert.deepEqual(browserMuseum,museum,'Trade Museum embedded source differs from audited source JSON; rebuild the museum before publishing');
assert.ok(raceHTML.includes("../data/playoff_race_v1.json"),'Playoff Race must fetch the canonical projection file');
assert.ok(museumHTML.includes('id="tm-audit-cutoff"') && museumHTML.includes('latest2026Trade'),'Trade Museum must display its actual audited cutoff');
for(let week=1;week<=canonicalWeek;week++) {
  assert.equal(games.filter(g=>g.week===week).length,5,'Canonical week '+week+' is incomplete');
}
const museum2026 = museum.filter(t=>t.year===2026);
const scoreWeeks= museum2026.map(t=>t.scoring_through_week);
const tradeStarterScoringWeek=scoreWeeks.length>0&&scoreWeeks.every(w=>Number.isInteger(w)&&w>=1&&w<=14)
 ? Math.min(...scoreWeeks):null;
const newestTrade = museum2026.map(t=>t.date).sort().at(-1)||null;
const latestTradeWeek = Math.max(0,...museum2026.map(t=>Number(t.week)||0));
const raceWeek = Number(race.verified_through_week);
const expectedArg = process.argv.find(a=>a.startsWith('--expected-week='));
const expectedWeek = expectedArg ? Number(expectedArg.split('=')[1]) : null;
if(expectedArg && (!Number.isInteger(expectedWeek)||expectedWeek<1||expectedWeek>14))
 throw Error('Expected week must be an integer from 1 to 14');
const failures = [],warnings = [];
if(raceWeek!==canonicalWeek)failures.push('Playoff Race Week '+raceWeek+' does not match approved canonical Week '+canonicalWeek);
if(expectedWeek!==null && canonicalWeek<expectedWeek)failures.push(
 'Approved canonical Week '+canonicalWeek+' trails the externally verified finalized Week '+expectedWeek
);
if(latestTradeWeek<canonicalWeek-1)warnings.push(
 'Trade Museum last listed 2026 trade is Week '+latestTradeWeek+' while canonical games end Week '+canonicalWeek+
 '. This may be missing later transactions; inspect Sleeper trade receipts. No fresh trade is assumed without evidence.'
);
if(tradeStarterScoringWeek===null)warnings.push(
 'Trade Museum 2026 starter-point audit cutoff is not stated for every receipt; verify the score attribution against final weekly lineups.'
);
else if(tradeStarterScoringWeek<canonicalWeek)warnings.push(
 'Trade Museum 2026 starter-point calculations end Week '+tradeStarterScoringWeek+
 ' but approved matchups end Week '+canonicalWeek+'. Regenerate from verified completed starters.'
);
warnings.push('Trade Museum starter-point values are verified through an explicit source cutoff, NOT continuously live cumulative scores.');
const report = {
  auditedAt: new Date().toISOString(),
  canonicalWeek,
  canonicalGames: games.length,
  playoffRaceWeek: raceWeek,
  tradeMuseum: {totalReceipts:museum.length,receipts2026:museum2026.length,latestListed2026TradeDate:newestTrade,latestListed2026TradeWeek:latestTradeWeek,scoringCutoffWeek2026:tradeStarterScoringWeek,scoring:'source-verified-weekly-starter-audit'},
  expectedVerifiedWeek:expectedWeek,
  failures,warnings,
  publicationReady:failures.length===0 && warnings.length===1
};
console.log(JSON.stringify(report,null,2));
if(process.env.GITHUB_STEP_SUMMARY){
 const lines = [
  '## Fellas weekly publication audit',
  '| Surface | Approved data |',
  '| --- | --- |',
  '| Canonical matchups | Week '+canonicalWeek+' ('+games.length+' games) |',
  '| Playoff Race | Week '+raceWeek+' |',
  '| Trade Museum | Last 2026 trade '+(newestTrade||'not established')+'; Week '+latestTradeWeek+'; 2026 starter-point audit through Week '+(tradeStarterScoringWeek??'unverified')+' |',
  '',
  ...failures.map(x=>'**FAIL:** '+x),
  ...warnings.map(x=>'**REVIEW:** '+x),
  '',
  'The Trade Museum is an audited archive, not a live player-point tracker. Staged Sleeper results are not published until reviewed and merged.'
 ];
 fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines.join('\n')+'\n');
}
if(failures.length)process.exitCode=1;
// A potentially stale museum is flagged for review, not silently rewritten or declared factually incomplete.
