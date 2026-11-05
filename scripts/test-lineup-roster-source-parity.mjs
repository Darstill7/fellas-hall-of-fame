import fs from 'node:fs';
import assert from 'node:assert/strict';
// Recompute complete Sleeper-era regular-season roster receipts, not skill grades.
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const audit=read('data-integrity/LINEUP_HISTORY_RECEIPT_AUDIT_2020_2025.json');
const summary=read('data/lineup_hindsight_coverage_2020_2025.json');
assert.equal(audit.observations.length,830);assert.equal(audit.sourceFiles.length,83);
assert.equal(summary.researchComparable,822);assert.equal(summary.excludedWeeks,8);
const slots=['QB','RB','RB','WR','WR','TE','FLEX','FLEX','DEF'];
const alias={darstill:'Stilly',dsylvester9:'Stew',thommy:'Thommy',yogurtslinger15:'Stover',dillionpanthers15:'Stover',birchhh:'Birch',tsteg:'Tony',huppdawg80:'Mitch',ckuhl5:'Kuhl',jmidd:'JMid',sheffla:'Scott',evansbrandonm:'Evans',koble2323:'Koble'};
function bestLineup(players){
 let states=new Map([[0,0]]);
 for(const p of players.filter(x=>Number.isFinite(x.points))){
  const next=new Map(states);
  for(const [mask,points] of states)for(let i=0;i<slots.length;i++){
   const eligible=slots[i]==='FLEX'?['RB','WR','TE'].includes(p.position):p.position===slots[i];
   if((mask&(1<<i))||!eligible)continue;
   const id=mask|(1<<i),total=points+p.points;
   if(total>(next.get(id)??-Infinity))next.set(id,total);
  }
  states=next;
 }
 return states.get(511)??null;
}
function calculate(roster){
 const pool=[...roster.starters,...roster.bench];
 if(roster.starters.some(p=>p.empty===true&&String(p.id)==='0'))return{reason:'Vacant starting slot'};
 const optimal=bestLineup(pool),sum=roster.starters.reduce((a,p)=>a+Number(p.points||0),0);
 if(!pool.every(p=>Number.isFinite(p.points)))return{reason:'Unscored roster player'};
 if(roster.starters.length!==9||bestLineup(roster.starters)===null)return{reason:'Illegal or incomplete actual starter slots'};
 if(!Number.isFinite(roster.points))return{reason:'Missing team points'};
 if(new Set(pool.map(x=>String(x.id))).size!==pool.length)return{reason:'Duplicate player IDs'};
 if(!roster.starters.every(p=>['QB','RB','WR','TE','DEF'].includes(p.position)))return{reason:'Nonstandard starter position'};
 if(Math.abs(sum-roster.points)>=.07)return{reason:'Starter-score mismatch'};
 if(optimal===null)return{reason:'No feasible lineup under assumed slots'};
 if(optimal+.07<roster.points)return{reason:'Optimizer below observed score'};
 if(optimal<=0)return{reason:'Nonpositive optimal scored lineup'};
 return{actual:+roster.points.toFixed(2),optimal:+optimal.toFixed(2),
  gap:+Math.max(0,optimal-roster.points).toFixed(2),accuracy:+(100*roster.points/optimal).toFixed(4)};
}
const original=new Map(audit.observations.map(x=>[[x.year,x.week,x.manager].join('/'),x]));
assert.equal(original.size,830);
const seen=new Set();let compared=0,excluded=0;
for(const f of audit.sourceFiles){
 const doc=read(f.path),rosters=Array.isArray(doc)?doc:doc.rosters;
 assert.equal(rosters.length,10,f.path);
 let weekly=0;const managers=new Set();
 for(const r of rosters){
  const name=alias[String(r.owner||'').toLowerCase()];
  assert.ok(name&&!managers.has(name),'Unknown or duplicate owner '+f.path);
  managers.add(name);
  const id=[f.year,f.week,name].join('/');
  assert.ok(!seen.has(id),'Duplicate team week '+id);seen.add(id);
  const expected=original.get(id);assert.ok(expected,'Missing archived row '+id);
  const value=calculate(r);
  assert.equal(value.reason??null,expected.reason??null,id+' exclusion');
  if(value.reason){excluded++;assert.equal(expected.accuracy,undefined)}
  else {
   compared++;weekly++;
   for(const key of ['actual','optimal','gap','accuracy'])
    assert.ok(Math.abs(value[key]-expected[key])<=.015,id+' '+key);
  }
 }
 assert.equal(weekly,f.comparable,f.path+' compared weeks');
 assert.equal(10-weekly,f.excluded,f.path+' excluded weeks');
}
assert.equal(seen.size,830);assert.equal(compared,822);assert.equal(excluded,8);
console.log('Lineup source parity PASS: 83 original files, 830 observations, 822 comparable, 8 excluded. Research only; no coaching grade.');
