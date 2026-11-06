// Recalculate the compact manager-profile draft/trade records from original archives.
// Match source facts exactly; research counts are not draft/trade decision skill.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const published=read('data/manager_draft_trade_profile_evidence_v1.json');
assert.equal(published.status,'research_only_no_draft_or_trade_skill_grades');
assert.equal(published.seasonCutoff.year,2026);
assert.equal(published.seasonCutoff.throughWeek,8);
const alias=n=>n==='Tom'?'Thommy':n;
const originals=[
 ...[2016,2017,2018,2019].flatMap(year=>read('data/espn_'+year+'_draft_recovered_v1.json').picks.map(p=>({
  year,manager:alias(p.manager),round:p.round,overall:p.overall,player:p.name||null,keeper:false
 }))),
 ...read('data/v9_draft_engine.json').map(p=>({
  year:p.year,manager:alias(p.manager),round:p.round,overall:p.overall,player:p.player||null,keeper:p.keeper===true
 }))
];
const byManagerYear=new Map();
for(const p of originals){
 const key=p.manager+'|'+p.year;
 if(!byManagerYear.has(key))byManagerYear.set(key,[]);
 byManagerYear.get(key).push(p);
}
const tradeGroups=new Map();
for(const side of read('data/v9_trade_engine.json').sides){
 if(side.provisional!==false||!String(side.confidence).startsWith('verified')||
    !Number.isFinite(side.direct_edge)||!side.trade_id)continue;
 const key=side.year+'|'+side.trade_id;
 if(!tradeGroups.has(key))tradeGroups.set(key,[]);
 tradeGroups.get(key).push(side);
}
const tradeCounts=new Map();
for(const sides of tradeGroups.values()){
 const managers=[...new Set(sides.map(s=>alias(s.manager)))];
 const complete=managers.length>=2&&sides.length===managers.length;
 for(const manager of managers){
  const key=manager+'|'+sides[0].year;
  const item=tradeCounts.get(key)||{representedEvents:0,fullyRepresentedEvents:0,partialEvents:0};
  item.representedEvents++;
  if(complete)item.fullyRepresentedEvents++;else item.partialEvents++;
  tradeCounts.set(key,item);
 }
}
assert.equal(published.rows.length,byManagerYear.size,'Missing or added manager-seasons');
const seen=new Set();
for(const row of published.rows){
 const key=row.manager+'|'+row.year;
 assert.ok(!seen.has(key),'Repeated manager-season '+key);
 seen.add(key);
 const picks=byManagerYear.get(key);
 assert.ok(picks?.length,'No source draft for '+key);
 picks.sort((a,b)=>a.overall-b.overall);
 assert.equal(row.platform,row.year<2020?'ESPN':'Sleeper');
 assert.equal(row.recordedSelections,picks.length);
 assert.equal(row.recordedKeeperSelections,picks.filter(p=>p.keeper).length);
 assert.equal(row.unresolvedNames,picks.filter(p=>!p.player).length);
 assert.deepEqual(row.earlySelections,picks.filter(p=>!p.keeper).slice(0,3).map(p=>({
  round:p.round,overall:p.overall,player:p.player
 })));
 assert.deepEqual(row.trades,tradeCounts.get(key)||{
  representedEvents:0,fullyRepresentedEvents:0,partialEvents:0
 });
 assert.ok(row.earlySelections.every(p=>p.player===null||
  typeof p.player==='string'&&p.player.length>0));
}
const endings=read('data/manager_verified_season_endings_v1.json').managers;
// JMid appears in the 2023 season ledger, but that year's archived draft
// identifies different original drafters. Never attribute their picks to him.
const noOriginalDraft=[{manager:'JMid',year:2023}];
for(const manager of ['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'])
 for(const season of endings[manager]){
  if(noOriginalDraft.some(g=>g.manager===manager&&g.year===season.year)){
   assert.ok(!seen.has(manager+'|'+season.year),
    '2023 draft ownership was incorrectly assigned to JMid');
   continue;
  }
  assert.ok(seen.has(manager+'|'+season.year),
   'Manager profile has no draft/trade evidence for '+manager+' '+season.year);
 }
assert.equal(seen.size,published.rows.length);
// Career résumé must reconcile with the same exact season-level records,
// and no manager can receive a phantom skill grade or uncertified 2026 trade.
const {buildDraftTradeCareer}=await import('../assets/manager-draft-trade-career.mjs');
const tabsSource=fs.readFileSync('assets/manager-profile-tabs.mjs','utf8');
const stoverSource=fs.readFileSync('managers/stover/index.html','utf8');
assert.ok(tabsSource.includes('function populateManagerResearch(quick,manager)')&&
 tabsSource.includes('populateManagerResearch(quick,manager);')&&
 tabsSource.includes('if(existingProfile&&!legacyNav)'),
 'Both standard and hand-curated profiles must mount the same research components');
// The Stover page uses the same runtime upgrader as every other manager.
// The chapter navigation is authored in HTML; tabs, quick-start features,
// and research components are mounted by manager-profile-tabs.mjs.
assert.ok(stoverSource.includes('class="profile-chapters')&&
 stoverSource.includes('manager-profile-tabs.mjs')&&
 stoverSource.includes('id="legacy-resume"')&&
 tabsSource.includes("nav.dataset.managerProfileTabs=''")&&
 tabsSource.includes("quick.className='profile-quickstart'"),
 'Stover custom profile must load shared navigation and research mount');
const currentManagers=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
for(const manager of currentManagers){
 const seasons=published.rows.filter(r=>r.manager===manager);
 const career=buildDraftTradeCareer(published.rows,manager);
 assert.equal(career.seasons,seasons.length);
 assert.equal(career.documentedPicks,seasons.reduce((n,s)=>n+s.recordedSelections,0));
 assert.equal(career.keeperSlots,seasons.reduce((n,s)=>n+s.recordedKeeperSelections,0));
 assert.equal(career.unresolvedNames,seasons.reduce((n,s)=>n+s.unresolvedNames,0));
 assert.equal(career.representedTrades,seasons.reduce((n,s)=>n+s.trades.representedEvents,0));
 assert.equal(career.representedTrades,career.fullyRepresentedTrades+career.partialTrades);
 assert.ok(career.latestPicks.length>=1&&career.latestPicks.length<=3);
 const source2026=seasons.find(x=>x.year===2026);
 assert.ok(source2026);
 assert.equal(source2026.trades.representedEvents,0,
  '2026 provisional trade sides must not be certified');
 const profileCode=fs.readFileSync('assets/manager-profile-tabs.mjs','utf8');
 assert.ok(profileCode.includes('mountDraftTradeCareer(shelfBody,keeperManager)'),
  'Manager profiles do not mount career résumé');
}
console.log('Manager draft/trade profile evidence PASS: '+seen.size+
 ' manager-seasons verified without fabricated grades or missing ESPN names');
