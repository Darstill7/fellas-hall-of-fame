// Verified 2020–2025 final ranks must appear clearly in manager season timelines.
// This is a placement audit, not an invented score, award, or playoff qualifier.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const endings=read('data/manager_verified_season_endings_v1.json').managers;
const placements=read('data/fellas_final_placements_2016_2025_verified.json').seasons.filter(s=>s.year>=2020&&s.year<=2025);
const label=n=>n===1?'Champion':n===2?'Runner-up':n===3?'3rd place':n===10?'10th place (last)':n+'th place';
let checked=0;
for(const season of placements){
 assert.equal(season.teams,10,'Unexpected team count '+season.year);
 for(const finish of season.finishes){
  const rows=endings[finish.manager]||[];
  const row=rows.find(x=>x.year===season.year);
  if(!row)continue; // Historical alumni are not required to have active-manager profiles.
  assert.equal(row.finalRank??finish.rank,finish.rank,'Rank conflict '+season.year+' '+finish.manager);
  assert.equal(row.ending,label(finish.rank),'Postseason label wrong '+season.year+' '+finish.manager);
  assert.ok(row.ending!=='Postseason ending not verified','Verified finish hidden');
  if(finish.rank>=2&&finish.rank<=9){
   assert.ok(typeof row.note==='string'&&row.note.trim().length>0&&
    typeof row.source==='string'&&row.source.trim().length>0,
     'Missing final-placement provenance '+finish.manager+' '+season.year);
  }
  checked++;
 }
}
const remaining=Object.values(endings).flat().filter(r=>r.year>=2020&&r.year<=2025&&r.ending==='Postseason ending not verified');
assert.equal(remaining.length,0,'All recoverable 2020–2025 manager endings must be filled');
const birch=placements.find(s=>s.year===2020)?.finishes.find(f=>f.manager==='Birch');
assert.equal(birch?.postseasonThirdPlaceScore,110.14,'Confirmed 2020 Birch third-place score drifted');
assert.ok(checked>=50,'Missing placement coverage '+checked);
console.log('Sleeper postseason ending labels PASS: '+checked+' profiled 2020–2025 finishes; no unverified placeholders.');
