// Preserve verified points for unpaired historical roster entries without inventing a head-to-head game.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const evidence=read('data-integrity/historical-unpaired-week14-2020-2021.json');
const ledger=read('data/unified_record_book_2016_2026.json');
const mirrors=read('data/season_weekly_matchups_2016_2026_v1.json');
const expected={2020:['Birch','Mitch'],2021:['Birch','Tony']};
assert.equal(evidence.seasons.length,2);
for(const season of evidence.seasons){
 assert.equal(season.week,14);
 assert.equal(season.providerShape,'partially_paired');
 assert.equal(season.pairedGames,4);
 const names=season.unpaired.map(x=>x.manager).sort();
 assert.deepEqual(names,expected[season.year],'Unpaired roster identities changed');
 assert.ok(season.unpaired.every(x=>Number.isInteger(x.rosterId)&&Number.isFinite(x.points)));
 const observed=ledger.games.filter(g=>g.year===season.year&&g.stage==='regular'&&g.week===14);
 assert.equal(observed.length,4,'Historical ledger may not backfill an unverified fifth pairing');
 assert.equal(mirrors.bySeason[season.year].games.filter(g=>g.stage==='regular'&&g.week===14).length,4);
 assert.ok(season.unpaired.every(x=>observed.every(g=>g.home!==x.manager&&g.away!==x.manager)),'Unpaired score falsely treated as a game');
 const raw=read('data/sleeper_matchups_'+season.year+'.json').find(x=>x.week===14);
 assert.ok(raw&&raw.games.length===4,'Underlying raw export differs; re-audit historical status');
}
console.log('Historical unpaired Week 14 evidence PASS: four paired games and two provider-scored, unpaired teams in both 2020 and 2021; no invented outcomes.');
