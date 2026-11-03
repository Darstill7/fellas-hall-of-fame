// Research-only 2026 weekly lineup hindsight, never a public start/sit skill grade.
// Recorded bench scores may not establish pre-kickoff availability or injury status.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const slots=['QB','RB','RB','WR','WR','TE','FLEX','FLEX','DEF'];
const isEligible=(p,s)=>s==='FLEX'?['RB','WR','TE'].includes(p.position):p.position===s;
const round=x=>Math.round((x+Number.EPSILON)*100)/100;
function optimize(players){
 let dp=new Map([[0,0]]);
 for(const p of players){
  if(!Number.isFinite(p.points))return null;
  const next=new Map(dp);
  for(const [mask,score] of dp)for(let i=0;i<slots.length;i++){
   if(mask&(1<<i)||!isEligible(p,slots[i]))continue;
   const k=mask|(1<<i),value=score+p.points;
   if(!next.has(k)||next.get(k)<value)next.set(k,value);
  }
  dp=next;
 }
 return dp.get((1<<slots.length)-1)??null;
}
// Regression fixtures: FLEX accepts a third RB/WR/TE, never QB or DEF.
// Mandatory starter slots remain required even if their points are negative.
const fixture=[
 {position:'QB',points:10},{position:'RB',points:10},{position:'RB',points:8},
 {position:'WR',points:8},{position:'WR',points:6},{position:'TE',points:5},
 {position:'RB',points:4},{position:'WR',points:3},{position:'DEF',points:-2}
];
const fixtureScore=fixture.reduce((n,p)=>n+p.points,0);
assert.equal(optimize(fixture),fixtureScore,'Every legal slot must be populated, even negative DEF');
assert.equal(optimize([...fixture,{position:'WR',points:20}]),fixtureScore+17,
 'A better third wide receiver must be available for FLEX');
assert.equal(optimize([...fixture,{position:'TE',points:21}]),fixtureScore+18,
 'An extra tight end must be eligible for FLEX');
assert.equal(optimize(fixture.filter(p=>p.position!=='DEF')),null,
 'The optimizer cannot omit a mandatory defense slot');

