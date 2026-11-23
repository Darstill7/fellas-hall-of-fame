// Integrated, zero-publication rehearsal: refreshed 2026 production + six new receipts.
// Imports into disposable workspace and checks exact per-start audit preservation.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const sourceDir=process.env.FELLAS_EVIDENCE_ROOT;
if(!sourceDir||!path.isAbsolute(sourceDir))throw Error('Exact-SHA evidence directory required');
const file=(root,p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const main='data/trade_museum_stage66.json',htmlFile='analytics/trade-museum.html';
const rawPath='data-integrity/sleeper-sync-candidates/2026-trades-through-week11.json';
const certPath='data-integrity/trade-certifications/2026-week11.json';
const existing=file(process.cwd(),main);
const verified=file(process.cwd(),'data-integrity/trade-point-recalculations/2026-through-week10.json');
const raw=file(sourceDir,rawPath),cert=file(sourceDir,certPath);
assert.equal(existing.length,51);
assert.equal(verified.scoring_through_week,10);
assert.equal(verified.audits.length,7);
assert.equal(raw.status,'REVIEW_REQUIRED');
assert.equal(cert.status,'REVIEW_REQUIRED');
assert.equal(raw.trades.length,13);
assert.equal(cert.trades.length,6);
assert.equal(new Set(cert.trades.map(x=>String(x.transaction_id))).size,6);
const ids=new Set(existing.map(x=>String(x.id)));
assert(cert.trades.every(t=>!ids.has(String(t.transaction_id))));
const existing2026=existing.filter(t=>t.year===2026);
assert.equal(existing2026.length,7);
assert(existing2026.every(t=>t.scoring_through_week===10));
const simulated=structuredClone(cert);
simulated.status='COMMISSIONER_APPROVED'; // ONLY the temporary test fixture
for(const t of simulated.trades){
 assert.equal(t.faab_reviewed,false,'Original commissioner review remains unsigned');
 if(t.faab_transfers?.length)t.faab_reviewed=true;
}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'fellas-combined-release-'));
try{
 const copy=(from,relative)=>{
  const output=path.join(tmp,relative);
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.copyFileSync(from,output);
 };
 for(const relative of ['scripts/import-reviewed-trade-museum.mjs',main,htmlFile])
  copy(path.join(process.cwd(),relative),relative);
 copy(path.join(sourceDir,rawPath),rawPath);
 const dest=path.join(tmp,certPath);
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(simulated,null,2)+'\n');
 const result=execFileSync(process.execPath,['scripts/import-reviewed-trade-museum.mjs',certPath],{
  cwd:tmp,encoding:'utf8',env:{...process.env,FELLAS_APPROVE_TRADE_MUSEUM:'YES'}
 });
 assert.match(result,/IMPORTED 6 verified trades/);
 const combined=file(tmp,main);
 assert.equal(combined.length,57);
 assert.equal(new Set(combined.map(t=>String(t.id))).size,57);
 const byId=new Map(combined.map(t=>[String(t.id),t]));
 for(const record of existing){
  assert.deepEqual(byId.get(String(record.id)),record,'Existing archived receipt changed during integration: '+record.id);
 }
 for(const rec of verified.audits){
  const trade=byId.get(String(rec.id));
  assert.equal(trade.scoring_through_week,10);
  for(const side of rec.sides){
   const actual=trade.sides.find(x=>x.manager===side.manager);
   assert(actual,'Missing audited side '+rec.id+'/'+side.manager);
   assert.equal(actual.raw_starter_points,side.current.points);
   assert.equal(actual.started_games,side.current.starts);
  }
 }
 const newTrades=cert.trades.map(t=>byId.get(String(t.transaction_id)));
 assert(newTrades.every(Boolean));
 for(const t of newTrades){
  assert.equal(t.year,2026);
  assert.equal(t.comparison_status,'ungraded_pending_starter_audit');
  assert(t.sides.length>=2&&t.sides.every(s=>s.source_status==='VERIFIED_SOURCE'&&s.raw_starter_points===null&&s.started_games===null));
 }
 const original=cert.trades.find(x=>String(x.transaction_id)==='1424524291990450196');
 const newTrade=byId.get(String(original.transaction_id));
 const received=original.sides.find(x=>x.manager==='Stew').assets.map(a=>a.name).join(' + ');
 assert.equal(newTrade.sides.find(s=>s.manager==='Stew').assets,received+' + 2 FAAB');
 const rendered=fs.readFileSync(path.join(tmp,htmlFile),'utf8');
 const match=rendered.match(/<script id="archive-data" type="application\/json">([\s\S]*?)<\/script>/);
 assert(match);
 assert.deepEqual(JSON.parse(match[1]),combined,'Rendered Museum archive must match combined source');
 assert.deepEqual(file(process.cwd(),main),existing,'Public review branch archive must remain unchanged');
 assert.equal(file(sourceDir,certPath).status,'REVIEW_REQUIRED','Commissioner certificate must remain unapproved');
 console.log('COMBINED RELEASE REHEARSAL PASS: 44 historical + 7 Week-10-scored + 6 ungraded = 57 intact, 2 FAAB verified, no source writes.');
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
  '## Combined Trade Museum rehearsal — no publication\n\n- Historical receipts unchanged: 44\n- Existing 2026 trades retaining audited Week 10 production: 7\n- Recovered ungraded trade previews: 6\n- Synthetic combined museum: **57 receipts**\n- Source certificate: **REVIEW_REQUIRED**, not changed\n- Live website and main branch: **not changed**\n');
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
