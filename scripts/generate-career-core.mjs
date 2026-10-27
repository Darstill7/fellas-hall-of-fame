// Deterministically derive simple career W/L/T, annual and opponent H2H from the game ledger.
// Do not infer championships, player WAR, or postseason outcomes from regular season games.
// Run: node scripts/generate-career-core.mjs [--check]
import fs from 'node:fs';
const source='data/unified_record_book_2016_2026.json';
const target='data/career_core_generated.json';
const ledger=JSON.parse(fs.readFileSync(source,'utf8'));
const managers={};
for(const game of ledger.games.filter(g=>g.stage==='regular')){
 for(const [manager,points,against,opponent] of [[game.home,game.homeScore,game.awayScore,game.away],[game.away,game.awayScore,game.homeScore,game.home]]){
  if(manager===opponent||!Number.isFinite(points)||!Number.isFinite(against))throw Error('Bad game record: '+game.year+' W'+game.week);
  const career=managers[manager]??={games:0,w:0,l:0,t:0,annual:{},h2h:{}};
  const annual=career.annual[game.year]??={games:0,w:0,l:0,t:0};
  const pair=career.h2h[opponent]??={games:0,w:0,l:0,t:0};
  const result=points>against?'w':points<against?'l':'t';
  for(const record of [career,annual,pair]){record.games++;record[result]++}
 }
}
const sorted=Object.fromEntries(Object.keys(managers).sort().map(id=>[id,managers[id]]));
const output={schemaVersion:1,source,regularSeasonGames:ledger.games.filter(g=>g.stage==='regular').length,managers:sorted};
const contents=JSON.stringify(output,null,2)+'\n';
if(process.argv.includes('--check')){
 if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==contents){
  console.error('Generated career records are stale; run node scripts/generate-career-core.mjs');
  process.exit(1);
 }
 console.log('Career core generated data PASS: '+Object.keys(sorted).length+' managers, '+output.regularSeasonGames+' regular games');
}else{
 fs.writeFileSync(target,contents);
 console.log('Generated '+target);
}
