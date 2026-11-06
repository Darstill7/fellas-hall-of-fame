import fs from 'node:fs';
import assert from 'node:assert/strict';
import {validateLineupCoverage} from '../assets/lineup-history-coverage.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const published=read('data/lineup_hindsight_coverage_2020_2025.json');
const audit=read('data-integrity/LINEUP_HISTORY_RECEIPT_AUDIT_2020_2025.json');
validateLineupCoverage(published,audit);
const alias={darstill:'Stilly',dsylvester9:'Stew',thommy:'Thommy',yogurtslinger15:'Stover',
 dillionpanthers15:'Stover',birchhh:'Birch',tsteg:'Tony',huppdawg80:'Mitch',ckuhl5:'Kuhl',
 jmidd:'JMid',sheffla:'Scott',evansbrandonm:'Evans',koble2323:'Koble'};
const slots=['QB','RB','RB','WR','WR','TE','FLEX','FLEX','DEF'];
function optimal(players){
 let dp=new Map([[0,0]]);
 for(const p of players.filter(p=>Number.isFinite(p.points))){
  const next=new Map(dp);
  for(const [mask,score] of dp)for(let i=0;i<9;i++){
   const slot=slots[i],fits=slot==='FLEX'?['RB','WR','TE'].includes(p.position):p.position===slot;
   if(!fits||mask&(1<<i))continue;
   const key=mask|(1<<i),v=score+p.points;
   if(!next.has(key)||next.get(key)<v)next.set(key,v);
  }
  dp=next;
 }
 return dp.get(511)??null;
}
function evaluate(r){
 const pool=[...r.starters,...r.bench];
 if(r.starters.some(p=>p.empty===true&&String(p.id)==='0'))return 'Vacant starting slot';
 const best=optimal(pool),started=r.starters.reduce((n,p)=>n+Number(p.points||0),0);
 if(!pool.every(p=>Number.isFinite(p.points)))return 'Unscored roster player';
 if(r.starters.length!==9||optimal(r.starters)===null)return 'Illegal or incomplete actual starter slots';
 if(!Number.isFinite(r.points))return 'Missing team points';
 if(new Set(pool.map(p=>String(p.id))).size!==pool.length)return 'Duplicate player IDs';
 if(!r.starters.every(p=>['QB','RB','WR','TE','DEF'].includes(p.position)))return 'Nonstandard starter position';
 if(Math.abs(started-r.points)>=.07)return 'Starter-score mismatch';
 if(best===null)return 'No feasible lineup under assumed slots';
 if(best+.07<r.points)return 'Optimizer below observed score';
 if(best<=0)return 'Nonpositive optimal scored lineup';
 return {actual:r.points,optimal:best,gap:Math.max(0,best-r.points),accuracy:100*r.points/best};
}
const receipt=new Map(audit.observations.map(x=>[[x.year,x.week,x.manager].join('/'),x]));
let observed=0,comparable=0,excluded=0;const reasons={};
for(const year of [2020,2021,2022,2023,2024,2025])
 for(let week=1;week<=(year===2020?13:14);week++){
  const path=year===2025&&[1,7].includes(week)
   ?'data/war_rosters_2025_week'+week+'.json'
   :'data/sleeper_roster_snapshots_'+year+'_week'+week+'.json';
  const raw=read(path),rosters=Array.isArray(raw)?raw:raw.rosters;
  assert.equal(rosters.length,10,'Missing team roster '+path);
  const file=audit.sourceFiles.find(x=>x.year===year&&x.week===week);
  assert.equal(file?.path,path,'Source file path changed '+path);
  let valid=0,invalid=0;const managers=new Set();
  for(const roster of rosters){
   const providerHandle=String(roster.owner||'').toLowerCase();
   const manager=year===2023&&providerHandle==='jmidd'?'Evans':alias[providerHandle];
   assert.ok(manager&&!managers.has(manager),'Missing or duplicate owner '+path);
   managers.add(manager);const key=[year,week,manager].join('/');
   const row=receipt.get(key);assert.ok(row,'Missing published receipt '+key);
   const result=evaluate(roster);observed++;
   if(typeof result==='string'){
    excluded++;invalid++;reasons[result]=(reasons[result]||0)+1;
    assert.equal(row.reason,result,'Exclusion reason mismatch '+key);
    assert.equal(row.accuracy,undefined,'Excluded team-week cannot be graded '+key);
   }else{
    comparable++;valid++;
    assert.equal(row.reason,undefined,'Unexpected excluded published row '+key);
    for(const metric of ['actual','optimal','gap'])
     assert.ok(Math.abs(row[metric]-result[metric])<.011,'Score mismatch '+key+' '+metric);
    assert.ok(Math.abs(row.accuracy-result.accuracy)<.00011,'Accuracy mismatch '+key);
   }
  }
  assert.equal(file.observed,10);assert.equal(file.comparable,valid);assert.equal(file.excluded,invalid);
 }
assert.equal(observed,830);assert.equal(comparable,822);assert.equal(excluded,8);
assert.deepEqual(reasons,published.exclusionReasons);
const mean=(arr,key)=>arr.length?arr.reduce((n,r)=>n+r[key],0)/arr.length:null;
for(const row of published.managerSeasons){
 const samples=audit.observations.filter(x=>x.year===row.year&&x.manager===row.manager);
 const eligible=samples.filter(x=>!x.reason);
 assert.equal(samples.length,row.observedWeeks,'Annual manager coverage mismatch '+row.manager+'/'+row.year);
 assert.equal(eligible.length,row.comparableWeeks,'Annual manager included-week count mismatch '+row.manager+'/'+row.year);
 assert.equal(samples.length-eligible.length,row.excludedWeeks,'Annual manager excluded-week count mismatch '+row.manager+'/'+row.year);
 const expectedReasons=samples.filter(x=>x.reason).map(x=>({week:x.week,reason:x.reason}));
 assert.deepEqual(row.excludedReasons,expectedReasons,'Wrong excluded-week explanation '+row.manager+'/'+row.year);
 if(eligible.length){
  assert.ok(Math.abs(row.averageHindsightAccuracy-mean(eligible,'accuracy'))<.011,
   'Annual manager hindsight accuracy cannot differ from included weeks '+row.manager+'/'+row.year);
  assert.ok(Math.abs(row.averageHindsightGap-mean(eligible,'gap'))<.011,
   'Annual manager hindsight gap cannot differ from included weeks '+row.manager+'/'+row.year);
 }else{
  assert.equal(row.averageHindsightAccuracy,null);
  assert.equal(row.averageHindsightGap,null);
 }
}
for(const manager of published.managers){
 const eligible=audit.observations.filter(x=>x.manager===manager.manager&&!x.reason);
 assert.ok(eligible.length>0);
 assert.ok(Math.abs(manager.averageHindsightAccuracy-mean(eligible,'accuracy'))<.011,
  'Career observed hindsight average differs from recorded team-weeks '+manager.manager);
 assert.ok(Math.abs(manager.averageHindsightGap-mean(eligible,'gap'))<.011,
  'Career observed hindsight point gap differs from recorded team-weeks '+manager.manager);
}
console.log('Source parity passed: 83 files, 830 weeks, 822 research-comparable, 8 excluded; no unsupported grades.');
