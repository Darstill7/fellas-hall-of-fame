// Run only in a disposable CI checkout. Overlay the verified candidate, then
// run existing source contracts and mobile journeys; never commit the overlay.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root='data-integrity/historical-trade-draft-audits/website-migration-candidate';
const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
assert.equal(manifest.status,'RESEARCH_ONLY_NOT_DEPLOYABLE');
assert.equal(manifest.files.length,9);
const hash=b=>createHash('sha256').update(b).digest('hex');
const originals=new Map(),report=[];
const htmlFiles=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?htmlFiles(path.join(d,e.name)):e.name.endsWith('.html')?[path.join(d,e.name)]:[]);
const playoff='data/playoff_race_v1.json';
const playoffPreview=path.join(path.dirname(root),'playoff-race-preview.json');
try{
 for(const entry of manifest.files){
  assert(/^data\/[a-zA-Z0-9_]+\.json$/.test(entry.path));
  const original=fs.readFileSync(entry.path),candidate=fs.readFileSync(path.join(root,entry.path));
  assert.equal(hash(original),entry.previous_sha256);assert.equal(hash(candidate),entry.sha256);
  originals.set(entry.path,original);
 }
 // Back up every file that the static synchronizer may touch before the disposable overlay.
 for(const p of ['index.html',...htmlFiles('managers'),...htmlFiles('seasons'),...htmlFiles('analytics'),playoff])originals.set(p,fs.readFileSync(p));
 const race=JSON.parse(fs.readFileSync(playoffPreview,'utf8'));
 assert.equal(race.verified_through_week,manifest.completedThrough.week,'Staged playoff cutoff mismatch');
 for(const entry of manifest.files)fs.copyFileSync(path.join(root,entry.path),entry.path);
 fs.copyFileSync(playoffPreview,playoff);
 const sync=spawnSync(process.execPath,['scripts/sync-verified-career-static-fallbacks.mjs'],{encoding:'utf8'});
 assert.equal(sync.status,0,sync.stderr||sync.stdout||'Static synchronization failed');
 console.log(sync.stdout);
 for(const script of ['verify-core-consumers.mjs','verify-current-week-website.mjs','verify-manager-profile-v2.mjs','audit-mobile-journey.mjs']){
  const r=spawnSync(process.execPath,['scripts/'+script],{encoding:'utf8',maxBuffer:20*1024*1024});
  report.push({script,passed:r.status===0,exit:r.status,stdout:r.stdout||'',stderr:r.stderr||'',error:r.error?.message});
  console.log('CANDIDATE CONSUMER '+script+' '+(r.status===0?'PASS':'FAIL'));
  if(r.status!==0)console.log((r.stderr||r.stdout||'').slice(-5000));
 }
}finally{
 for(const [p,b] of originals){fs.writeFileSync(p,b);assert.equal(hash(fs.readFileSync(p)),hash(b));}
 fs.writeFileSync(root+'/consumer-integration-report.json',JSON.stringify({completedThrough:manifest.completedThrough,restored:originals.size,results:report},null,2)+'\n');
}
assert.equal(report.length,4);
assert(report.every(r=>r.passed),'Candidate consumer integration requires remediation; see report');
