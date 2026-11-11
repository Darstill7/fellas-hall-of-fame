import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const d=JSON.parse(execFileSync(process.execPath,['scripts/build-record-taxonomy-crosswalk.mjs'],
 {encoding:'utf8',maxBuffer:12*1024*1024}));
assert.equal(d.schema,'fellas-record-taxonomy-crosswalk-v1');
assert.equal(d.status,'research-only-no-production-writes');
assert.equal(d.coverage.publishedExpandedIDs,44);
assert.equal(d.coverage.existingLegendaryIDs,19);
assert.equal(d.coverage.proposedAppearances,77);
assert.equal(d.sources.candidateGroups.length,6);
assert.equal(new Set(d.categories.map(c=>c.id)).size,d.categories.length);
assert(d.coverage.uniqueTaxonomyIDs<44+19+77,'No aliases merged');
const category=id=>{const x=d.categories.find(c=>c.id===id);assert(x,'Missing '+id);return x};
assert(category('weekly-highs-career').aliases.includes('weekly-highs'));
assert(category('weekly-highs-career').sourceFamilies.includes('phase2-scoring'));
assert(category('deepest-champion-hole').aliases.includes('turnaround-deepest-hole-champion'));
assert(category('deepest-playoff-qualifier-hole').aliases.includes('turnaround-deepest-hole-playoff'));
assert(category('playoff-upset-largest-seed-gap').relatedReview.includes('biggest-final-seed-upset'));
assert(category('playoff-elimination-narrowest').relatedReview.includes('closest-opening-playoff-loss'));
assert(!category('playoff-upset-largest-seed-gap').aliases.includes('biggest-final-seed-upset'),
 'An all-round upset must not be merged into final-only record');
assert(!category('playoff-elimination-narrowest').aliases.includes('closest-opening-playoff-loss'),
 'An all-round closest elimination must not be merged into opening-only record');
assert.equal(category('highest-score').origin.type,'expanded');
assert.equal(category('worst-championship-start').origin.type,'legendary');
assert.equal(category('collapse-half-season-swing').origin.type,'proposal');
assert.equal(category('collapse-half-season-swing').status,'candidate-awaiting-certification');
assert(d.categories.every(c=>c.publication==='never-auto-publish'));
for(const cat of d.categories){
 assert(cat.id.trim()&&cat.canonicalLabel.trim());
 assert(Array.isArray(cat.aliases)&&Array.isArray(cat.proposals));
 assert(!cat.aliases.includes(cat.id));
 assert.equal(new Set(cat.aliases).size,cat.aliases.length);
 for(const p of cat.proposals){
  assert(p.source.trim()&&p.id.trim());
  assert(p.pr!==null||p.branch,'Proposal without a source PR or research branch');
 }
 for(const rel of cat.relatedReview){
  assert(d.categories.some(x=>x.id===rel),'Broken related reference '+rel);
 }
}
assert.equal(d.managerPolicy.currentSeason.includes('Week 9'),true);
console.log('PASS: 44 expanded IDs + 19 legendary IDs + 77 proposal appearances reconciled without destructive semantic merging.');
