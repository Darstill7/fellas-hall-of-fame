// Dedicated proof for the 2022 opening-round Mitch/Stilly revenge game.
// A league matchup, an actual archived starter lineup, and the earlier trade must agree.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const source=j('data/sleeper_2022_w15_mitch_stilly_trade_reunion_v1.json');
const study=j('data/expanded_playoff_trade_revenge_2020_2025_v1.json');
const bracket=j('data/playoff_explorer_verified_2016_2025_v1.json').seasons.find(x=>x.year===2022);
const trade=j('data/trade_museum_stage66.json').find(x=>x.id===source.tradeId);
const actual=bracket.matches.find(x=>x.week===15&&x.winner==='Mitch'&&x.loser==='Stilly');
const round=n=>Number(n.toFixed(2));
assert.equal(source.schema,'fellas-2022-week15-direct-trade-opponent-lineups-v1');
assert.equal(source.leagueId,'857125408712310784');
assert.equal(source.teamWinner.rosterId,6);assert.equal(source.teamLoser.rosterId,1);
assert(actual,'Verified 2022 opening-round matchup missing');
assert.equal(actual.homeScore,94.92);assert.equal(actual.awayScore,127.9);
assert.equal(round(actual.margin),32.98);
assert.equal(source.teamWinner.score,actual.awayScore);
assert.equal(source.teamLoser.score,actual.homeScore);
assert.equal(round(source.teamWinner.starters.reduce((x,p)=>x+p.points,0)),actual.awayScore);
assert.equal(round(source.teamLoser.starters.reduce((x,p)=>x+p.points,0)),actual.homeScore);
assert.equal(trade?.year,2022);assert.equal(trade.week,2);
assert.equal(trade.sides.find(x=>x.manager==='Mitch')?.assets,'Adam Thielen + Saquon Barkley');
assert.equal(trade.sides.find(x=>x.manager==='Stilly')?.assets,'Jonathan Taylor');
for(const [name,points] of [['Saquon Barkley',20.5],['Adam Thielen',11.6]]){
 const played=source.teamWinner.starters.find(x=>x.name===name);
 assert(played);assert.equal(played.points,points);
}
assert.equal(source.teamLoser.starters.find(x=>x.name==='Jonathan Taylor')?.points,1.8);
assert.equal(round(source.verifiedScoring.barkley+source.verifiedScoring.thielen),32.1);
assert.equal(round(source.verifiedScoring.mitchReceivedCombined-source.verifiedScoring.margin),-.88);
const recorded=study.tradeCandidates.find(x=>x.tradeId===source.tradeId&&x.year===2022);
assert(recorded,'2022 case is missing from expanded study');
assert.equal(recorded.evidenceStatus,'verified_started_against_former_manager');
assert.equal(recorded.starterReceiptSource,'sleeper_2022_w15_mitch_stilly_trade_reunion');
assert.equal(recorded.verifiedFormerPlayerPoints,32.1);
assert.equal(study.coverage.verifiedWinnersBracketGames,25);
assert.equal(study.coverage.directOpponentTradeCandidates,4);
assert.equal(study.coverage.confirmedRevengeGames,3);
assert.equal(study.coverage.confirmedStartedAgainstFormerManagerTradeLinks,4);
assert.equal(study.coverage.unresolvedStarterCases,0);
const site=fs.readFileSync('analytics/greatest-worst-trades.html','utf8');
const book=fs.readFileSync('analytics/records.html','utf8');
assert(site.includes('32.10')&&site.includes('0.88')&&site.includes('id="expanded-trade-revenge-audit"'));
assert(book.includes('Mitch, 2022')&&book.includes('32.10'));
assert(study.methodology.some(x=>x.includes('2022 Week 15')));
console.log('PASS 2022 trade revenge: Mitch 127.90, Stilly 94.92, Barkley 20.50, Thielen 11.60, Taylor 1.80; 25-game archive contains three verified revenge games.');
