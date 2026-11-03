// Enforce parity between tracked public keeper research and generated canonical evidence.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const site=read('data/keeper_2025_website_research_v1.json');
const research=read('data-integrity/keeper-2025-decision-research-index-v1.json');
const partial=read('data/keeper_2026_website_research_v1.json');
const allKeeperDrafts=read('data/v9_draft_engine.json').filter(p=>p.keeper);
assert.deepEqual([...new Set(allKeeperDrafts.map(p=>p.year))].sort(),[2025,2026]);
assert.ok(Number.isInteger(partial.throughWeek)&&partial.throughWeek>=8&&partial.throughWeek<=14);
assert.equal(partial.status,'in_progress_2026_week1_to_week'+partial.throughWeek+'_no_completed_season_score');
assert.equal(partial.season,2026);
assert.ok(partial.selections.every(p=>p.observations.length===partial.throughWeek));
for(let w=1;w<=partial.throughWeek;w++)assert.ok(partial.sourcePaths.includes('data/sleeper_roster_snapshots_2026_week'+w+'.json'));
assert.ok(!partial.sourcePaths.includes('data/sleeper_roster_snapshots_2026_week'+(partial.throughWeek+1)+'.json'));

assert.equal(partial.rows.length,10);
assert.equal(partial.selections.length,20);
assert.equal(partial.rows.reduce((n,m)=>n+m.keepers.length,0),20);
assert.ok(partial.rows.every(m=>m.researchScore===null&&m.officialKeeperDecisionGrade===null&&m.championshipStarterPoints===null));
assert.ok(partial.rows.every(m=>m.verifiedDropStatus==='not_audited_for_2026'));

// Independently reconcile all published 2026 rows with their underlying keeper receipts.
// This catches partial/stale summaries even when a reader bypasses the generator.
const round2=n=>Math.round((n+Number.EPSILON)*100)/100;
const picksByManager=new Map();
const seenKeeperKeys=new Set();
for(const p of partial.selections){
 const key=p.manager+'|'+p.player;
 assert.ok(!seenKeeperKeys.has(key),'Duplicate 2026 keeper: '+key);
 seenKeeperKeys.add(key);
 assert.equal(p.observations.length,partial.throughWeek);
 assert.equal(p.observations.filter(o=>o.startedForOriginalManager).length,p.verifiedOriginalManagerStarts,'2026 original-manager starts: '+key);
 assert.deepEqual(p.observations.map(o=>o.week),Array.from({length:partial.throughWeek},(_,i)=>i+1),'2026 weekly coverage: '+key);
 assert.ok(p.observations.every(o=>!o.startedForOriginalManager||o.onOriginalTeam),'2026 keeper credit after transfer: '+key);
 assert.ok(p.observations.every(o=>!o.onOriginalTeam||o.rosterTeamId===p.originalTeamId),'2026 owner identity mismatch: '+key);
 assert.equal(p.startingReceipts.length,p.verifiedOriginalManagerStarts,'2026 starter receipts: '+key);
 assert.deepEqual(p.startingReceipts.map(r=>r.week),p.observations.filter(o=>o.startedForOriginalManager).map(o=>o.week),'2026 receipt weeks: '+key);
 assert.ok(p.startingReceipts.every(r=>r.source==='data/sleeper_roster_snapshots_2026_week'+r.week+'.json'),'2026 receipt provenance: '+key);
 assert.ok(p.startingReceipts.every(r=>Number.isFinite(r.points)&&Number.isFinite(r.median)),'2026 finite points: '+key);
 assert.ok(Math.abs(round2(p.startingReceipts.reduce((n,r)=>n+r.points,0))-p.verifiedOriginalManagerStartedPoints)<.011,'2026 keeper points: '+key);
 assert.ok(Math.abs(round2(p.startingReceipts.reduce((n,r)=>n+r.median,0))-p.observedStarterMedianPoints)<.011,'2026 keeper median: '+key);
 assert.ok(Math.abs(round2(p.startingReceipts.reduce((n,r)=>n+r.points-r.median,0))-p.relativeToStartedPositionMedians)<.011,'2026 positional surplus: '+key);
 if(!picksByManager.has(p.manager))picksByManager.set(p.manager,[]);
 picksByManager.get(p.manager).push(p);
}
assert.equal(picksByManager.size,10);
const seenManagers=new Set();
for(const m of partial.rows){
 assert.ok(!seenManagers.has(m.manager),'Duplicate 2026 manager row: '+m.manager);
 seenManagers.add(m.manager);
 const picks=picksByManager.get(m.manager);
 assert.equal(picks?.length,2,'2026 keeper selection count: '+m.manager);
 assert.equal(m.keepers.length,2,'2026 published keeper count: '+m.manager);
 for(const pick of picks){
  const shown=m.keepers.filter(k=>k.name===pick.player);
  assert.equal(shown.length,1,'2026 keeper row identity: '+m.manager+'/'+pick.player);
  assert.equal(shown[0].round,pick.round);
  assert.equal(shown[0].position,pick.position);
  assert.equal(shown[0].starts,pick.verifiedOriginalManagerStarts);
  assert.equal(shown[0].startedPoints,pick.verifiedOriginalManagerStartedPoints);
  assert.equal(shown[0].transferredDuringSeason,pick.tradedSameSeasonArchiveFlag);
 }
 assert.equal(m.verifiedOriginalManagerStarts,picks.reduce((n,p)=>n+p.verifiedOriginalManagerStarts,0),'2026 manager starts: '+m.manager);
 assert.ok(Math.abs(m.regularStartedPoints-round2(picks.reduce((n,p)=>n+p.verifiedOriginalManagerStartedPoints,0)))<.011,'2026 manager points: '+m.manager);
 assert.ok(Math.abs(m.regularVsStarterMedian-round2(picks.reduce((n,p)=>n+p.relativeToStartedPositionMedians,0)))<.011,'2026 manager surplus: '+m.manager);
 assert.ok(Math.abs(m.nominalDraftCapital-round2(picks.reduce((n,p)=>n+Math.min(100,Math.max(0,(p.round-1)/14*100)),0)/2))<.011,'2026 draft capital: '+m.manager);
 assert.equal(m.components.observedProduction,null);
 assert.equal(m.components.nominalDraftCapital,null);
 assert.equal(m.components.championshipContribution,null);
 assert.equal(m.otherWeek15to17StartedPoints,null);
}

