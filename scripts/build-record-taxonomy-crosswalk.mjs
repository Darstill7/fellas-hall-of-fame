// Build a governance-grade crosswalk of incumbent and proposed Record Book IDs.
// No live site files are modified. node scripts/build-record-taxonomy-crosswalk.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const incumbent=read('data/expanded_records_verified_v1.json');
const legendary=read('data/legendary_records_2016_2025_v1.json');
const groups=[
 {pr:202,source:'shared-registry',ids:[
 'weekly-highs-career','weekly-lows-career','weekly-seconds-career',
 'top-three-scoring-losses','bottom-three-scoring-wins',
 'weekly-highs-season','weekly-lows-season','weekly-high-streak','weekly-low-streak',
 'rivalry-consecutive-meeting-wins','combined-matchup-points']},
 {pr:203,source:'phase2-scoring',ids:[
 'weekly-highs','weekly-lows','weekly-runnerups','weekly-top-three','weekly-bottom-three',
 'top-three-losses','bottom-three-wins','runnerup-losses','second-lowest-wins',
 'season-top-three','season-bottom-three','season-weekly-highs','season-weekly-lows',
 'career-150-plus','career-sub-80','season-150-plus','season-sub-80',
 'high-streak','low-streak','combined-high','combined-low','rival-win-run','rival-one-point']},
 {pr:204,source:'turnaround-resilience',ids:[
 'turnaround-largest-half-swing','turnaround-largest-half-swing-playoff',
 'turnaround-largest-half-swing-finalist','turnaround-deepest-hole-playoff',
 'turnaround-deepest-hole-finalist','turnaround-deepest-hole-champion',
 'turnaround-loss-streak-playoff','turnaround-win-streak-finalist',
 'turnaround-most-late-half-wins-finalist','turnaround-most-late-half-wins-playoff',
 'turnaround-perfect-second-half-playoff','turnaround-last-four-wins-champion',
 'turnaround-last-four-losses-finalist','turnaround-wins-after-low-point-champion']},
 {pr:205,source:'historic-collapses',ids:[
 'collapse-half-season-swing','collapse-half-season-swing-missed-playoffs',
 'collapse-half-season-swing-playoff-team','collapse-lead-erosion',
 'collapse-second-half-losses','collapse-second-half-winless',
 'collapse-first-half-wins-missed-playoffs','collapse-early-undefeated-no-title',
 'collapse-last-four-losses-playoff','collapse-longest-loss-run-missed-playoffs',
 'collapse-strongest-season-no-final']},
 {pr:206,source:'playoff-upsets',ids:[
 'playoff-upset-largest-seed-gap','playoff-upset-largest-semifinal',
 'playoff-upset-largest-opening','playoff-upset-most-career',
 'playoff-upset-most-top-two','playoff-elimination-most-one-seeds',
 'playoff-elimination-most-one-seed-exits','playoff-elimination-narrowest',
 'playoff-elimination-biggest-margin','playoff-elimination-top-seed-closest']},
 {pr:null,source:'phase3-postseason',branch:'research/postseason-records-phase3-20261111',ids:[
 'postseason-consecutive-finals','postseason-consecutive-semifinals',
 'postseason-consecutive-byes','postseason-semis-no-final',
 'postseason-byes-no-final','postseason-finals-without-bye',
 'postseason-final-conversion','postseason-title-conversion']}
];
// Direct duplicate = matching outcome and qualification rule in recovered-source definitions.
// Related-but-not-identical definitions are deliberately NOT automatically merged.
const aliases={
 'weekly-highs':'weekly-highs-career','weekly-lows':'weekly-lows-career',
 'weekly-runnerups':'weekly-seconds-career',
 'top-three-losses':'top-three-scoring-losses',
 'bottom-three-wins':'bottom-three-scoring-wins',
 'season-weekly-highs':'weekly-highs-season','season-weekly-lows':'weekly-lows-season',
 'high-streak':'weekly-high-streak','low-streak':'weekly-low-streak',
 'combined-high':'combined-matchup-points','rival-win-run':'rivalry-consecutive-meeting-wins',
 'turnaround-deepest-hole-playoff':'deepest-playoff-qualifier-hole',
 'turnaround-deepest-hole-champion':'deepest-champion-hole',
 'playoff-upset-largest-seed-gap':'biggest-final-seed-upset', // SEE limitation: all-round vs final ONLY; override as related below.
 'playoff-elimination-narrowest':'closest-opening-playoff-loss' // SEE limitation: all-round vs opening ONLY; override as related below.
};
delete aliases['playoff-upset-largest-seed-gap'];
delete aliases['playoff-elimination-narrowest'];
const related={
 'playoff-upset-largest-seed-gap':['biggest-final-seed-upset'],
 'playoff-elimination-narrowest':['closest-opening-playoff-loss','closest-semifinal-loss','closest-championship-final'],
 'playoff-elimination-biggest-margin':['largest-championship-margin'],
 'playoff-upset-largest-opening':['biggest-final-seed-upset'],
 'collapse-strongest-season-no-final':['best-record-no-title'],
 'turnaround-deepest-hole-finalist':['finalist-opening-losses'],
 'turnaround-last-four-losses-finalist':['collapse-last-four-losses-playoff'],
 'collapse-last-four-losses-playoff':['turnaround-last-four-losses-finalist'],
 'highest-score-in-loss':['highest-score-loss']
};
const canonicalIds=new Set([
 ...incumbent.categories.map(c=>c.key),
 ...legendary.categories.map(c=>c.id),
 ...groups.flatMap(g=>g.ids)
]);
assert.equal(incumbent.categoryCount,44);
assert.equal(legendary.categories.length,19);
assert.equal(groups.reduce((n,g)=>n+g.ids.length,0),77);
for(const [key,target] of Object.entries(aliases)){
 assert(canonicalIds.has(key)&&canonicalIds.has(target),'Unknown direct alias '+key+' to '+target);
 assert.notEqual(key,target);
}
for(const [key,targets] of Object.entries(related)){
 assert(canonicalIds.has(key),'Unknown related ID '+key);
 for(const target of targets)assert(canonicalIds.has(target),'Unknown related target '+target);
}
const resolve=id=>{
 const visited=new Set();
 while(aliases[id]){
  assert(!visited.has(id),'Duplicate resolution cycle '+id);
  visited.add(id);id=aliases[id];
 }
 return id;
};
const taxonomy=new Map();
function put(id,label,origin){
 const stable=resolve(id);
 if(!taxonomy.has(stable))taxonomy.set(stable,{id:stable,canonicalLabel:label,origin,
  aliases:[],proposals:[],relatedReview:new Set(),sourceFamilies:new Set()});
 const row=taxonomy.get(stable);
 if(id!==stable)row.aliases.push(id);
 return row;
}
for(const c of incumbent.categories)put(c.key,c.label,{type:'expanded',file:'data/expanded_records_verified_v1.json'});
for(const c of legendary.categories)put(c.id,c.label,{type:'legendary',file:'data/legendary_records_2016_2025_v1.json'});
for(const g of groups)for(const id of g.ids){
 const row=put(id,id,{type:'proposal',source:g.source});
 row.sourceFamilies.add(g.source);
 row.proposals.push({id,source:g.source,pr:g.pr,branch:g.branch??null});
 if(related[id])for(const other of related[id])row.relatedReview.add(resolve(other));
}
for(const [id,links] of Object.entries(related)){
 const row=taxonomy.get(resolve(id));
 for(const link of links)row.relatedReview.add(resolve(link));
}
for(const row of taxonomy.values()){
 row.aliases=[...new Set(row.aliases)].sort();
 row.relatedReview=[...row.relatedReview].filter(x=>x!==row.id).sort();
 row.sourceFamilies=[...row.sourceFamilies].sort();
 row.status=row.origin.type==='expanded'||row.origin.type==='legendary'?
  'existing-source-preserved':'candidate-awaiting-certification';
 row.publication='never-auto-publish';
}
const list=[...taxonomy.values()].sort((a,b)=>
 ['expanded','legendary','proposal'].indexOf(a.origin.type)-['expanded','legendary','proposal'].indexOf(b.origin.type)||
 a.id.localeCompare(b.id));
