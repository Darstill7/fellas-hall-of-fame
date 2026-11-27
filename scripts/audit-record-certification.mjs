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
// Reproduce the incumbent consecutive documented appearance rule exactly.
// Gap-aware and season-reset variants remain separate migration research.
const streakDefinitions={
 'winning-streak':r=>r.p>r.q,
 'scoring-streak-100':r=>r.p>=10000,
 'scoring-streak-120':r=>r.p>=12000
};
function longestRuns(appearances,eligible){
 const ordered=[...appearances].sort((a,b)=>a.year-b.year||a.week-b.week);
 let run=[],best=[],length=0;
 function finish(){
  if(run.length>length){length=run.length;best=[];}
  if(run.length&&run.length===length)best.push(run);
  run=[];
 }
 for(const r of ordered){
  if(eligible(r))run.push(r);else finish();
 }
 finish();
 return {value:length,runs:best};
}
const rebuiltStreaks=Object.entries(streakDefinitions).map(([id,eligible])=>{
 const cat=expanded.categories.find(c=>c.key===id);assert(cat);
 const full=[...careerGroups].map(([manager,a])=>({manager,...longestRuns(a,eligible),games:a.length})).sort((a,b)=>b.value-a.value||a.manager.localeCompare(b.manager));
 assert.equal(full.length,cat.entries,id+' population');
 let prev=null,rank=0;
 const ranked=full.map((r,i)=>{if(r.value!==prev){rank=i+1;prev=r.value;}return {...r,rank};});
 for(const l of cat.leaders){
  const r=ranked.find(r=>r.manager===canonicalName(l.manager));
  assert(r&&r.value===l.value&&r.rank===l.rank&&r.games===l.evidence.games,id+' archive mark mismatch');
  assert(r.runs[0]?.at(-1)?.year===l.evidence.endingYear&&r.runs[0]?.at(-1)?.week===l.evidence.endingWeek,id+' archive endpoint mismatch');
 }
 return {id,cutoff,population:ranked.length,archivedEntriesMatched:cat.leaders.length,ranked,status:'archived-scope-reconstructed-not-recertified',stageBasis:'legacy regular-labeled ledger with eight known postseason mislabels',continuity:'consecutive documented regular-season appearances, not necessarily consecutive NFL weeks'};
});
assert.equal(rebuiltStreaks.length,3);
// Completed season archive reconstruction preserves its original win-rate rule.
// Career rate counts ties as half wins; archived season rate counts actual wins only.
// Keep alternate tie-inclusive ranks as research, never silently replace incumbents.
const seasonGroups=new Map();
for(const row of appearances.filter(r=>r.year<2026)){
 const k=JSON.stringify([row.manager,row.year]);
 if(!seasonGroups.has(k))seasonGroups.set(k,[]);
 seasonGroups.get(k).push(row);
}
const seasonDefinitions={
 'season-points':a=>a.reduce((s,x)=>s+x.p,0)/100,
 'season-average':a=>Math.round(a.reduce((s,x)=>s+x.p,0)/a.length)/100,
 'season-wins':a=>countWhere(a,x=>x.p>x.q),
 'season-win-rate':a=>round2(100*countWhere(a,x=>x.p>x.q)/a.length),
 'season-point-diff':a=>a.reduce((s,x)=>s+x.p-x.q,0)/100,
 'season-140-club':a=>countWhere(a,x=>x.p>=14000)
};
function rankSeasonRows(full){
 let prev=null,rank=0;
 return full.sort((a,b)=>b.value-a.value||a.manager.localeCompare(b.manager)||a.year-b.year).map((r,i)=>{
  if(r.value!==prev){rank=i+1;prev=r.value;}return {...r,rank};
 });
}
const rebuiltSeasons=Object.entries(seasonDefinitions).map(([id,value])=>{
 const cat=expanded.categories.find(c=>c.key===id);assert(cat);
 const full=[...seasonGroups].filter(([,a])=>a.length>=12).map(([k,a])=>{
  const [manager,year]=JSON.parse(k);
  return {manager,year,value:value(a),evidence:{games:a.length,wins:countWhere(a,x=>x.p>x.q),losses:countWhere(a,x=>x.p<x.q),ties:countWhere(a,x=>x.p===x.q),points:seasonDefinitions['season-points'](a),against:a.reduce((s,x)=>s+x.q,0)/100}};
 });
 assert.equal(full.length,cat.entries,id+' population');
 const ranked=rankSeasonRows(full);
 for(const l of cat.leaders)assert(ranked.some(r=>r.manager===canonicalName(l.manager)&&r.year===l.year&&r.value===l.value&&r.rank===l.rank),id+' archive mark mismatch');
 const personalBests=Object.create(null);
 for(const r of ranked){const b=personalBests[r.manager]??={rank:r.rank,value:r.value,marks:[]};if(b.rank===r.rank)b.marks.push(r);}
 const alternate=id==='season-win-rate'?rankSeasonRows(ranked.map(r=>({...r,value:round2(100*(r.evidence.wins+r.evidence.ties/2)/r.evidence.games)}))):null;
 return {id,cutoff,population:ranked.length,archivedEntriesMatched:cat.leaders.length,ranked,personalBests,alternateTieInclusiveRanks:alternate,status:'archived-scope-reconstructed-not-recertified',stageBasis:'legacy regular-labeled ledger with eight known postseason mislabels',ratePolicy:id==='season-win-rate'?'archived wins / games; alternate tie-half methodology awaiting review':null,pointsBasis:'summed matchup scores, not official season PF'};
});
assert.equal(rebuiltSeasons.length,6);
const mitchInterruption=ledger.games.find(g=>g.year===2025&&g.week===16&&g.stage!=='regular'&&((g.home==='Mitch'&&g.homeScore<g.awayScore)||(g.away==='Mitch'&&g.awayScore<g.homeScore)));
assert(mitchInterruption,'Missing archived Mitch postseason streak interruption');
const streakScopeEvidence={status:'stored-archive-confirmation-not-fresh-provider-receipt',regularOnlyMark:20,interruption:mitchInterruption,policy:'Never label regular-only streak as uninterrupted all-game streak; all-game ordering and postseason eligibility require certification'};
// Directional rivalry statistics: retain both perspectives, but a meeting
// is one underlying game. Reverse directions must reconcile exactly.
const rivalryGroups=new Map();
for(const row of appearances){
 const k=JSON.stringify([row.manager,row.opponent]);
 if(!rivalryGroups.has(k))rivalryGroups.set(k,[]);
 rivalryGroups.get(k).push(row);
}
const rivalryTotals=a=>({meetings:a.length,wins:countWhere(a,x=>x.p>x.q),losses:countWhere(a,x=>x.p<x.q),ties:countWhere(a,x=>x.p===x.q),pf:a.reduce((s,x)=>s+x.p,0),pa:a.reduce((s,x)=>s+x.q,0)});
const rivalryMatrix=[...rivalryGroups].map(([k,a])=>{
 const [manager,opponent]=JSON.parse(k),v=rivalryTotals(a);
 const reverse=rivalryGroups.get(JSON.stringify([opponent,manager]));assert(reverse);
 const b=rivalryTotals(reverse);
 assert.equal(v.meetings,b.meetings);assert.equal(v.wins,b.losses);assert.equal(v.losses,b.wins);assert.equal(v.ties,b.ties);assert.equal(v.pf,b.pa);assert.equal(v.pa,b.pf);
 assert.equal(v.meetings,v.wins+v.losses+v.ties);
 return {manager,opponent,...v,pointDifferential:(v.pf-v.pa)/100,winLossDifferential:v.wins-v.losses,receipts:a};
});
assert.equal(rivalryMatrix.reduce((s,r)=>s+r.meetings,0),archivedGames.length*2);
assert.equal(rivalryMatrix.reduce((s,r)=>s+r.winLossDifferential,0),0);
const rivalryDefinitions={
 'rival-wins':r=>r.wins,
 'rival-games':r=>r.meetings,
 'rival-percentage':r=>round2(100*r.wins/r.meetings),
 'rival-margin':r=>r.pointDifferential,
 'rival-scoring':r=>round2(r.pf/100/r.meetings)
};
const rebuiltRivalries=Object.entries(rivalryDefinitions).map(([id,value])=>{
 const cat=expanded.categories.find(c=>c.key===id);assert(cat);
 const minimum=id==='rival-percentage'?6:5;
 const full=rivalryMatrix.filter(r=>r.meetings>=minimum).map(r=>({manager:r.manager,opponent:r.opponent,value:value(r),evidence:{opponent:r.opponent,meetings:r.meetings,wins:r.wins,losses:r.losses,ties:r.ties,points:r.pf/100,against:r.pa/100}})).sort((a,b)=>b.value-a.value||a.manager.localeCompare(b.manager)||a.opponent.localeCompare(b.opponent));
 assert.equal(full.length,cat.entries,id+' population');
 let prev=null,rank=0;
 const ranked=full.map((r,i)=>{if(r.value!==prev){rank=i+1;prev=r.value;}return {...r,rank};});
 for(const l of cat.leaders)assert(ranked.some(r=>r.manager===canonicalName(l.manager)&&r.opponent===canonicalName(l.evidence.opponent)&&r.value===l.value&&r.rank===l.rank&&r.evidence.meetings===l.evidence.meetings&&r.evidence.wins===l.evidence.wins&&r.evidence.losses===l.evidence.losses),id+' archive mark mismatch');
 const personalBests=Object.create(null);
 for(const r of ranked){const b=personalBests[r.manager]??={rank:r.rank,value:r.value,marks:[]};if(b.rank===r.rank)b.marks.push(r);}
 return {id,cutoff,population:ranked.length,minimumMeetings:minimum,archivedEntriesMatched:cat.leaders.length,ranked,personalBests,status:'archived-scope-reconstructed-not-recertified',stageBasis:'legacy regular-labeled ledger with eight known postseason mislabels',ratePolicy:id==='rival-percentage'?'archived wins / meetings; tie-half treatment not certified':null};
});
assert.equal(rebuiltRivalries.length,5);
// Rebuild final-standing categories from the verified placement receipts,
// never from regular-season seed or win-loss standings.
const placements=JSON.parse(fs.readFileSync('data/fellas_final_placements_2016_2025_verified.json','utf8'));
const placementGroups=new Map();
for(const season of placements.seasons){
 assert(season.year>=2016&&season.year<=2025);
 assert.equal(season.teams,season.year===2016?8:10);
 assert.equal(season.finishes.length,season.teams);
 assert.equal(new Set(season.finishes.map(f=>canonicalName(f.manager))).size,season.teams);
 assert.deepEqual(season.finishes.map(f=>f.rank).sort((a,b)=>a-b),Array.from({length:season.teams},(_,i)=>i+1));
 for(const f of season.finishes){
  const manager=canonicalName(f.manager);
  if(!placementGroups.has(manager))placementGroups.set(manager,[]);
  placementGroups.get(manager).push({year:season.year,rank:f.rank,teams:season.teams,provider:season.provider,source:f.source});
 }
}
assert.equal(placements.seasons.length,10);
assert.equal(placementGroups.size,14);
const finishScore=r=>100*(r.teams-r.rank)/(r.teams-1);
const finishDefinitions={
 'seasons-played':a=>a.length,
 'top-three-finishes':a=>countWhere(a,r=>r.rank<=3),
 'top-half-finishes':a=>countWhere(a,r=>r.rank<=r.teams/2),
 'average-finish':a=>round2(a.reduce((s,r)=>s+finishScore(r),0)/a.length)
};
const rebuiltFinishes=[...Object.keys(finishDefinitions),'bounceback'].map(id=>{
 const cat=expanded.categories.find(c=>c.key===id);assert(cat);
 const full=[];
 for(const [manager,history] of placementGroups){
  const a=[...history].sort((x,y)=>x.year-y.year);
  if(id==='bounceback'){
   for(let i=1;i<a.length;i++){
    const from=a[i-1],to=a[i];if(to.year!==from.year+1)continue;
    full.push({manager,year:to.year,value:round2(finishScore(to)-finishScore(from)),evidence:{fromYear:from.year,toYear:to.year,fromRank:from.rank,toRank:to.rank,fromTeams:from.teams,toTeams:to.teams,receipts:[from,to]}});
   }
  }else if(id!=='average-finish'||a.length>=6){
   full.push({manager,value:finishDefinitions[id](a),evidence:{years:a.map(r=>r.year),seasons:a.length,receipts:a}});
  }
 }
 assert.equal(full.length,cat.entries,id+' population');
 const ranked=rankSeasonRows(full);
 for(const l of cat.leaders)assert(ranked.some(r=>r.manager===canonicalName(l.manager)&&r.year===l.year&&r.value===l.value&&r.rank===l.rank),id+' archive mark mismatch');
 const personalBests=Object.create(null);
 for(const r of ranked){const b=personalBests[r.manager]??={rank:r.rank,value:r.value,marks:[]};if(b.rank===r.rank)b.marks.push(r);}
 return {id,population:ranked.length,archivedEntriesMatched:cat.leaders.length,ranked,personalBests,status:'archived-scope-reconstructed-not-recertified',source:'data/fellas_final_placements_2016_2025_verified.json',scope:'completed official final placements 2016–2025'};
});
assert.equal(rebuiltFinishes.length,5);
const reconstructedIds=[...rebuiltSingleGame,...rebuiltCareer,...rebuiltStreaks,...rebuiltSeasons,...rebuiltRivalries,...rebuiltFinishes].map(c=>c.id);
assert.equal(reconstructedIds.length,44);
assert.equal(new Set(reconstructedIds).size,44);
assert.deepEqual([...reconstructedIds].sort(),expanded.categories.map(c=>c.key).sort());
const expandedReconstruction={reconstructed:44,total:expanded.categories.length,uniqueIds:44,status:'archive-reconstruction-only-not-publication-certification',ids:reconstructedIds};
const legendaryReconstruction=JSON.parse(execFileSync(process.execPath,['scripts/verify-legendary-records.mjs','--research-json'],{encoding:'utf8',maxBuffer:32*1024*1024}));
assert.equal(legendaryReconstruction.categories.length,19);
assert.deepEqual(legendaryReconstruction.categories.map(c=>c.id).sort(),legendary.categories.map(c=>c.id).sort());
const incumbentReconstruction={expanded:expandedReconstruction.reconstructed,legendary:legendaryReconstruction.categories.length,totalCategoryAppearances:63,status:'archive-reconstruction-only-not-publication-certification',note:'63 source category appearances; taxonomy aliases and overlapping definitions are not automatically new unique records'};
assert.equal(incumbentReconstruction.expanded+incumbentReconstruction.legendary,63);
// All-game research includes regular, championship and consolation results.
 // Aggregate playoff rounds count once; running cumulative score rows are unknown.
 // Observed appearances alone do not prove uninterrupted provider coverage.
