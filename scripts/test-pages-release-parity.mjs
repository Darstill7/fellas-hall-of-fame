// Prove that matching bytes pass, deliberate mismatches fail, and a transient
// Pages/CDN mismatch can recover on a subsequent retry.
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import http from 'node:http';
import {verifyFiles,verifyWithRetries,checkedPaths} from './verify-pages-release-parity.mjs';

for(const required of [
 'data/unified_record_book_2016_2026.json','data/playoff_race_v1.json',
 'data/trade_museum_stage66.json','data/current_2026_records_v1.json',
 'data/alltime_game_records_live_v1.json','data/alltime_career_records_live_v1.json',
 'data/ledger_milestones_live_v1.json','analytics/records.html','analytics/trade-museum.html'
])assert(checkedPaths.includes(required),'Missing Pages publication parity coverage for '+required);

const root=await mkdtemp(join(tmpdir(),'pages-parity-'));
await mkdir(join(root,'assets'));
await writeFile(join(root,'assets','test.js'),'EXPECTED-BYTES\n');
let remote='EXPECTED-BYTES\n';
let requests=0;
const server=http.createServer((req,res)=>{
 requests++;
 res.setHeader('ETag','"example"');
 res.setHeader('Content-Type','text/javascript');
 res.end(remote);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/';
try{
 const opts={root,baseUrl:base,paths:['assets/test.js'],nonce:'fixture'};
 const ok=await verifyFiles(opts);
 assert(ok.ok,'Matching byte payload must pass');
 assert.equal(ok.details[0].expectedLength,15,'Expected byte-length contract');
 assert.equal(ok.details[0].expectedSha256,ok.details[0].publishedSha256);
 remote='WRONG-RELEASE\n';
 const mismatch=await verifyFiles(opts);
 assert.equal(mismatch.ok,false,'A deliberate hash mismatch must fail');
 assert(mismatch.errors[0].includes('expected')&&mismatch.errors[0].includes('published'));
 await assert.rejects(
  verifyWithRetries({...opts,attempts:2,intervalMs:0}),
  /still differ/,'Persistent mismatch must fail the required job');
 remote='EXPECTED-BYTES\n';
 const recovered=await verifyWithRetries({...opts,attempts:2,intervalMs:0});
 assert(recovered.ok,'After CDN catch-up, byte-exact files pass');
 assert(requests>=5,'Every attempt must actually retrieve remote bytes');
 console.log('PASS: exact match, intentional mismatch, persistent failure, and retry recovery');
}finally{
 await new Promise(resolve=>server.close(resolve));
 await rm(root,{recursive:true,force:true});
}
