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
// Canonical IDs are the portfolio key. A candidate alias is not an
// incumbent certification, and a missing personal mark is not rank zero.
const canonicalManagerIndex=Object.create(null);
const phase2ToCanonical=new Map();
for(const row of rows)for(const p of row.phase2){
 assert(!phase2ToCanonical.has(p.id),'Duplicate proposal mapping '+p.id);
 phase2ToCanonical.set(p.id,row.id);
}
assert.equal(phase2ToCanonical.size,23);
let outsideTopFive=0,personalMarks=0;
for(const [manager,categories] of Object.entries(phase2.managerIndex)){
 const portfolio=canonicalManagerIndex[manager]=Object.create(null);
 for(const [proposalId,best] of Object.entries(categories)){
  const id=phase2ToCanonical.get(proposalId);
  assert(id,'Missing canonical mapping '+proposalId);
  assert(!portfolio[id],'Multiple proposal definitions require review '+id);
  const category=byId.get(proposalId);
  assert(best.rank>=1&&best.rank<=category.count);
  assert(best.marks.length>0&&best.marks.every(m=>m.rank===best.rank&&m.manager===manager));
  portfolio[id]={...best,canonicalId:id,proposalId,source:'phase2-scoring',rankPopulation:category.count,status:'research-only-not-certified',stageBasis:'legacy regular-labeled ledger; eight known postseason mislabels; weekly award eligibility separate from regular-season eligibility'};
  personalMarks++;if(best.rank>5)outsideTopFive++;
 }
}
assert(outsideTopFive>0);
const expanded=JSON.parse(fs.readFileSync('data/expanded_records_verified_v1.json','utf8'));
const legendary=JSON.parse(fs.readFileSync('data/legendary_records_2016_2025_v1.json','utf8'));
const incumbentRankCoverage=[
 ...expanded.categories.map(c=>({id:c.key,source:'expanded',storedRows:c.leaders.length,population:c.entries,status:c.leaders.length===c.entries?'stored-row-count-complete-not-recertified':'truncated-source-requires-full-rebuild'})),
 ...legendary.categories.map(c=>({id:c.id,source:'legendary',storedHolders:c.holder.length,status:'holder-only-requires-full-rebuild'}))
];
assert.equal(incumbentRankCoverage.length,63);
// Reconstruct full incumbent single-game populations at their own archived cutoff.
// This establishes reproducibility, not corrected-stage or current-week certification.
const cutoff=Number(String(expanded.scope).match(/2026 Week (\d+)/)?.[1]);
assert(Number.isInteger(cutoff)&&cutoff<=week);
const archivedGames=ledger.games.filter(g=>g.stage==='regular'&&(g.year!==2026||g.week<=cutoff));
assert.equal(archivedGames.length,expanded.recoveredRegularGames);
const canonicalName=n=>n==='Tom'?'Thommy':n;
const cent=n=>{assert(Number.isFinite(n));return Math.round(n*100);};
const appearances=archivedGames.flatMap(g=>[[g.home,g.away,g.homeScore,g.awayScore],[g.away,g.home,g.awayScore,g.homeScore]].map(([manager,opponent,p,q])=>({manager:canonicalName(manager),opponent:canonicalName(opponent),year:g.year,week:g.week,p:cent(p),q:cent(q),era:g.era,source:g.source})));
const singleGameDefinitions={
 'highest-score':[r=>true,r=>r.p],'lowest-score':[r=>true,r=>r.p],
 'highest-score-loss':[r=>r.p<r.q,r=>r.p],'lowest-score-win':[r=>r.p>r.q,r=>r.p],
 'biggest-win':[r=>r.p>r.q,r=>r.p-r.q],'narrowest-win':[r=>r.p>r.q,r=>r.p-r.q],
 'biggest-defeat':[r=>r.p<r.q,r=>r.q-r.p],'narrowest-defeat':[r=>r.p<r.q,r=>r.q-r.p],
 'giant-slayer-win':[r=>r.p>r.q,r=>r.q]
};
const rebuiltSingleGame=Object.entries(singleGameDefinitions).map(([id,[eligible,value]])=>{
 const cat=expanded.categories.find(c=>c.key===id);assert(cat);
 const full=appearances.filter(eligible).map(r=>({...r,value:value(r)/100})).sort((a,b)=>(cat.direction==='low'?1:-1)*(a.value-b.value)||a.manager.localeCompare(b.manager)||a.year-b.year||a.week-b.week);
 assert.equal(full.length,cat.entries,id+' population');
 let prev=null,rank=0;
 const ranked=full.map((r,i)=>{if(r.value!==prev){rank=i+1;prev=r.value;}return {...r,rank};});
 for(const l of cat.leaders)assert(ranked.some(r=>r.manager===canonicalName(l.manager)&&r.year===l.year&&r.week===l.week&&r.value===l.value&&r.rank===l.rank),id+' archive mark mismatch');
 const personalBests=Object.create(null);
 for(const r of ranked){
  const best=personalBests[r.manager]??={rank:r.rank,value:r.value,marks:[]};
  if(best.rank===r.rank)best.marks.push(r);
 }
 assert(Object.values(personalBests).every(b=>b.marks.length&&b.rank>=1&&b.rank<=ranked.length));
 return {id,cutoff,population:ranked.length,archivedEntriesMatched:cat.leaders.length,personalBests,status:'archived-scope-reconstructed-not-recertified',stageBasis:'legacy regular-labeled ledger with eight known postseason mislabels'};
});
assert.equal(rebuiltSingleGame.length,9);
const careerGroups=new Map();
for(const row of appearances){
 if(!careerGroups.has(row.manager))careerGroups.set(row.manager,[]);
 careerGroups.get(row.manager).push(row);
}
const countWhere=(a,f)=>a.filter(f).length;
const round2=x=>Math.round(x*100)/100;
const careerDefinitions={
 'most-wins':a=>countWhere(a,x=>x.p>x.q),
 'most-games':a=>a.length,
 'win-rate':a=>round2(100*(countWhere(a,x=>x.p>x.q)+countWhere(a,x=>x.p===x.q)/2)/a.length),
 'career-points':a=>a.reduce((s,x)=>s+x.p,0)/100,
 'career-ppg':a=>round2(a.reduce((s,x)=>s+x.p,0)/100/a.length),
 'points-against':a=>a.reduce((s,x)=>s+x.q,0)/100,
 'hundred-club':a=>countWhere(a,x=>x.p>=10000),
 'one-twenty-club':a=>countWhere(a,x=>x.p>=12000),
 'one-forty-club':a=>countWhere(a,x=>x.p>=14000),
 'one-sixty-club':a=>countWhere(a,x=>x.p>=16000),
 'wins-vs-130':a=>countWhere(a,x=>x.p>x.q&&x.q>=13000),
 'wins-below-100':a=>countWhere(a,x=>x.p>x.q&&x.p<10000),
 'high-score-losses':a=>countWhere(a,x=>x.p<x.q&&x.p>=12000),
 'nailbiters':a=>countWhere(a,x=>x.p>x.q&&x.p-x.q<=300),
 'one-score-drama':a=>countWhere(a,x=>Math.abs(x.p-x.q)<=300),
 'thirty-plus-wins':a=>countWhere(a,x=>x.p-x.q>=3000)
};
const rebuiltCareer=Object.entries(careerDefinitions).map(([id,value])=>{
 const cat=expanded.categories.find(c=>c.key===id);assert(cat);
 const minimum=['win-rate','career-ppg'].includes(id)?60:0;
 const full=[...careerGroups].filter(([,a])=>a.length>=minimum).map(([manager,a])=>({manager,value:value(a),evidence:{games:a.length,...(minimum?{minimum}:{})}})).sort((a,b)=>(cat.direction==='low'?1:-1)*(a.value-b.value)||a.manager.localeCompare(b.manager));
 assert.equal(full.length,cat.entries,id+' population');
 let prev=null,rank=0;
 const ranked=full.map((r,i)=>{if(r.value!==prev){rank=i+1;prev=r.value;}return {...r,rank};});
 for(const l of cat.leaders)assert(ranked.some(r=>r.manager===canonicalName(l.manager)&&r.value===l.value&&r.rank===l.rank),id+' archive mark mismatch');
 return {id,cutoff,population:ranked.length,archivedEntriesMatched:cat.leaders.length,ranked,status:'archived-scope-reconstructed-not-recertified',stageBasis:'legacy regular-labeled ledger with eight known postseason mislabels'};
});
assert.equal(rebuiltCareer.length,16);
const portfolioCoverage={managers:Object.keys(canonicalManagerIndex).length,personalMarks,outsideTopFive,mappedProposalCategories:phase2ToCanonical.size,incumbentRankCoverage,unmappedTaxonomyCategories:rows.filter(r=>!r.phase2.length).map(r=>r.id),publication:'not-authorized; candidate marks must not replace incumbent records; missing categories remain unavailable'};
const report={schema:'fellas-record-certification-audit-v1',throughWeek:week,coverage:taxonomy.coverage,phase2Coverage:phase2.coverage,provisionalManagerIndex:phase2.managerIndex,canonicalManagerIndex,portfolioCoverage,rebuiltSingleGame,rebuiltCareer,counts:{candidateOnly:rows.filter(r=>r.origin.type==='proposal').length,withPhase2Evidence:rows.filter(r=>r.phase2.length).length,relatedReview:rows.filter(r=>r.related.length).length},rows};
console.log(JSON.stringify(report,null,2));
