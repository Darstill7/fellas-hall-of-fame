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
 assert.equal(raw.season,2026);
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
  const best=optimize(pool);
  assert.ok(best!==null&&best+.07>=actual,'Infeasible optimal lineup Week '+week+'/'+manager);
  rows.push({season:2026,week,teamId,manager,actualPoints:actual,recordedRosterOptimalPoints:round(best),
   hindsightGap:round(Math.max(0,best-actual)),source:path,
   status:'research_only_eligible_position_hindsight',officialStartSitGrade:null});
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
  officialStartSitGrade:null};
});
assert.equal(rows.length,10*weeks.length);
const output={schema:'fellas-start-sit-2026-hindsight-v1',throughWeek:weeks.at(-1),
 status:'retrospective_scored_roster_comparison_not_decision_skill',
 limitations:['Full recorded starters and bench do not prove each benched player was startable before kickoff',
 'Injury or inactive status and lineup lock timestamps are not certified',
 'An optimal after-the-fact lineup is not a prospective fantasy decision or WAR',
 'No Madden OVR or report-card grade may be changed by this research alone'],
 weeklyRows:rows,managers:summaries};
const target='data-integrity/start-sit-2026-hindsight-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),output);
else fs.writeFileSync(target,JSON.stringify(output,null,2)+'\n');
console.log('2026 Start/Sit research PASS: '+rows.length+' team-weeks, through Week '+weeks.at(-1)+', ten manager summaries, zero grades');
