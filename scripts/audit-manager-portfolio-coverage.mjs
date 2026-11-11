// Audit completeness of current manager records before displaying "all records" claims.
// Run: node scripts/audit-manager-portfolio-coverage.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
const path='data/expanded_records_verified_v1.json';
const ledger=JSON.parse(fs.readFileSync(path,'utf8'));
const active=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
const normalize=n=>n==='Tom'?'Thommy':n;
assert.equal(ledger.categories.length,44);
const categories=ledger.categories.map(c=>({
 id:c.key,group:c.group,sourceEntries:c.entries,retainedLeaderboardEntries:c.leaders.length,
 sourceCapped:c.entries>c.leaders.length,
 observedManagerCount:new Set(c.leaders.map(r=>normalize(r.manager))).size,
 sourceCoverageFraction:Number((c.leaders.length/c.entries).toFixed(4))
}));
const managerCoverage={};
for(const name of active){
 const sourceName=name==='Thommy'?'Tom':name;
 const signature=ledger.signatures[sourceName];
 assert(signature,'Missing signature '+name);
 const seen=new Set();
 const row=[];
 for(const cat of ledger.categories){
  const matches=cat.leaders.filter(e=>normalize(e.manager)===name);
  if(matches.length){
   const best=matches.reduce((a,b)=>a.rank<=b.rank?a:b);
   seen.add(cat.key);
   row.push({categoryId:cat.key,rank:best.rank,evidence:'retained-leaderboard'});
  }
 }
 const highlights=signature.highlights||[];
 const extra=highlights.filter(x=>!seen.has(x.key));
 for(const h of extra){seen.add(h.key);row.push({categoryId:h.key,rank:h.leagueRank,evidence:'signature-only'})}
 assert.equal(new Set(row.map(x=>x.categoryId)).size,row.length);
 managerCoverage[name]={
 claimedSourceCategoriesWithEvidence:signature.categoriesWithEvidence,
 actuallyRecoverableUniqueCategories:row.length,
 truncatedSourceCategoryCount:categories.filter(c=>c.sourceCapped).length,
 personalHighlights:highlights.length,
 missingCategoryCount:ledger.categories.length-row.length,
 missingCategoryIds:ledger.categories.map(c=>c.key).filter(id=>!seen.has(id)),
 categoryEntries:row.sort((a,b)=>a.categoryId.localeCompare(b.categoryId))
 };
}
const result={
 schema:'fellas-manager-portfolio-completeness-audit-v1',
 status:'research-only',
 sourcePath:path,
 totalPublishedExpandedCategories:44,
 notes:[
  'The 44 published expanded categories are valid source categories, but source category leaderboards may retain only 20 rows while their full ranked population is much larger.',
  'A manager signature normally selects eight highlights, not necessarily an exhaustive 44-category portfolio.',
  'Missing a manager from retained top-20 and curated highlights does not prove that the manager has no qualifying mark.',
  'A manager can hold a personal best in a category without appearing in its top 20; the all-records page needs regenerated full category rankings.',
  'Never reconstruct missing personal placements by assigning a rank of zero or claiming an unearned league record.',
  'Team identity Tom maps to Thommy for current profiles but separate Schermerhorn history must be preserved.'
 ],
 categories,managerCoverage,
 totals:{sourceCappedCategories:categories.filter(c=>c.sourceCapped).length,
  sourceLeaderboardItems:categories.reduce((n,x)=>n+x.retainedLeaderboardEntries,0),
  sourceUnderlyingRankableItems:categories.reduce((n,x)=>n+x.sourceEntries,0),
  sourceHighlightItems:Object.values(managerCoverage).reduce((n,x)=>n+x.personalHighlights,0),
  managerRecoverableCategoryItems:Object.values(managerCoverage).reduce((n,x)=>n+x.actuallyRecoverableUniqueCategories,0),
  managerMissingCategoryItems:Object.values(managerCoverage).reduce((n,x)=>n+x.missingCategoryCount,0)}
};
assert.equal(Object.keys(managerCoverage).length,10);
assert(result.totals.sourceCappedCategories>0);
console.log(JSON.stringify(result,null,2));
