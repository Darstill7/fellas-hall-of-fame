// One reproducible record RESULTS registry, not just a category-ID taxonomy.
// node scripts/build-unified-record-results-registry.mjs > /tmp/fellas-record-results.json
// Research candidates are NEVER presented as published/independently certified.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const run=p=>JSON.parse(execFileSync(process.execPath,[p],{encoding:'utf8',maxBuffer:25*1024*1024}));
const expandedPath='data/expanded_records_verified_v1.json';
const legendaryPath='data/legendary_records_2016_2025_v1.json';
const expanded=read(expandedPath);
const legendary=read(legendaryPath);
const phase2=run('scripts/build-record-book-phase2.mjs');
const taxonomy=run('scripts/build-record-taxonomy-crosswalk.mjs');
assert.equal(expanded.categories.length,44);
assert.equal(legendary.categories.length,19);
assert.equal(phase2.categoryCount,23);
const alias=taxonomy.aliasRules;
const normalize=m=>m==='Tom'?'Thommy':m;
const resolve=id=>{const touched=new Set();while(alias[id]){assert(!touched.has(id),'Circular alias '+id);touched.add(id);id=alias[id]}return id};
const resultCategories=new Map();
const rankedFromRows=(rows,origin,categoryId)=>{
 const ranked=rows.map(item=>({...item,manager:item.manager?normalize(item.manager):item.manager,
  origin,categoryId}));
 assert(ranked.every(item=>item.rank===undefined||Number.isInteger(item.rank)),categoryId);
 return ranked;
};
for(const c of expanded.categories){
 assert(c.key&&!resultCategories.has(c.key),'Duplicate incumbent '+c.key);
 resultCategories.set(c.key,{id:c.key,title:c.label,group:c.group,definition:c.description,
  metric:{unit:c.unit,direction:c.direction,qualifier:c.qualifier},
  provenance:{source:expandedPath,coverage:expanded.scope,asOf:expanded.asOf,
   interpretation:'Existing published expanded-record ledger; retain original evidence and ranks'},
  publication:'existing-record',verification:'source-recovered-not-provider-rechecked',
  evidenceStatus:'source-captured',leaders:rankedFromRows(c.leaders||[],'expanded',c.key),
  holders:(c.leaders||[]).filter(x=>x.rank===1).map(x=>({...x,manager:normalize(x.manager)})),
  recordsIncluded:c.entries,aliases:[],candidateEvidence:[]});
}
for(const c of legendary.categories){
 assert(c.id&&!resultCategories.has(c.id),'Duplicate Legendary ID '+c.id);
 resultCategories.set(c.id,{id:c.id,title:c.label,group:'Legendary',
  definition:c.rule,metric:{display:c.metric,direction:null,unit:null},
  provenance:{source:legendaryPath,scope:legendary.scope,asOf:legendary.asOf,
   interpretation:'Existing separately curated Legendary record; holder evidence expressed in original text'},
  publication:'existing-legendary',verification:'source-recovered-not-provider-rechecked',
  evidenceStatus:'curated-claim',leaders:[],holders:(c.holder||[]).map(x=>({...x,manager:normalize(x.manager)})),
  summary:c.detail,aliases:[],candidateEvidence:[]});
}
for(const p of phase2.categories){
 const id=resolve(p.id),mapped=id!==p.id;
 const results={proposalId:p.id,sourceScript:'scripts/build-record-book-phase2.mjs',
  status:'provisional-not-published',scope:p.scope,direction:p.direction,unit:p.unit,
  entryCount:p.count,leaders:rankedFromRows(p.leaders,'phase2',id),
  holders:rankedFromRows(p.holders,'phase2',id),updatedFrom:'2016–2026 Week 9 canonical regular games',
  caveat:'Source-derived research; eligibility and cross-provider certification pending'};
 if(mapped){
  assert(resultCategories.has(id),'Alias target missing '+p.id+' => '+id);
  resultCategories.get(id).candidateEvidence.push(results);
 }else{
  assert(!resultCategories.has(id),'Unexpected ID collision '+id);
  resultCategories.set(id,{id,title:p.title,group:'Research candidates',
   definition:p.scope,metric:{direction:p.direction,unit:p.unit},provenance:{
    source:'scripts/build-record-book-phase2.mjs',scope:p.scope,asOf:'2026-11-11',
    interpretation:'Research candidate, not part of published records'},
   publication:'candidate-not-published',verification:'internal-formula-validated',
   evidenceStatus:'reproducible-weekly-receipts',leaders:results.leaders,holders:results.holders,
   aliases:[],candidateEvidence:[results]});
 }
}
for(const row of taxonomy.categories){
 const record=resultCategories.get(row.id);
 // Taxonomy lists identifiers from additional, separately tested research branches.
 // A taxonomy ID alone is NOT a calculated result; don't invent its leaderboard.
 if(!record)continue;
 record.aliases=row.aliases;
 record.relatedReview=row.relatedReview;
}
const active=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
const managerIndex=Object.fromEntries(active.map(m=>[m,[]]));
const indexed=new Map();
function offer(manager,categoryId,entry,source){
 if(!manager||!managerIndex[manager])return;
 const key=manager+'|'+categoryId,old=indexed.get(key);
 // Capture the best verified rank for each manager, prefer the source's original
 // personal portfolio highlight over a truncated global top-20 leaderboard.
 const candidate={categoryId,rank:entry.rank??entry.leagueRank??null,
  value:entry.value??null,year:entry.year??entry.season??null,
  evidence:entry.evidence??null,source,visibility:'personal-evidence-recovered'};
 if(!old||(source==='existing-personal-signature'&&old.source!=='existing-personal-signature')||
  (candidate.rank!==null&&(old.rank===null||candidate.rank<old.rank)))indexed.set(key,{manager,...candidate});
}
for(const record of resultCategories.values()){
 if(record.publication==='existing-record')for(const entry of record.leaders)offer(entry.manager,record.id,entry,'existing-expanded-leaderboard');
 if(record.publication==='existing-legendary')for(const holder of record.holders)
  offer(holder.manager,record.id,{...holder,value:record.metric.display,rank:1},'existing-legendary-holder');
 // Provisional proposal records go in their own partition, not the existing manager trophy case.
}
for(const [rawManager,signature] of Object.entries(expanded.signatures||{})){
 const manager=normalize(rawManager);
 for(const h of signature.highlights||[]){
  offer(manager,h.key,{...h,rank:h.leagueRank??null},'existing-personal-signature');
 }
}
for(const row of indexed.values())managerIndex[row.manager].push({
 categoryId:row.categoryId,rank:row.rank,value:row.value,year:row.year,
 evidence:row.evidence,source:row.source,visibility:row.visibility});
