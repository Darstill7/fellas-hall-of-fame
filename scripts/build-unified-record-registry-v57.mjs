// Registry intake: normalize identities and evidence without silently certifying or merging records.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildLegacyRecords, normalizeManager as norm} from './legacy-record-definitions-v57.mjs';
import {reviewOwnershipScope} from './record-ownership-review-v57.mjs';
import {reviewLegacyDefinitions} from './record-deduplication-v57.mjs';
const read=n=>JSON.parse(fs.readFileSync('data-integrity/'+n+'.json','utf8'));
const data=n=>JSON.parse(fs.readFileSync('data/'+n+'.json','utf8'));
const archive=data('manager_record_books_2016_2026');
const inputs={
 ledger:data('unified_record_book_2016_2026'),
 weekly:data('season_weekly_matchups_2016_2026_v1'),
 placements:data('fellas_final_placements_2016_2025_verified'),
 archive,
 catalog:data('expanded_records_verified_v1')
};
const legacy=buildLegacyRecords(inputs);
const archivedCutoff=inputs.catalog.scope.match(/(\d{4}) Week (\d+)/);
assert.ok(archivedCutoff,'Missing archived Expanded Records cutoff');
const archived=buildLegacyRecords(inputs,{year:Number(archivedCutoff[1]),week:Number(archivedCutoff[2])});
assert.equal(archived.regularGames,inputs.catalog.recoveredRegularGames);
const managers=new Set(archive.managers.map(r=>norm(r.manager)));
const playerIndex=new Map(read('player-hall-of-fame-v56').players.map(p=>[p.id,p.name]));
const families=[
 ['core','canonical-record-core-v52'],['historical','canonical-record-completed-v52'],['position','positional-record-pilot-v53'],['champion-position','champion-position-records-v53'],['team-scoring','team-scoring-records-v53'],['draft-trade','front-office-records-v54'],['waiver','waiver-records-v54'],['keeper','keeper-records-v54'],['transaction','transaction-records-v54'],['champion-acquisition','championship-acquisition-records-v54'],['lineup','lineup-records-v55'],['luck','schedule-luck-records-v55'],['player','player-hall-of-fame-v56'],['player-champion','player-championship-records-v56'],['player-transaction','player-transaction-history-v56']
];
const records=[],ids=new Set(),sourceCounts={};
const intake=families.map(([family,file])=>[family,'data-integrity/'+file+'.json',read(file)]);
intake.push(['legacy','data/expanded_records_verified_v1.json',{
 categoryCount:legacy.records.length,records:legacy.records
}]);
for(const [family,sourceReceipt,d] of intake){
 assert.ok(Array.isArray(d.records));assert.equal(d.categoryCount,d.records.length,sourceReceipt);
 sourceCounts[family]=d.records.length;
 for(const r of d.records){
  const id=family+':'+r.id;assert.ok(!ids.has(id),id);ids.add(id);
  const ownerType=r.ownerType??'manager';assert.ok(['manager','player'].includes(ownerType));
  const holders=r.holders.map(h=>{
   if(ownerType==='player'){assert.ok(playerIndex.has(h.playerId),id);return {ownerId:h.playerId,displayName:playerIndex.get(h.playerId),evidence:h.evidence??[]};}
   const manager=norm(typeof h==='string'?h:h.manager);
   assert.ok(managers.has(manager),id+' unknown manager '+manager);
   return {ownerId:manager,displayName:manager,evidence:typeof h==='string'?(r.evidence??[]).filter(e=>norm(e.manager)===manager):h.evidence??[]};
  });
  assert.ok(holders.length,id);assert.equal(new Set(holders.map(h=>h.ownerId)).size,holders.length,id);
  assert.ok(holders.every(h=>Array.isArray(h.evidence)&&h.evidence.length>0),id+' missing holder evidence');
  const scope=r.scope??d.scope??'See source receipt';
  const label=r.label??[r.position,r.round,r.kind,r.direction].filter(Boolean).join(' ');
  assert.ok(label && (Number.isFinite(r.value) || typeof r.value==='string' && r.value.length>0), id);
  records.push({id,sourceId:r.id,family,ownerType,label,value:r.value,unit:r.unit??'',scope,
   category:r.category??family,qualification:r.qualification??d.qualification??'See source receipt',
   sourceReceipt,sources:r.source?r.source.split(' + '):[sourceReceipt],holders,
   shared:holders.length>1,publicationStatus:'candidate'});
 }
}
const legacyReview=reviewLegacyDefinitions(inputs.catalog,records,archived.records);
const reviewedCategories=new Map(inputs.catalog.categories.map(c=>[c.key,c.group]));
const byId=new Map(records.map(record=>[record.id,record]));
for(const {canonicalId,legacyId} of legacyReview.mappings){
 const record=byId.get(canonicalId);
 record.category=reviewedCategories.get(legacyId);
 record.publicationStatus='legacy-reviewed-candidate';
}
for(const {canonicalId} of legacyReview.establishedPanel)assert.equal(byId.get(canonicalId).ownerType,'manager');
const ownershipReview=reviewOwnershipScope(records,legacyReview.establishedPanel,archive,data('season_guide'),{
 espn:data('verified_espn_playoff_brackets_2016_2019'),
 sleeper:data('verified_sleeper_playoff_brackets_2020_2025'),
 placements:data('fellas_final_placements_2020_2025'),
 placementReceipts:data('sleeper_postseason_placement_receipts_2020_2025'),
 allEra:inputs.placements
});

