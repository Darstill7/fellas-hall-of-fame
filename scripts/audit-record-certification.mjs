// Research only: inventory each canonical category without promoting any record.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const run=s=>JSON.parse(execFileSync(process.execPath,[s],{encoding:'utf8',maxBuffer:32*1024*1024}));
const taxonomy=run('scripts/build-record-taxonomy-crosswalk.mjs');
const phase2=run('scripts/build-record-book-phase2.mjs');
const ledger=JSON.parse(fs.readFileSync('data/unified_record_book_2016_2026.json','utf8'));
const week=Math.max(...ledger.games.filter(g=>g.year===2026&&g.stage==='regular').map(g=>g.week));
assert.equal(phase2.coverage.latest2026Week,week);
const byId=new Map(phase2.categories.map(c=>[c.id,c]));
const rows=taxonomy.categories.map(c=>{
 const research=c.proposals.filter(p=>p.source==='phase2-scoring').map(p=>byId.get(p.id));
 assert(research.every(Boolean),'Unmapped phase2 source '+c.id);
 const blockers=[];
 if(c.origin.type==='proposal')blockers.push('Original-source certification and publication review required');
 if(c.relatedReview.length)blockers.push('Resolve related definitions before consolidation');
 if(!research.length&&c.origin.type==='proposal')blockers.push('Re-run original research engine');
 for(const r of research){
  if(r.scope==='Weekly league rank'||r.scope==='Consecutive calendar weeks'||['season-top-three','season-bottom-three','season-weekly-highs','season-weekly-lows'].includes(r.id))blockers.push('Commissioner approved eight competing managers; verify source receipts and revised rankings');
  if(['combined-high','combined-low','rival-one-point'].includes(r.id))blockers.push('Review symmetric participant credit before public promotion');
  if(r.unit==='points'||r.id.includes('150-plus')||r.id.includes('sub-80'))blockers.push('Disclose cross-era raw scoring differences');
 }
 return {id:c.id,label:c.canonicalLabel,origin:c.origin,status:c.status,aliases:c.aliases,related:c.relatedReview,sourceProposals:c.proposals,phase2:research.map(r=>({id:r.id,scope:r.scope,unit:r.unit,count:r.count,holders:r.holders.map(h=>({manager:h.manager,opponent:h.opponent,year:h.year,week:h.week,value:h.value}))})),blockers:[...new Set(blockers)],publication:'not-authorized-by-this-audit'};
});
assert.equal(rows.length,taxonomy.coverage.uniqueTaxonomyIDs);
assert.equal(rows.flatMap(r=>r.phase2).length,23);
assert(rows.every(r=>r.publication==='not-authorized-by-this-audit'));
const report={schema:'fellas-record-certification-audit-v1',throughWeek:week,coverage:taxonomy.coverage,phase2Coverage:phase2.coverage,provisionalManagerIndex:phase2.managerIndex,counts:{candidateOnly:rows.filter(r=>r.origin.type==='proposal').length,withPhase2Evidence:rows.filter(r=>r.phase2.length).length,relatedReview:rows.filter(r=>r.related.length).length},rows};
console.log(JSON.stringify(report,null,2));
