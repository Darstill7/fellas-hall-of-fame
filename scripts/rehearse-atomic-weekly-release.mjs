// Rehearse atomic release bundles on disk. No canonical writes or deployment.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export function stageRelease(manifest,{workspace,store}){
 assert.equal(manifest.status,'RESEARCH_ONLY_NOT_DEPLOYABLE');
 assert.equal(manifest.files.length,17);
 const {year,week}=manifest.completedThrough;
 assert(Number.isInteger(year)&&Number.isInteger(week)&&week>=1&&week<=18);
 const targets=new Set();
 const validated=manifest.files.map(f=>{
  assert.match(f.target,/^data\/(?:front-office\/)?[a-zA-Z0-9_.-]+\.json$/);
  assert(!targets.has(f.target));targets.add(f.target);
  const source=path.resolve(workspace,f.source);
  assert(source.startsWith(path.resolve(workspace)+path.sep));
  assert(fs.realpathSync(source).startsWith(fs.realpathSync(workspace)+path.sep));
  const bytes=fs.readFileSync(source);
  assert.equal(sha(bytes),f.sha256,'Input checksum mismatch: '+f.target);
  assert.equal(bytes.length,f.bytes);
  const parsed=JSON.parse(bytes);
  if(parsed.completedThrough)assert.deepEqual(parsed.completedThrough,manifest.completedThrough);
  return {...f,bytes};
 });
 const releaseId=year+'-w'+String(week).padStart(2,'0')+'-'+sha(JSON.stringify(manifest)).slice(0,16);
 fs.mkdirSync(store,{recursive:true});
 const destination=path.join(store,releaseId);
 const temp=fs.mkdtempSync(path.join(store,'.stage-'));
 try{
  for(const f of validated){const p=path.join(temp,f.target);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,f.bytes,{flag:'wx'});}
  fs.writeFileSync(path.join(temp,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
  verifyRelease(temp);
  if(fs.existsSync(destination)){verifyRelease(destination);assert.deepEqual(read(path.join(destination,'manifest.json')),manifest);}
  else fs.renameSync(temp,destination);
  return releaseId;
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
export function verifyRelease(dir){
 const m=read(path.join(dir,'manifest.json'));assert.equal(m.files.length,17);
 const seen=new Set();
 for(const f of m.files){assert.match(f.target,/^data\/(?:front-office\/)?[a-zA-Z0-9_.-]+\.json$/);assert(!seen.has(f.target));seen.add(f.target);const p=path.join(dir,f.target);assert(fs.realpathSync(p).startsWith(fs.realpathSync(dir)+path.sep));const b=fs.readFileSync(p);assert.equal(sha(b),f.sha256);assert.equal(b.length,f.bytes);}
 return m;
}
export function selectRelease(store,id,{rollback=false}={}){
 assert.match(id,/^\d{4}-w\d{2}-[a-f0-9]{16}$/);
 const next=verifyRelease(path.join(store,id));
 const pointer=path.join(store,'CURRENT.json');
 const previous=fs.existsSync(pointer)?read(pointer):null;
 if(previous&&!rollback){const a=previous.completedThrough,b=next.completedThrough;assert(b.year>a.year||(b.year===a.year&&b.week>=a.week),'Stale release refused');}
 const temp=path.join(fs.mkdtempSync(path.join(store,'.pointer-')),'CURRENT.json');
 try{fs.writeFileSync(temp,JSON.stringify({id,completedThrough:next.completedThrough,previous:previous?.id??null,mode:'REHEARSAL_ONLY'},null,2)+'\n');fs.renameSync(temp,pointer);}
 finally{fs.rmSync(path.dirname(temp),{recursive:true,force:true});}
 return read(pointer);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root='data-integrity/historical-trade-draft-audits/';
 const m=read(root+'unified-weekly-release-manifest.json');
 const store=path.resolve(root+'atomic-release-rehearsal');
 const id=stageRelease(m,{workspace:process.cwd(),store});
 const current=selectRelease(store,id);
 console.log('ATOMIC RELEASE REHEARSAL PASS '+JSON.stringify({id,completedThrough:current.completedThrough,files:17,canonical_writes:0,production:false}));
}
