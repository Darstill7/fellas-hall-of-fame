// Championship trade history must follow exact archived playoff starters and receiving-side trades.
// Does NOT claim a trade was necessary for a win or infer replacement lineups.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const archive=read('data/trade_museum_stage66.json');
const boxes=read('data/championship_player_boxscores_2020_2025_v1.json').games;
const brackets=read('data/verified_sleeper_playoff_brackets_2020_2025.json').seasons;
const research=read('data/championship_trade_impact_receipts_2020_2025_v1.json');
const html=fs.readFileSync('analytics/greatest-worst-trades.html','utf8');
const name=x=>x==='Tom'?'Thommy':x==='EvansBrandon'?'Evans':x;
const close=(a,b)=>Math.abs(a-b)<.011;
assert.equal(research.schema,'fellas-championship-trade-impact-receipts-v1');
assert.equal(boxes.length,12);
assert.equal(research.coverage.championPlayoffGamesReviewed,boxes.length);
const rebuilt=[];
for(const game of boxes){
 const season=brackets.find(s=>s.year===game.year);
 assert.equal(season?.champion,game.champion,'Bracket champion identity mismatch '+game.year);
 const margin=Number((game.score-game.opponentScore).toFixed(2));
 assert(margin>0,'Championship side must have won '+game.year+' '+game.round);
 for(const trade of archive.filter(x=>x.year===game.year&&x.week<game.week)){
  const recipient=trade.sides.find(s=>name(s.manager)===game.champion);
  if(!recipient)continue;
  const assets=recipient.assets.split(' + ').map(x=>x.trim());
  const matching=game.starters.filter(s=>assets.includes(s.name));
  if(!matching.length)continue;
  rebuilt.push({year:game.year,round:game.round,tradeId:trade.id,champion:game.champion,
   names:matching.map(s=>s.name),points:Number(matching.reduce((sum,s)=>sum+s.points,0).toFixed(2)),
   margin});
 }
}
assert.equal(rebuilt.length,research.qualifiedPlayoffReceipts.length,'Trade-player/game coverage changed');
for(let i=0;i<rebuilt.length;i++){
 const a=rebuilt[i],b=research.qualifiedPlayoffReceipts[i];
 assert.equal(a.year,b.year);assert.equal(a.round,b.round);
 assert.equal(a.tradeId,b.tradeId);assert.equal(a.champion,b.champion);
 assert.deepEqual(a.names,b.players.map(p=>p.name));
 assert(close(a.points,b.totalAcquiredStarterPoints));assert(close(a.margin,b.margin));
 assert.equal(b.greaterThanWinningMargin,a.points>a.margin);
}
const retrieve=(year,round,trade)=>research.qualifiedPlayoffReceipts.find(x=>x.year===year&&x.round===round&&x.tradeId===trade);
const tony=research.qualifiedPlayoffReceipts.filter(x=>x.year===2021&&x.round==='championship');
assert.equal(tony.length,4);
assert(close(tony.reduce((a,b)=>a+b.totalAcquiredStarterPoints,0),62.90));
assert(tony.every(x=>close(x.margin,4.30)));
const henryEvans=retrieve(2023,'semifinal','1023059879336013824');
assert(henryEvans&&close(henryEvans.totalAcquiredStarterPoints,44.98)&&close(henryEvans.margin,33.08));
const higgins=retrieve(2024,'semifinal','1144362000575840256');
const higginsFinal=retrieve(2024,'championship','1144362000575840256');
assert(higgins&&close(higgins.totalAcquiredStarterPoints,15.80)&&close(higgins.margin,2.30));
assert(higginsFinal&&close(higginsFinal.totalAcquiredStarterPoints,34.60));
const titlePlayers=research.qualifiedPlayoffReceipts.filter(x=>x.round==='championship')
 .flatMap(x=>x.players.map(p=>({year:x.year,champion:x.champion,player:p.name,points:p.points,tradeId:x.tradeId,championshipMargin:x.margin})))
 .sort((a,b)=>b.points-a.points||a.year-b.year);
