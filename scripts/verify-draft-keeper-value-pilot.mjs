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
assert.ok(page.includes('id="manager-value-ranking"')&&page.includes('Manager Draft Value per Pick')&&
 page.includes('const updateManagerRanking=year=>')&&page.includes('data-value-manager'),
 'Interactive ten-manager value-per-pick ranking is missing');
for(const year of [2025,2026]){
 const managers=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
 const counts=managers.map(manager=>({manager,rows:data.draftPicks.filter(p=>p.year===year&&p.manager===manager)}));
 assert.ok(counts.every(m=>m.rows.length===13),'Each manager must have thirteen nonkeeper selections for '+year);
 const perPick=counts.map(m=>({manager:m.manager,value:m.rows.reduce((n,p)=>n+p.pointsAbovePeerMedian,0)/m.rows.length}));
 assert.ok(perPick.every(m=>Number.isFinite(m.value)),'Draft ranking has nonfinite value '+year);
 const sort=[...perPick].sort((a,b)=>b.value-a.value);
 assert.equal(sort.length,10,'Ten ranked managers '+year);
 if(year===2026){assert.equal(sort[0].manager,'Mitch');assert.equal(sort[1].manager,'Birch');}
}


const report=read('data/draft_intelligence_research_2025_2026w8_v1.json');
assert.equal(report.schema,'fellas-draft-intelligence-research-v1');
assert.equal(report.seasonSummaries.length,2);
assert.equal(report.keeperResearch.season2025.length,10);
assert.equal(report.keeperResearch.season2026.length,10);
assert.equal(report.keeperResearch.opportunityCost,null);
assert.ok(report.limits.some(x=>x.includes('2026 is incomplete')));
const tier=rank=>rank<=2?'A':rank<=4?'B':rank<=6?'C':rank<=8?'D':'F';
const researchRound2=x=>Math.round((x+Number.EPSILON)*100)/100;
for(const season of report.seasonSummaries){
 const {year,managerGrades,lateRoundSteals,byRound}=season;
 assert.equal(managerGrades.length,10,'All ten manager research rows '+year);
 assert.equal(season.selectionCount,130,'All thirteen nonkeeper choices per team '+year);
 assert.equal(season.keeperExcluded,20,'Keep 20 keeper slots distinct '+year);
 assert.deepEqual(byRound.map(x=>x.round),Array.from({length:15},(_,i)=>i+1));
 assert.equal(byRound.reduce((n,x)=>n+x.picks,0),130);
 const sameYear=data.draftPicks.filter(p=>p.year===year&&!p.keeper);
 for(const [i,row] of managerGrades.entries()){
  const sourced=sameYear.filter(p=>p.manager===row.manager);
  assert.equal(sourced.length,13,'Must reconcile thirteen original picks: '+row.manager+' '+year);
  assert.equal(row.rankByObservedSurplus,i+1);
  assert.equal(row.isFinalGrade,year===2025);
  assert.equal(row.observedReturnGrade2025,year===2025?tier(i+1):null);
  assert.equal(row.nonKeeperPicks,13);
  assert.equal(row.startedPoints,researchRound2(sourced.reduce((n,x)=>n+x.startedPoints,0)));
  assert.equal(row.verifiedStarts,sourced.reduce((n,x)=>n+x.starts,0));
  assert.ok(Math.abs(row.pointsAbovePeerMedian-sourced.reduce((n,x)=>n+x.pointsAbovePeerMedian,0))<0.02);
  assert.equal(row.byRound.length,15);
  assert.equal(row.byRound.reduce((n,x)=>n+x.picks,0),13);
  assert.equal(row.lateRoundStartedPoints,researchRound2(sourced.filter(x=>x.round>=10).reduce((n,x)=>n+x.startedPoints,0)));
 }
 for(const steal of lateRoundSteals){
  const pick=sameYear.find(x=>x.manager===steal.manager&&x.overall===steal.overall&&x.player===steal.player);
  assert.ok(pick,'Late steal missing source: '+year+' '+steal.player);
  assert.ok(pick.round>=10&&pick.starts>=3&&!pick.keeper);
  assert.equal(steal.startedPoints,pick.startedPoints);
 }
}
assert.ok(report.seasonSummaries[1].lateRoundSteals.some(x=>x.manager==='Stilly'&&x.player==='Woody Marks'&&x.round===13&&x.overall===128&&x.startedPoints===25.9));
const recovered=report.espnArchive2016to2019;
assert.equal(recovered.selectionCountTotal,598);
assert.equal(recovered.seasons.length,4);
assert.equal(recovered.seasons.reduce((n,x)=>n+x.selections,0),598);
assert.deepEqual(recovered.seasons.map(x=>x.selections),[128,160,160,150]);
assert.equal(recovered.seasons.find(x=>x.year===2018).confirmedDraftPickOrder,false);
assert.ok(recovered.seasons.every(x=>x.originalStarterPointGrade===null));
assert.equal(report.archive2020to2024.byYear.length,5);
for(const season of report.archive2020to2024.byYear){
 assert.equal(season.managerRows.length,10);
 assert.equal(season.selectionCount,150);
 assert.equal(season.managerRows.reduce((n,x)=>n+x.selections,0),150);
 assert.ok(season.managerRows.every((x,i)=>x.rank===i+1&&x.observedReturnTier===tier(i+1)));
}
assert.ok(report.keeperResearch.season2026.every(x=>x.keeperOpportunityCost===null&&x.keeperDecisionGrade===null));

const medianArr=values=>{const ordered=values.slice().sort((a,b)=>a-b);return ordered.length%2?ordered[(ordered.length-1)/2]:(ordered[ordered.length/2-1]+ordered[ordered.length/2])/2;};
const keeperSlotRows=report.keeperResearch.season2026.flatMap(x=>x.keepers);
assert.equal(keeperSlotRows.length,20,'All twenty 2026 observed keeper round-slot receipts required');
for(const k of keeperSlotRows){
 const peers=data.draftPicks.filter(x=>x.year===2026&&!x.keeper&&x.round===k.round);
 assert.ok(peers.length>=3,'At least three same-round nonkeeper receipts');
 assert.equal(k.nonkeeperSameRoundPeerCount,peers.length);
 assert.equal(k.nonkeeperSameRoundMedianPoints,researchRound2(medianArr(peers.map(x=>x.startedPoints))));
 assert.equal(k.observedRoundSlotReturn,researchRound2(k.startedPoints-k.nonkeeperSameRoundMedianPoints));
 assert.equal(k.observedRoundSlotReturnIsDecisionOpportunityCost,false);
}
assert.equal(report.keeperResearch.roundSlotProxyStatus,'descriptive_only_not_decision_time_opportunity_cost');

const researchPage=fs.readFileSync('analytics/draft-intelligence.html','utf8');
assert.ok(researchPage.includes('draft_intelligence_research_2025_2026w8_v1.json'));
assert.ok(researchPage.includes('Keeper value vs. keeper decisions')&&researchPage.includes('no final grades')||researchPage.includes('No 2026 grades before season end.'));
assert.ok(fs.readFileSync('analytics/draft-value-lab.html','utf8').includes('draft-intelligence.html'));
assert.ok(fs.readFileSync('analytics/draft-keeper-value.html','utf8').includes('draft-intelligence.html'));
console.log('DRAFT + KEEPER PILOT VERIFIED: 260 nonkeeper draft receipts (2025/2026), 20 keeper observations, 2026 Week 7–8 original-team starts, source-backed value and no fabricated keeper grade.');
