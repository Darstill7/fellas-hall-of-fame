// Expands playoff trade-revenge research only as far as verified winner-bracket scores
// and champion-side playoff starter box scores support.
// Usage: node scripts/build-expanded-playoff-trade-revenge.mjs [--check]
import fs from 'node:fs';
import assert from 'node:assert/strict';
const input=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const src=['data/playoff_explorer_verified_2016_2025_v1.json','data/trade_museum_stage66.json','data/championship_player_boxscores_2020_2025_v1.json','data/playoff_trade_revenge_2020_2025_v1.json','data/sleeper_2022_w15_mitch_stilly_trade_reunion_v1.json'];
const seasons=input(src[0]).seasons.filter(x=>x.year>=2020&&x.year<=2025);
const trades=input(src[1]);
const boxscores=input(src[2]).games;
const prior=input(src[3]);
const recovered=input(src[4]);
assert.equal(recovered.teamWinner.starters.reduce((n,p)=>n+p.points,0).toFixed(2),'127.90');
assert.equal(recovered.teamLoser.starters.reduce((n,p)=>n+p.points,0).toFixed(2),'94.92');
const normalize=x=>x==='Tom'?'Thommy':x==='EvansBrandon'?'Evans':x;
const round=n=>Number(n.toFixed(2));
const games=[],tradeCandidates=[];
for(const season of seasons){
 for(const game of season.matches){
  const entry={year:season.year,round:game.round,week:game.week,winner:game.winner,loser:game.loser,winnerScore:game.winner===game.home?game.homeScore:game.awayScore,loserScore:game.winner===game.home?game.awayScore:game.homeScore,margin:game.margin,matchVerified:true,eligibleDirectTradeIds:[],status:'no_eligible_direct_trade_in_tracked_archive'};
  for(const trade of trades.filter(t=>t.year===season.year&&t.week<game.week&&t.sides.length===2)){
   const winnerSide=trade.sides.find(side=>normalize(side.manager)===game.winner);
   const loserSide=trade.sides.find(side=>normalize(side.manager)===game.loser);
   if(!winnerSide||!loserSide)continue;
   const box=boxscores.find(b=>b.year===season.year&&b.week===game.week&&b.champion===game.winner&&Math.abs(b.score-entry.winnerScore)<.02&&Math.abs(b.opponentScore-entry.loserScore)<.02);
   const recoveryMatches=recovered.year===season.year&&recovered.week===game.week&&recovered.teamWinner.manager===game.winner&&recovered.teamLoser.manager===game.loser&&Math.abs(recovered.teamWinner.score-entry.winnerScore)<.02&&Math.abs(recovered.teamLoser.score-entry.loserScore)<.02;
   const recoveredBox=recoveryMatches?{starters:recovered.teamWinner.starters}:null;
   const receiptBox=box||recoveredBox;
   const assets=winnerSide.assets.split(' + ').map(x=>x.trim());
   const starters=receiptBox?.starters.filter(p=>assets.includes(p.name))||[];
   const receipt={year:season.year,round:game.round,week:game.week,winner:game.winner,loser:game.loser,winningMargin:game.margin,tradeId:trade.id,tradeDate:trade.date,winnerReceived:winnerSide.assets,loserReceived:loserSide.assets,archivedWinnerStarterBoxAvailable:!!receiptBox,starterReceiptSource:box?'championship_player_boxscores_2020_2025':recoveredBox?'sleeper_2022_w15_mitch_stilly_trade_reunion':'not_available',startedPlayers:starters.map(p=>({name:p.name,points:p.points})),verifiedFormerPlayerPoints:receiptBox?round(starters.reduce((sum,p)=>sum+p.points,0)):null,evidenceStatus:!receiptBox?'starter_box_missing':starters.length?'verified_started_against_former_manager':'verified_not_started'};
   entry.eligibleDirectTradeIds.push(trade.id);
   tradeCandidates.push(receipt);
  }
  const recent=tradeCandidates.filter(c=>c.year===entry.year&&c.week===entry.week&&c.winner===entry.winner);
  if(entry.eligibleDirectTradeIds.length)entry.status=recent.some(c=>c.evidenceStatus==='verified_started_against_former_manager')?'verified_revenge':recent.every(c=>c.evidenceStatus==='verified_not_started')?'verified_trade_but_no_received_starter':'direct_trade_candidate_starter_unverified';
  games.push(entry);
 }
}
const verified=tradeCandidates.filter(x=>x.evidenceStatus==='verified_started_against_former_manager');
const awaiting=tradeCandidates.filter(x=>x.evidenceStatus==='starter_box_missing');
const numeric=verified.map(c=>({game:c.year+':'+c.week+':'+c.winner,tradeId:c.tradeId,points:c.verifiedFormerPlayerPoints}));
assert.equal(prior.confirmedCases.length,2,'Legacy champion-side source count has changed');
assert.equal(verified.length,4,'Verified revenge trade receipts have changed; audit source evidence');
assert.equal(awaiting.length,0,'New starter coverage gaps require review');
const recoveredCase=verified.find(x=>x.tradeId===recovered.tradeId&&x.year===2022);
assert(recoveredCase&&recoveredCase.verifiedFormerPlayerPoints===32.1&&recoveredCase.startedPlayers.length===2,'2022 verified Barkley/Thielen evidence mismatch');
const historic=prior.confirmedCases.flatMap(g=>g.formerPlayerTrades.map(t=>({key:g.season+':'+g.week+':'+g.winningManager,id:t.tradeId,points:t.points})));
for(const item of historic)assert(numeric.some(n=>n.game===item.key&&n.tradeId===item.id&&n.points===item.points),'Champion-side verified fixture drifted '+item.key);
const output={schema:'fellas-expanded-playoff-trade-revenge-v1',asOf:'2026-11-12',status:'verified_winners_bracket_matchups_with_source_scoped_starter_receipts',sources:src,coverage:{seasons:seasons.map(s=>s.year),verifiedWinnersBracketGames:games.length,missingWinnerBracketGames:seasons.flatMap(s=>s.coverage.missing.map(reason=>({year:s.year,reason}))),directOpponentTradeCandidates:tradeCandidates.length,confirmedStartedAgainstFormerManagerTradeLinks:verified.length,confirmedRevengeGames:games.filter(g=>g.status==='verified_revenge').length,unresolvedStarterCases:awaiting.length,scope:'Only verified winners-bracket games 2020–2025; confirmed starter receipts are limited to championship-winner box scores and separately recovered Mitch/Stilly Week 15 2022 Sleeper roster snapshots.'},games,tradeCandidates,verifiedRevengeLinks:verified,pendingStarterVerification:awaiting,methodology:['2022 Week 15 Mitch vs Stilly is independently confirmed from two archived Sleeper lineups; those starters sum to the verified 127.90–94.92 playoff score.','An eligible candidate requires a verified winners-bracket game and a two-manager transaction in the tracked museum before that playoff week in which the winner received assets from the loser.','An award requires exact matching player names in the winner’s verified starting lineup, not aggregate season production or roster possession.','A game with no candidate means none in the tracked museum, not proof that no trade occurred.','2020–2021 verified bracket data has missing opening rounds; playoff seasons 2016–2019 lack comparable starter receipts.','Two or more transactions in one game can aggregate for the combined record; a single trade must remain its own category.','Winning margin comparisons are purely descriptive; a hypothetical roster without the trade could score differently.'],missingResearch:[{years:[2020,2021],why:'Recover the specifically missing winners-bracket results before claiming full bracket coverage.'},{years:[2016,2017,2018,2019],why:'Acquire ESPN-era trade receipts plus original playoff player starts before admitting records.'}],recordPolicy:'Existing 48.60 two-trade combined and 44.98 single-trade honors remain leaders within the expanded 25-game bracket audit; the newly verified Mitch/Stilly 2022 trade produced 32.10 from two starters in the 32.98-point opening-round victory.'};
const dest='data/expanded_playoff_trade_revenge_2020_2025_v1.json';
const serialized=JSON.stringify(output,null,2)+'\n';
if(process.argv.includes('--check')){
 assert(fs.existsSync(dest)&&fs.readFileSync(dest,'utf8')===serialized,'Expanded playoff revenge registry is stale');
 console.log('EXPANDED PLAYOFF TRADE REVENGE VERIFIED: '+games.length+' games, '+verified.length+' matched starter links, '+awaiting.length+' unresolved candidates.');
}else{fs.writeFileSync(dest,serialized);console.log('Built '+dest)}