const byManagerPolicy={
 managerKey:'canonical historical manager key',
 aliasPolicy:'Tom -> Thommy, but Schermerhorn remains a separate historical manager; 2023 Evans never maps to JMid',
 tiedRanks:'Competition rank shared by all tied holders, no arbitrary truncation',
 evidence:'year, week, opponent or playoff round, exact source path, source-era and qualification caveats',
 portfolio:'One manager best mark per canonical category, regardless of whether in global top ten',
 currentSeason:'2026 through Week 9 only where regular-season category permits; completed-season and postseason categories use 2016–2025'
};
const result={schema:'fellas-record-taxonomy-crosswalk-v1',
 status:'research-only-no-production-writes',updated:'2026-11-11',
 sources:{existingExpanded:'data/expanded_records_verified_v1.json',
  existingLegendary:'data/legendary_records_2016_2025_v1.json',
  candidateGroups:groups.map(({pr,source,branch,ids})=>({source,pr,branch:branch??null,count:ids.length}))},
 coverage:{publishedExpandedIDs:incumbent.categories.length,existingLegendaryIDs:legendary.categories.length,
  proposedAppearances:groups.reduce((n,g)=>n+g.ids.length,0),
  directAliasRules:Object.keys(aliases).length,
  uniqueTaxonomyIDs:list.length,
  candidateOnlyIDs:list.filter(x=>x.origin.type==='proposal').length,
  relatedReviewItems:list.filter(x=>x.relatedReview.length>0).length},
 aliasRules:aliases,relatedReview:related,managerPolicy:byManagerPolicy,categories:list};
assert.equal(result.coverage.publishedExpandedIDs,44);
assert.equal(result.coverage.existingLegendaryIDs,19);
assert.equal(new Set(list.map(x=>x.id)).size,list.length);
assert(list.some(x=>x.id==='deepest-champion-hole'&&x.aliases.includes('turnaround-deepest-hole-champion')));
assert(list.some(x=>x.id==='weekly-highs-career'&&x.aliases.includes('weekly-highs')));
console.log(JSON.stringify(result,null,2));
