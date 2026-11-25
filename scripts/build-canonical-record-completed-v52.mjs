// Completed-season ownership candidates. Preserve the scope and tie rules of each source.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {auditAllEraFinishes} from '../assets/all-era-final-placements.mjs';
import {auditPlacementStatistics} from '../assets/placement-statistics.mjs';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const normalize=n=>n==='Tom'?'Thommy':n;
export function buildCompleted(allEra,placements,receipts,legendary,postseason,floor,ledger){
 const a=auditAllEraFinishes(allEra),s=auditPlacementStatistics(placements,receipts);
 const scope='Completed seasons 2016–2025';const records=[],excluded=[];
 const add=(id,label,value,unit,holders,qualification,source,recordScope=scope)=>{
  assert.ok(id&&label&&qualification&&source&&holders.length);
  assert.ok(typeof value==='string'?value.length>0:Number.isFinite(value));
  const normalized=[...new Set(holders.map(h=>normalize(h.manager)))].sort().map(manager=>({manager,evidence:holders.filter(h=>normalize(h.manager)===manager).map(h=>({...h,manager}))}));
  records.push({id,label,value,unit,scope:recordScope,qualification,source,holders:normalized,shared:normalized.length>1});
 };
 const peak=(id,label,rows,metric,direction,unit,qualification,source,recordScope=scope)=>{
  assert.ok(rows.length,id);assert.ok(rows.every(r=>Number.isFinite(metric(r))),id);
  const value=Math[direction](...rows.map(metric));
  add(id,label,value,unit,rows.filter(r=>metric(r)===value),qualification,source,recordScope);
 };
 const allSrc='data/fellas_final_placements_2016_2025_verified.json';
 peak('seasons-played','Most completed seasons',a.managers,r=>r.seasonsPlayed,'max','seasons','Official final ranks across both platforms',allSrc);
 peak('top-three-finishes','Most top-three final finishes',a.managers,r=>r.topThree,'max','finishes','Official final ranks across both platforms',allSrc);
 peak('top-half-finishes','Most top-half final finishes',a.managers,r=>r.topHalf,'max','finishes','Top half of the official field; 2016 eight teams',allSrc);
 peak('average-finish','Best average normalized career finish',a.managers.filter(r=>r.seasonsPlayed>=6),r=>r.meanFinishScore,'max','finish score','Minimum six completed seasons; 100=first, 0=last; two-decimal published score',allSrc);
 const sleeperSrc='data/fellas_final_placements_2020_2025.json + data/sleeper_postseason_placement_receipts_2020_2025.json';
 for(const r of s.records)add('sleeper-'+r.id,r.label,r.value,r.id==='best_average_six'?'avg place':'finishes',s.stats.filter(x=>r.holders.includes(x.manager)),'Verified Sleeper final standings; minimum '+r.qualifiedMinSeasons+' completed seasons',sleeperSrc,'Completed Sleeper seasons 2020–2025');
 // Use every verified bracket participant, not a truncated leaderboard.
 const postSrc='data/postseason_records_verified_v1.json';
 const p=postseason.managers;
 for(const [id,label,field] of [
  ['playoff-berths','Most championship-bracket appearances','appearances'],
  ['finals','Most championship-game appearances','finals'],
  ['semifinals','Most semifinal appearances','semifinals'],
  ['playoff-byes','Most playoff byes','byes'],
  ['top-seeds','Most top seeds','topSeeds'],
  ['championships','Most championships','championships']
 ])peak(id,label,p,r=>r[field].length,'max','seasons','Verified championship bracket only',postSrc);
 const streaks=p.map(r=>{let length=0,max=0,previous=null;const years=[...r.appearances].sort((a,b)=>a-b);for(const y of years){length=y===previous+1?length+1:1;max=Math.max(max,length);previous=y;}return {...r,streak:max};});
 peak('playoff-berth-streak','Longest consecutive playoff berth streak',streaks,r=>r.streak,'max','seasons','Consecutive calendar seasons in verified championship brackets',postSrc);
 const games=ledger.games.filter(g=>g.year<=2025&&g.stage!=='regular'&&!g.twoWeekAggregate&&!g.cumulativeScoring&&g.scoreAggregation!=='running_three_week_consolation_total'&&g.home!==g.away&&Number.isFinite(g.homeScore)&&Number.isFinite(g.awayScore));
 assert.equal(games.length,postseason.qualifiedPostseasonMatchups);
 const rows=games.flatMap(g=>[[g.home,g.away,g.homeScore,g.awayScore],[g.away,g.home,g.awayScore,g.homeScore]].map(([manager,opponent,points,against])=>({manager,opponent,points,against,margin:Number((points-against).toFixed(2)),year:g.year,week:g.week,stage:g.stage})));
 const postScope=scope+'; all recovered eligible postseason stages, including consolation';
 const q='Single-week scores only; no cumulative or multiweek aggregates';
 peak('postseason-highest-single-week','Highest recorded postseason single-week score',rows,r=>r.points,'max','pts',q,postSrc,postScope);
 peak('postseason-lowest-single-week','Lowest recorded postseason single-week score',rows,r=>r.points,'min','pts',q,postSrc,postScope);
 peak('postseason-biggest-win','Largest recorded postseason single-week victory',rows.filter(r=>r.margin>0),r=>r.margin,'max','pts',q,postSrc,postScope);
 peak('postseason-closest-win','Closest recorded postseason single-week victory',rows.filter(r=>r.margin>0),r=>r.margin,'min','pts',q,postSrc,postScope);
 for(const c of legendary.categories){
  if(c.id==='highest-score-in-loss'){excluded.push({id:c.id,reason:'Use current regular-season highest-score-loss instead; historical-only exhibit not counted twice'});continue;}
  if(c.id==='undefeated-six-week-champs'){excluded.push({id:c.id,reason:'Achievement cohort, not a ranked extremum'});continue;}
  add('legendary-'+c.id,c.label,c.metric,'',c.holder.map(h=>({...h,detail:c.detail})),c.rule,'data/legendary_records_2016_2025_v1.json');
 }
 assert.equal(floor.managerSeasons.length,floor.completeManagerSeasons);
 const fullSeason='Every canonical regular-season week in a completed manager-season must have a recorded score';
 for(const [id,label,field,unit,method] of [
  ['highest-season-floor','Highest complete-season scoring floor','minScore','pts','rank the lowest weekly score'],
  ['season-weeks-over100','Most weeks strictly over 100 in a completed season','weeksStrictlyOver100','weeks','count scores strictly greater than 100.00'],
  ['season-weeks-atleast105','Most weeks at least 105 in a completed season','weeksAtLeast105','weeks','count scores greater than or equal to 105.00']
 ])peak(id,label,floor.managerSeasons,r=>r[field],'max',unit,fullSeason+'; '+method,'data/scoring_floor_research_2016_2025_v1.json');
 assert.equal(new Set(records.map(r=>r.id)).size,records.length);
 return {schemaVersion:1,status:'completed-family-candidates-not-full-registry',categoryCount:records.length,scope,records,excluded};
}
// Run independent source verifiers before generating ownership candidates.
for(const script of ['verify-legendary-records.mjs','verify-postseason-records.mjs','verify-scoring-floor-research.mjs'])execFileSync(process.execPath,['scripts/'+script],{stdio:'inherit'});
const output=buildCompleted(read('fellas_final_placements_2016_2025_verified.json'),read('fellas_final_placements_2020_2025.json'),read('sleeper_postseason_placement_receipts_2020_2025.json'),read('legendary_records_2016_2025_v1.json'),read('postseason_records_verified_v1.json'),read('scoring_floor_research_2016_2025_v1.json'),read('unified_record_book_2016_2026.json'));
const file='data-integrity/canonical-record-completed-v52.json',body=JSON.stringify(output,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),body);else fs.writeFileSync(file,body);
console.log('Completed record candidates: '+output.categoryCount+'; '+output.excluded.length+' excluded exhibits.');
