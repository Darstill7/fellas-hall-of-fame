// Resolve observed Sleeper handles only against documented canonical identity evidence.
// Deliberately leave unknown handles unresolved; do not infer identities from team number.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const identity=read('data/manager_identity_map_v1.json');
const source=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
assert.equal(source.status,'research_only_not_causal_or_skill_grade');
const key=x=>String(x).trim().toLowerCase();
const owners=new Map();
const register=(handle,canonical)=>{
 const k=key(handle);
 if(!k)return;
 if(owners.has(k)&&owners.get(k)!==canonical)throw Error('Ambiguous Sleeper owner '+handle);
 owners.set(k,canonical);
};
for(const entry of identity.originalContinuingManagers??[])
 for(const h of entry.sleeperHandles??[])register(h,entry.displayAlias??entry.canonical);
for(const entry of identity.additionalVerifiedManagers??[])
 if(entry.sleeper)register(entry.sleeper,entry.canonical);
for(const [canonical,entry] of Object.entries(identity.managers??{}))
 if(entry.sourceEvidence?.sleeperOwnerHandle)register(entry.sourceEvidence.sleeperOwnerHandle,canonical==='Tom'?'Thommy':canonical);
const observations=source.observations.map(row=>{
 const manager=row.ownerIdentityStatus==='single_observed_roster_owner_handle'?owners.get(key(row.observedOwnerHandle)):undefined;
 return {year:row.year,transactionId:row.transactionId,teamId:row.teamId,playerId:row.playerId,
  observedOwnerHandle:row.observedOwnerHandle,manager:manager??null,
  identityStatus:manager?'canonical_handle_verified':'unresolved_handle_or_roster_evidence'};
});
const unresolved=[...new Set(observations.filter(x=>!x.manager&&x.observedOwnerHandle).map(x=>x.observedOwnerHandle))].sort();
const report={schema:'fellas-faab-identity-attribution-v1',status:'research_only_no_skill_grades',
 policy:'Only exact documented Sleeper owner handles are mapped. Other team IDs/handles remain unresolved. Never infer manager from a roster ID.',
 mapped:observations.filter(x=>x.manager).length,unmapped:observations.filter(x=>!x.manager).length,
 unresolvedHandles:unresolved,observations};
const target='data-integrity/faab-identity-attribution-v1.json';
if(process.argv.includes('--check')){
 assert.deepEqual(read(target),report,'FAAB attribution artifact stale');
}else fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
console.log('FAAB owner attribution: '+report.mapped+' mapped, '+report.unmapped+' unresolved; handles '+JSON.stringify(unresolved));
