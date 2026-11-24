// Archive only the exact independently reviewed package; never regenerate history here.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyFinalHistory} from './verify-final-historical-acquisitions.mjs';
const proposal=JSON.parse(fs.readFileSync('data-integrity/historical-acquisition-freeze-proposal.json','utf8'));
const approved=process.env.APPROVED_FINGERPRINT;
assert.equal(approved,proposal.historical_content_sha256,'Explicit approval must match pinned fingerprint');
assert.equal(proposal.status,'PENDING_ARCHIVAL_AND_APPROVAL');
const source=process.argv[2];assert(source,'Extracted original artifact directory required');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):e.isFile()?[path.join(d,e.name)]:[]);
const files=walk(source);
const names=['historical-acquisition-final-review.json','historical-acquisition-certification-candidate.json','final-historical-source-completeness-audit.json'];
const selected=Object.fromEntries(names.map(name=>{const matches=files.filter(p=>path.basename(p)===name);assert.equal(matches.length,1,'Expected exactly one '+name);return [name,fs.readFileSync(matches[0])]}));
const [final,candidate,audit]=names.map(n=>JSON.parse(selected[n]));
const verified=verifyFinalHistory(final,candidate,approved);
assert.equal(verified.acquisitions,proposal.expected.acquisitions);
assert.equal(verified.receipts,proposal.expected.receipts);
assert.equal(verified.pf_cents,proposal.expected.pf_cents);
assert.equal(verified.checks,proposal.expected.independent_checks);
assert.equal(audit.status,'SOURCE_COMPLETENESS_PASS');
assert.equal(audit.historical_package_sha256,approved);
assert.deepEqual(audit.findings,[]);
assert.deepEqual(audit.coverage,{provider_starts:verified.receipts,package_starts:verified.receipts,matched_acquisitions:verified.acquisitions,package_acquisitions:verified.acquisitions});
assert.deepEqual(audit.years.map(y=>y.year),[2020,2021,2022,2023,2024,2025]);
assert.equal(audit.years.reduce((n,y)=>n+y.pf_cents,0),verified.pf_cents);
assert.equal(audit.years.reduce((n,y)=>n+y.starts,0),verified.receipts);
assert.equal(audit.years.reduce((n,y)=>n+y.completed_additions,0)+900,verified.acquisitions);
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest={schema:'fellas-frozen-acquisitions-v1',status:'ARCHIVED_APPROVED_BASELINE',source_run_id:proposal.source_run_id,source_artifact_id:proposal.source_artifact_id,source_head_sha:proposal.source_head_sha,content_sha256:approved,scope:proposal.scope,verified,keeper_evidence:proposal.keeper_evidence,limitations:proposal.limitations.filter(x=>!x.includes('proposal is not')),files:names.map(name=>({name,sha256:hash(selected[name])}))};
const target='data-integrity/frozen-acquisitions-2020-2025';
const bytes={...selected,'manifest.json':Buffer.from(JSON.stringify(manifest,null,2)+'\n')};
if(fs.existsSync(target)){
 assert.deepEqual(fs.readdirSync(target).sort(),Object.keys(bytes).sort(),'Existing archive has unexpected files');
 for(const [name,b] of Object.entries(bytes))assert.equal(hash(fs.readFileSync(path.join(target,name))),hash(b),'Refusing to overwrite existing historical baseline: '+name);
}else{
 const temp=fs.mkdtempSync('data-integrity/frozen-acquisitions-temp-');
 try{for(const [name,b] of Object.entries(bytes))fs.writeFileSync(path.join(temp,name),b,{flag:'wx'});fs.renameSync(temp,target);}
 finally{if(fs.existsSync(temp))fs.rmSync(temp,{recursive:true,force:true});}
}
console.log('EXACT HISTORICAL ARCHIVE VERIFIED '+JSON.stringify(verified));
