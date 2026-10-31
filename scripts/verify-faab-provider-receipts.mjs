// Read-only verification of provider FAAB receipt recovery; does not generate manager skill grades.
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const seasons=[2020,2021,2022,2023,2024,2025,2026];
const byYear=new Map();
let completedTotal=0,failedTotal=0,spentTotal=0,archivedWaiversTotal=0;
for(const year of seasons){
 const file=read('data-integrity/faab-provider-receipts-'+year+'.json');
 const archive=read('data/acquisitions_'+year+'.json').weeks.flatMap(w=>w.tx);
 const byId=new Map(archive.map(x=>[String(x.id),x]));
 const archivedWaivers=archive.filter(x=>x.type==='waiver');
 const expectedWeeks=year===2026?7:18;
 if(file.year!==year||file.weeks.length!==expectedWeeks)throw Error('FAAB week coverage mismatch '+year);
 if(file.weeks.some((w,i)=>w.week!==i+1||w.ok!==true))throw Error('Incomplete weekly source response '+year);
 if(file.issues.length)throw Error('Unresolved FAAB provider fetch issues '+year);
 const receipts=new Map();
 let completed=0,failed=0,spent=0,attempted=0,matched=0;
 for(const tx of file.receipts){
  if(tx.type!=='waiver'||!['complete','failed'].includes(tx.status))throw Error('Unsupported waiver status '+year+' '+tx.id);
  if(!Number.isSafeInteger(tx.bid)||tx.bid<0)throw Error('Invalid provider FAAB bid '+year+' '+tx.id);
  if(receipts.has(tx.id))throw Error('Duplicate provider transaction '+year+' '+tx.id);
  if(!Number.isInteger(tx.week)||tx.week<1||tx.week>expectedWeeks)throw Error('Wrong provider week '+year+' '+tx.id);
  receipts.set(tx.id,tx);
  const archived=byId.get(tx.id);
  if(tx.archived!==!!archived)throw Error('False archived-match flag '+year+' '+tx.id);
  if(tx.status==='complete'){
   completed++;spent+=tx.bid;
   if(archived){
    const rosters=(archived.teamIds||[]).map(String);
    const players=(archived.players||[]).map(p=>String(p.id));
    if(archived.type!=='waiver'||!tx.rosterIds.every(x=>rosters.includes(String(x)))||!tx.playerIds.every(x=>players.includes(String(x)))||!tx.rosterMatch||!tx.playerMatch)throw Error('Bad FAAB claim reconciliation '+year+' '+tx.id);
    matched++;
   }
  }else{failed++;attempted+=tx.bid;if(archived)throw Error('Failed claim should not be in completed acquisition ledger '+year+' '+tx.id);}
 }
 for(const archived of archivedWaivers){const tx=receipts.get(String(archived.id));if(!tx||tx.status!=='complete'||!tx.rosterMatch||!tx.playerMatch)throw Error('Missing winning bid receipt for archived waiver '+year+' '+archived.id)}
 const summary=file.outcomeSummary;
 if(summary.completedClaims!==completed||summary.failedClaims!==failed||summary.completedSpend!==spent||summary.failedAttemptedBidTotal!==attempted||summary.completedWithArchiveMatch!==matched)throw Error('Stale FAAB season totals '+year);
 byYear.set(year,receipts);
 completedTotal+=completed;failedTotal+=failed;spentTotal+=spent;archivedWaiversTotal+=archivedWaivers.length;
 console.log(year+': '+completed+' completed, '+failed+' failed, '+spent+' winning FAAB, '+matched+'/'+archivedWaivers.length+' archived claims matched');
}
const manager=read('data-integrity/faab-manager-spend-research-v1.json');
if(manager.schema!=='fellas-faab-manager-spend-research-v2')throw Error('Outdated manager FAAB research');
const metrics=['completedClaims','failedClaims','paidWins','zeroDollarWins','completedBidSpend','failedAttemptedBidTotal','completedNotInOldArchive'];
const aggregated=new Map();
for(const record of manager.managerSeasons){
 for(const k of metrics)if(!Number.isFinite(record[k]))throw Error('Invalid research metric '+k);
 const key=record.manager;
 if(!aggregated.has(key))aggregated.set(key,{seasons:0,...Object.fromEntries(metrics.map(k=>[k,0]))});
 const total=aggregated.get(key);total.seasons++;
 for(const k of metrics)total[k]+=record[k];
}
for(const rec of manager.managerTotals){
 const expected=aggregated.get(rec.manager);
 if(!expected||rec.seasons!==expected.seasons||metrics.some(k=>rec[k]!==expected[k]))throw Error('Stale FAAB manager summary '+rec.manager);
}
if(manager.managerTotals.reduce((n,r)=>n+r.completedClaims,0)!==completedTotal||manager.managerTotals.reduce((n,r)=>n+r.failedClaims,0)!==failedTotal||manager.managerTotals.reduce((n,r)=>n+r.completedBidSpend,0)!==spentTotal)throw Error('FAAB manager spend sums diverge from provider receipts');
const editorial=read('data-integrity/faab-legacy-claim-verification-v1.json');
if(editorial.cases.length!==16)throw Error('Missing FAAB editorial source receipts');
for(const x of editorial.cases){const r=byYear.get(x.year)?.get(x.transactionId);if(!r||r.status!=='complete'||r.bid!==x.verifiedBid||!r.playerIds.includes(x.playerId)||!r.rosterIds.includes(x.rosterId)||!r.rosterMatch||!r.playerMatch)throw Error('Legacy FAAB claim not source-verified '+x.player);}
console.log('FAAB RECEIPTS PASS: '+completedTotal+' successful and '+failedTotal+' failed claims, $'+spentTotal+' verified winning bids, '+archivedWaiversTotal+' archived claims reconciled; 16 legacy prices sourced. No skill grades.');
