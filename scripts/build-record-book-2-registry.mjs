// Research-only unified record registry and manager portfolios.
// Run: node scripts/build-record-book-2-registry.mjs > /tmp/fellas-record-book-2-registry.json
// Does not change public website assets or certified record files.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const expanded=read('data/expanded_records_verified_v1.json');
const legendary=read('data/legendary_records_2016_2025_v1.json');
const postseason=read('data/postseason_records_verified_v1.json');
const taxonomy=JSON.parse(execFileSync('node',['scripts/build-record-taxonomy-crosswalk.mjs'],{encoding:'utf8',maxBuffer:10*1024*1024}));
const phase2=JSON.parse(execFileSync('node',['scripts/build-record-book-phase2.mjs'],{encoding:'utf8',maxBuffer:10*1024*1024}));
const norm=x=>x==='Tom'?'Thommy':x;
const normalize=id=>{let seen=new Set();while(taxonomy.aliasRules[id]){assert(!seen.has(id));seen.add(id);id=taxonomy.aliasRules[id]}return id};
const records=[],ids=new Set();
const add=c=>{assert(!ids.has(c.record_id),'Record ID collision: '+c.record_id);ids.add(c.record_id);records.push(c)};
const fullManagers=new Set(['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott','Evans','Koble','Halderman','Schermerhorn']);
const simplify=(e)=>({manager:norm(e.manager),rank:e.rank,value:e.value,year:e.year??e.evidence?.year??null,week:e.week??e.evidence?.week??null,opponent:e.opponent??e.evidence?.opponent??null,evidence:e.evidence??null});
const bestPerManager=rows=>{
 const m=new Map();
 for(const r of rows){if(!r.manager)continue;const p=m.get(r.manager);if(!p||r.rank<p.rank)m.set(r.manager,r)}
 return [...m.values()].sort((a,b)=>a.rank-b.rank||a.manager.localeCompare(b.manager));
};
// The existing expanded dataset stores up to 20 entries, rather than all eligible season/event/rivalry rows.
// Those categories may yield an INCOMPLETE manager-best index. This builder refuses to hide that limitation.
for(const c of expanded.categories){
 const rows=c.leaders.map(simplify);
 const personal=bestPerManager(rows),truncated=c.entries>c.leaders.length;
 for(const e of personal)fullManagers.add(e.manager);
 add({record_id:c.key,title:c.label,family:c.group,direction:c.direction,unit:c.unit,
  status:'existing-source-preserved',publication:'existing-only-no-new-certification',
  coverage:'2016–2026 W9 regular season; completed season awards through 2025',
  eligibility:c.qualifier??null,source:'data/expanded_records_verified_v1.json',
  completeManagerRanking:!truncated,sourceEntryCount:c.entries,sourceStoredCount:rows.length,
  knownLeaders:rows.filter(e=>e.rank===1),displayRows:rows.slice(0,20),
  managerBest:personal,notes:truncated?['Rankings are truncated at source: do not assert an absent manager has no personal record.']:[]});
}
// Legendary exhibits have qualitative metrics: do not invent a numeric rank or count their owner as a new score trophy.
const duplicateLegendary={'highest-score-in-loss':'highest-score-loss'};
for(const c of legendary.categories){
 const duplicate=duplicateLegendary[c.id];
 add({record_id:c.id,title:c.title,family:'Legendary',direction:null,unit:null,
  status:'existing-source-preserved',publication:'existing-only-no-new-certification',
  coverage:'Completed seasons 2016–2025',eligibility:c.rule,source:'data/legendary_records_2016_2025_v1.json',
  metricDisplay:c.metric,description:c.detail,aliasOfExisting:duplicate??null,
  knownLeaders:c.holder.map(x=>({manager:norm(x.manager),year:x.year,rank:1})),
  managerBest:c.holder.map(x=>({manager:norm(x.manager),year:x.year,rank:1})),
  completeManagerRanking:false,notes:['Qualitative story exhibit: not an independently additive numerical record.']});
}
// Invariant: include every category proposal, but never report as newly certified.
// Direct aliases share an existing candidate or exhibit ID in the crosswalk.
for(const c of phase2.categories){
 const id=normalize(c.id);
 const sourceAliases=taxonomy.categories.find(x=>x.id===id)?.aliases||[];
 // If Phase 2 aliases a known existing record, preserve its source as candidate-only metadata.
 if(ids.has(id)){
  const t=records.find(x=>x.record_id===id);
  t.proposalAliases=[...(t.proposalAliases||[]),c.id];
  continue;
 }
 const rows=c.leaders.map(e=>({manager:norm(e.manager),year:e.year??null,week:e.week??null,
  value:e.value,rank:e.rank,opponent:e.opponent??null,evidence:e.evidence??null}));
 const personal=bestPerManager(c.managerBest.map(e=>({manager:norm(e.manager),year:e.year??null,week:e.week??null,
  value:e.value,rank:e.rank,opponent:e.opponent??null,evidence:e.evidence??null})));
 add({record_id:id,title:c.title,family:c.scope,direction:c.direction,unit:c.unit,
  status:'candidate-awaiting-certification',publication:'research-only',
  coverage:'2016–2026 W9 regular season; season entries 2016–2025',
  eligibility:'See phase2 research generator and missing full-week exclusions',
  source:'scripts/build-record-book-phase2.mjs',proposalAliases:[c.id,...sourceAliases.filter(x=>x!==c.id)],
  completeManagerRanking:true,sourceEntryCount:c.count,sourceStoredCount:c.count,
  knownLeaders:rows.filter(x=>x.rank===1),displayRows:rows,
  managerBest:personal,notes:['Full personal-best index from all eligible Phase 2 rows; status remains provisional pending original-provider certification.']});
}
// Postseason leader series are kept separate from the published expanded 44 categories.
const postseasonGroups=[['playoffBerths','Playoff appearances'],['finals','Championship game appearances'],
 ['semifinals','Semifinal appearances'],['byes','First-round byes'],['topSeeds','No. 1 playoff seeds'],
 ['championships','League championships'],['berthStreak','Consecutive playoff appearances']];
