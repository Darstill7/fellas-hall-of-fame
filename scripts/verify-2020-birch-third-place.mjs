// Commissioner-confirmed canonical result for Birch's 2020 Week 16
// third-place game; never silently restore the conflicting archive score.
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
const near=(a,b)=>typeof a==='number'&&Math.abs(a-b)<0.001;
const original=read('data/playoff_matchups_2020_2025.json');
const ledger=read('data/unified_record_book_2016_2026.json');
const weekly=read('data/season_weekly_matchups_2016_2026_v1.json');
const receipt=read('data/sleeper_postseason_placement_receipts_2020_2025.json');
const ranks=read('data/fellas_final_placements_2020_2025.json');
const all=read('data/fellas_final_placements_2016_2025_verified.json');
const game=original.find(x=>x.year===2020&&x.week===16)?.games.filter(x=>
 x.home?.[0]==='yogurtslinger15'&&x.away?.[0]==='birchhh');
assert(game?.length===1,'Expected one 2020 Week 16 Birch/Stover archived game');
assert(near(game[0].home[1],78.9)&&near(game[0].away[1],110.14),
 'Commissioner-confirmed Birch third-place score must equal 110.14–78.90');
assert(near(game[0].scoreCorrection?.originalArchivedBirchScore,110.24)&&
 near(game[0].scoreCorrection?.confirmedBirchScore,110.14),
 'Original archived 110.24 must remain explicit as provenance; initial 110.10 correction superseded');
for(const [name,rows] of [
 ['unified ledger',ledger.games.filter(x=>x.year===2020)],
 ['weekly matchup mirror',weekly.bySeason['2020'].games]]){
 const match=rows.filter(x=>x.week===16&&x.home==='Stover'&&x.away==='Birch');
 assert(match.length===1&&near(match[0].homeScore,78.9)&&
 near(match[0].awayScore,110.14)&&near(match[0].margin,31.24)&&
 match[0].winner==='AWAY',name+' does not mirror corrected score/margin');
}
const s=receipt.seasons.find(x=>x.year===2020);
const third=s.placementGames.filter(x=>x.label==='3rd Place');
assert(third.length===1&&third[0].winner==='Birch'&&third[0].loser==='Stover'&&
 near(third[0].winnerScore,110.14)&&near(third[0].loserScore,78.9),
 'Canonical placement receipt disagrees with score');
assert(s.reviewNeeded?.length===0&&s.scoreCorrections?.some(c=>
 near(c.correctedScore,110.14)&&near(c.originalArchivedScore,110.24)&&
 near(c.earlierScreenshotReading,110.14)&&near(c.initialCommissionerStatement,110.10)),'Discrepancy provenance not resolved/preserved');
for(const records of [s.finalPlacements,ranks.seasons.find(x=>x.year===2020).finishers,
 all.seasons.find(x=>x.year===2020).finishes]){
 for(const name of ['Birch','Stover']){
  const row=records.find(x=>x.manager===name);
  assert(row?.scoreVerified===true,
   name+' placement source incorrectly remains unverified');
 }
}
const ui=fs.readFileSync('assets/verified-sleeper-placement-ui.mjs','utf8');
assert(ui.includes('Birch 110.14–78.90 Stover')&&
 ui.includes('commissioner'),'Public postseason placement must display corrected game score');
const src=fs.readFileSync('assets/placement-statistics-ui.mjs','utf8');
assert(!src.includes('2020 third-place finishing order is verified, but the third-place game score remains under review'),
 'Public placement statistics still show superseded dispute');
console.log('PASS: Birch 2020 third-place final 110.14–78.90, 31.24-point margin; all six mirrors reconcile; 110.24 source preserved.');