const allGameHistories=new Map();
for(const g of ledger.games){
 for(const [manager,opponent,pf,pa] of [[g.home,g.away,g.homeScore,g.awayScore],[g.away,g.home,g.awayScore,g.homeScore]]){
  const name=canonicalName(manager);
  const history=allGameHistories.get(name)??[];
  const uncertain=!!g.cumulativeScoring||g.scoreAggregation==='running_three_week_consolation_total';
  history.push({year:g.year,week:g.week,manager:name,opponent:canonicalName(opponent),points:pf,against:pa,result:uncertain?'unknown':pf>pa?'W':pf<pa?'L':'T',stage:g.stage,source:g.source,weeksCovered:g.weeksCovered??[g.week],aggregate:!!g.twoWeekAggregate});
  allGameHistories.set(name,history);
 }
}
function allGameRuns(history,strict){
 const h=[...history].sort((a,b)=>a.year-b.year||a.week-b.week);
 let run=[],best={W:[],L:[]},previous=null;
 const finish=()=>{
  if(!run.length)return;
  const k=run[0].result,len=best[k][0]?.length??0;
  if(run.length>len)best[k]=[];
  if(run.length>=len)best[k].push(run);
  run=[];
 };
 for(const g of h){
  if(previous)assert(previous.year!==g.year||previous.week!==g.week,'Duplicate all-game appearance');
  // Conservative floor: only bridge contiguous calendar coverage within a
  // season. Offseason and bye bridges are retained only in observed mode.
  const contiguous=previous&&g.year===previous.year&&Math.min(...g.weeksCovered)===Math.max(...previous.weeksCovered)+1;
  if(strict&&!contiguous||!['W','L'].includes(g.result)||run.at(-1)?.result!==g.result)finish();
  if(['W','L'].includes(g.result))run.push(g);
  previous=g;
 }
 const terminalRun=run.slice();finish();
 return {longestWin:best.W[0]?.length??0,longestLoss:best.L[0]?.length??0,winReceipts:best.W,lossReceipts:best.L,terminalRun,lastObservedGame:previous};
}
const allGameStreakResearch=[false,true].map(strict=>{
 const managers=[...allGameHistories].map(([manager,h])=>({manager,...allGameRuns(h,strict)}));
 const ranking=field=>{let prev=null,rank=0;return [...managers].sort((a,b)=>b[field]-a[field]||a.manager.localeCompare(b.manager)).map((r,i)=>{if(r[field]!==prev){rank=i+1;prev=r[field];}return {manager:r.manager,value:r[field],rank};});};
 return {policy:strict?'conservative contiguous within-season floor; gaps and offseasons break':'consecutive observed matchups; gaps and offseasons may hide missing results',managers,winning:ranking('longestWin'),losing:ranking('longestLoss'),status:'research-only-not-certified'};
});
assert.equal([...allGameHistories.values()].reduce((n,h)=>n+h.length,0),ledger.games.length*2);
const mitchObserved=allGameStreakResearch[0].managers.find(r=>r.manager==='Mitch');
assert(mitchObserved.winReceipts.every(run=>!run.some(g=>g.year===2025&&g.week===16)));
assert(allGameHistories.get('Mitch').some(g=>g.year===2025&&g.week===16&&g.result==='L'));
const allGameCoverage={unknownCumulativeRows:ledger.games.filter(g=>g.cumulativeScoring||g.scoreAggregation==='running_three_week_consolation_total').length,aggregateRounds:ledger.games.filter(g=>g.twoWeekAggregate).length,throughWeek:week,blockers:['Verify provider matchup completeness, especially postseason and missing weeks','Reconcile 2019 cumulative consolation outcomes','Validate 2026 pairing receipts before publication','Certify continuity through documented byes and offseasons; observed mode is not proof']};
// Reuse the exact archived definitions for a same-cutoff stage-only projection.
const stageAudit=JSON.parse(fs.readFileSync('data/week14_2020_2021_stage_classification_audit_v1.json','utf8'));
const gameKey=(year,week,a,b)=>JSON.stringify([year,week,...[canonicalName(a),canonicalName(b)].sort()]);
const exclusion=new Map(stageAudit.years.flatMap(y=>y.week14Games.map(g=>[gameKey(y.year,g.week,g.home,g.away),g])));
assert.equal(exclusion.size,8);
const removedGames=archivedGames.filter(g=>exclusion.has(gameKey(g.year,g.week,g.home,g.away)));
assert.equal(removedGames.length,8);
for(const g of removedGames){
 const e=exclusion.get(gameKey(g.year,g.week,g.home,g.away));
 assert.equal(canonicalName(g.home),canonicalName(e.home));assert.equal(canonicalName(g.away),canonicalName(e.away));
 assert.equal(g.homeScore,e.homeScore);assert.equal(g.awayScore,e.awayScore);
}
const correctedAppearances=appearances.filter(r=>!exclusion.has(gameKey(r.year,r.week,r.manager,r.opponent)));
assert.equal(appearances.length-correctedAppearances.length,16);
const groupRows=(items,key)=>{
 const out=new Map();
 for(const r of items){const k=key(r);if(!out.has(k))out.set(k,[]);out.get(k).push(r);}
 return out;
};
function projectExpanded(items){
 const result=new Map();
 const add=(id,full)=>{
  const cat=expanded.categories.find(c=>c.key===id);assert(cat);
  const ordered=full.sort((a,b)=>(cat.direction==='low'?1:-1)*(a.value-b.value)||a.manager.localeCompare(b.manager)||(a.year??0)-(b.year??0)||(a.week??0)-(b.week??0)||(a.opponent??'').localeCompare(b.opponent??''));
  let prev=null,rank=0;
  const ranked=ordered.map((r,i)=>{if(r.value!==prev){rank=i+1;prev=r.value;}return {...r,rank};});
  const personalBests=Object.create(null);
  for(const r of ranked){const b=personalBests[r.manager]??={rank:r.rank,value:r.value,marks:[]};if(b.rank===r.rank)b.marks.push(r);}
  result.set(id,{id,population:ranked.length,holders:ranked.filter(r=>r.rank===1),personalBests});
 };
 for(const [id,[eligible,value]] of Object.entries(singleGameDefinitions))add(id,items.filter(eligible).map(r=>({...r,value:value(r)/100})));
 const career=groupRows(items,r=>r.manager);
 for(const [id,value] of Object.entries(careerDefinitions))add(id,[...career].filter(([,a])=>!['win-rate','career-ppg'].includes(id)||a.length>=60).map(([manager,a])=>({manager,value:value(a)})));
 for(const [id,eligible] of Object.entries(streakDefinitions))add(id,[...career].map(([manager,a])=>({manager,...longestRuns(a,eligible)})));
 const seasons=groupRows(items.filter(r=>r.year<2026),r=>JSON.stringify([r.manager,r.year]));
 for(const [id,value] of Object.entries(seasonDefinitions))add(id,[...seasons].filter(([,a])=>a.length>=12).map(([k,a])=>{const [manager,year]=JSON.parse(k);return {manager,year,value:value(a)};}));
 const rivals=groupRows(items,r=>JSON.stringify([r.manager,r.opponent]));
 for(const [id,value] of Object.entries(rivalryDefinitions))add(id,[...rivals].filter(([,a])=>a.length>=(id==='rival-percentage'?6:5)).map(([k,a])=>{const [manager,opponent]=JSON.parse(k),v=rivalryTotals(a);return {manager,opponent,value:value({...v,pointDifferential:(v.pf-v.pa)/100})};}));
 return result;
}
const archivedProjection=projectExpanded(appearances),correctedProjection=projectExpanded(correctedAppearances);
assert.equal(archivedProjection.size,39);assert.equal(correctedProjection.size,39);
const markSignature=r=>JSON.stringify([r.manager,r.year??null,r.week??null,r.opponent??null,r.value,r.rank]);
const holderSignature=c=>c.holders.map(markSignature).sort().join('|');
const correctedStageRankings=[...archivedProjection].map(([id,old])=>{
 const next=correctedProjection.get(id),cat=expanded.categories.find(c=>c.key===id);
 assert.equal(old.population,cat.entries);
 // All archived leader values and ranks must be reproduced by the shared baseline.
 for(const l of cat.leaders){
  const b=old.personalBests[canonicalName(l.manager)];
  assert(b&&b.rank<=l.rank,id+' personal rank baseline mismatch');
 }
 const names=[...new Set([...Object.keys(old.personalBests),...Object.keys(next.personalBests)])];
 const changedManagers=names.filter(n=>{
  const a=old.personalBests[n],b=next.personalBests[n];return a?.rank!==b?.rank||a?.value!==b?.value||JSON.stringify(a?.marks)!==JSON.stringify(b?.marks);
 }).map(manager=>({manager,before:old.personalBests[manager]??null,after:next.personalBests[manager]??null}));
 return {id,beforePopulation:old.population,afterPopulation:next.population,holderChange:holderSignature(old)!==holderSignature(next),beforeHolders:old.holders,afterHolders:next.holders,changedManagers};
});
const stageProjectionCoverage={status:'same-cutoff research projection not certified',cutoff,regularBefore:archivedGames.length,regularAfter:archivedGames.length-removedGames.length,allGamesUnchanged:ledger.games.length,expandedRecomputed:correctedStageRankings.length,placementCategoriesUnaffected:rebuiltFinishes.map(c=>c.id),legendaryFullCorrectedRerank:'pending',weeklyAwards:'separate approved eligibility; not recalculated here',pointBasis:'summed weekly scores not official PF/PA',unresolved:'four non-winners exact postseason labels and six official PF discrepancies'};
const correctedLegendary=JSON.parse(execFileSync(process.execPath,['scripts/verify-legendary-records.mjs','--corrected-research-json'],{encoding:'utf8',maxBuffer:32*1024*1024}));
assert.equal(correctedLegendary.categories.length,19);
const correctedLegendaryRankings=legendaryReconstruction.categories.map(old=>{
 const next=correctedLegendary.categories.find(c=>c.id===old.id);assert(next);
 const names=[...new Set([...Object.keys(old.personalBests),...Object.keys(next.personalBests)])];
 const changedManagers=names.filter(n=>JSON.stringify(old.personalBests[n])!==JSON.stringify(next.personalBests[n])).map(manager=>({manager,before:old.personalBests[manager]??null,after:next.personalBests[manager]??null}));
 return {id:old.id,beforePopulation:old.population,afterPopulation:next.population,holderChange:holderSignature(old)!==holderSignature(next),beforeHolders:old.holders,afterHolders:next.holders,changedManagers};
});
const correctedPhase2=JSON.parse(execFileSync(process.execPath,['scripts/build-record-book-phase2.mjs','--corrected-research-json'],{encoding:'utf8',maxBuffer:32*1024*1024}));
assert.equal(correctedPhase2.categoryCount,23);
assert.equal(phase2.coverage.games-correctedPhase2.coverage.games,8);
assert.equal(phase2.coverage.weeklyScoringSets,correctedPhase2.coverage.weeklyScoringSets);
assert.deepEqual(phase2.coverage.includedByeWeeks,correctedPhase2.coverage.includedByeWeeks);
const weeklyAwardIds=['weekly-highs','weekly-lows','weekly-runnerups','weekly-top-three','weekly-bottom-three','top-three-losses','bottom-three-wins','runnerup-losses','second-lowest-wins','season-top-three','season-bottom-three','season-weekly-highs','season-weekly-lows','high-streak','low-streak'];
for(const id of weeklyAwardIds){
 assert.deepEqual(phase2.categories.find(c=>c.id===id),correctedPhase2.categories.find(c=>c.id===id),'Approved weekly award parity '+id);
 for(const manager of new Set([...Object.keys(phase2.managerIndex),...Object.keys(correctedPhase2.managerIndex)]))assert.deepEqual(phase2.managerIndex[manager]?.[id],correctedPhase2.managerIndex[manager]?.[id],'Weekly personal rank parity '+manager+' '+id);
}
const phase2StageComparisons=phase2.categories.map(old=>{
 const next=correctedPhase2.categories.find(c=>c.id===old.id);assert(next);
 return {id:old.id,beforePopulation:old.count,afterPopulation:next.count,weeklyAward:weeklyAwardIds.includes(old.id),holdersBefore:old.holders,holdersAfter:next.holders};
});
const weeklyEligibilityProjection={status:'research-only-not-certified',weeklyAwardCategories:weeklyAwardIds.length,regularOnlyCategories:23-weeklyAwardIds.length,weeklyScoringSets:correctedPhase2.coverage.weeklyScoringSets,approvedPartialWeeks:correctedPhase2.coverage.includedByeWeeks,regularMatchups:correctedPhase2.coverage.games,weeklyAwardMatchups:correctedPhase2.coverage.weeklyAwardMatchups};
stageProjectionCoverage.legendaryFullCorrectedRerank='integrated research comparison';
stageProjectionCoverage.weeklyAwards='separate eligibility projection with invariant category and personal-rank assertions';
// Independent axes: historical stage correction versus new completed weeks.
const latestGames=ledger.games.filter(g=>g.stage==='regular');
const latestAppearances=latestGames.flatMap(g=>[[g.home,g.away,g.homeScore,g.awayScore],[g.away,g.home,g.awayScore,g.homeScore]].map(([manager,opponent,p,q])=>({manager:canonicalName(manager),opponent:canonicalName(opponent),year:g.year,week:g.week,p:cent(p),q:cent(q),era:g.era,source:g.source})));
const latestCorrected=latestAppearances.filter(r=>!exclusion.has(gameKey(r.year,r.week,r.manager,r.opponent)));
assert.equal(latestGames.length-archivedGames.length,5*(week-cutoff));
assert.equal(latestAppearances.length-latestCorrected.length,16);
const liveLegacy=projectExpanded(latestAppearances),liveCorrected=projectExpanded(latestCorrected);
const refreshedWeek11=[...archivedProjection].map(([id,old])=>{
 const stageOnly=correctedProjection.get(id),freshOnly=liveLegacy.get(id),both=liveCorrected.get(id);
 const names=[...new Set([...Object.keys(old.personalBests),...Object.keys(both.personalBests)])];
 const compact=b=>b?{rank:b.rank,value:b.value}:null;
 const changes=names.map(manager=>({manager,archive:compact(old.personalBests[manager]),stageOnly:compact(stageOnly.personalBests[manager]),freshOnly:compact(freshOnly.personalBests[manager]),both:compact(both.personalBests[manager])})).filter(r=>JSON.stringify(r.archive)!==JSON.stringify(r.stageOnly)||JSON.stringify(r.archive)!==JSON.stringify(r.freshOnly)||JSON.stringify(r.archive)!==JSON.stringify(r.both));
 return {id,archivePopulation:old.population,latestPopulation:both.population,archiveHolders:old.holders,stageOnlyHolders:stageOnly.holders,freshOnlyHolders:freshOnly.holders,combinedHolders:both.holders,performanceHolderChange:holderSignature(stageOnly)!==holderSignature(both),personalRankChanges:changes,latestCorrectedPersonalBests:both.personalBests};
});
assert.equal(refreshedWeek11.length,39);
const refreshCoverage={status:'research-only-not-certified',fromWeek:cutoff,throughWeek:week,newMatchups:latestGames.length-archivedGames.length,legacyMatchups:latestGames.length,correctedMatchups:latestCorrected.length/2,expandedMatchupCategories:39,completedSeasonPlacementCategories:5,legendaryCompletedSeasonCategories:19,phase2Categories:23,policy:'Completed-season-only categories exclude 2026; historical correction and weekly advancement compared separately'};
const portfolioCoverage={managers:Object.keys(canonicalManagerIndex).length,personalMarks,outsideTopFive,mappedProposalCategories:phase2ToCanonical.size,incumbentRankCoverage,unmappedTaxonomyCategories:rows.filter(r=>!r.phase2.length).map(r=>r.id),publication:'not-authorized; candidate marks must not replace incumbent records; missing categories remain unavailable'};
const report={schema:'fellas-record-certification-audit-v1',throughWeek:week,coverage:taxonomy.coverage,phase2Coverage:phase2.coverage,provisionalManagerIndex:phase2.managerIndex,canonicalManagerIndex,portfolioCoverage,rebuiltSingleGame,rebuiltCareer,rebuiltStreaks,rebuiltSeasons,streakScopeEvidence,rebuiltRivalries,rivalryMatrix,rebuiltFinishes,expandedReconstruction,legendaryReconstruction,incumbentReconstruction,allGameStreakResearch,allGameCoverage,correctedStageRankings,stageProjectionCoverage,correctedLegendaryRankings,phase2StageComparisons,weeklyEligibilityProjection,refreshedWeek11,refreshCoverage,counts:{candidateOnly:rows.filter(r=>r.origin.type==='proposal').length,withPhase2Evidence:rows.filter(r=>r.phase2.length).length,relatedReview:rows.filter(r=>r.related.length).length},rows};
console.log(JSON.stringify(report,null,2));
