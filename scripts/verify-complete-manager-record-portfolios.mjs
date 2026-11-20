// Verify that complete personal portfolios retain all 44 published category definitions
// while reconstructing all source-ranked entries instead of a top-20 truncation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCompleteManagerPortfolios} from '../assets/full-manager-record-portfolios.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const source=read('data/expanded_records_verified_v1.json');
const canonical=read('data/unified_record_book_2016_2026.json');
const finishes=read('data/fellas_final_placements_2016_2025_verified.json');
const d=buildCompleteManagerPortfolios(source,canonical,finishes);
assert.equal(d.schema,'fellas-complete-44-manager-record-portfolios-v1');
assert.equal(d.coverage.regularGames,705);
assert.equal(d.coverage.teamPerformances,1410);
assert.equal(d.coverage.completedSeasons,10);
assert.equal(d.categories.length,44);
assert.equal(Object.keys(d.managers).length,10);
assert.equal(new Set(d.categories.map(x=>x.key)).size,44);
for(const original of source.categories){
 const c=d.categories.find(x=>x.key===original.key);
 assert(c,'Missing '+original.key);
 assert.equal(c.direction,original.direction);
 assert.equal(c.unit,original.unit);
 assert.equal(c.rankableEntries,original.entries,
  'Changed eligibility or event count '+original.key);
 assert(c.fullEntries.length>=c.leaders.length);
 assert.equal(c.fullEntries.length,c.rankableEntries);
 assert.equal(c.leagueHolders[0].rank,1);
 assert.equal(c.fullEntries[0].value,original.leaders[0].value,
  'Published record leader value mismatch '+original.key);
 assert.equal(c.fullEntries[0].manager,original.leaders[0].manager,
  'Published record holder mismatch '+original.key);
 for(let i=1;i<c.fullEntries.length;i++){
  const p=c.fullEntries[i-1],r=c.fullEntries[i];
  assert(c.direction==='low'?r.value>=p.value:r.value<=p.value,'Bad sorting '+original.key);
  assert(r.rank>=p.rank);
  if(r.value===p.value)assert.equal(r.rank,p.rank,'Ties must share rank '+original.key);
 }
}
for(const manager of Object.keys(d.managers)){
 const p=d.managers[manager];
 assert.equal(p.categories.length,44,'Every manager must see every category '+manager);
 assert.equal(new Set(p.categories.map(c=>c.categoryId)).size,44);
 assert.equal(p.qualifyingCategories+p.ineligibleCategoryIds.length,44);
 for(const cat of p.categories){
  const global=d.categories.find(x=>x.key===cat.categoryId);
  const matches=global.fullEntries.filter(x=>x.manager===manager);
  assert.equal(cat.eligible,matches.length>0,'Eligibility mismatch '+manager+' '+cat.categoryId);
  if(cat.eligible){
   assert.equal(cat.eligibleEntries,matches.length,'Lost manager evidence '+manager+' '+cat.categoryId);
   assert.equal(cat.leagueRank,matches[0].rank,'Incorrect personal rank '+manager+' '+cat.categoryId);
   assert.equal(cat.value,matches[0].value);
   assert(cat.status==='personal-best'||cat.status==='league-record-coholder'||cat.status==='league-top-three');
  }else{
   assert.equal(cat.status,'no-qualifying-entry');
   assert.equal(cat.leagueRank,null);
  }
 }
}
assert.equal(d.managers.Tom.displayName,'Thommy');
assert(!d.managers.Schermerhorn&& !d.managers.Evans,'Retired managers are not current portfolios');
assert(d.categories.find(x=>x.key==='season-wins').fullEntries.every(x=>x.year<=2025));
assert(d.managers.JMid.ineligibleCategoryIds.length>=0);
console.log('PASS: reconstructed all 44 published category rankings and all ten personal portfolios, including below-top-20 personal marks.');
