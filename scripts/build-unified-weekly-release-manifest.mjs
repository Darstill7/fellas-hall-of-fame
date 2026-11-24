// Coordinated 17-dataset candidate gate. Never publish or modify canonical data here.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root='data-integrity/historical-trade-draft-audits/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const core=root+'website-migration-candidate',front=root+'front-office-site-candidate';
const cm=read(core+'/manifest.json'),fm=read(front+'/manifest.json'),race=read(root+'playoff-race-preview.json');
const evidence=read(root+'2026-evidence-supported-acquisition-preview.json'),career=read(root+'combined-career-acquisition-preview.json');
const cutoff=cm.completedThrough;
for(const x of [fm,race,evidence,career])assert.deepEqual(x.completedThrough,cutoff,'Mixed weekly release');
assert.equal(cm.files.length,9);assert.equal(fm.files.length,7);
assert.equal(evidence.coverage.strict+evidence.coverage.schedule_supported+evidence.coverage.unresolved,evidence.coverage.observed);
const files=[],names=new Set();
function add(source,target,expected){
 assert(!names.has(target));names.add(target);
 const raw=fs.readFileSync(source),hash=sha(raw);
 if(expected)assert.equal(hash,expected,'Source file changed: '+source);
 files.push({source,target,sha256:hash,bytes:raw.length});
}
for(const f of cm.files){assert.match(f.path,/^data\/[a-zA-Z0-9_.-]+\.json$/);add(core+'/'+f.path,f.path,f.sha256);assert.equal(sha(fs.readFileSync(f.path)),f.previous_sha256,'Canonical file changed since staging');}
const expected=['overview.json','trading.json','draft.json','acquisitions.json','players.json','managers.json','keepers.json'];
assert.deepEqual(fm.files.map(f=>f.name).sort(),expected.sort());
for(const f of fm.files){const source=front+'/'+f.name;assert.deepEqual(read(source).completedThrough,cutoff);add(source,'data/front-office/'+f.name,f.sha256);}
add(root+'playoff-race-preview.json','data/playoff_race_v1.json');
assert.equal(files.length,17);
const blockers=['Production browser and consumer verification required','Independent future fixture verification required','Historical certification and release approval required','Timing-supported Front Office consumer migration required','Atomic production publishing not enabled'];
const output={status:'RESEARCH_ONLY_NOT_DEPLOYABLE',completedThrough:cutoff,files,coverage:evidence.coverage,approvedHistoricalPackage:career.historical_source.package_sha256??null,blockers};
fs.writeFileSync(root+'unified-weekly-release-manifest.json',JSON.stringify(output,null,2)+'\n');
console.log('UNIFIED WEEKLY RELEASE CANDIDATE PASS '+JSON.stringify({datasets:files.length,completedThrough:cutoff,blockers:blockers.length,canonical_writes:0}));
