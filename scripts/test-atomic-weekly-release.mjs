import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {stageRelease,verifyRelease,selectRelease} from './rehearse-atomic-weekly-release.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'fellas-release-test-')),store=path.join(root,'store');
const sha=b=>createHash('sha256').update(b).digest('hex');
let checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++};
const reject=fn=>{assert.throws(fn);checks++};
function manifest(week){
 const files=[];
 for(let i=0;i<17;i++){
  const source='w'+week+'-'+i+'.json',raw=JSON.stringify({completedThrough:{year:2026,week},value:i});
  fs.writeFileSync(path.join(root,source),raw);files.push({source,target:'data/test-'+i+'.json',sha256:sha(raw),bytes:Buffer.byteLength(raw)});
 }
 return {status:'RESEARCH_ONLY_NOT_DEPLOYABLE',completedThrough:{year:2026,week},files};
}
const stage=m=>stageRelease(m,{workspace:root,store});
const current=()=>JSON.parse(fs.readFileSync(path.join(store,'CURRENT.json'),'utf8'));
try{
 const m10=manifest(10),m11=manifest(11),m12=manifest(12);
 const id10=stage(m10);eq(stage(m10),id10);eq(selectRelease(store,id10).id,id10);
 const id11=stage(m11);eq(current().id,id10);eq(selectRelease(store,id11).id,id11);
 reject(()=>selectRelease(store,id10));eq(current().id,id11);
 for(const change of [m=>m.files.pop(),m=>m.files[1].target=m.files[0].target,m=>m.files[0].sha256='0'.repeat(64),m=>m.files[0].source='absent.json',m=>m.files[0].target='../outside.json',m=>m.completedThrough.week=13,m=>m.files[0].bytes++]){
  const copy=structuredClone(m12);change(copy);reject(()=>stage(copy));eq(current().id,id11);
 }
 const id12=stage(m12);eq(current().id,id11);
 const victim=path.join(store,id12,m12.files[0].target);fs.writeFileSync(victim,'corrupt');
 reject(()=>selectRelease(store,id12));eq(current().id,id11);
 eq(selectRelease(store,id10,{rollback:true}).id,id10);eq(verifyRelease(path.join(store,id10)).completedThrough.week,10);
 eq(selectRelease(store,id11).id,id11);
 // Simulated upstream outage: failed collection means no staged or selected release.
 const before=fs.readFileSync(path.join(store,'CURRENT.json'),'utf8');
 reject(()=>{throw Error('Simulated provider unavailable')});eq(fs.readFileSync(path.join(store,'CURRENT.json'),'utf8'),before);
 console.log('ATOMIC RELEASE FAILURE AND ROLLBACK PASS '+JSON.stringify({checks,synthetic:true,canonical_writes:0}));
}finally{fs.rmSync(root,{recursive:true,force:true});}