const managerRecords=records.filter(r=>r.ownerType==='manager'),playerRecords=records.filter(r=>r.ownerType==='player');
const portfolios=(eligible,owners)=>[...owners].map(ownerId=>{
 const held=eligible.filter(r=>r.holders.some(h=>h.ownerId===ownerId));
 const byCategory={};
 for(const record of held){
  const counts=byCategory[record.category]??={total:0,sole:0,shared:0};
  counts.total++;
  if(record.shared)counts.shared++;else counts.sole++;
 }
 return {ownerId,soleCandidateCategories:held.filter(r=>!r.shared).length,
  sharedCandidateCategories:held.filter(r=>r.shared).length,candidateCategories:held.length,
  byCategory,recordIds:held.map(r=>r.id)};
});
const managerPortfolios=portfolios(managerRecords,managers),playerPortfolios=portfolios(playerRecords,playerIndex.keys());
const reviewedLegacyRecords=legacyReview.mappings.map(({canonicalId})=>byId.get(canonicalId));
legacyReview.managerPortfolios=portfolios(reviewedLegacyRecords,managers);
for(const [type,owners] of [['manager',managerPortfolios],['player',playerPortfolios],['manager',legacyReview.managerPortfolios]]){
 for(const p of owners){
  assert.equal(p.soleCandidateCategories+p.sharedCandidateCategories,p.candidateCategories);
  assert.equal(new Set(p.recordIds).size,p.candidateCategories);
  const counts=Object.values(p.byCategory);
  assert.equal(counts.reduce((sum,c)=>sum+c.sole,0),p.soleCandidateCategories);
  assert.equal(counts.reduce((sum,c)=>sum+c.shared,0),p.sharedCandidateCategories);
  assert.ok(counts.every(c=>c.total===c.sole+c.shared));
  for(const id of p.recordIds){
   const record=byId.get(id);
   assert.equal(record.ownerType,type);
   assert.ok(record.holders.some(holder=>holder.ownerId===p.ownerId),id);
  }
 }
}
assert.equal(managerPortfolios.reduce((s,p)=>s+p.candidateCategories,0),managerRecords.reduce((s,r)=>s+r.holders.length,0));
assert.equal(playerPortfolios.reduce((s,p)=>s+p.candidateCategories,0),playerRecords.reduce((s,r)=>s+r.holders.length,0));
assert.equal(legacyReview.managerPortfolios.reduce((s,p)=>s+p.candidateCategories,0),
 reviewedLegacyRecords.reduce((s,r)=>s+r.holders.length,0));
// Similar labels are only review signals. Same holder/value is not proof of equivalent scope.
const labelGroups=new Map();
for(const r of records){const key=r.ownerType+'|'+r.label.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();if(!labelGroups.has(key))labelGroups.set(key,[]);labelGroups.get(key).push(r.id);}
const duplicateLabelReview=[...labelGroups].filter(([,a])=>a.length>1).map(([label,ids])=>({label,ids}));
const out={schemaVersion:2,status:'legacy-reviewed-candidate-registry',asOf:inputs.ledger.updated,
 regularSeasonThrough:legacy.through,regularGames:legacy.regularGames,sourceCounts,categoryCount:records.length,
 managerCategoryCount:managerRecords.length,playerCategoryCount:playerRecords.length,legacyReview,
 ownershipReview,duplicateLabelReview,managerPortfolios,playerPortfolios,records};
const files=[
 ['data-integrity/unified-record-registry-v57.json',out],
 ['data-integrity/record-publication-preview-v57.json',{
  asOf:out.asOf,regularSeasonThrough:out.regularSeasonThrough,...ownershipReview.publicationReview
 }]
];
for(const [file,value] of files){
 const body=JSON.stringify(value,null,2)+'\n';
 if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),body);else fs.writeFileSync(file,body);
}
console.log('Unified registry: '+records.length+' candidates; '+managerRecords.length+' manager-owned, '+
 playerRecords.length+' player-owned; '+legacyReview.mappings.length+' legacy mappings and '+
 managerPortfolios.length+' manager portfolios. Candidate totals only.');
