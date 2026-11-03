// Verify canonical historical Sleeper owner aliases used for FAAB attribution.
// Never infer identity from roster ID or use identity matching as a skill grade.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const identity=read('data/manager_identity_map_v1.json');
const faab=read('data-integrity/faab-identity-attribution-v1.json');
const startSit=fs.readFileSync('assets/manager-lineup-research-page.mjs','utf8');
const match=startSit.match(/const managerAliases=(\{[^\n]+\});/);
assert.ok(match,'Historical Start/Sit alias source not found');
const sourceAliases=JSON.parse(match[1].replace(/([,{])([a-zA-Z][\w]*):/g,'$1"$2":').replace(/'/g,'"'));
const verified=identity.verifiedSleeperHistoricalHandleAliases;
assert.equal(verified.length,6,'Historical identity alias cohort changed');
const lookup=new Map();
for(const r of verified){
 const k=r.handle.toLowerCase();
 assert.ok(!lookup.has(k),'Duplicate historical owner handle '+k);
 lookup.set(k,r.manager);
 assert.equal(sourceAliases[k],r.manager,'Alias conflicts with archived Start/Sit mapping '+r.handle);
 assert.ok(r.status==='current'||r.status==='historical');
}
assert.equal(faab.status,'research_only_no_skill_grades');
assert.equal(faab.mapped+faab.unmapped,faab.observations.length);
const expected={};
for(const row of faab.observations){
 const k=String(row.observedOwnerHandle??'').toLowerCase();
 if(lookup.has(k)&&row.identityStatus!=='unresolved_handle_or_roster_evidence'){
  assert.equal(row.manager,lookup.get(k),'Wrong historical Sleeper owner attribution '+k);
  expected[k]=(expected[k]??0)+1;
 }
 assert.ok(row.manager===null||row.identityStatus==='canonical_handle_verified');
}
assert.ok(!fs.readFileSync('scripts/attribute-faab-managers.mjs','utf8').includes('row.teamId)'),'Team number cannot imply manager identity');
console.log('Verified FAAB historical handle attribution',JSON.stringify(expected),
 'mapped',faab.mapped,'unresolved',faab.unmapped,'no skill ratings');
