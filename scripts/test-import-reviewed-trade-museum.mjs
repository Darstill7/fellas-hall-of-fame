// Offline approval-gate test: no live provider call or production mutations.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const dir='data-integrity/sleeper-sync-candidates',certDir='data-integrity/trade-certifications';
const rawPath=dir+'/2026-trades-through-week14.json',certPath=certDir+'/2026-week14.json';
fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(certDir,{recursive:true});
if(fs.existsSync(rawPath)||fs.existsSync(certPath))throw Error('Refuse to replace existing commissioner artifacts');
const id='999999999999999993';
const raw={
 schema:'fellas-sleeper-raw-trade-review-v1',status:'REVIEW_REQUIRED',year:2026,
 league:'1340027406009761792',through_week:14,
 trades:[{week:14,transaction_id:id,roster_ids:[1,2],adds:{'123':1,'456':2},drops:{'123':2,'456':1},draft_picks:[],waiver_budget:[]}]
};
const cert={
 schema:'fellas-trade-museum-certification-v1',status:'COMMISSIONER_APPROVED',
 year:2026,through_week:14,raw_candidate:rawPath,
 trades:[{transaction_id:id,week:14,date:'2026-11-25',
  sides:[{roster_id:1,manager:'Stilly',assets:['Test Player A']},{roster_id:2,manager:'JMid',assets:['Test Player B']}]}]
};
const museum='data/trade_museum_stage66.json',html='analytics/trade-museum.html';
const beforeMuseum=fs.readFileSync(museum,'utf8'),beforeHTML=fs.readFileSync(html,'utf8');
const run=({approve=true}={})=>execFileSync(process.execPath,['scripts/import-reviewed-trade-museum.mjs',certPath,'--dry-run'],{
 encoding:'utf8',env:{...process.env,FELLAS_APPROVE_TRADE_MUSEUM:approve?'YES':'NO'},stdio:'pipe'
});
try{
 fs.writeFileSync(rawPath,JSON.stringify(raw));fs.writeFileSync(certPath,JSON.stringify(cert));
 assert.throws(()=>run({approve:false}),/Command failed/);
 assert.match(run(),/DRY RUN: 1 verified new receipts/);
 assert.equal(fs.readFileSync(museum,'utf8'),beforeMuseum);
 assert.equal(fs.readFileSync(html,'utf8'),beforeHTML);
 cert.trades[0].sides[1].manager='Tony';
 fs.writeFileSync(certPath,JSON.stringify(cert));
 assert.throws(()=>run(),/Command failed/);
 cert.trades[0].sides[1].manager='JMid';raw.trades[0].draft_picks=[{round:2}];
 fs.writeFileSync(certPath,JSON.stringify(cert));fs.writeFileSync(rawPath,JSON.stringify(raw));
 assert.throws(()=>run(),/Command failed/);
 console.log('PASS Trade Museum importer: approval required, dry-run no-write, owner identity and prohibited pick guard');
}finally{
 fs.rmSync(rawPath,{force:true});fs.rmSync(certPath,{force:true});
}
