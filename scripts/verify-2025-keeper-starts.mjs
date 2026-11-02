// Independent keeper contribution parity audit from archived weekly scored rosters.
// A verified start is descriptive lineup contribution, NOT cost-adjusted keeper value.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const draft=read('data/v9_draft_engine.json');
const norm=s=>String(s??'').toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\b/g,'').replace(/[^a-z0-9]/g,'');
const sources=Array.from({length:14},(_,i)=>{const w=i+1;return {week:w,path:w===1||w===7?`data/war_rosters_2025_week${w}.json`:`data/sleeper_roster_snapshots_2025_week${w}.json`}});
const weekly=sources.map(s=>{const v=read(s.path);const rosters=Array.isArray(v)?v:v.rosters;assert.ok(Array.isArray(rosters));return {...s,rosters}});
const picks=draft.filter(p=>p.year===2025&&p.keeper);
assert.equal(picks.length,20);
const rows=[];
for(const pick of picks){
 let starts=0,points=0;const receipts=[];
 for(const w of weekly){
  const team=w.rosters.filter(r=>String(r.teamId??r.id)===String(pick.team_id));
  assert.equal(team.length,1,`Missing/duplicated roster ${w.week}/${pick.team_id}`);
  const candidates=(team[0].starters??[]).filter(p=>norm(p.name)===norm(pick.player));
  assert.ok(candidates.length<=1,`Ambiguous keeper ${pick.player} week ${w.week}`);
  if(!candidates.length)continue;
  assert.ok(Number.isFinite(candidates[0].points));
  starts++;points+=candidates[0].points;
  receipts.push({week:w.week,points:candidates[0].points,source:w.path});
 }
 points=Math.round(points*100)/100;
 assert.equal(starts,pick.reg_starts,`Keeper starts differ for ${pick.player}`);
 assert.ok(Math.abs(points-pick.reg_starter_points)<.011,`Keeper points differ for ${pick.player}`);
 rows.push({manager:pick.manager==='Tom'?'Thommy':pick.manager,player:pick.player,round:pick.round,
  draftSlot:pick.overall,regularStarts:starts,verifiedRegularStartedPoints:points,
  archivedPlayoffStartedPointsUnreconciled:pick.playoff_starter_points,receipts});
}
const managers=[...new Set(rows.map(x=>x.manager))].sort().map(manager=>{
 const r=rows.filter(x=>x.manager===manager);
 assert.equal(r.length,2,'Expected two keeper selections for '+manager);
 return {manager,keepers:r.map(x=>({player:x.player,round:x.round})),
  verified2025RegularStartedPoints:Math.round(r.reduce((s,x)=>s+x.verifiedRegularStartedPoints,0)*100)/100,
  archivedPlayoffPointsUnreconciled:Math.round(r.reduce((s,x)=>s+x.archivedPlayoffStartedPointsUnreconciled,0)*100)/100,
  overallKeeperValue:null,keeperDecisionGrade:null};
});
const result={schema:'fellas-2025-keeper-verified-starts-v1',status:'20_of_20_regular_starts_and_points_reconciled',
 sources:sources.map(({week,path})=>({week,path})),limitations:[
 '2025 regular-season contributions independently match weeks 1–14, not postseason source receipts.',
 'Observed starter production is not surplus, causal win contribution, or keeper decision skill.',
 'Draft round is a nominal cost only; its opportunity cost and deadline alternatives are not established.',
 '2026 season data is partial and is not compared as a completed season.'],managers,rows};
const target='data-integrity/keeper-2025-verified-starts-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),result);
else fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');
console.log('2025 keeper verification PASS: 20 selections; 10 managers; all regular starts and points match');
