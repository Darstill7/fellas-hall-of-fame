// Offline certification gate: all receipt directions and failure modes; no live APIs or site writes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
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
 attempt((r,c)=>{r.waiver_budget=[{sender:1,receiver:2,amount:15}];c.faab_reviewed=true},true);
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
 console.log('PASS Trade Museum certification: approval, exact player recipients/donors, no missing/duplicate/legacy IDs, FAAB/pick guards, three-way, dry-run no-write');
}finally{
 fs.rmSync(rawPath,{force:true});fs.rmSync(certPath,{force:true});
}
