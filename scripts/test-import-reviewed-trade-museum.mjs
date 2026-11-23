// Offline certification gate: all receipt directions and failure modes; no live APIs or site writes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const dir='data-integrity/sleeper-sync-candidates',certDir='data-integrity/trade-certifications';
const rawPath=dir+'/2026-trades-through-week14.json',certPath=certDir+'/2026-week14.json';
fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(certDir,{recursive:true});
if(fs.existsSync(rawPath)||fs.existsSync(certPath))throw Error('Refuse to overwrite commissioner artifacts');
const id='999999999999999993';
const raw={
 schema:'fellas-sleeper-raw-trade-review-v1',status:'REVIEW_REQUIRED',year:2026,
 league:'1340027406009761792',through_week:14,
 trades:[{week:14,transaction_id:id,roster_ids:[1,2],
  adds:{'123':1,'456':2},drops:{'123':2,'456':1},draft_picks:[],waiver_budget:[]}]
};
const cert={
 schema:'fellas-trade-museum-certification-v1',status:'COMMISSIONER_APPROVED',year:2026,through_week:14,raw_candidate:rawPath,
 trades:[{transaction_id:id,week:14,date:'2026-11-25',
  sides:[{roster_id:1,manager:'Stilly',assets:[{player_id:'123',name:'Test Player A'}]},
         {roster_id:2,manager:'JMid',assets:[{player_id:'456',name:'Test Player B'}]}]}]
};
const museum='data/trade_museum_stage66.json',html='analytics/trade-museum.html';
const beforeMuseum=fs.readFileSync(museum,'utf8'),beforeHTML=fs.readFileSync(html,'utf8');
const run=({approve=true}={})=>execFileSync(process.execPath,['scripts/import-reviewed-trade-museum.mjs',certPath,'--dry-run'],{
 encoding:'utf8',env:{...process.env,FELLAS_APPROVE_TRADE_MUSEUM:approve?'YES':'NO'},stdio:'pipe'
});
const attempt=(change,approved=false)=>{
 const r=structuredClone(raw),c=structuredClone(cert);
 change(r.trades[0],c.trades[0]);
 fs.writeFileSync(rawPath,JSON.stringify(r));fs.writeFileSync(certPath,JSON.stringify(c));
 if(approved)assert.match(run(),/DRY RUN: 1 verified new receipts/);
 else assert.throws(()=>run(),/Command failed/);
 assert.equal(fs.readFileSync(museum,'utf8'),beforeMuseum,'Dry run must not mutate audited JSON');
 assert.equal(fs.readFileSync(html,'utf8'),beforeHTML,'Dry run must not mutate museum HTML');
};
try{
 attempt(()=>{},true);
 assert.throws(()=>run({approve:false}),/Command failed/,'Unapproved import must be denied');
 attempt((r,c)=>{c.sides[1].manager='Tony'});
 attempt((r,c)=>{c.sides[0].assets[0].player_id='456'},false);
 attempt((r,c)=>{c.sides[0].assets[0].player_id='999'},false);
 attempt((r,c)=>{c.sides[0].assets[0]={name:'Legacy name-only asset'}},false);
 attempt((r,c)=>{c.sides[1].assets[0].player_id='123'},false);
 attempt((r,c)=>{c.sides[1].assets=[]},false);
 attempt((r,c)=>{r.adds['789']=1;r.drops['789']=2},false);
 attempt((r,c)=>{delete r.drops['456']},false);
 attempt((r,c)=>{r.drops['123']=1},false);
 attempt((r,c)=>{r.adds['123']=3},false);
 attempt((r,c)=>{c.sides[0].assets[0].name='<script>'},false);
 attempt((r,c)=>{r.draft_picks=[{round:2}]},false);
 attempt((r,c)=>{r.waiver_budget=[{sender:1,receiver:2,amount:15}]},false);
 attempt((r,c)=>{r.waiver_budget=[{sender:1,receiver:2,amount:15}];c.faab_reviewed=true},false);
 attempt((r,c)=>{r.waiver_budget=[{sender:1,receiver:2,amount:15}];c.faab_reviewed=true;c.faab_transfers=[{sender:2,receiver:1,amount:15}]},false);
 attempt((r,c)=>{r.waiver_budget=[{sender:1,receiver:2,amount:15}];c.faab_reviewed=true;c.faab_transfers=[{sender:1,receiver:2,amount:14}]},false);
 attempt((r,c)=>{c.faab_reviewed=true;c.faab_transfers=[{sender:1,receiver:2,amount:15}]},false);
 attempt((r,c)=>{r.waiver_budget=[{sender:1,receiver:2,amount:15}];c.faab_reviewed=true;c.faab_transfers=[{sender:1,receiver:2,amount:15}]},true);
 // A three-manager cycle requires a distinct, traceable incoming ID per side.
 const tri=structuredClone(raw),triCert=structuredClone(cert);
 tri.trades[0].roster_ids=[1,2,3];
 tri.trades[0].adds={'123':1,'456':2,'789':3};
 tri.trades[0].drops={'123':3,'456':1,'789':2};
 triCert.trades[0].sides=[
  {roster_id:1,manager:'Stilly',assets:[{player_id:'123',name:'Test Player A'}]},
  {roster_id:2,manager:'JMid',assets:[{player_id:'456',name:'Test Player B'}]},
  {roster_id:3,manager:'Thommy',assets:[{player_id:'789',name:'Test Player C'}]}
 ];
 fs.writeFileSync(rawPath,JSON.stringify(tri));fs.writeFileSync(certPath,JSON.stringify(triCert));
 assert.match(run(),/DRY RUN: 1 verified new receipts/,'Complete three-team receipts should pass');
 triCert.trades[0].sides[2].assets[0].player_id='999';
 fs.writeFileSync(certPath,JSON.stringify(triCert));
 assert.throws(()=>run(),/Command failed/,'Unmapped third-side asset must fail');
 assert.equal(fs.readFileSync(museum,'utf8'),beforeMuseum);
 assert.equal(fs.readFileSync(html,'utf8'),beforeHTML);
 // The 2026 recovery case: Mitch transfers 2 FAAB to Stew.
 attempt((r,c)=>{r.waiver_budget=[{sender:6,receiver:4,amount:2}];r.roster_ids=[4,6];r.adds={'123':4,'456':6};r.drops={'123':6,'456':4};c.sides=[{roster_id:4,manager:'Stew',assets:[{player_id:'123',name:'Adonai Mitchell'}]},{roster_id:6,manager:'Mitch',assets:[{player_id:'456',name:'Minnesota Vikings DEF'}]}];c.faab_reviewed=true;c.faab_transfers=[{sender:6,receiver:4,amount:2}]},true);
 // Test actual importer output in a disposable workspace; never mutate tracked source.
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'fellas-trade-faab-'));
 try{
  const copy=(relative)=>{
   const dst=path.join(tmp,relative);fs.mkdirSync(path.dirname(dst),{recursive:true});
   fs.copyFileSync(relative,dst);
  };
  for(const relative of ['scripts/import-reviewed-trade-museum.mjs',museum,html])copy(relative);
  const dstRaw=path.join(tmp,rawPath),dstCert=path.join(tmp,certPath);
  fs.mkdirSync(path.dirname(dstRaw),{recursive:true});fs.mkdirSync(path.dirname(dstCert),{recursive:true});
  const source=structuredClone(raw),certificate=structuredClone(cert);
  source.trades[0].roster_ids=[4,6];
  source.trades[0].adds={'123':4,'MIN':6};source.trades[0].drops={'123':6,'MIN':4};
  source.trades[0].waiver_budget=[{sender:6,receiver:4,amount:2}];
  certificate.trades[0].sides=[
   {roster_id:4,manager:'Stew',assets:[{player_id:'123',name:'Adonai Mitchell'}]},
   {roster_id:6,manager:'Mitch',assets:[{player_id:'MIN',name:'Minnesota Vikings DEF'}]}
  ];
  certificate.trades[0].faab_reviewed=true;
  certificate.trades[0].faab_transfers=[{sender:6,receiver:4,amount:2}];
  fs.writeFileSync(dstRaw,JSON.stringify(source));fs.writeFileSync(dstCert,JSON.stringify(certificate));
  execFileSync(process.execPath,['scripts/import-reviewed-trade-museum.mjs',certPath],{
   cwd:tmp,encoding:'utf8',env:{...process.env,FELLAS_APPROVE_TRADE_MUSEUM:'YES'}
  });
  const next=JSON.parse(fs.readFileSync(path.join(tmp,museum),'utf8'));
  const trade=next.find(row=>row.id===id);
  assert.ok(trade,'Test trade must enter disposable museum');
  assert.equal(trade.sides.find(side=>side.manager==='Stew').assets,'Adonai Mitchell + 2 FAAB');
  assert.equal(trade.sides.find(side=>side.manager==='Mitch').assets,'Minnesota Vikings DEF');
  assert.equal(trade.comparison_status,'ungraded_pending_starter_audit');
  assert.equal(trade.sides.find(side=>side.manager==='Stew').raw_starter_points,null);
  assert.equal(fs.readFileSync(museum,'utf8'),beforeMuseum,'Live museum source unchanged');
  assert.equal(fs.readFileSync(html,'utf8'),beforeHTML,'Live museum markup unchanged');
 }finally{fs.rmSync(tmp,{recursive:true,force:true})}
 console.log('PASS Trade Museum certification: approval, exact player recipients/donors, no missing/duplicate/legacy IDs, FAAB/pick guards, three-way, dry-run no-write');
}finally{
 fs.rmSync(rawPath,{force:true});fs.rmSync(certPath,{force:true});
}
