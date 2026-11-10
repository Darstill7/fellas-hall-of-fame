import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Read-only source regression: run with "node scripts/verify-weekly-title-records.mjs".
// Fully paired regular-season weeks only; incomplete 2020/2021 Week 14 excluded.
const ledger=JSON.parse(readFileSync(new URL('../data/unified_record_book_2016_2026.json',import.meta.url),'utf8'));
assert(Array.isArray(ledger.games)&&ledger.games.length>0,'Canonical games required');
const weeks=new Map();
for(const g of ledger.games.filter(x=>x.stage==='regular')){
 const k=g.year+'|'+g.week,rows=weeks.get(k)||[];
 rows.push({year:Number(g.year),week:Number(g.week),manager:g.home,points:Math.round(Number(g.homeScore)*100)},
           {year:Number(g.year),week:Number(g.week),manager:g.away,points:Math.round(Number(g.awayScore)*100)});
 weeks.set(k,rows);
}
const excluded=[],titles=new Map();
for(const [k,rows] of weeks){
 const year=rows[0].year,required=year===2016?8:10;
 if(rows.length!==required||new Set(rows.map(x=>x.manager)).size!==required){excluded.push(k);continue}
 const high=Math.max(...rows.map(x=>x.points));
 for(const r of rows.filter(x=>x.points===high)){
  const id=year+'|'+r.manager,arr=titles.get(id)||[];
  arr.push(r.week);titles.set(id,arr);
 }
}
function streak(arr){
 const weeks=[...arr].sort((a,b)=>a-b);let best=0,last=null,run=0;
 for(const week of weeks){run=last!==null&&week===last+1?run+1:1;best=Math.max(best,run);last=week}
 return best;
}
assert.deepEqual(excluded.sort(),['2020|14','2021|14']);
assert.equal(titles.get('2025|Mitch')?.length,5,'Mitch 2025 single-season record');
assert.equal(Math.max(...[...titles].filter(([k])=>!k.startsWith('2026|')).map(([,v])=>v.length)),5,'All-time completed-season ceiling');
assert.equal(streak(titles.get('2016|Evans')),3,'Evans Weeks 7–9');
assert.equal(Math.max(...[...titles].filter(([k])=>!k.startsWith('2026|')).map(([,v])=>streak(v))),3,'Longest completed-season streak');
assert.equal(titles.get('2026|Mitch')?.length,4,'Mitch 2026 provisional');
assert.equal(streak(titles.get('2026|JMid')),2,'JMid 2026 Weeks 8–9');
assert.deepEqual(titles.get('2026|JMid')?.filter(w=>w>=8),[8,9]);
console.log('PASS: fully paired week coverage, all-time single-season titles, consecutive streaks and provisional 2026');
