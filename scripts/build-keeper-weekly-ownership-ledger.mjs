// Read-only keeper ownership ledger from archived weekly roster snapshots.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const exists=p=>fs.existsSync(p);
const norm=s=>String(s??'').toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\b/g,'').replace(/[^a-z0-9]/g,'');
const picks=read('data/v9_draft_engine.json').filter(x=>x.keeper&&[2025,2026].includes(x.year));
const rows=[],coverage=[];
for(const year of [2025,2026]){
 const weeks=[];
 for(let week=1;week<=(year===2025?14:8);week++){
  const p=year===2025&&(week===1||week===7)?'data/war_rosters_2025_week'+week+'.json':'data/sleeper_roster_snapshots_'+year+'_week'+week+'.json';
  assert.ok(exists(p),'Missing weekly roster source '+p);
  const v=read(p);const rosters=Array.isArray(v)?v:v.rosters;
  assert.equal(rosters.length,10,'Expected ten team rosters '+p);
  weeks.push({week,source:p,rosters});
 }
 for(const pick of picks.filter(p=>p.year===year)){
  const observations=weeks.map(w=>{
   const matches=w.rosters.flatMap(t=>{
    const teamId=String(t.teamId??t.id);
    return [...(t.starters??[]).map(p=>({...p,started:true})),...(t.bench??[]).map(p=>({...p,started:false}))].filter(p=>norm(p.name)===norm(pick.player)).map(p=>({teamId,started:p.started,points:p.started?p.points:null,providerId:String(p.id)}));
   });
   assert.ok(matches.length<=1,'Duplicate keeper identity '+pick.player+'/'+year+'/'+w.week);
   const found=matches[0];
   return {week:w.week,teamId:found?.teamId??null,onOriginalTeam:found?.teamId===String(pick.team_id),
    started:found?.started??false,startedPoints:found?.started?found.points:null,
    playerId:found?.providerId??null,source:w.source,observationStatus:found?'rostered':'not_observed'};
  });
  const verifiedOriginalPoints=Math.round(observations.filter(o=>o.onOriginalTeam&&o.started).reduce((s,o)=>s+o.startedPoints,0)*100)/100;
  const originalStarts=observations.filter(o=>o.onOriginalTeam&&o.started).length;
  if(year===2025){
   assert.equal(originalStarts,pick.reg_starts,'Original manager keeper starts mismatch '+pick.player);
   assert.ok(Math.abs(verifiedOriginalPoints-pick.reg_starter_points)<.011,'Original manager keeper points mismatch '+pick.player);
  }
  rows.push({year,manager:pick.manager==='Tom'?'Thommy':pick.manager,player:pick.player,originalTeamId:String(pick.team_id),
   observedWeeks:observations.length,verifiedOriginalStarts:originalStarts,verifiedOriginalStartedPoints:verifiedOriginalPoints,
   observedOtherTeamStarts:observations.filter(o=>!o.onOriginalTeam&&o.started).length,
   observedOtherTeamStarterPoints:Math.round(observations.filter(o=>!o.onOriginalTeam&&o.started).reduce((s,o)=>s+o.startedPoints,0)*100)/100,
   observations,keeperDecisionGrade:null});
 }
 coverage.push({year,weeks:weeks.length,keepers:picks.filter(x=>x.year===year).length});
}
assert.equal(rows.length,40);
const result={schema:'fellas-keeper-weekly-ownership-ledger-v1',status:'weekly_snapshot_verified_not_transaction_continuity',
 caveats:['A weekly not_observed row does not prove a drop, trade, or absence at any exact timestamp.',
 'The original keeper manager receives only own-team starter points; other-team points are tracked separately.',
 '2025 regular-season archived starter totals are reconciled; 2026 source coverage is partial.',
 'Player name normalization is used for matching; provider IDs are retained when observed.',
 'No keeper decision grades or penalties are inferred from ownership observations.'],coverage,rows};
const path='data-integrity/keeper-weekly-ownership-ledger-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(path),result);
else fs.writeFileSync(path,JSON.stringify(result,null,2)+'\n');
console.log('Keeper owner ledger PASS: '+rows.length+' keeper picks, '+coverage.map(c=>c.year+':'+c.weeks+' weeks').join(', '));
