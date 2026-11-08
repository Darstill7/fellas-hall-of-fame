import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('data/draft_keeper_value_pilot_2025_2026w8_v1.json');
const draft=read('data/v9_draft_engine.json');
const keeper=read('data/keeper_2026_website_research_v1.json');
const snapshots=new Map([7,8].map(week=>[week,read('data/sleeper_roster_snapshots_2026_week'+week+'.json')]));
const normalize=x=>String(x||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g,'');
const round=x=>Math.round((x+Number.EPSILON)*100)/100;
const tol=(a,b)=>Math.abs(a-b)<.011;
assert.equal(data.draftPicks.length,260,'2025 and 2026 should have 130 nonkeeper selections each');
assert.equal(data.keeperObservations2026.length,20,'2026 confirmed two keepers per manager');
assert.equal(data.keeperObservations2026.every(x=>x.decisionGrade===null&&x.opportunityCostPoints===null),true,'Do not assign unverified keeper decision grades');
const source=draft.filter(x=>[2025,2026].includes(x.year)&&!x.keeper);
const index=new Map(source.map(x=>[x.year+':'+x.overall,x]));
const seen=new Set();
for(const row of data.draftPicks){
 const key=row.year+':'+row.overall,raw=index.get(key);
 assert.ok(raw&&!seen.has(key),'Missing or duplicate verified draft selection '+key);
 seen.add(key);
 assert.equal(row.player,raw.player,'Name '+key);
 assert.equal(row.manager,raw.manager==='Tom'?'Thommy':raw.manager,'Original manager '+key);
 assert.equal(row.round,raw.round,'Round '+key);
 assert.equal(row.position,raw.position,'Position '+key);
 let added=0,starts=raw.reg_starts;const late=[];
 if(row.year===2026)for(const week of [7,8]){
  const source=snapshots.get(week).rosters.find(x=>String(x.teamId)===String(raw.team_id));
  const matching=source?.starters?.filter(x=>normalize(x.name)===normalize(raw.player))||[];
  assert.ok(matching.length<=1,'Duplicate original-team starting receipt for '+key+' week '+week);
  if(matching.length){starts++;added+=matching[0].points;late.push({week,points:round(matching[0].points),source:'data/sleeper_roster_snapshots_2026_week'+week+'.json'})}
 }
 const pts=round(raw.reg_starter_points+added);
 assert.equal(row.starts,starts,'Attributed original-manager starts '+key);
 assert.ok(tol(row.startedPoints,pts),'Started point total '+key+' '+row.startedPoints+' vs '+pts);
 assert.deepEqual(row.lateStartingReceipts,late,'Week 7–8 additions '+key);
 if(row.year===2026)assert.ok(tol(row.draftEnginePointsThroughWeek6,raw.reg_starter_points)&&tol(row.additionalWeek7to8Points,added),'Draft/roster split '+key);
 const cohort=data.draftPicks.filter(x=>x.year===row.year&&x.overall!==row.overall&&x.position===row.position);
 let peers=[],radius=2;
 for(const window of [2,3,5,15]){
  peers=cohort.filter(x=>Math.abs(x.round-row.round)<=window);radius=window;
  if(peers.length>=4)break;
 }
 const values=peers.map(x=>x.startedPoints).sort((a,b)=>a-b);
 const median=values.length?(values.length%2?values[(values.length-1)/2]:(values[values.length/2-1]+values[values.length/2])/2):null;
 assert.equal(row.peerCount,peers.length,'Peer count '+key);
 assert.equal(row.peerRoundWindow,radius,'Peer window '+key);
 assert.ok(median!==null&&tol(row.peerMedianStartedPoints,round(median)),'Observed peer median '+key);
 assert.ok(tol(row.pointsAbovePeerMedian,round(pts-median)),'Pick value '+key);
}
assert.equal(seen.size,source.length,'All source picks covered');
for(const item of data.keeperObservations2026){
 const row=keeper.selections.find(x=>x.manager===item.manager&&x.player===item.player);
 assert.ok(row,'Unverified keeper '+item.manager+' '+item.player);
 assert.equal(item.costRound,row.round);
 assert.equal(item.starts,row.verifiedOriginalManagerStarts);
 assert.ok(tol(item.startedPoints,row.verifiedOriginalManagerStartedPoints));
 assert.ok(tol(item.positionalStarterMedianPoints,row.observedStarterMedianPoints));
 assert.ok(tol(item.pointsAbovePositionalMedian,row.relativeToStartedPositionMedians));
 assert.equal(item.decisionTimeAlternativesVerified,false);
 assert.equal(item.decisionGrade,null);
}
const woody=data.draftPicks.find(x=>x.year===2026&&x.manager==='Stilly'&&x.player==='Woody Marks');
assert.ok(woody,'Woody Marks 2026 round-13 example missing');
assert.equal(woody.round,13);assert.equal(woody.overall,128);
assert.equal(woody.starts,3);assert.ok(tol(woody.startedPoints,25.9)&&tol(woody.additionalWeek7to8Points,8.6));
assert.ok(tol(woody.peerMedianStartedPoints,0)&&tol(woody.pointsAbovePeerMedian,25.9));
const page=fs.readFileSync('analytics/draft-keeper-value.html','utf8');
assert.ok(page.includes('draft_keeper_value_pilot_2025_2026w8_v1.json'),'Value page must load audited source');
assert.ok(page.includes('Keeper decision grade: not yet verified'),'Research grade disclaimer required');
assert.ok(page.includes('Bench points')||page.includes('bench scoring'),'Bench scoring exclusion required');
assert.ok(page.includes('Round 13'),'Woody benchmark must be prominent');
assert.ok(page.includes('id="efficiency-rows"')&&page.includes('const redrawEfficiency=()=>')&&page.includes("$('draft-year').addEventListener('change',redrawEfficiency)"),'Manager Value Points per Pick must track the selected season');
for(const year of [2025,2026]){
 const managers=[...new Set(data.draftPicks.filter(x=>x.year===year).map(x=>x.manager))];
 assert.equal(managers.length,10,'Exactly ten draft efficiency managers '+year);
 for(const manager of managers){
  const picks=data.draftPicks.filter(x=>x.year===year&&x.manager===manager);
  assert.equal(picks.length,13,'Exactly thirteen keeper-excluded draft picks '+year+' '+manager);
  assert.ok(picks.every(x=>Number.isFinite(x.pointsAbovePeerMedian)),'Value peer receipts required '+year+' '+manager);
 }
}
console.log('DRAFT + KEEPER PILOT VERIFIED: 260 nonkeeper draft receipts (2025/2026), 20 keeper observations, 2026 Week 7–8 original-team starts, source-backed value and no fabricated keeper grade.');
