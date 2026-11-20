// Recalculate ledger-derived all-time single-game records without touching the archived 44-category research registry.
// Usage: node scripts/build-alltime-game-records.mjs [--check]
import fs from 'node:fs';
const source='data/unified_record_book_2016_2026.json';
const target='data/alltime_game_records_live_v1.json';
const ledger=JSON.parse(fs.readFileSync(source,'utf8'));
const regular=ledger.games.filter(g=>g.stage==='regular');
if(!regular.length)throw Error('No regular-season canonical source games');
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const entries=regular.flatMap(g=>[
 {manager:g.home,opponent:g.away,points:g.homeScore,opponentPoints:g.awayScore,year:g.year,week:g.week,era:g.era},
 {manager:g.away,opponent:g.home,points:g.awayScore,opponentPoints:g.homeScore,year:g.year,week:g.week,era:g.era}
].map(x=>({...x,margin:round(x.points-x.opponentPoints)})));
for(const row of entries)if(!Number.isFinite(row.points)||!Number.isFinite(row.opponentPoints)||!Number.isInteger(row.year)||!Number.isInteger(row.week)||!row.manager||!row.opponent)
 throw Error('Invalid historical ledger game');
const specs=[
 {key:'highest-score',title:'Highest single-game score',select:()=>true,value:x=>x.points,order:'high'},
 {key:'lowest-score',title:'Lowest single-game score',select:()=>true,value:x=>x.points,order:'low'},
 {key:'highest-score-loss',title:'Highest score in a loss',select:x=>x.margin<0,value:x=>x.points,order:'high'},
 {key:'lowest-score-win',title:'Lowest winning score',select:x=>x.margin>0,value:x=>x.points,order:'low'},
 {key:'biggest-win',title:'Largest winning margin',select:x=>x.margin>0,value:x=>x.margin,order:'high'},
 {key:'narrowest-win',title:'Closest victory margin',select:x=>x.margin>0,value:x=>x.margin,order:'low'},
 {key:'narrowest-defeat',title:'Closest losing margin',select:x=>x.margin<0,value:x=>Math.abs(x.margin),order:'low'},
 {key:'biggest-defeat',title:'Largest losing margin',select:x=>x.margin<0,value:x=>Math.abs(x.margin),order:'high'}
];
const records=specs.map(spec=>{
 const candidates=entries.filter(spec.select).map(x=>({...x,value:round(spec.value(x))}));
 if(!candidates.length)throw Error('No candidates for '+spec.key);
 const best=spec.order==='high'?Math.max(...candidates.map(x=>x.value)):Math.min(...candidates.map(x=>x.value));
 const holders=candidates.filter(x=>x.value===best).sort((a,b)=>a.year-b.year||a.week-b.week||a.manager.localeCompare(b.manager));
 return {key:spec.key,title:spec.title,direction:spec.order,value:best,unit:'pts',holderCount:holders.length,holders};
});
const seasonWeek=Math.max(0,...regular.filter(g=>g.year===2026).map(g=>g.week));
for(let w=1;w<=seasonWeek;w++){
 const games=regular.filter(g=>g.year===2026&&g.week===w);
 if(games.length!==5||new Set(games.flatMap(g=>[g.home,g.away])).size!==10)
  throw Error('Noncontiguous 2026 final matchups in canonical ledger, Week '+w);
}
const result={
 schema:'fellas-ledger-alltime-single-game-v1',
 generatedFrom:source,
 verified2026ThroughWeek:seasonWeek,
 sourceGames:regular.length,
 sourceTeamGames:entries.length,
 coverage:'All recorded 2016–2026 regular-season scores only; not postseason or research-dependent all-time records',
 caveats:[
  'Historic ESPN integer-rounded scores and scoring rules differ from Sleeper; no cross-era normalization.',
  'Only directly computable single-game categories are refreshed; season awards and research records remain separately audited.',
  'All equal record values retain co-holder status; original season and week receipts are preserved.'
 ],
 records
};
const output=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--check')){
 if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==output)
  throw Error('All-time single-game records are stale against the canonical ledger');
 console.log('ALL-TIME GAME RECORD PARITY PASS: '+regular.length+' games, '+records.length+' categories, 2026 through Week '+seasonWeek);
}else{
 fs.writeFileSync(target,output);
 console.log('Rebuilt '+target+' from '+regular.length+' canonical games through 2026 Week '+seasonWeek);
}
