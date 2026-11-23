// Six-trade synthetic publication rehearsal. NEVER publishes or certifies.
// Run only with an exact, separately reviewed evidence commit checked out into
// a temporary workspace. The actual cert remains REVIEW_REQUIRED.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const paths=[
 'data-integrity/sleeper-sync-candidates/2026-trades-through-week11.json',
 'data-integrity/trade-certifications/2026-week11.json'
];
const root=process.cwd(),evidenceRoot=process.env.FELLAS_EVIDENCE_ROOT;
if(!evidenceRoot||!path.isAbsolute(evidenceRoot))throw Error('Absolute verified evidence checkout required');
const get=(base,file)=>JSON.parse(fs.readFileSync(path.join(base,file),'utf8'));
const source=get(evidenceRoot,paths[0]),certificate=get(evidenceRoot,paths[1]);
assert.equal(source.schema,'fellas-sleeper-raw-trade-review-v1');
assert.equal(source.status,'REVIEW_REQUIRED');
assert.equal(source.through_week,11);
assert.equal(source.league,'1340027406009761792');
assert.equal(source.trades.length,13,'Exact raw source trade count changed; independent review required');
assert.equal(certificate.schema,'fellas-trade-museum-certification-v1');
assert.equal(certificate.status,'REVIEW_REQUIRED','Source certificate cannot be pre-approved');
assert.equal(certificate.through_week,11);
assert.equal(certificate.trades.length,6);
assert.equal(certificate.raw_candidate,paths[0]);
const originalMuseumBytes=fs.readFileSync(path.join(root,'data/trade_museum_stage66.json'),'utf8');
const old=JSON.parse(originalMuseumBytes);
assert.equal(old.length,51,'Current audited museum baseline changed; independently review before rehearsing');
const oldById=new Map(old.map(t=>[String(t.id),t]));
const expectedIds=[
 '1424524291990450196','1427488044335788032',
 '1428829144581406720','1428878310045151232',
 '1428887570439245824','1428927046507069440'
];
assert.deepEqual(certificate.trades.map(t=>String(t.transaction_id)).sort(),[...expectedIds].sort());
for(const t of certificate.trades){
 assert(!oldById.has(String(t.transaction_id)),'A new candidate already exists in the archived museum');
 assert.equal(t.faab_reviewed,false,'Real certificate must remain unapproved');
}
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'fellas-six-trade-preview-'));
try{
 const copy=(from,to)=>{
  const dst=path.join(temp,to);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(from,dst);
 };
 for(const p of ['scripts/import-reviewed-trade-museum.mjs','data/trade_museum_stage66.json','analytics/trade-museum.html'])
  copy(path.join(root,p),p);
 copy(path.join(evidenceRoot,paths[0]),paths[0]);
 const simulated=structuredClone(certificate);
 simulated.status='COMMISSIONER_APPROVED'; // temporary test fixture only, NOT a source change
 for(const trade of simulated.trades)if((trade.faab_transfers||[]).length)trade.faab_reviewed=true;
 const certLocation=path.join(temp,paths[1]);
 fs.mkdirSync(path.dirname(certLocation),{recursive:true});
 fs.writeFileSync(certLocation,JSON.stringify(simulated,null,2)+'\n');
 const imported=execFileSync(process.execPath,['scripts/import-reviewed-trade-museum.mjs',paths[1]],{
  cwd:temp,env:{...process.env,FELLAS_APPROVE_TRADE_MUSEUM:'YES'},encoding:'utf8'});
 assert.match(imported,/IMPORTED 6 verified trades/);
 const next=get(temp,'data/trade_museum_stage66.json');
 assert.equal(next.length,57,'New museum must contain original 51 plus six, without additions');
 const byId=new Map(next.map(t=>[String(t.id),t]));
 assert.equal(byId.size,next.length,'Repeated transaction IDs cannot publish');
 for(const [id,original] of oldById)assert.deepEqual(byId.get(id),original,'Historical receipt changed: '+id);
 for(const id of expectedIds){
  const t=byId.get(id);
  assert(t,'Recovered receipt not imported: '+id);
  assert.equal(t.year,2026);
  assert.equal(t.comparison_status,'ungraded_pending_starter_audit');
  assert.equal(t.sides.length,2);
  assert(t.sides.every(s=>s.source_status==='VERIFIED_SOURCE'&&s.raw_starter_points===null&&s.started_games===null));
 }
 const faab=byId.get('1424524291990450196');
 assert.equal(faab.sides.find(s=>s.manager==='Stew').assets,'Adonai Mitchell + 2 FAAB');
 assert.equal(faab.sides.find(s=>s.manager==='Mitch').assets,'Minnesota Vikings DEF');
 const html=fs.readFileSync(path.join(temp,'analytics/trade-museum.html'),'utf8');
 const match=html.match(/<script id="archive-data" type="application\/json">([\s\S]*?)<\/script>/);
 assert(match,'Trade Museum embedded archive must exist');
 assert.deepEqual(JSON.parse(match[1]),next,'Public markup and JSON must be identical');
 assert.equal(fs.readFileSync(path.join(root,'data/trade_museum_stage66.json'),'utf8'),
  originalMuseumBytes,'Real source must be unchanged by isolated preview');
 const unchanged=get(evidenceRoot,paths[1]);
 assert.equal(unchanged.status,'REVIEW_REQUIRED','Real commissioner certificate must remain unapproved');
 console.log('SYNTHETIC TRADE RELEASE PASS: 51 historical + 6 source-backed ungraded = 57 receipts; exact original roster directions and FAAB; no live writes.');
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
  '## Trade Museum preview — synthetic, NOT APPROVED\n\n- Prior audited receipts: **51**\n- Recovered trade candidates: **6**\n- Disposable rendered preview receipts: **57**\n- New grading status: **all ungraded**\n- Verified source FAAB display: **Stew receives 2 FAAB**\n- Source certification: **REVIEW_REQUIRED**, unchanged\n- No main merge, branch writes, score changes or deployment.\n');
}finally{fs.rmSync(temp,{recursive:true,force:true})}
