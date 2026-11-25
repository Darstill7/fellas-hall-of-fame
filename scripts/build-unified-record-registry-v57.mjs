// Registry intake: normalize identities and evidence without silently certifying or merging records.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=n=>JSON.parse(fs.readFileSync('data-integrity/'+n+'.json','utf8'));
const archive=JSON.parse(fs.readFileSync('data/manager_record_books_2016_2026.json','utf8'));
const norm=n=>({Tom:'Thommy',EvansBrandon:'Evans'}[n]||n);
const managers=new Set(archive.managers.map(r=>norm(r.manager)));
const playerIndex=new Map(read('player-hall-of-fame-v56').players.map(p=>[p.id,p.name]));
const families=[
 ['core','canonical-record-core-v52'],['historical','canonical-record-completed-v52'],['position','positional-record-pilot-v53'],['champion-position','champion-position-records-v53'],['team-scoring','team-scoring-records-v53'],['draft-trade','front-office-records-v54'],['waiver','waiver-records-v54'],['keeper','keeper-records-v54'],['transaction','transaction-records-v54'],['champion-acquisition','championship-acquisition-records-v54'],['lineup','lineup-records-v55'],['luck','schedule-luck-records-v55'],['player','player-hall-of-fame-v56'],['player-champion','player-championship-records-v56'],['player-transaction','player-transaction-history-v56']
];
const records=[],ids=new Set(),sourceCounts={};
for(const [family,file] of families){
 const d=read(file);assert.ok(Array.isArray(d.records));assert.equal(d.categoryCount,d.records.length,file);
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
  records.push({id,sourceId:r.id,family,ownerType,label:r.label??[r.position,r.round,r.kind,r.direction].filter(Boolean).join(' '),value:r.value,unit:r.unit??'',scope,qualification:r.qualification??'See source receipt',sourceReceipt:file+'.json',holders,shared:holders.length>1,publicationStatus:'candidate'});
 }
}
const managerRecords=records.filter(r=>r.ownerType==='manager'),playerRecords=records.filter(r=>r.ownerType==='player');
const portfolios=(type,owners)=>[...owners].map(ownerId=>{
 const held=records.filter(r=>r.ownerType===type&&r.holders.some(h=>h.ownerId===ownerId));
 return {ownerId,soleCandidateCategories:held.filter(r=>!r.shared).length,sharedCandidateCategories:held.filter(r=>r.shared).length,candidateCategories:held.length,recordIds:held.map(r=>r.id)};
});
const managerPortfolios=portfolios('manager',managers),playerPortfolios=portfolios('player',playerIndex.keys());
for(const p of [...managerPortfolios,...playerPortfolios])assert.equal(p.soleCandidateCategories+p.sharedCandidateCategories,p.candidateCategories);
assert.equal(managerPortfolios.reduce((s,p)=>s+p.candidateCategories,0),managerRecords.reduce((s,r)=>s+r.holders.length,0));
assert.equal(playerPortfolios.reduce((s,p)=>s+p.candidateCategories,0),playerRecords.reduce((s,r)=>s+r.holders.length,0));
// Similar labels are only review signals. Same holder/value is not proof of equivalent scope.
const labelGroups=new Map();
for(const r of records){const key=r.ownerType+'|'+r.label.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();if(!labelGroups.has(key))labelGroups.set(key,[]);labelGroups.get(key).push(r.id);}
const duplicateLabelReview=[...labelGroups].filter(([,a])=>a.length>1).map(([label,ids])=>({label,ids}));
const out={schemaVersion:1,status:'intake-only-not-certified-ownership',sourceCounts,categoryCount:records.length,managerCategoryCount:managerRecords.length,playerCategoryCount:playerRecords.length,duplicateLabelReview,managerPortfolios,playerPortfolios,records};
fs.writeFileSync('data-integrity/unified-record-registry-v57.json',JSON.stringify(out,null,2)+'\n');
console.log('Unified registry intake: '+records.length+' candidates; '+managerRecords.length+' manager-owned, '+playerRecords.length+' player-owned; '+duplicateLabelReview.length+' exact normalized label review groups; '+managerPortfolios.length+' manager portfolios. Not certified ownership.');
