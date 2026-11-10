import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync('hall/shame.html','utf8');
const css=fs.readFileSync('assets/museum-editorial-editions.css','utf8');
const espn=JSON.parse(fs.readFileSync('data/espn_shitter_of_the_year_2016_2019.json','utf8'));
const sleeper=JSON.parse(fs.readFileSync('data/sleeper_postseason_placement_receipts_2020_2025.json','utf8'));
const receipts=new Map();
for(const [year,d] of Object.entries(espn.seasons)){
  const self=d.finalRoundEntrants.find(x=>x.manager===d.awardWinner);
  assert(self,'ESPN last-place participant missing '+year);
  const opponent=d.finalRoundEntrants.find(x=>x.matchupId===self.matchupId&&x.manager!==d.awardWinner);
  assert(opponent,'ESPN final opponent missing '+year);
  receipts.set(Number(year),{winner:d.awardWinner,score:d.awardWinningScore,opp:opponent.finalRoundTotal});
}
for(const d of sleeper.seasons){
  assert(d.toiletBowl.points<d.toiletBowl.opponentPoints,'Sleeper final losing score must be lower');
  assert(d.finalPlacements.some(x=>x.place===10&&x.manager===d.toiletBowl.manager),'Sleeper official last place mismatch '+d.year);
  receipts.set(d.year,{winner:d.toiletBowl.manager,score:d.toiletBowl.points,opp:d.toiletBowl.opponentPoints});
}
assert.equal(receipts.size,10,'Need all ten completed seasons');
const cards=[...html.matchAll(/<article class="shitter-plaque[^"]*" data-shitter-year="(\d{4})" data-recipient="([^"]+)" data-score="([\d.]+)" data-opponent-score="([\d.]+)"/g)];
assert.equal(cards.length,10,'Show exactly ten researched plaques');
assert.deepEqual(cards.map(m=>Number(m[1])),[2025,2024,2023,2022,2021,2020,2019,2018,2017,2016],'Trophy case newest to oldest');
for(const [,yearStr,winner,score,opponentScore] of cards){
 const year=Number(yearStr),expected=receipts.get(year);
 assert(expected,'Unknown historical year '+year);
 assert.equal(winner,expected.winner,'Recipient differs from verified final '+year);
 assert(Math.abs(Number(score)-expected.score)<.001,'Final recipient total mismatch '+year);
 assert(Math.abs(Number(opponentScore)-expected.opp)<.001,'Final opponent total mismatch '+year);
}
for(const term of ['Two-week consolation final · Weeks 16–17','Two-week consolation final · Weeks 15–16','Three-week cumulative ladder · Weeks 14–15–16','Single-week ESPN consolation final · Week 16','Official finish: 8th of 8','id="shitter-trophy-case"','id="shame-trades"','id="shame-lineups"','id="shame-scores"','id="shame-faab"'])
 assert(html.includes(term),'Missing original rules or existing exhibit '+term);
assert(css.includes('.shitter-plaque-grid')&&css.includes('@media(max-width:680px)'),'Trophy plaques must retain mobile layout');
assert(!html.includes('2026 SEASON</span><span class="shitter-title"'),'Do not award unfinished 2026 season');
console.log('PASS: ten source-verified Shitter recipients and final opponents, ESPN format exceptions, responsive trophy case and four preserved Shame categories');