// Re-read the provider roster snapshots, not merely the published research receipts.
// Match the generator's documented player-name normalization until stable player IDs
// are available for all draft picks. Fail on duplicate matches or stale attribution.
const normalizeKeeperName=s=>String(s??'').toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\b/g,'').replace(/[^a-z0-9]/g,'');
for(let week=1;week<=partial.throughWeek;week++){
 const source='data/sleeper_roster_snapshots_2026_week'+week+'.json';
 const weekly=read(source);
 assert.equal(weekly.week,week,'Keeper snapshot week mismatch: '+source);
 assert.equal(weekly.season??weekly.year,2026,'Keeper snapshot season mismatch: '+source);
 assert.equal(weekly.rosters.length,10,'Incomplete keeper roster snapshot: '+source);
 const owners=weekly.rosters.map(t=>Number(t.teamId)).sort((a,b)=>a-b);
 assert.deepEqual(owners,Array.from({length:10},(_,i)=>i+1),'Keeper snapshot team coverage: '+source);
 const starters=weekly.rosters.flatMap(t=>t.starters);
 assert.equal(starters.length,90,'Keeper snapshot starter coverage: '+source);
 assert.ok(starters.every(p=>Number.isFinite(p.points)),'Invalid keeper cohort points: '+source);
 const medians={};
 for(const position of ['QB','RB','WR','TE']){
  const values=starters.filter(p=>p.position===position).map(p=>p.points).sort((a,b)=>a-b);
  assert.ok(values.length>=10,'Insufficient '+position+' cohort: '+source);
  const mid=Math.floor(values.length/2);
  medians[position]=round2(values.length%2?values[mid]:(values[mid-1]+values[mid])/2);
 }
 for(const pick of partial.selections){
  const hits=weekly.rosters.flatMap(team=>[
   ...team.starters.map(player=>({...player,isStarter:true})),
   ...team.bench.map(player=>({...player,isStarter:false}))
  ].filter(player=>normalizeKeeperName(player.name)===normalizeKeeperName(pick.player))
    .map(player=>({...player,teamId:String(team.teamId)})));
  assert.ok(hits.length<=1,'Ambiguous keeper in '+source+': '+pick.player);
  const hit=hits[0];
  const original=!!hit&&hit.teamId===pick.originalTeamId;
  const started=original&&hit.isStarter;
  const observation=pick.observations[week-1];
  const key=pick.manager+'/'+pick.player+' Week '+week;
  assert.equal(observation.rosterTeamId,hit?.teamId??null,'Snapshot ownership: '+key);
  assert.equal(observation.onOriginalTeam,original,'Snapshot original-team status: '+key);
  assert.equal(observation.startedForOriginalManager,started,'Snapshot starter status: '+key);
  const receipt=pick.startingReceipts.find(r=>r.week===week);
  if(!started){assert.equal(receipt,undefined,'Unowned starter receipt: '+key);continue;}
  assert.ok(receipt,'Missing source starter receipt: '+key);
  assert.ok(Math.abs(receipt.points-hit.points)<.011,'Source starter score: '+key);
  assert.ok(Math.abs(receipt.median-medians[pick.position])<.011,'Source position median: '+key);
 }
}

