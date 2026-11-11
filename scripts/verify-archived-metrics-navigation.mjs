import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';

const page = fs.readFileSync('analytics/metrics.html','utf8');
for (const [label, fragment] of [
  ['current verified metrics', 'Current 2026 metrics are shown first'],
  ['historical archive note', 'Open archived Week 6 analysis'],
  ['live metrics module', 'current-advanced-metrics.mjs'],
  ['archival scope', 'authored after Week 6 of 2026'],
  ['live season destination', 'href="../seasons/2026.html"'],
  ['verified record book destination', 'href="record-holders.html"'],
  ['manager directory destination', 'href="../managers/"'],
  ['Hall of Fame destination', 'href="../hall/"'],
  ['accessible skip target', 'id="archive-metrics-title"'],
  ['skip link', 'href="#archive-metrics-title"'],
  ['historical methodology retained', 'Expected wins = all-play wins'],
]) {
  assert(page.includes(fragment), 'Missing '+label);
}
for (const destination of ['../index.html','../managers/','../hall/','record-holders.html','../seasons/2026.html']) {
  const resolved=path.resolve('analytics',destination);
  assert(fs.existsSync(resolved), 'Missing navigation destination: '+destination);
}
assert(!page.includes('☰ Explore Fellas OS'), 'Old product-facing navigation label returned');
assert(!page.includes('2026 · Week 6 snapshot'), 'Frozen data incorrectly styled as live');
assert(page.indexOf('id="current-metrics"') < page.indexOf('class="historical-metrics"'), 'Verified season metrics must appear ahead of archived analysis');
const moduleSource=fs.readFileSync('assets/current-advanced-metrics.mjs','utf8');
for(const marker of ['season_weekly_matchups_2016_2026_v1.json','allWins','lastWeek','Incomplete Week'])assert(moduleSource.includes(marker),'Current calculation missing '+marker);

assert.equal((page.match(/id="archive-metrics-title"/g)||[]).length,1,'Archive heading target must be unique');
console.log('Archived Advanced Metrics scope and visitor navigation verified.');
