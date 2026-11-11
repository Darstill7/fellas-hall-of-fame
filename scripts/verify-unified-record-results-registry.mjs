import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const d=JSON.parse(execFileSync(process.execPath,['scripts/build-unified-record-results-registry.mjs'],
 {encoding:'utf8',maxBuffer:25*1024*1024}));
assert.equal(d.schema,'fellas-unified-record-results-registry-v1');
assert.equal(d.cutoff.regularSeason.year,2026);
assert.equal(d.cutoff.regularSeason.completedWeek,9);
assert.equal(d.cutoff.completedSeasonsThrough,2025);
assert.equal(d.counts.publishedExpanded,44);
assert.equal(d.counts.existingLegendary,19);
assert.equal(d.counts.phase2ProposalDefinitions,23);
assert.equal(d.counts.aliasesMerged+d.counts.separateCandidateCategories,23);
assert.equal(d.categories.length,63+d.counts.separateCandidateCategories);
assert.equal(new Set(d.categories.map(c=>c.id)).size,d.categories.length);
const get=id=>{const c=d.categories.find(x=>x.id===id);assert(c,'Missing '+id);return c};
const base=get('highest-score');
assert.equal(base.publication,'existing-record');
assert.equal(base.holders[0].manager,'Mitch');
assert.equal(base.holders[0].value,180.86);
assert.equal(base.holders[0].year,2025);
assert.equal(base.leaders[0].rank,1);
assert.equal(base.provenance.source,'data/expanded_records_verified_v1.json');
const leg=get('deepest-champion-hole');
assert.equal(leg.publication,'existing-legendary');
assert(leg.holders.some(x=>x.manager==='Stilly'&&x.year===2023));
assert.equal(get('weekly-highs-career').publication,'candidate-not-published');
assert.equal(get('weekly-highs-career').holders[0].manager,'Mitch');
assert.equal(get('weekly-highs-career').holders[0].value,22);
assert(get('weekly-highs-career').aliases.includes('weekly-highs'));
assert(!d.categories.some(c=>c.id==='weekly-highs'),'Duplicated alias');
assert(!d.categories.some(c=>c.publication==='candidate-not-published'&&c.verification==='source-recovered-not-provider-rechecked'));
assert.equal(Object.keys(d.managerIndex).length,10);
assert.equal(Object.keys(d.candidateManagerIndex).length,10);
for(const manager of ['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott']){
 const official=d.managerIndex[manager],proposed=d.candidateManagerIndex[manager];
 assert(official.length,'Missing existing personal records '+manager);
 assert(new Set(official.map(x=>x.categoryId)).size===official.length,'Duplicate personal record '+manager);
 assert(new Set(proposed.map(x=>x.categoryId)).size===proposed.length,'Duplicate proposed category '+manager);
 for(const row of official){
  assert(['existing-expanded-leaderboard','existing-personal-signature','existing-legendary-holder'].includes(row.source));
  assert(get(row.categoryId).publication!=='candidate-not-published',
   'Unpublished candidate leaked into existing personal record portfolio');
 }
 for(const row of proposed){
  assert.equal(row.publication,'candidate-not-published');
  assert.equal(row.coverage,'top-five-ranks-only');
  assert(get(row.categoryId).candidateEvidence.length>0);
 }
}
assert(!d.managerIndex.Tom);
assert(!d.managerIndex.Schermerhorn);
assert(d.managerIndex.Thommy.some(e=>e.source==='existing-personal-signature'));
assert(d.managerIndex.Stilly.some(e=>e.categoryId==='lowest-score-win'));
assert(!d.categories.some(c=>c.publication==='existing-record'&&c.leaders.length===0));
assert(d.categories.every(c=>Array.isArray(c.holders)&&c.holders.length>0));
assert(d.categories.every(c=>Array.isArray(c.candidateEvidence)));
console.log('PASS unified results registry: 44 existing expanded, 19 Legendary, 23 proposed appearances and separate manager profiles; no candidate promoted.');
