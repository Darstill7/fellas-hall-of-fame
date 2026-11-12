// Tony's 2021 four-acquisition championship editorial: verify every named contribution.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const get=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const study=get('data/tony_2021_championship_trade_case_study_v1.json');
const trades=get('data/trade_museum_stage66.json');
const boxes=get('data/championship_player_boxscores_2020_2025_v1.json').games.filter(g=>g.year===2021);
const anthology=get('data/championship_season_stories_2016_2025_v1.json').seasons.find(s=>s.year===2021);
const html=fs.readFileSync('analytics/tony-2021-four-trades-one-ring.html','utf8');
const museum=fs.readFileSync('analytics/greatest-worst-trades.html','utf8');
assert.equal(study.schema,'fellas-tony-2021-championship-trade-case-study-v1');
assert.equal(study.transactions.length,4);
assert.equal(boxes.length,2);
for(const row of study.transactions){
 const original=trades.find(t=>t.id===row.tradeId);
 assert(original,'Unknown archival trade '+row.tradeId);
 assert.equal(original.date,row.date);assert.equal(original.week,row.week);
 assert.equal(original.sides.find(s=>s.manager==='Tony')?.assets,row.tonyReceived);
 assert.equal(original.sides.find(s=>s.manager!=='Tony')?.assets,row.partnerReceived);
 assert(anthology.verifiedTradeReceipts.some(t=>t.id===row.tradeId));
 for(const game of boxes){
  assert.equal(game.champion,'Tony');
  assert.deepEqual(row.roundScores[game.round],row.featuredStarters.map(name=>{
    const starter=game.starters.find(x=>x.name===name);
    assert(starter,'Acquired starter absent from '+game.round+': '+name);
    return {name,points:starter.points};
  }));
 }
}
const total=round=>study.transactions.flatMap(t=>t.roundScores[round]).reduce((sum,player)=>sum+player.points,0);
assert(Math.abs(total('semifinal')-49.2)<.001);
assert(Math.abs(total('championship')-62.9)<.001);
assert(Math.abs(study.totals.combinedTwoRoundStarterPoints-112.1)<.001);
assert(Math.abs(boxes.find(g=>g.round==='championship').score-boxes.find(g=>g.round==='championship').opponentScore-4.3)<.001);
const textTerms=['2021-08-30','2021-10-05','2021-10-13','2021-10-27','Jonathan Taylor','Joe Mixon','CeeDee Lamb','Kyle Pitts','49.20','62.90','112.10','4.30','Davante Adams','Tampa Bay'];
for(const term of textTerms)assert(html.includes(term),'Missing factual case detail '+term);
assert(html.includes('alternative starters')&&html.includes('not a claim'));
assert(museum.includes('tony-2021-four-trades-one-ring.html'),'Trade Museum backlink missing');
console.log('PASS Tony 2021: 4 trades, 4 incoming starters, 49.20 semifinal points, 62.90 title points, no invented replacement result.');
