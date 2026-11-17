// Build a small static, explicit REVIEW-ONLY data projection for the mobile preview.
// No user-facing page is published automatically by this script.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const source=JSON.parse(execFileSync(process.execPath,['scripts/build-record-book-2-registry.mjs'],{encoding:'utf8',maxBuffer:60*1024*1024}));
assert.equal(source.coverage.completeRankingCategories,74);
assert.equal(source.coverage.incompleteRankingCategories,19);
const compact=e=>{
 if(!e)return null;
 return {manager:e.manager,rank:e.rank,value:e.value??null,year:e.year??null,week:e.week??null,
  opponent:e.opponent??e.evidence?.opponent??null,years:e.years??e.evidence?.years??null,
  evidence:e.evidence??null};
};
const records=source.records.map(r=>({
 id:r.record_id,title:r.title,family:r.family,status:r.status,publication:r.publication,
 direction:r.direction,unit:r.unit,coverage:r.coverage,eligibility:r.eligibility??null,
 complete:r.completeManagerRanking,source:r.originalPublishedSource??r.source,
 sourceGenerator:r.source,notes:r.notes??[],metric:r.metricDisplay??null,description:r.description??null,
 knownLeaders:(r.knownLeaders||[]).map(compact),leaders:(r.displayRows||[]).slice(0,10).map(compact),
 managerBest:(r.managerBest||[]).map(compact)
}));
const managers=Object.entries(source.profiles).map(([manager,p])=>({
 manager,recordPlacements:p.recordPlacements.map(x=>({
 id:x.record_id,rank:x.leagueRank,value:x.value,year:x.year??null,
 status:x.status,positiveTrophyEligible:x.positiveTrophyEligible,
 completeness:x.completeness
 }))
})).sort((a,b)=>a.manager.localeCompare(b.manager));
const out={schema:'fellas-record-book-2-static-preview-v1',preview:true,
 asOf:'2026-11-13',cutoff:'2026 Week 9 regular season / 2025 completed postseason',
 published:false,scopeNote:'Review-only data. Existing records and provisional research are not equally certified.',
 coverage:source.coverage,records,managers};
assert.equal(records.length,93);
assert.equal(managers.length,14);
for(const m of managers)for(const p of m.recordPlacements)
 assert(records.some(r=>r.id===p.id && r.managerBest.some(x=>x.manager===m.manager)));
fs.mkdirSync('data',{recursive:true});
fs.writeFileSync('data/record_book_2_preview.json',JSON.stringify(out));
console.log('Built review-only static preview: '+records.length+' records; '+managers.length+' manager portfolios');
