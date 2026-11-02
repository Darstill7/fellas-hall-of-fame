// Independently recompute reported FAAB acquisition points from weekly roster source files.
// This is arithmetic/source parity, NOT independent proof of ownership continuity.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const report=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
assert.equal(report.status,'research_only_not_causal_or_skill_grade');
const snapshots=new Map();
let checked=0,started=0;
const money=n=>Math.round(n*100)/100;
for(const claim of report.observations){
 for(const observation of claim.weeks){
  assert.ok(observation.week>claim.claimWeek,'Claim-week scoring leak');
  const key=claim.year+'|'+observation.week;
  if(!snapshots.has(key)){
   let path='data/sleeper_roster_snapshots_'+claim.year+'_week'+observation.week+'.json';
   const alt='data/war_rosters_'+claim.year+'_week'+observation.week+'.json';
   if(claim.year===2025&&(observation.week===1||observation.week===7)&&fs.existsSync(alt))path=alt;
   const data=read(path);snapshots.set(key,Array.isArray(data)?data:data.rosters);
  }
  const rosters=snapshots.get(key);
  assert.ok(Array.isArray(rosters),'Missing roster source '+key);
  const team=rosters.filter(x=>String(x.teamId??x.id)===claim.teamId);
  assert.equal(team.length,1,'Roster not uniquely observed '+key+'/'+claim.teamId);
  const starters=(team[0].starters??[]).filter(p=>String(p.id)===claim.playerId);
  const bench=(team[0].bench??[]).filter(p=>String(p.id)===claim.playerId);
  assert.equal(starters.length+bench.length,1,'Player missing or duplicated on credited roster '+key+'/'+claim.playerId);
  const player=starters[0]??bench[0];
  assert.ok(Number.isFinite(player.points),'Non-numeric player points '+key+'/'+claim.playerId);
  assert.equal(observation.points,money(player.points),'FAAB attributed points disagree with roster source');
  assert.equal(observation.started,starters.length===1,'FAAB lineup attribution disagrees with roster source');
  checked++;if(starters.length)started++;
 }
 assert.equal(claim.observedWeeks,claim.weeks.length);
 assert.equal(claim.startedWeeks,claim.weeks.filter(w=>w.started).length);
 assert.ok(Math.abs(claim.rosteredPoints-money(claim.weeks.reduce((a,w)=>a+w.points,0)))<0.011,'Rostered total mismatch');
 assert.ok(Math.abs(claim.startedPoints-money(claim.weeks.filter(w=>w.started).reduce((a,w)=>a+w.points,0)))<0.011,'Started total mismatch');
}
console.log('FAAB roster scoring receipt parity PASS:',report.observations.length,'claims,',checked,'player-weeks,',started,'starts; no ownership or skill certification');