const drafts=read('data/v9_draft_engine.json').filter(p=>p.year===2026&&p.keeper);
const managers=new Map();
for(const p of drafts){
 const id=String(p.team_id),name=p.manager==='Tom'?'Thommy':p.manager;
 if(managers.has(id))assert.equal(managers.get(id),name);
 managers.set(id,name);
}
assert.equal(managers.size,10);
const weeks=fs.readdirSync('data').map(s=>/^sleeper_roster_snapshots_2026_week([0-9]+)[.]json$/.exec(s)?.[1]).filter(Boolean).map(Number).sort((a,b)=>a-b);
assert.ok(weeks.length>=8&&weeks.length<=14);
for(let i=0;i<weeks.length;i++)assert.equal(weeks[i],i+1,'Noncontiguous completed weekly roster evidence');
if(weeks.includes(9))assert.ok(Date.now()>=Date.parse('2026-11-10T06:00:00Z'),'Week 9 cannot be scored before MNF finishes');
const rows=[];
for(const week of weeks){
 const path='data/sleeper_roster_snapshots_2026_week'+week+'.json';
 const raw=read(path);
 if(raw.season!==undefined)assert.equal(raw.season,2026,'Incorrect explicitly labeled season');
 assert.equal(raw.week,week);
 assert.equal(raw.rosters.length,10);
 assert.deepEqual(raw.rosters.map(x=>Number(x.teamId)).sort((a,b)=>a-b),Array.from({length:10},(_,i)=>i+1));
 for(const roster of raw.rosters){
  const teamId=String(roster.teamId);
  const manager=managers.get(teamId);
  assert.ok(manager,'Unknown 2026 team '+teamId);
  const starters=roster.starters??[],bench=roster.bench??[];
  const pool=[...starters,...bench];
  assert.equal(starters.length,9,'Incorrect lineup slot count Week '+week+'/'+manager);
  assert.equal(new Set(pool.map(x=>String(x.id))).size,pool.length,'Duplicate rostered player Week '+week+'/'+manager);
  assert.ok(pool.every(p=>Number.isFinite(p.points)),'Unscored roster entry Week '+week+'/'+manager);
  assert.ok(starters.every(p=>['QB','RB','WR','TE','DEF'].includes(p.position)),'Unexpected starter position Week '+week+'/'+manager);
  const actual=round(starters.reduce((n,p)=>n+p.points,0));
  assert.ok(Math.abs(actual-roster.points)<.07,'Source score mismatch Week '+week+'/'+manager);
  // A team score can reconcile despite an illegal positional lineup.
  // Require the nine recorded starters themselves to fit the real league slots.
  const actualLayout=optimize(starters);
  assert.ok(actualLayout!==null&&Math.abs(actualLayout-actual)<.07,
   'Recorded Week '+week+' starters do not fit QB/2RB/2WR/TE/2FLEX/DEF: '+manager);
  const best=optimize(pool);
  assert.ok(best!==null&&best+.07>=actual,'Infeasible optimal lineup Week '+week+'/'+manager);
  // Sleeper matchup UI uses the arithmetic mean of weekly lineup efficiency.
  // Preserve unrounded weekly ratios when computing the season average.
  const weeklyAccuracyPercent=best>0?actual/best*100:null;
  rows.push({season:2026,week,teamId,manager,actualPoints:actual,recordedRosterOptimalPoints:round(best),
   hindsightGap:round(Math.max(0,best-actual)),
   weeklyStartSitAccuracyPercent:weeklyAccuracyPercent===null?null:round(weeklyAccuracyPercent),
   source:path,status:'research_only_eligible_position_hindsight',officialStartSitGrade:null});
 }
}
const summaries=[...managers.values()].sort().map(manager=>{
 const observations=rows.filter(x=>x.manager===manager);
 assert.equal(observations.length,weeks.length);
 const totalActual=round(observations.reduce((s,r)=>s+r.actualPoints,0));
 const totalOptimal=round(observations.reduce((s,r)=>s+r.recordedRosterOptimalPoints,0));
 return {manager,observedWeeks:observations.length,recordedActualPoints:totalActual,
  recordedRosterOptimalPoints:totalOptimal,hindsightGap:round(totalOptimal-totalActual),
  averageGapPerWeek:round((totalOptimal-totalActual)/observations.length),
  averageWeeklyStartSitAccuracyPercent:observations.every(r=>r.weeklyStartSitAccuracyPercent!==null)?
   round(observations.reduce((n,r)=>n+r.weeklyStartSitAccuracyPercent,0)/observations.length):null,
  aggregatePointsEfficiencyPercent:totalOptimal>0?round(totalActual/totalOptimal*100):null,
  officialStartSitGrade:null};
});
assert.equal(rows.length,10*weeks.length);
// Independent Sleeper mobile UI observations captured after Week 8.
// These are platform display benchmarks, not ex-ante skill judgments.
// Validate all ten managers, only at the same completed-week cutoff.
const uiBenchmark=read('data-integrity/sleeper-start-sit-ui-benchmarks-2026-week8.json');
assert.equal(uiBenchmark.season,2026);
assert.equal(uiBenchmark.throughWeek,8);
assert.equal(uiBenchmark.data.length,10);
if(weeks.at(-1)===uiBenchmark.throughWeek){
 const seen=new Set();
 for(const sample of uiBenchmark.data){
  assert.ok(!seen.has(sample.manager),'Duplicate Sleeper UI benchmark '+sample.manager);
  seen.add(sample.manager);
  const computed=summaries.find(r=>r.manager===sample.manager);
  assert.ok(computed,'Unmapped Sleeper UI benchmark '+sample.manager);
  assert.ok(Math.abs(computed.averageWeeklyStartSitAccuracyPercent-sample.accuracyPercent)<.051,
   'Sleeper UI Start/Sit mismatch: '+sample.manager+' expected '+sample.accuracyPercent+
   ' got '+computed.averageWeeklyStartSitAccuracyPercent);
 }
 assert.equal(seen.size,managers.size,'Not all current managers independently screenshot-verified');
}

const output={schema:'fellas-start-sit-2026-hindsight-v1',throughWeek:weeks.at(-1),
 status:'retrospective_scored_roster_comparison_not_decision_skill',
 sleeperAccuracyMethod:'Unweighted arithmetic mean of weekly (actual lineup points / optimal scored roster lineup points × 100), rounded to one decimal for display; independent Sleeper Week 8 UI screenshots for all ten managers',

 limitations:['Full recorded starters and bench do not prove each benched player was startable before kickoff',
 'Injury or inactive status and lineup lock timestamps are not certified',
 'An optimal after-the-fact lineup is not a prospective fantasy decision or WAR',
 'No Madden OVR or report-card grade may be changed by this research alone'],
 weeklyRows:rows,managers:summaries};
const target='data-integrity/start-sit-2026-hindsight-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),output);
else fs.writeFileSync(target,JSON.stringify(output,null,2)+'\n');
console.log('2026 Start/Sit research PASS: '+rows.length+' team-weeks, through Week '+weeks.at(-1)+', ten manager summaries, zero grades');
