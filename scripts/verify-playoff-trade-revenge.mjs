// Verify only champion-playoff direct opponent reunions with independently matched trade receipts.
// Competing rosters and replacement fantasy points are not inferred.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const archive=read('data/playoff_trade_revenge_2020_2025_v1.json');
const games=read('data/championship_player_boxscores_2020_2025_v1.json').games;
const seasons=read('data/season_weekly_matchups_2016_2026_v1.json').bySeason;
const trades=read('data/trade_museum_stage66.json');
const norm=name=>name==='Tom'?'Thommy':name==='EvansBrandon'?'Evans':name;
const round=num=>Number(num.toFixed(2));
assert.equal(archive.schema,'fellas-playoff-trade-revenge-2020-2025-v1');
assert.equal(games.length,12);
assert.equal(archive.coverage.championPlayoffGamesChecked,games.length);
const rebuilt=[];
for(const game of games){
 const match=seasons[String(game.year)].games.filter(x=>x.stage==='postseason_unclassified'&&x.week===game.week&&(x.home===game.champion||x.away===game.champion)&&Math.abs((x.home===game.champion?x.homeScore:x.awayScore)-game.score)<.02&&Math.abs((x.home===game.champion?x.awayScore:x.homeScore)-game.opponentScore)<.02);
 assert.equal(match.length,1,'Cannot resolve playoff opponent '+game.year+' '+game.round);
 const m=match[0],opponent=m.home===game.champion?m.away:m.home,qualifying=[];
 for(const t of trades.filter(t=>t.year===game.year&&t.week<game.week&&t.sides.length===2)){
  const receiving=t.sides.find(s=>norm(s.manager)===game.champion);
  const sending=t.sides.find(s=>norm(s.manager)===opponent);
  if(!receiving||!sending)continue;
  const assets=receiving.assets.split(' + ');
  const players=game.starters.filter(p=>assets.includes(p.name));
  if(!players.length)continue;
  qualifying.push({tradeId:t.id,points:round(players.reduce((a,p)=>a+p.points,0)),names:players.map(p=>p.name)});
 }
 rebuilt.push({year:game.year,round:game.round,winner:game.champion,opponent,margin:round(game.score-game.opponentScore),trades:qualifying,points:round(qualifying.reduce((a,t)=>a+t.points,0))});
}
const sourced=archive.gamesReviewed;
assert.equal(sourced.length,rebuilt.length);
for(let i=0;i<rebuilt.length;i++){
 const x=rebuilt[i],y=sourced[i];
 assert.equal(x.year,y.season);assert.equal(x.round,y.round);
 assert.equal(x.winner,y.winningManager);assert.equal(x.opponent,y.losingManager);
 assert.equal(x.margin,y.margin);assert.equal(x.points,y.formerPlayerPoints);
 assert.deepEqual(x.trades.map(t=>t.tradeId),y.formerPlayerTrades.map(t=>t.tradeId));
 assert.deepEqual(x.trades.map(t=>t.names),y.formerPlayerTrades.map(t=>t.scoringPlayers.map(p=>p.name)));
}
const cases=rebuilt.filter(x=>x.trades.length).sort((a,b)=>b.points-a.points);
assert.equal(cases.length,2);
assert.equal(cases[0].year,2024);assert.equal(cases[0].opponent,'Stilly');assert.equal(cases[0].points,48.6);
assert.equal(cases[0].trades.length,2);
assert.equal(cases[1].year,2023);assert.equal(cases[1].opponent,'Tony');assert.equal(cases[1].points,44.98);
assert.equal(cases[1].trades.length,1);
assert.equal(archive.recordA.points,48.6);
assert.equal(archive.recordB.points,44.98);
// Keep published coverage language aligned with the independent expanded bracket registry.
const expanded=read('data/expanded_playoff_trade_revenge_2020_2025_v1.json');
assert.equal(expanded.schema,'fellas-expanded-playoff-trade-revenge-v1');
assert.equal(expanded.coverage.verifiedWinnersBracketGames,expanded.games.length);
assert.equal(expanded.games.length,30);
assert.equal(expanded.coverage.newlyRecoveredBracketGames,5);
assert.equal(expanded.tradeCandidates.length,4);
assert.equal(expanded.verifiedRevengeLinks.length,4);
assert.equal(expanded.games.filter(g=>g.status==='verified_revenge').length,3);
const museum=fs.readFileSync('analytics/greatest-worst-trades.html','utf8');
const records=fs.readFileSync('analytics/records.html','utf8');
const holders=fs.readFileSync('analytics/record-holders.html','utf8');
const finder=fs.readFileSync('assets/record-holders-page.mjs','utf8');
assert(museum.includes('id="trade-revenge"')&&museum.includes('48.60')&&museum.includes('44.98'));
assert(museum.includes('expanded 30-game winners-bracket archive'),'Published trade museum must report all 30 verified winners-bracket games');
assert(!museum.includes('expanded 25-game archive'),'Outdated playoff archive count must not reappear');
assert(records.includes('id="playoff-trade-revenge-records"'));
assert(holders.includes('id="playoff-trade-revenge-records"'));
assert(finder.includes('tradeRevenge?.recordA?.holder')&&finder.includes('tradeRevenge?.recordB?.holder'));
assert(archive.causalityCaution.includes('not replacement-adjusted'));
console.log('PASS playoff trade revenge: 12 verified champion games; 2 direct opponent reunions; 3 original trades; 48.60 and 44.98 scoped records.');
