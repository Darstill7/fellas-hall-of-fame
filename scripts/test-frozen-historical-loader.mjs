// Offline rejection tests; positive archive verification is a separate explicit gate.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {loadFrozenHistory} from './lib/load-frozen-historical-acquisitions.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fellas-frozen-test-'));
let checks=0;
const reject=fn=>{assert.throws(fn);checks++};
try{
 reject(()=>loadFrozenHistory(dir));
 const names=['historical-acquisition-final-review.json','historical-acquisition-certification-candidate.json','final-historical-source-completeness-audit.json'];
 const proposal=JSON.parse(fs.readFileSync('data-integrity/historical-acquisition-freeze-proposal.json','utf8'));
 const manifest={schema:'fellas-frozen-acquisitions-v1',status:'ARCHIVED_APPROVED_BASELINE',content_sha256:proposal.historical_content_sha256,files:names.map(name=>({name,sha256:'0'.repeat(64)}))};
 const write=m=>fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(m));
 write({...manifest,status:'REVIEW_ONLY'});reject(()=>loadFrozenHistory(dir));
 write({...manifest,content_sha256:'f'.repeat(64)});reject(()=>loadFrozenHistory(dir));
 write({...manifest,files:manifest.files.slice(1)});reject(()=>loadFrozenHistory(dir));
 write({...manifest,files:[manifest.files[0],manifest.files[0],manifest.files[2]]});reject(()=>loadFrozenHistory(dir));
 write(manifest);reject(()=>loadFrozenHistory(dir));
 fs.writeFileSync(path.join(dir,names[0]),'{}');reject(()=>loadFrozenHistory(dir));
 const actual='data-integrity/frozen-acquisitions-2020-2025';
 if(fs.existsSync(actual)){
  const result=loadFrozenHistory(actual);assert.equal(result.verified.receipts,7374);checks++;
  fs.cpSync(actual,dir,{recursive:true,force:true});
  assert.equal(loadFrozenHistory(dir).verified.sha256,result.verified.sha256);checks++;
  const receipt=path.join(dir,names[0]);const original=fs.readFileSync(receipt);
  fs.appendFileSync(receipt,' ');reject(()=>loadFrozenHistory(dir));fs.writeFileSync(receipt,original);
  const altered=JSON.parse(original);altered.receipts[0].pf_cents++;
  fs.writeFileSync(receipt,JSON.stringify(altered));reject(()=>loadFrozenHistory(dir));
  fs.writeFileSync(receipt,original);fs.unlinkSync(path.join(dir,names[1]));reject(()=>loadFrozenHistory(dir));
  console.log('FROZEN HISTORY POSITIVE AND MUTATION PASS '+JSON.stringify({checks}));
 }else console.log('FROZEN HISTORY NEGATIVE TESTS PASS '+JSON.stringify({checks,positiveArchiveTest:'PENDING_ARCHIVAL'}));
}finally{fs.rmSync(dir,{recursive:true,force:true})}
