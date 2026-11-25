// Apply completed timing audit to the museum, preserving prior-season records.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const audit=JSON.parse(execFileSync(process.execPath,['scripts/audit-trade-starter-timing.mjs',...process.argv.slice(2)],{encoding:'utf8'}));
assert.equal(audit.status,'COMPLETE');
const path='data/trade_museum_stage66.json',htmlPath='analytics/trade-museum.html';
const museum=JSON.parse(fs.readFileSync(path,'utf8'));
const before=fs.readFileSync(htmlPath,'utf8');
const re=/(<script id="archive-data" type="application\/json">)([\s\S]*?)(<\/script>)/;
assert.deepEqual(JSON.parse(before.match(re)[2]),museum);
const lookup=new Map(audit.audits.map(t=>[String(t.id),t]));
assert.equal(museum.filter(t=>t.year===2026).length,lookup.size);
for(const t of museum.filter(t=>t.year===2026)){
 const a=lookup.get(String(t.id));assert(a);assert.equal(a.week,t.week);
 assert.equal(t.sides.length,a.sides.length);
 for(const s of t.sides){
  const v=a.sides.find(x=>x.manager===(s.manager==='Tom'?'Thommy':s.manager));
  assert(v?.complete);s.raw_starter_points=v.verified_points;s.started_games=v.verified_start_count;
 }
 t.scoring_through_week=audit.through_week;t.comparison_status='raw_only';
 t.evidence='Verified finalized Sleeper receiving-roster starters through completed Week '+audit.through_week+'; eligible transaction-week starts included using archived game-date evidence. Not a lineup-, keeper-, FAAB- or replacement-adjusted verdict.';
 lookup.delete(String(t.id));
}
assert.equal(lookup.size,0);
fs.writeFileSync(path,JSON.stringify(museum,null,2)+'\n');
fs.writeFileSync(htmlPath,before.replace(re,(_,a,b,c)=>a+JSON.stringify(museum).replace(/</g,'\\u003c')+c));
console.log('Museum scoring refreshed through Week '+audit.through_week+'; historical seasons untouched.');