const composite=read('data-integrity/keeper-2025-composite-evidence-v1.json');
const bracket=read('data-integrity/keeper-2025-championship-bracket-contribution-v1.json');
const draft=read('data/v9_draft_engine.json').filter(x=>x.year===2025&&x.keeper);
const close=(a,b,scope,tol=.011)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol,scope+': '+a+' vs '+b);
assert.equal(site.schema,'fellas-2025-keeper-website-research-v1');
assert.equal(site.status,'research_only_no_public_ovr_changes');
assert.equal(site.rows.length,10);
assert.deepEqual([...new Set(site.rows.map(x=>x.manager))].sort(),[...new Set(research.rows.map(x=>x.manager))].sort());
for(const m of site.rows){
 const r=research.rows.find(x=>x.manager===m.manager);
 const c=composite.managers.find(x=>x.manager===m.manager);
 const b=bracket.rows.find(x=>x.manager===m.manager);
 assert.ok(r&&c&&b,'Missing canonical manager '+m.manager);
 assert.equal(m.officialKeeperDecisionGrade,null);
 assert.equal(r.certifiedKeeperDecisionScore,null);
 assert.equal(r.publicReportCardKeeperGrade,null);
 assert.equal(m.keepers.length,2);
 assert.equal(m.verifiedDrops.length,r.verifiedDropCount);
 close(m.researchScore,r.observedResearchIndex,m.manager+' research score');
 close(m.components.observedProduction,r.observedProductionComponent,m.manager+' production component');
 close(m.components.nominalDraftCapital,r.nominalKeeperCapitalComponent,m.manager+' draft component');
 close(m.components.championshipContribution,r.observedPostseasonContributionComponent,m.manager+' championship component');
 close(m.regularVsStarterMedian,c.descriptiveDifferenceFromLeagueStarterMedians,m.manager+' weekly median');
 close(m.regularStartedPoints,c.verifiedRegularStarterPoints,m.manager+' regular');
 close(m.championshipStarterPoints,b.verifiedChampionshipBracketKeeperStartedPoints,m.manager+' championship points');
 close(m.otherWeek15to17StartedPoints,b.otherWeek15To17KeeperStartedPoints,m.manager+' placement points');
 assert.equal(m.playoffQualified,b.qualifiedFor2025ChampionshipBracket);
 for(const k of m.keepers){
  const p=draft.filter(x=>(x.manager==='Tom'?'Thommy':x.manager)===m.manager&&x.player===k.name);
  assert.equal(p.length,1,'Draft identity missing '+m.manager+'/'+k.name);
  assert.equal(k.round,p[0].round);
  assert.equal(k.position,p[0].position);
 }
}
const html=fs.readFileSync('analytics/keeper-decision-research.html','utf8');
const js=fs.readFileSync('assets/keeper-decision-research-page.mjs','utf8');
assert.ok(html.includes('../assets/keeper-decision-research-page.mjs'));
assert.ok(js.includes('keeper_2025_website_research_v1.json'));
assert.ok(html.includes('not an official grade'));
assert.ok(html.includes('id="keeper-year"'));
assert.ok(html.includes('value="2026"'));
assert.ok(js.includes('keeper_2026_website_research_v1.json'));
assert.ok(js.includes('2026 is in progress'));
assert.ok(js.includes('no comparable Keeper Decision Score'));
assert.ok(js.includes('researchScore!==null'));

assert.ok(fs.readFileSync('analytics/manager-report-cards.html','utf8').includes('keeper-decision-research.html'));
assert.ok(fs.readFileSync('managers/index.html','utf8').includes('keeper-decision-research.html'));
console.log('Keeper research website PASS: 2025 completed plus 2026 Week 1–'+partial.throughWeek+' verified evidence; 40 keeper selections; no partial-season rating');
