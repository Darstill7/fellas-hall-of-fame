// Browser-free contract for the historically recovered season-collapse ledger.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const d=JSON.parse(execFileSync(process.execPath,['scripts/build-historic-collapse-records.mjs'],
 {encoding:'utf8',maxBuffer:16*1024*1024}));
assert.equal(d.schema,'fellas-historical-collapses-v1');
assert.equal(d.status,'provisional-not-published');
assert.equal(d.coverage.managerSeasons,98);
assert.equal(d.categoryCount,11);
assert.equal(new Set(d.categories.map(c=>c.id)).size,11);
const get=id=>{const c=d.categories.find(x=>x.id===id);assert(c,'Missing record '+id);return c};
function leader(id,value,pairs){
 const c=get(id);
 assert.equal(c.holders[0].value,value,'Record value '+id);
 const keys=c.holders.map(x=>x.manager+'|'+x.year).sort();
 assert.deepEqual(keys,pairs.map(x=>x.join('|')).sort(),'Record holders '+id);
 assert(c.holders.every(x=>x.rank===1));
}
leader('collapse-half-season-swing',8,[['Stover',2017],['Koble',2021],['Tony',2023]]);
leader('collapse-half-season-swing-missed-playoffs',8,[['Stover',2017],['Koble',2021]]);
leader('collapse-half-season-swing-playoff-team',8,[['Tony',2023]]);
leader('collapse-lead-erosion',8,[['Koble',2021]]);
leader('collapse-second-half-losses',7,[['Koble',2021],['Stew',2023],['Thommy',2019]]);
leader('collapse-second-half-winless',7,[['Koble',2021],['Stew',2023],['Thommy',2019]]);
leader('collapse-first-half-wins-missed-playoffs',5,[['Stover',2017]]);
leader('collapse-early-undefeated-no-title',7,[['Tony',2023],['Stover',2021]]);
leader('collapse-last-four-losses-playoff',4,[['Evans',2020],['Thommy',2025]]);
leader('collapse-longest-loss-run-missed-playoffs',11,[['Stew',2021]]);
leader('collapse-strongest-season-no-final',13,[['Mitch',2025]]);
const Tony=get('collapse-half-season-swing-playoff-team').holders[0];
assert.equal(Tony.evidence.first.w,7);assert.equal(Tony.evidence.first.l,0);
assert.equal(Tony.evidence.second.w,3);assert.equal(Tony.evidence.second.l,4);
assert.equal(Tony.evidence.final.w,10);assert.equal(Tony.evidence.final.l,4);
const Koble=get('collapse-half-season-swing').holders.find(x=>x.manager==='Koble');
assert(Koble);
assert.equal(Koble.evidence.first.w,4);assert.equal(Koble.evidence.first.l,3);
assert.equal(Koble.evidence.second.w,0);assert.equal(Koble.evidence.second.l,7);
for(const c of d.categories){
 assert(c.leaderboard.length&&c.holders.length,'Missing leaderboard '+c.id);
 assert(c.holders.every(h=>h.rank===1),'Bad tied holder '+c.id);
 for(const h of c.leaderboard){
  assert(h.year>=2016&&h.year<=2025);
  assert(h.manager!=='Tom');
  const first=h.evidence.first,second=h.evidence.second,final=h.evidence.final;
  assert.equal(first.w+second.w,final.w,'Win mismatch '+c.id);
  assert.equal(first.l+second.l,final.l,'Loss mismatch '+c.id);
  assert.equal(first.t+second.t,final.t,'Tie mismatch '+c.id);
  assert.equal(h.evidence.weeklyReceipts.length,h.evidence.regularGames);
  assert(h.evidence.midpoint>=6&&h.evidence.midpoint<=7);
 }
 for(let i=1;i<c.leaderboard.length;i++){
  assert(c.leaderboard[i].value<=c.leaderboard[i-1].value,'Sort mismatch '+c.id);
  if(c.leaderboard[i].value===c.leaderboard[i-1].value)
   assert.equal(c.leaderboard[i].rank,c.leaderboard[i-1].rank,'Tie mismatch '+c.id);
 }
}
console.log('PASS: 98 manager-seasons; 11 historical collapse categories, source receipts, eligibility and tied leaders.');
