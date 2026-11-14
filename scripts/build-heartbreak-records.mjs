// Archive-backed Heartbreak & Misfortune records. Data-only research, no site writes.
// Run: node scripts/build-heartbreak-records.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
const ledger=JSON.parse(fs.readFileSync('data/unified_record_book_2016_2026.json','utf8'));
const norm=x=>x==='Tom'?'Thommy':x;
const games=ledger.games.filter(g=>g.stage==='regular');
assert.equal(games.length,705,'Expected researched Week 9 archive (do not relabel a newer ledger)');
const names=[...new Set(games.flatMap(g=>[norm(g.home),norm(g.away)]))].sort();
assert.equal(names.length,14);
const appearances=games.flatMap(g=>[
 {manager:norm(g.home),opponent:norm(g.away),score:g.homeScore,against:g.awayScore,year:g.year,week:g.week,era:g.era},
 {manager:norm(g.away),opponent:norm(g.home),score:g.awayScore,against:g.homeScore,year:g.year,week:g.week,era:g.era}
]).map(g=>({...g,marginCents:Math.abs(Math.round(g.score*100)-Math.round(g.against*100)),
 loss:g.score<g.against,win:g.score>g.against,tie:g.score===g.against}));
assert.equal(appearances.length,1410);
const losses=appearances.filter(r=>r.loss);
const proof=r=>({year:r.year,week:r.week,manager:r.manager,opponent:r.opponent,
 score:r.score,against:r.against,margin:Number((r.marginCents/100).toFixed(2)),era:r.era});
const categories=[];
const add=(id,label,rule,predicate,meta={})=>{
 const ranked=names.map(manager=>{
  const rows=losses.filter(r=>r.manager===manager&&predicate(r));
  return {manager,value:rows.length,evidence:rows.map(proof).sort((a,b)=>a.year-b.year||a.week-b.week)};
 }).sort((a,b)=>b.value-a.value||a.manager.localeCompare(b.manager));
 let rank=0,prior;
 for(let i=0;i<ranked.length;i++){
  if(i===0||ranked[i].value!==prior)rank=i+1;
  prior=ranked[i].value;ranked[i].rank=rank;
 }
 const positive=ranked.filter(x=>x.value>0);
 categories.push({id,label,metric:'games',kind:'career',rule,...meta,
  leaders:positive.filter(x=>x.rank===1),ranked,hasEarnedHolder:positive.length>0});
};
for(const t of [100,110,125,130,140,150]){
 add('loss-over-'+t,'Losses despite scoring over '+t+' points','Score strictly greater than '+t+'; ties not losses.',
 r=>Math.round(r.score*100)>t*100,{threshold:{operator:'>',points:t}});
}
for(const pts of [1,3,5,10]){
 add('loss-by-'+pts+'-or-less','Defeats by '+pts+' points or fewer','Losing margin > 0 and ≤ '+pts+' points; exclude tied games.',
 r=>r.marginCents>0&&r.marginCents<=pts*100,{margin:{operator:'<=',points:pts}});
}
for(const [t,pts] of [[100,5],[110,5],[125,5],[130,5],[140,5]]){
 add('loss-over-'+t+'-within-'+pts,'High-scoring heartbreak: over '+t+' in a loss by '+pts+' or fewer',
 'Score strictly above '+t+' and loss margin >0, ≤'+pts+'.',
 r=>Math.round(r.score*100)>t*100&&r.marginCents>0&&r.marginCents<=pts*100,
 {threshold:{operator:'>',points:t},margin:{operator:'<=',points:pts}});
}
const seasonRecords=[];
for(const t of [110,125]){
 const rows=[];
 for(const name of names)for(let year=2016;year<=2025;year++){
  const events=losses.filter(r=>r.manager===name&&r.year===year&&Math.round(r.score*100)>t*100);
  if(events.length)rows.push({manager:name,year,value:events.length,evidence:events.map(proof)});
 }
 rows.sort((a,b)=>b.value-a.value||a.year-b.year||a.manager.localeCompare(b.manager));
 let rank=0,prev;
 for(let i=0;i<rows.length;i++){if(i===0||rows[i].value!==prev)rank=i+1;prev=rows[i].value;rows[i].rank=rank}
 seasonRecords.push({id:'season-loss-over-'+t,label:'Most '+t+'+ point losses in one completed regular season',
 rule:'Strictly above '+t+'; one completed season only, 2016–2025; 2026 excluded',rows,
 leaders:rows.filter(x=>x.rank===1)});
}
const top=(id)=>categories.find(c=>c.id===id).leaders;
const assertTop=(id,name,count)=>assert(top(id).some(x=>x.manager===name&&x.value===count),id+' '+name+' '+count);
assertTop('loss-over-100','Stilly',34);
assertTop('loss-over-110','Tony',19);
for(const x of ['Mitch','Stilly','Thommy','Tony'])assertTop('loss-over-125',x,5);
assertTop('loss-over-130','Stew',4);assertTop('loss-over-130','Stilly',4);
assertTop('loss-over-140','Stew',3);assertTop('loss-over-150','Stew',2);
assertTop('loss-by-1-or-less','Stover',4);
assertTop('loss-by-3-or-less','Mitch',7);
assertTop('loss-by-5-or-less','Mitch',10);assertTop('loss-by-5-or-less','Stew',10);
assertTop('loss-by-10-or-less','Thommy',21);
assertTop('loss-over-110-within-5','Stew',6);
assertTop('loss-over-125-within-5','Stew',4);
assertTop('loss-over-140-within-5','Stew',3);
assert(seasonRecords.find(x=>x.id==='season-loss-over-125').leaders.some(x=>x.manager==='Stilly'&&x.year===2022&&x.value===3));
const byManager=Object.fromEntries(names.map(manager=>[manager,categories.map(c=>{
 const row=c.ranked.find(x=>x.manager===manager);
 return {id:c.id,rank:row.rank,value:row.value,evidence:row.evidence};
})]));
const result={schema:'fellas-heartbreak-candidates-v1',
 status:'provisional-research-only-not-published',updated:'2026-11-14',
 coverage:{source:'data/unified_record_book_2016_2026.json',last2026Week:9,
  games:games.length,appearances:appearances.length,managers:names.length,
  completedSeasonEnd:2025,countsIncludeFormerManagers:true},
 rules:['Strict > thresholds; scoring equal to 125 does not qualify as over 125.',
  'Margins are compared in integer cents and must be positive for a loss.',
  'Regular-season head-to-head only; playoff, consolation and bye weeks excluded.',
  '2026 through Week 9; no assumption that Week 10 is complete.',
  'ESPN and Sleeper scoring eras differ; raw score totals are not normalized.',
  '2016 eight-team league; rank all 14 historical manager identities without rate normalization.',
  'Counts are descriptive and exposure-dependent; manager tenure differs.',
  'Proposed categories may overlap existing 120+ point losses and close-game records: crosswalk before publication.'],
 categoryCount:categories.length,seasonCategoryCount:seasonRecords.length,
 categories,seasonRecords,byManager};
assert.equal(categories.length,15);assert.equal(seasonRecords.length,2);
assert.equal(new Set(categories.map(x=>x.id)).size,categories.length);
console.log(JSON.stringify(result,null,2));
