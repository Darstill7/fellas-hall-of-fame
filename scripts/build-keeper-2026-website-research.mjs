// Generate a season-to-date keeper comparison from confirmed 2026 scored roster snapshots.
// 2026 is not a completed season and must not inherit a completed-season Keeper Decision grade.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const draft=read('data/v9_draft_engine.json').filter(p=>p.year===2026&&p.keeper);
const norm=s=>String(s??'').toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\b/g,'').replace(/[^a-z0-9]/g,'');
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const weeks=[];
for(let week=1;week<=8;week++){
 const path='data/sleeper_roster_snapshots_2026_week'+week+'.json';
 const raw=read(path);assert.equal(raw.rosters.length,10,'Incomplete 2026 team coverage: '+week);
 const starters=raw.rosters.flatMap(team=>team.starters.map(p=>({...p,teamId:String(team.teamId)})));
 assert.equal(starters.length,90,'Incomplete 2026 starters week '+week);
 const positionMedians={};
 for(const pos of ['QB','RB','WR','TE']){
  const v=starters.filter(p=>p.position===pos).map(p=>p.points).sort((a,b)=>a-b);
  assert.ok(v.length>=10,'Missing position cohort '+pos+' week '+week);
  const mid=Math.floor(v.length/2);
  positionMedians[pos]=round(v.length%2?v[mid]:(v[mid-1]+v[mid])/2);
 }
 weeks.push({week,source:path,rosters:raw.rosters,positionMedians});
}
assert.equal(draft.length,20);
const selections=draft.map(p=>{
 const starts=[],observations=[];
 for(const w of weeks){
  const matches=w.rosters.flatMap(team=>[...team.starters.map(q=>({...q,started:true})),...team.bench.map(q=>({...q,started:false}))].filter(q=>norm(q.name)===norm(p.player)).map(q=>({...q,teamId:String(team.teamId)})));
  assert.ok(matches.length<=1,'Ambiguous keeper identity '+p.player+' week '+w.week);
  const observed=matches[0];
  const original=observed&&observed.teamId===String(p.team_id);
  const started=!!(original&&observed.started);
  observations.push({week:w.week,rosterTeamId:observed?.teamId??null,onOriginalTeam:!!original,startedForOriginalManager:started});
  if(started)starts.push({week:w.week,points:observed.points,median:w.positionMedians[p.position],source:w.source});
 }
 const archivalStarts=starts.filter(x=>x.week<=6);
 assert.equal(archivalStarts.length,p.reg_starts,'2026 archived Week 1–6 keeper starts mismatch: '+p.player);
 assert.ok(Math.abs(round(archivalStarts.reduce((n,x)=>n+x.points,0))-p.reg_starter_points)<.011,
  '2026 archived Week 1–6 keeper points mismatch: '+p.player);
 return {manager:p.manager==='Tom'?'Thommy':p.manager,player:p.player,position:p.position,round:p.round,originalTeamId:String(p.team_id),
  verifiedOriginalManagerStarts:starts.length,
  verifiedOriginalManagerStartedPoints:round(starts.reduce((n,x)=>n+x.points,0)),
  observedStarterMedianPoints:round(starts.reduce((n,x)=>n+x.median,0)),
  relativeToStartedPositionMedians:round(starts.reduce((n,x)=>n+x.points-x.median,0)),
  tradedSameSeasonArchiveFlag:!!p.traded_same_season,observations,startingReceipts:starts};
});
const names=[...new Set(selections.map(x=>x.manager))].sort();
assert.equal(names.length,10);
const rows=names.map(manager=>{
 const picks=selections.filter(p=>p.manager===manager);assert.equal(picks.length,2);
 const sum=k=>round(picks.reduce((n,p)=>n+p[k],0));
 return {manager,keepers:picks.map(p=>({name:p.player,round:p.round,position:p.position,
  starts:p.verifiedOriginalManagerStarts,startedPoints:p.verifiedOriginalManagerStartedPoints,
  transferredDuringSeason:p.tradedSameSeasonArchiveFlag})),
  regularStartedPoints:sum('verifiedOriginalManagerStartedPoints'),
  regularVsStarterMedian:sum('relativeToStartedPositionMedians'),
  verifiedOriginalManagerStarts:picks.reduce((n,p)=>n+p.verifiedOriginalManagerStarts,0),
  nominalDraftCapital:round(picks.reduce((n,p)=>n+Math.min(100,Math.max(0,(p.round-1)/14*100)),0)/2),
  championshipStarterPoints:null,otherWeek15to17StartedPoints:null,
  components:{observedProduction:null,nominalDraftCapital:null,championshipContribution:null},
  researchScore:null,verifiedDrops:[],verifiedDropStatus:'not_audited_for_2026',
  officialKeeperDecisionGrade:null};
}).sort((a,b)=>b.regularStartedPoints-a.regularStartedPoints);
const data={schema:'fellas-2026-keeper-website-research-v1',status:'in_progress_2026_week1_to_week7_no_completed_season_score',
 season:2026,throughWeek:8,sourcePaths:weeks.map(x=>x.source).concat('data/v9_draft_engine.json'),
 methodology:'Verified original-manager keeper starters through archived 2026 Week 8; positional median at corresponding player-start weeks; no season grade',
 limitations:['Weeks 1–6 are reconciled against the archived draft engine. Weeks 7–8 are sourced from the additional weekly roster snapshots.',
 '2026 is incomplete. The research index, playoffs and abandonment penalty are intentionally unavailable.',
 'Starter medians describe observed league starters, not eligible waivers or replacement value.',
 'Points after an original keeper is traded belong to the new roster owner and are not credited back.',
 '2026 waiver/drop history is not fully certified for keeper abandonment; a blank drop label does not mean no drops.'],
 rows,selections};
const target='data/keeper_2026_website_research_v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),data);
else fs.writeFileSync(target,JSON.stringify(data,null,2)+'\n');
console.log('2026 keeper website evidence PASS: '+selections.length+' keeper choices, 10 managers, Weeks 1–8, no incomplete-season rating');
