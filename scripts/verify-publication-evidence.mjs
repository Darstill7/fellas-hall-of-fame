import fs from 'node:fs';
import assert from 'node:assert/strict';
import {deriveFacts} from './derive-publication-facts.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ledger=read('data/unified_record_book_2016_2026.json');
const manifest=read('data/weekly-recaps/publication-evidence/2026-week-11.json');
const facts=deriveFacts(ledger,manifest.year,manifest.week);
assert.equal(facts.managers.Stew.streak,'W7');
const html=fs.readFileSync(manifest.article,'utf8');
for(const claim of manifest.claims){
 assert.ok(claim.id&&claim.text&&claim.source,'Claim metadata missing');
 if(claim.kind==='canonical'){
  let value=facts;for(const key of claim.path.split('.')){assert.ok(Object.hasOwn(value,key),claim.id+' unknown path');value=value[key];}
  assert.deepEqual(value,claim.expected,claim.id);
  if(claim.articleText)assert.ok(html.includes(claim.articleText),claim.id+' missing from rendered source');
 }else{
  assert.ok(['player','trade','nfl','manual'].includes(claim.kind),claim.id+' unknown kind');
  assert.ok(['pending','verified'].includes(claim.status),claim.id+' unknown verification status');
  if(claim.status==='verified')assert.ok(claim.evidence&&claim.evidence.trim().length>0,claim.id+' missing evidence');
 }
}
const pending=manifest.claims.filter(c=>c.kind!=='canonical'&&c.status!=='verified');
console.log('Verified canonical claims:',manifest.claims.filter(c=>c.kind==='canonical').length,'Pending independent claims:',pending.map(c=>c.id).join(', '));
if(process.env.STRICT_PUBLICATION==='1')assert.equal(pending.length,0,'Unverified factual claims block release');