assert.equal(research.coverage.championshipAcquiredPlayerGameEntries,titlePlayers.length);
assert.equal(research.championshipAcquiredStarterLeaderboard.length,titlePlayers.length);
research.championshipAcquiredStarterLeaderboard.forEach((row,index)=>{
 assert.equal(row.rank,index+1);
 for(const field of ['year','champion','player','points','tradeId','championshipMargin'])
  assert.equal(row[field],titlePlayers[index][field],'Title-game player scoring mismatch '+index+' '+field);
});
assert.equal(titlePlayers[0].player,'Tee Higgins');
assert.equal(titlePlayers[0].points,34.6);
for(const label of ['id="championship-changing-trades"','62.90','44.98','15.80','34.60','replacement-adjusted'])
 assert(html.includes(label),'Trade history page is missing qualified context '+label);
assert(!research.status.includes('definitive')&&!research.methodology.some(x=>x.includes('proves the trade was necessary')));
assert(research.researchQueue.some(x=>x.topic.includes('2016–2019')));
const awards=read('data/championship_trade_awards_2020_2025_v1.json');
assert.equal(awards.schema,'fellas-championship-trade-awards-2020-2025-v1');
assert.equal(awards.coverage.matchedTradePlayerGameReceipts,research.qualifiedPlayoffReceipts.length);
const tradeScores=new Map();
for(const receipt of research.qualifiedPlayoffReceipts){
 const original=archive.find(t=>t.id===receipt.tradeId);
 const recipient=original?.sides.find(s=>name(s.manager)===receipt.champion);
 assert(original&&recipient,'Awards need traceable source trade and recipient');
 const current=tradeScores.get(receipt.tradeId)||{year:receipt.year,holder:receipt.champion,points:0,rounds:{}};
 current.points=Number((current.points+receipt.totalAcquiredStarterPoints).toFixed(2));
 current.rounds[receipt.round]=receipt.totalAcquiredStarterPoints;
 tradeScores.set(receipt.tradeId,current);
}
const expectedAwards=[...tradeScores].sort((a,b)=>b[1].points-a[1].points);
assert.equal(awards.coverage.distinctRecipientTrades,expectedAwards.length);
assert.equal(awards.eligibleRanking.length,expectedAwards.length);
expectedAwards.forEach(([id,group],i)=>{
 const saved=awards.eligibleRanking[i];
 assert.equal(saved.rank,i+1);
 assert.equal(saved.tradeId,id);
 assert.equal(saved.year,group.year);
 assert.equal(saved.receivingManager,group.holder);
 assert.equal(saved.totalPlayoffStarterPoints,group.points);
});
assert.equal(awards.officialScopedRecord.tradeId,expectedAwards[0][0]);
assert.equal(awards.officialScopedRecord.holder,'Stilly');
assert.equal(awards.officialScopedRecord.value,57.68);
assert.equal(awards.officialScopedRecord.semifinalPoints,44.98);
assert.equal(awards.officialScopedRecord.championshipPoints,12.70);
const higgins=awards.honorableDistinctions.find(x=>x.player==='Tee Higgins');
const mixon=awards.honorableDistinctions.find(x=>x.player==='Joe Mixon');
assert(higgins&&higgins.semifinalPoints===15.8&&higgins.semifinalWinningMargin===2.3);
assert(mixon&&mixon.championshipPoints===29.5&&mixon.championshipWinningMargin===4.3);
const holderPage=fs.readFileSync('analytics/record-holders.html','utf8');
const recordBook=fs.readFileSync('analytics/records.html','utf8');
const holderJs=fs.readFileSync('assets/record-holders-page.mjs','utf8');
assert(html.includes('id="championship-trade-awards"'));
assert(holderPage.includes('id="championship-trade-record"'));
assert(recordBook.includes('id="championship-trade-impact-record"'));
assert(holderJs.includes('championshipTradeRecord')&&holderJs.includes("'#championship-trade-record'"));
assert(html.includes('57.68')&&html.includes('15.80')&&html.includes('29.50'));
console.log('PASS championship trade impacts: '+boxes.length+' champion playoff box scores, '+rebuilt.length+' incoming-player/game trade receipts, 2021/2023/2024 hero contexts, no fabricated causal verdicts.');
