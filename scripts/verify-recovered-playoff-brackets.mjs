// Preserve the five recovered Sleeper playoff games and the 2020 semifinalist discrepancy.
// Does not mutate legacy canonical bracket data without separate source reconciliation.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const get=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const recovered=get('data/recovered_winners_bracket_2020_2021_v1.json');
const bracket=get('data/verified_sleeper_playoff_brackets_2020_2025.json').seasons;
const legacy=get('data/playoff_explorer_verified_2016_2025_v1.json').seasons;
const tradeAudit=get('data/expanded_playoff_trade_revenge_2020_2025_v1.json');
const recon=get('data/recovered_playoff_bracket_canonical_reconciliation_v1.json');
assert.equal(recovered.records.length,5);
assert.equal(recovered.schema,'fellas-recovered-winners-bracket-2020-2021-v1');
const keys=new Set();
for(const row of recovered.records){
 const season=bracket.find(x=>x.year===row.year);
 assert(season&&[2020,2021].includes(row.year));
 assert(season.seeds.includes(row.winner)&&season.seeds.includes(row.loser));
 if(row.round==='opening')assert(!season.byes.includes(row.winner)&&!season.byes.includes(row.loser));
 assert.equal(Number((row.winnerScore-row.loserScore).toFixed(2)),row.winningMargin);
 assert(row.winningMargin>0);
 const key=row.year+':'+row.week+':'+row.winner+':'+row.loser;
 assert(!keys.has(key),'Duplicate recovered fixture '+key);keys.add(key);
 assert(!legacy.find(x=>x.year===row.year).matches.some(x=>x.week===row.week&&x.winner===row.winner&&x.loser===row.loser));
 const copied=tradeAudit.games.find(x=>x.year===row.year&&x.week===row.week&&x.winner===row.winner&&x.loser===row.loser);
 assert(copied,'Recovered matchup absent from expanded audit '+key);
 assert.equal(copied.winnerScore,row.winnerScore);assert.equal(copied.loserScore,row.loserScore);
 assert.equal(copied.margin,row.winningMargin);
}
assert.equal(recovered.records.filter(x=>x.year===2020).length,3);
assert.equal(recovered.records.filter(x=>x.year===2021).length,2);
assert.equal(tradeAudit.games.length,30);
for(const year of [2020,2021,2022,2023,2024,2025])assert.equal(tradeAudit.games.filter(x=>x.year===year).length,5);
assert.equal(recon.defect.year,2020);
assert.equal(recon.defect.verifiedCorrection.includes('Stover'),true);
assert.equal(recon.defect.currently.includes('Evans'),true);
const stoverOverEvans=recovered.records.find(x=>x.year===2020&&x.round==='opening'&&x.winner==='Stover'&&x.loser==='Evans');
const mitchOverStover=recovered.records.find(x=>x.year===2020&&x.round==='semifinal'&&x.winner==='Mitch'&&x.loser==='Stover');
assert(stoverOverEvans&&mitchOverStover);
assert.equal(stoverOverEvans.winningMargin,2.12);
assert.equal(mitchOverStover.winningMargin,28.82);
assert.equal(recon.status,'source_verified_patch_proposal_not_applied_to_canonical');
const museum=fs.readFileSync('analytics/greatest-worst-trades.html','utf8');
assert(museum.includes('30 verified championship-bracket games'));
assert(museum.includes('recovered_winners_bracket_2020_2021_v1.json'));
console.log('PASS playoff source recovery: five new 2020-21 winners-bracket fixtures; 30 of 30 2020-25 games in research; 2020 Stover/Evans canonical discrepancy explicitly quarantined.');
