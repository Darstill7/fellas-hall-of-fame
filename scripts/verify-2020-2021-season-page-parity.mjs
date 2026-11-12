// The 2020 and 2021 static season guides already show verified 13-week W/L totals.
// Preserve their unresolved small PF differences until original weekly scoring is audited.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const audit=load('data/2020_2021_static_season_page_parity_v1.json');
const projection=load('data/corrected_2020_2021_regular_standings_projection_v1.json');
assert.equal(audit.schema,'fellas-2020-2021-static-season-page-parity-audit-v1');
assert.equal(audit.status,'win_loss_consistent_pf_differences_need_provider_validation');
const parse=s=>{
 const start=s.indexOf('<h2>Season Table</h2>'),end=s.indexOf('</tbody></table>',start);
 assert(start>=0&&end>start,'Missing season table');
 return [...s.slice(start,end).matchAll(/<tr><td class="rank">(\d+)<\/td><td><b>([^<]+)<\/b><\/td><td>(\d+)[–-](\d+)<\/td><td>([\d,]+\.\d+)<\/td><td>([^<]+)<\/td><\/tr>/g)]
 .map(m=>({rank:Number(m[1]),manager:m[2]==='EvansBrandon'?'Evans':m[2]==='Tom'?'Thommy':m[2],record:{w:Number(m[3]),l:Number(m[4])},pointsFor:Number(m[5].replaceAll(',','')),finish:m[6]}));
};
for(const year of [2020,2021]){
 const flat=parse(fs.readFileSync('seasons/'+year+'.html','utf8'));
 const nested=parse(fs.readFileSync('seasons/'+year+'/index.html','utf8'));
 assert.equal(flat.length,10);
 assert.deepEqual(flat,nested,'Both static route variants must match for '+year);
 const researched=audit.years.find(x=>x.year===year);
 const source=projection.years.find(x=>x.year===year);
 assert(researched&&source);
 for(const row of flat){
  const original=source.rows.find(x=>x.manager===row.manager);
  const saved=researched.seasonPageRows.find(x=>x.manager===row.manager);
  assert(original&&saved,'Manager identity missing '+year+' '+row.manager);
  assert.equal(row.record.w,original.corrected.w);
  assert.equal(row.record.l,original.corrected.l);
  assert.equal(row.pointsFor,saved.pointsFor);
  assert.equal(Number((row.pointsFor-original.corrected.pf).toFixed(2)),saved.pointsForDifference);
 }
 assert(researched.allRecordsCorrect);
}
const y2020=audit.years.find(y=>y.year===2020),y2021=audit.years.find(y=>y.year===2021);
assert.equal(y2020.pointsForDifferences.length,5);
assert.equal(y2021.pointsForDifferences.length,1);
assert.equal(y2020.pointsForDifferences.find(x=>x.manager==='Stover').difference,-4);
assert.equal(y2021.pointsForDifferences.find(x=>x.manager==='Kuhl').difference,-1);
console.log('PASS: 2020–2021 season-page records agree with true 13-week results in all four URLs; six small points-for differences quarantined.');
