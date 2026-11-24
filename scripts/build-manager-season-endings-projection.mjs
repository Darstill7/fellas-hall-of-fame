// Derive annual regular records; preserve verified historical finishes and awards.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='data-integrity/historical-trade-draft-audits/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const stats=read(root+'full-era-career-statistics.json');
const legacy=read('data/manager_verified_season_endings_v1.json');
const legacyResults=read('data/manager_season_results_v1.json');
const placements=read('data/fellas_final_placements_2016_2025_verified.json');
const norm=n=>n==='Tom'?'Thommy':n==='EvansBrandon'?'Evans':n;
const managers={},rows=[],changes=[];
const completedThrough={year:stats.live_watermark.year,week:stats.live_watermark.completed_regular_week};
for(const s of stats.seasons)for(const [manager,r] of Object.entries(s.managers)){
 const year=s.year,current=year===completedThrough.year;
 const record=r.w+'-'+r.l+(r.t?'-'+r.t:'');
 const old=legacy.managers[manager]?.find(x=>x.year===year);
 let ending;
 if(current){
  ending={year,regular:record,ending:'Season in progress',note:'Verified regular-season results through Week '+completedThrough.week+'. Final placement not yet decided.',source:'Unified verified career engine'};
 }else{
  assert(old,manager+' missing historical ending '+year);
  const p=placements.seasons.find(x=>x.year===year).finishes.find(x=>norm(x.manager)===manager);
  assert(p,manager+' missing verified placement '+year);
  assert.equal(old.finalRank,p.rank,manager+' final rank '+year);
  ending={...old,regular:record};
 }
 if(old?.regular!==record)changes.push({manager,year,before:old?.regular??null,after:record});
 (managers[manager]??=[]).push(ending);
 rows.push({manager,year,record,wins:r.w,losses:r.l,ties:r.t,games:r.games,pf:r.pf_cents/100,ending:ending.ending,detail:ending.note,runnerUp:ending.finalRank===2,coverage:current?'verified_completed_regular_weeks':'verified_regular_season_and_final_placement',...(current?{}:{finalRank:ending.finalRank})});
}
assert.equal(rows.length,stats.seasons.reduce((n,s)=>n+Object.keys(s.managers).length,0));
assert.equal(rows.filter(r=>r.year<completedThrough.year).length,98);
assert.equal(rows.filter(r=>r.year===completedThrough.year).length,10);
for(const [m,rs] of Object.entries(managers))for(const r of rs.filter(r=>r.year<completedThrough.year)){
 const old=legacy.managers[m].find(x=>x.year===r.year);
 const {regular:a,...x}=old,{regular:b,...y}=r;assert.deepEqual(x,y,'Historical ending metadata must remain invariant');
}
const endings={...legacy,managers,completedThrough,status:'RESEARCH_ONLY'};
const results={...legacyResults,source:'Unified verified career engine and verified historical placement ledger',caveats:['Regular-season scores and postseason placements are distinct. Current season remains in progress.'],rows,completedThrough,status:'RESEARCH_ONLY'};
fs.writeFileSync(root+'manager-season-endings-preview.json',JSON.stringify(endings,null,2)+'\n');
fs.writeFileSync(root+'manager-season-results-preview.json',JSON.stringify(results,null,2)+'\n');
console.log('MANAGER SEASON ENDINGS PROJECTION PASS '+JSON.stringify({managers:Object.keys(managers).length,rows:rows.length,verified_historical_finishes:98,changes}));