for(const [key,title] of postseasonGroups){
 const vals=postseason.leaders[key];
 assert(Array.isArray(vals),'Missing postseason leaderboard '+key);
 const grouped=new Map();
 for(const r of vals){const m=norm(r.manager);assert(!grouped.has(m),'duplicate postseason manager '+m);
  grouped.set(m,{manager:m,value:r.count,years:r.years??[]})}
 const sorted=[...grouped.values()].sort((a,b)=>b.value-a.value||a.manager.localeCompare(b.manager));
 let previous=null,rank=0;
 const rows=sorted.map((r,i)=>{if(r.value!==previous){rank=i+1;previous=r.value}return {...r,rank}});
 add({record_id:'postseason-'+key,title,family:'Postseason',direction:'high',unit:'occurrences',
  status:'existing-source-preserved',publication:'existing-only-no-new-certification',
  coverage:'2016–2025 completed seasons',eligibility:'Verified championship bracket participation; no consolation',
  source:'data/postseason_records_verified_v1.json',completeManagerRanking:true,
  sourceEntryCount:rows.length,sourceStoredCount:rows.length,
  knownLeaders:rows.filter(x=>x.rank===1),displayRows:rows,managerBest:rows,
  notes:[]});
}
// Curated editorial policy: lowlights and opponent/schedule adversity are not positive trophy titles.
const nonTrophyExpanded=new Set(['lowest-score','highest-score-loss','lowest-score-win',
 'biggest-defeat','narrowest-defeat','points-against','wins-below-100',
 'high-score-losses','one-score-drama']);
const profiles={};
for(const manager of [...fullManagers].sort()){
 const items=records.flatMap(c=>c.managerBest.filter(x=>x.manager===manager).map(x=>({
  record_id:c.record_id,title:c.title,family:c.family,status:c.status,
  leagueRank:x.rank,value:x.value??c.metricDisplay??null,year:x.year??null,
  positiveTrophyEligible:c.status==='existing-source-preserved'&&c.family!=='Legendary'&&
    c.family!=='Postseason'&&c.direction==='high'&&x.rank===1&&!nonTrophyExpanded.has(c.record_id),
  completeness:c.completeManagerRanking?'complete-source-ranking':'limited-source-ranking'
 })));
 const absent=records.filter(c=>!c.completeManagerRanking&&!c.managerBest.some(x=>x.manager===manager)).length;
 profiles[manager]={manager,recordPlacements:items,knownPlacements:items.length,
  visibleFirstPlaceMarks:items.filter(x=>x.leagueRank===1).length,
  eligiblePositiveExpandedFirstPlaceMarks:items.filter(x=>x.positiveTrophyEligible).length,
  categoriesWithUnknownPersonalRank:absent,
  warning:'Counts only source-exposed placements; absent records and unverified proposed IDs are not evidence of zero.'};
}
const out={schema:'fellas-record-book-2-research-registry-v1',
 status:'research-only-no-production-writes',updated:'2026-11-13',
 sourceManifest:['data/expanded_records_verified_v1.json','data/legendary_records_2016_2025_v1.json',
  'data/postseason_records_verified_v1.json','scripts/build-record-book-phase2.mjs',
  'scripts/build-record-taxonomy-crosswalk.mjs'],
 coverage:{expanded:expanded.categories.length,legendary:legendary.categories.length,
  phase2Proposals:phase2.categories.length,postseasonGroups:postseasonGroups.length,
  uniqueRegistryIDs:records.length,completeRankingCategories:records.filter(x=>x.completeManagerRanking).length,
  incompleteRankingCategories:records.filter(x=>!x.completeManagerRanking).length,
  managers:Object.keys(profiles).length},
 caveats:['Source has truncated event/season lists; full manager best marks cannot yet be asserted for every manager.',
  'Legendary descriptions and matching scoring IDs are deliberately NOT additive trophies.',
  'Research Phase 2 candidates are not published or independently provider-certified.',
  'Postseason categories are from already archived verified-bracket summaries, not a new original-provider fetch.',
  'No auto-merge of semantically related but different playoff or season categories.',
  '2020/2021 Week 14 excluded from full weekly league ranking, but played matches remain valid.',
  '2016 used 8 managers; original ESPN scoring changed; Evans owns 2023 and JMid starts 2024.',
  'All tied top holders appear; no implicit unique first-place winner.'],
 records,profiles};
assert.equal(out.coverage.expanded,44);assert.equal(out.coverage.legendary,19);
assert.equal(out.coverage.phase2Proposals,23);assert.equal(out.coverage.postseasonGroups,7);
assert.equal(new Set(records.map(x=>x.record_id)).size,records.length);
assert.equal(Object.keys(profiles).length,14);
for(const p of Object.values(profiles))for(const x of p.recordPlacements)
 assert(records.some(c=>c.record_id===x.record_id&&c.managerBest.some(m=>m.manager===p.manager)));
console.log(JSON.stringify(out,null,2));
