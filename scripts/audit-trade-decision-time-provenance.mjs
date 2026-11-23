// Distinguish historical retrospective lineup/points snapshots from true
// decision-time evidence. A postgame score CANNOT substitute for a projection.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const par=read('data/trade_par_preview.json').records;
const v9=read('data/v9_trade_engine.json').sides;
const bracket=read('data/playoff_explorer_verified_2016_2025_v1.json').seasons;
const starts=Object.fromEntries(bracket.filter(s=>s.year>=2020&&s.year<=2025).map(s=>[s.year,Math.min(...s.matches.filter(m=>m.round==='opening').map(m=>m.week))]));
const sourceSide=new Map(v9.map(s=>[String(s.trade_id)+'|'+s.manager,s]));
const selected=par.filter(t=>t.year>=2020&&t.year<=2025&&t.complete&&t.sides.length===2&&t.sides.every(s=>s.fullyMatched&&s.matched.every(p=>p.sourceWeeks.every(w=>w<starts[t.year]))));
assert.equal(selected.length,13,'Source-clean trade sample changed');
const cache=new Map();
function getRoster(year,week,teamId){
 const key=year+'|'+week;
 if(!cache.has(key)){
  const candidates=['data/sleeper_roster_snapshots_'+year+'_week'+week+'.json','data/war_rosters_'+year+'_week'+week+'.json'];
  const file=candidates.find(x=>fs.existsSync(x));
  assert.ok(file,'Missing historical roster '+key);
  const obj=read(file);
  const teams=Array.isArray(obj)?obj:obj.rosters;
  cache.set(key,{file,teams:new Map(teams.map(t=>[String(t.teamId??t.id),t]))});
 }
 const snapshot=cache.get(key),team=snapshot.teams.get(String(teamId));
 assert.ok(team,'Receiving roster not available '+key+' team '+teamId);
 return {team,file:snapshot.file};
}
const norm=s=>String(s).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const requiredPreGame=['projection','projectedPoints','projected_points','projectionAsOf','projectionTimestamp','lineupLockTime','gameStartTime','injuryStatusAtLock','activeAtLock','rosterEffectiveAt','availableAtLock','preGameRank','projectionSource'];
const observations=[];
for(const t of selected)for(const side of t.sides){
 const origin=sourceSide.get(String(t.id)+'|'+side.manager);
 assert.ok(origin,'Original receiving roster ownership unknown');
 for(const asset of side.matched)for(const week of asset.sourceWeeks){
  const {team,file}=getRoster(t.year,week,origin.team_id);
  const player=team.starters.filter(p=>norm(p.name)===norm(asset.asset));
  assert.equal(player.length,1,'Source starter unresolved');
  const item=player[0];
  assert.ok(Number.isFinite(item.points));
  const evidenceObjects=[item,team,...team.bench.filter(x=>x&&x.id!=null)];
  const discovered=[...new Set(evidenceObjects.flatMap(x=>requiredPreGame.filter(f=>Object.hasOwn(x,f)&&x[f]!=null)))];
  observations.push({year:t.year,week,tradeId:String(t.id),manager:side.manager,asset:asset.asset,rosterFile:file,pregameFields:discovered,benchCount:team.bench.length,postGameStarterPoints:item.points});
 }
}
assert.equal(observations.length,254,'Source audit expected 254 period-clean acquired-player starts');
const sources=new Map(),missing=new Map();
for(const row of observations){
 const type=row.rosterFile.includes('war_rosters_')?'reconstructed_roster':'historical_sleeper_snapshot';
 sources.set(type,(sources.get(type)||0)+1);
 for(const f of requiredPreGame)if(!row.pregameFields.includes(f))missing.set(f,(missing.get(f)||0)+1);
}
assert.equal(sources.get('reconstructed_roster')||0,4);
assert.equal(sources.get('historical_sleeper_snapshot')||0,250);
const anyPregame=observations.filter(r=>r.pregameFields.length>0);
assert.equal(anyPregame.length,0,'Pregame metadata appeared: investigate actual timestamp, snapshot origin, and data leakage before designating it pre-lock evidence');
const message=[
 '# Decision-time replacement model data audit','',
 '> **Model promotion blocked:** all 254 period-clean acquired-player starts are sourced from weekly final-scoring roster records, not independently timestamped pre-lineup-lock projections. This scan covers the recorded fields; it does not prove the information never existed in Sleeper, only that it is not available in the archived research input files.','',
 '- Observed final-points and lineup identity: 254 / 254.',
 '- Standard historical Sleeper roster-source observations: 250. Reconstructed-source observations: 4.',
 '- Independently verifiable player projection with as-of time, game-lock timestamp, injury/active status at lock, and alternative-player availability: 0 / 254 in archived source player/team records.',
 '- Same-roster recorded bench players and final scores remain useful retrospective evidence, but cannot become ex-ante replacement expectations merely through averaging or picking the best observed scorer.',
 '- No pregame projection, roster-state timestamp, or lock-time availability should be fabricated to fill these gaps.',
 '',
 '## Minimum future model provenance','',
 '1. Select and version a **dated, pregame as-of** projection feed in each season, with stable player ID, fantasy scoring profile, and prediction issuance time.',
 '2. Record each NFL game lock timestamp; eligible player availability and fantasy league roster ownership **as of the decision time**, with historical injury/bye state.',
 '3. Enforce the RB/WR/TE dual-FLEX and single-use bench constraint; do not substitute a player already started or match the same bench asset twice.',
 '4. Specify how waiver replacements are sourced historically rather than treating absent same-roster bench players as zero replacement.',
 '5. Evaluate forecast quality versus actual scoring out-of-sample, then define a certified counterfactual before ever calling PAR, WAR or trading-skill standings.',
 '',
 'Result: **decision-time replacement projections NOT VERIFIED**; source-grade retrospective score and bench feasibility checks remain useful.'
].join('\n');
console.log(message);
if(process.argv.includes('--github-summary')&&process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,message+'\n');
