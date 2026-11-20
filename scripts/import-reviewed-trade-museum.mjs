// Human-certified Trade Museum importer. Never grades a trade without audited scoring.
// Usage: FELLAS_APPROVE_TRADE_MUSEUM=YES node scripts/import-reviewed-trade-museum.mjs data-integrity/trade-certifications/2026-weekN.json [--dry-run]
import fs from 'node:fs';
import assert from 'node:assert/strict';
if(process.env.FELLAS_APPROVE_TRADE_MUSEUM!=='YES')throw Error('Explicit human approval required (FELLAS_APPROVE_TRADE_MUSEUM=YES)');
const certPath=process.argv[2],dryRun=process.argv.includes('--dry-run');
if(!certPath||!/^data-integrity\/trade-certifications\/2026-week\d+\.json$/.test(certPath))
 throw Error('Provide reviewed certification data-integrity/trade-certifications/2026-weekN.json');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const cert=read(certPath);
if(cert.schema!=='fellas-trade-museum-certification-v1'||cert.status!=='COMMISSIONER_APPROVED'||
 cert.year!==2026||!Number.isInteger(cert.through_week)||cert.through_week<1||cert.through_week>14||
 !Array.isArray(cert.trades)||!cert.trades.length||typeof cert.raw_candidate!=='string'||
 !cert.raw_candidate.endsWith('/2026-trades-through-week'+cert.through_week+'.json'))
 throw Error('Invalid or incomplete commissioner certification');
const raw=read(cert.raw_candidate);
if(raw.schema!=='fellas-sleeper-raw-trade-review-v1'||raw.status!=='REVIEW_REQUIRED'||
 raw.through_week!==cert.through_week||raw.league!=='1340027406009761792')
 throw Error('Raw completed-trade source does not match certification week or league');
const rawById=new Map(raw.trades.map(x=>[String(x.transaction_id),x]));
if(rawById.size!==raw.trades.length)throw Error('Duplicate provider trade receipts');
const sourcePath='data/trade_museum_stage66.json';
const htmlPath='analytics/trade-museum.html';
const museum=read(sourcePath),seen=new Set(museum.map(t=>String(t.id)));
const names=new Map([[1,'Stilly'],[2,'JMid'],[3,'Thommy'],[4,'Stew'],[5,'Scott'],[6,'Mitch'],[7,'Tony'],[8,'Stover'],[9,'Kuhl'],[10,'Birch']]);
const certified=[];
for(const c of cert.trades){
 const id=String(c.transaction_id||''),txn=rawById.get(id);
 if(!/^\d+$/.test(id)||!txn||seen.has(id))throw Error('Duplicate or unverified new transaction '+id);
 seen.add(id);
 if(txn.week!==c.week||!/^2026-\d\d-\d\d$/.test(c.date)||!Array.isArray(c.sides)||c.sides.length<2)
  throw Error('Missing date/week/participants for new trade '+id);
 const expected=new Set(txn.roster_ids.map(Number));
 const received=new Set(c.sides.map(s=>Number(s.roster_id)));
 if(expected.size!==received.size||[...expected].some(n=>!received.has(n)))
  throw Error('Certified participant roster IDs differ from Sleeper for '+id);
 const sides=c.sides.map(s=>{
  const mgr=names.get(Number(s.roster_id));
  if(!mgr||s.manager!==mgr)throw Error('Unverified manager identity for '+id+' roster '+s.roster_id);
  if(!Array.isArray(s.assets)||!s.assets.length||s.assets.some(a=>typeof a!=='string'||a.trim().length<2))
   throw Error('All participating sides need verified received asset names; cannot publish incomplete trade '+id);
  if(s.assets.some(a=>/[<>]/.test(a)))throw Error('Unsafe asset display text');
  return {manager:mgr==='Thommy'?'Tom':mgr,assets:s.assets.join(' + '),raw_starter_points:null,started_games:null,source_status:'VERIFIED_SOURCE'};
 });
 if(txn.draft_picks?.length)throw Error('Trade '+id+' includes draft-pick fields forbidden in this league; requires separate source adjudication');
 if(txn.waiver_budget?.length&&!c.faab_reviewed)throw Error('Trade '+id+' includes FAAB entries not explicitly reviewed');
 if(Object.keys(txn.adds||{}).length===0&&Object.keys(txn.drops||{}).length===0)
  throw Error('Trade '+id+' lacks player-transfer evidence; keep as special research instead');
 certified.push({
  id,year:2026,date:c.date,week:c.week,sides,
  comparison_status:'ungraded_pending_starter_audit',
  evidence:'Sleeper completed transaction and commissioner-verified receiving sides; player-specific starter production is not yet audited. FAAB, if present, requires separate contextual interpretation.'
 });
}
const output=[...certified,...museum].sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(String(a.id)));
const before=fs.readFileSync(htmlPath,'utf8');
const archive=/<script id="archive-data" type="application\/json">([\s\S]*?)<\/script>/;
const match=before.match(archive);
if(!match)throw Error('Trade Museum embedded source missing');
assert.deepEqual(JSON.parse(match[1]),museum,'Museum HTML differs from audited source before import');
const html=before.replace(archive,'<script id="archive-data" type="application/json">'+JSON.stringify(output).replace(/</g,'\\u003c')+'</script>');
if(!html.includes('id="tm-audit-cutoff"'))throw Error('Trade Museum needs dynamic source cutoff before publication');
if(dryRun){
 console.log('DRY RUN: '+certified.length+' verified new receipts would enter Museum as ungraded; no files changed');
}else{
 fs.writeFileSync(sourcePath,JSON.stringify(output,null,2)+'\n');
 fs.writeFileSync(htmlPath,html);
 console.log('IMPORTED '+certified.length+' verified trades; audit-snapshot values remain unchanged and newly certified trades are explicitly ungraded.');
}
