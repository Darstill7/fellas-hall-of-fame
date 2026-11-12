// Evidence-first playoff upset and elimination candidates, regular-standings-only records separate.
// node scripts/build-playoff-upsets-records.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const espnPath='data/verified_espn_playoff_brackets_2016_2019.json';
const sleeperPath='data/verified_sleeper_playoff_brackets_2020_2025.json';
const receiptsPath='data/postseason_winners_bracket_record_receipts_2016_2025_v1.json';
const espn=load(espnPath),sleeper=load(sleeperPath),source=load(receiptsPath);
const seedByYear=new Map([...espn.seasons,...sleeper.seasons].map(s=>[s.year,s.seedByManager]));
assert.equal(seedByYear.size,10);
assert.equal(source.receipts.length,41);
const cent=n=>Math.round(n*100),money=n=>n/100;
const games=source.receipts.map(g=>{
 const seeds=seedByYear.get(g.year);
 assert(seeds,'Unseeded playoff year '+g.year);
 const winnerSeed=seeds[g.winner],loserSeed=seeds[g.loser];
 assert(Number.isInteger(winnerSeed)&&Number.isInteger(loserSeed));
 assert.notEqual(g.winner,g.loser);
 assert.equal(cent(g.winnerPoints)-cent(g.loserPoints),cent(g.margin),
  'Mismatch source score/margin '+g.year+' '+g.week);
 return {...g,winnerSeed,loserSeed,seedGap:winnerSeed-loserSeed,
  evidenceKey:[g.year,g.week,g.round,g.winner,g.loser].join('|')};
});
const upset=games.filter(g=>g.seedGap>0);
const asEvent=(g,value)=>({manager:g.winner,opponent:g.loser,year:g.year,week:g.week,round:g.round,
 value,evidence:{winnerSeed:g.winnerSeed,loserSeed:g.loserSeed,seedGap:g.seedGap,
 winnerPoints:g.winnerPoints,loserPoints:g.loserPoints,margin:g.margin,
 twoWeekAggregate:g.twoWeekAggregate,sourceStage:g.sourceStage}});
const asDefeat=(g,value)=>({manager:g.loser,opponent:g.winner,year:g.year,week:g.week,round:g.round,
 value,evidence:{winnerSeed:g.winnerSeed,loserSeed:g.loserSeed,seedGap:g.seedGap,
 winnerPoints:g.winnerPoints,loserPoints:g.loserPoints,margin:g.margin,
 twoWeekAggregate:g.twoWeekAggregate,sourceStage:g.sourceStage}});
const sumEvents=(matches,chooser)=>{const map=new Map();
 for(const g of matches){const k=chooser(g);if(!map.has(k))map.set(k,[]);
 map.get(k).push({year:g.year,week:g.week,round:g.round,winner:g.winner,loser:g.loser,
 winnerSeed:g.winnerSeed,loserSeed:g.loserSeed,margin:g.margin,twoWeekAggregate:g.twoWeekAggregate})}
 return [...map].map(([manager,evidence])=>({manager,value:evidence.length,evidence}))};
const categories=[
 {id:'playoff-upset-largest-seed-gap',title:'Largest championship-bracket seed upset',direction:'high',
 rows:upset.map(g=>asEvent(g,g.seedGap))},
 {id:'playoff-upset-largest-semifinal',title:'Largest semifinal seed upset',direction:'high',
 rows:upset.filter(g=>g.round==='semifinal').map(g=>asEvent(g,g.seedGap))},
 {id:'playoff-upset-largest-opening',title:'Largest opening-round seed upset',direction:'high',
 rows:upset.filter(g=>g.round==='opening').map(g=>asEvent(g,g.seedGap))},
 {id:'playoff-upset-most-career',title:'Most career championship-bracket seed upsets',direction:'high',
 rows:sumEvents(upset,g=>g.winner)},
 {id:'playoff-upset-most-top-two',title:'Most playoff victories over a higher-seeded top-two opponent',direction:'high',
 rows:sumEvents(upset.filter(g=>g.loserSeed<=2),g=>g.winner)},
 {id:'playoff-elimination-most-one-seeds',title:'Most No. 1 seeds personally eliminated',direction:'high',
 rows:sumEvents(games.filter(g=>g.loserSeed===1),g=>g.winner)},
 {id:'playoff-elimination-most-one-seed-exits',title:'Most seasons eliminated as No. 1 seed',direction:'high',
 rows:sumEvents(games.filter(g=>g.loserSeed===1),g=>g.loser)},
 {id:'playoff-elimination-narrowest',title:'Narrowest single-week championship-bracket elimination',direction:'low',
 rows:games.filter(g=>!g.twoWeekAggregate).map(g=>asDefeat(g,g.margin))},
 {id:'playoff-elimination-biggest-margin',title:'Largest single-week championship-bracket elimination margin',direction:'high',
 rows:games.filter(g=>!g.twoWeekAggregate).map(g=>asDefeat(g,g.margin))},
 {id:'playoff-elimination-top-seed-closest',title:'Narrowest single-week defeat eliminating a No. 1 seed',direction:'low',
 rows:games.filter(g=>!g.twoWeekAggregate&&g.loserSeed===1).map(g=>asDefeat(g,g.margin))}
];
for(const category of categories){
 const rows=category.rows;
 rows.sort((a,b)=>category.direction==='low'?a.value-b.value||a.year-b.year:
 b.value-a.value||a.year-b.year);
 let previous=null,rank=0;
 for(const [i,row] of rows.entries()){if(row.value!==previous){rank=i+1;previous=row.value}row.rank=rank}
 category.count=rows.length;
 category.holders=rows.filter(row=>row.rank===1);
 category.leaders=rows.filter(row=>row.rank<=5);
 delete category.rows;
}
const result={schema:'fellas-playoff-seed-upsets-research-v1',status:'provisional-not-published',
 sourcePaths:[espnPath,sleeperPath,receiptsPath],
 coverage:{from:2016,through:2025,verifiedChampionshipBracketGames:games.length,
 officialSeeds:seedByYear.size,seedUpsets:upset.length,oneSeedEliminations:games.filter(g=>g.loserSeed===1).length,
 singleWeekGames:games.filter(g=>!g.twoWeekAggregate).length},
 definitions:[
 'A seed upset is defined strictly as winning with a numerically higher seed number. No claim about betting odds or probabilities.',
 'Only recovered winner championship-bracket pairing receipts count; all games have both seed identities in original bracket assignments.',
 '2016/2017 two-week ESPN aggregates count for seed-upset and seed-elimination records but NOT for single-week margin records.',
 'Consolation and unclassified postseason matchups are excluded; first-round byes are not victories or playoff games.',
 'Seed #1 elimination counts only the single bracket game that ended that season’s title chase.',
 'Tie holders share competition rank one; all tied first-place events are retained.',
 'Raw fantasy scores across scoring eras are descriptive and not normalized; seed gap is independent of scoring format.',
 'Do not count this 10-category proposal as ten additional published records without deduplication against Legendary and Playoff Records.'
 ],categoryCount:categories.length,categories};
assert.equal(result.categoryCount,10);
console.log(JSON.stringify(result,null,2));