for(const manager of active)managerIndex[manager].sort((a,b)=>
 (a.rank??Number.MAX_SAFE_INTEGER)-(b.rank??Number.MAX_SAFE_INTEGER)||
 a.categoryId.localeCompare(b.categoryId));
const candidatesIndex=Object.fromEntries(active.map(m=>[m,[]]));
for(const record of resultCategories.values()){
 for(const c of record.candidateEvidence){
  const byManager=new Map();
  // Best known result in a *truncated* research leaderboard. Do NOT assert
  // complete manager coverage for proposed categories.
  for(const row of c.leaders){if(!byManager.has(row.manager))byManager.set(row.manager,row)}
  for(const [manager,entry] of byManager){
   if(!candidatesIndex[manager])continue;
   candidatesIndex[manager].push({categoryId:record.id,rank:entry.rank,
    value:entry.value,year:entry.year??null,evidence:entry.evidence??null,
    publication:'candidate-not-published',coverage:'top-five-ranks-only'});
  }
 }
}
for(const manager of active){
 const keyed=new Map();
 for(const row of candidatesIndex[manager])if(!keyed.has(row.categoryId))keyed.set(row.categoryId,row);
 candidatesIndex[manager]=[...keyed.values()].sort((a,b)=>a.categoryId.localeCompare(b.categoryId));
}
const categories=[...resultCategories.values()].sort((a,b)=>
 ['existing-record','existing-legendary','candidate-not-published'].indexOf(a.publication)-
 ['existing-record','existing-legendary','candidate-not-published'].indexOf(b.publication)||
 a.id.localeCompare(b.id));
const counts={
 publishedExpanded:categories.filter(c=>c.publication==='existing-record').length,
 existingLegendary:categories.filter(c=>c.publication==='existing-legendary').length,
 phase2ProposalDefinitions:phase2.categoryCount,
 separateCandidateCategories:categories.filter(c=>c.publication==='candidate-not-published').length,
 aliasesMerged:phase2.categories.filter(p=>resolve(p.id)!==p.id).length,
 existingPersonalEntries:Object.values(managerIndex).reduce((n,x)=>n+x.length,0),
 researchPersonalTopFiveEntries:Object.values(candidatesIndex).reduce((n,x)=>n+x.length,0)
};
assert.equal(counts.publishedExpanded,44);
assert.equal(counts.existingLegendary,19);
assert.equal(counts.phase2ProposalDefinitions,23);
assert.equal(counts.aliasesMerged+counts.separateCandidateCategories,23);
assert.equal(new Set(categories.map(x=>x.id)).size,categories.length);
const result={schema:'fellas-unified-record-results-registry-v1',
 asOf:'2026-11-11',status:'mixed-published-sources-and-unpublished-research',
 cutoff:{regularSeason:{year:2026,completedWeek:9},completedSeasonsThrough:2025},
 sourcePaths:[expandedPath,legendaryPath,
  'scripts/build-record-book-phase2.mjs','scripts/build-record-taxonomy-crosswalk.mjs'],
 counts,notes:[
 'This one JSON includes actual existing and Phase 2 source-derived results, not merely category names.',
 'Existing records retain original rank and evidence. Existing Legendary holders retain original human-curated metric.',
 'Phase 2 values are never promoted: they remain proposal evidence, even where an ID aliases an existing category.',
 'Other PRs (204–206) are not yet merged; taxonomy-only IDs are NOT fabricated as verified result rows.',
 'Manager Index includes existing source leaderboard entries and original existing personal signature highlights; full below-leaderboard coverage remains incomplete.',
 'Research managerIndex shows only top-five available entries; not a definitive complete personal portfolio.',
 'Current Thommy maps former Tom site key, but does not merge separate historical Schermerhorn. 2023 Evans and 2024+ JMid remain separate.',
 '2020 and 2021 Week 14 byes excluded from weekly scoring ranks, but paired matchups remain in other eligible records.',
 'A user-facing site switch requires independent source certification and exact-head canonical/visual checks.'
 ],categories,managerIndex,candidateManagerIndex:candidatesIndex};
console.log(JSON.stringify(result,null,2));
