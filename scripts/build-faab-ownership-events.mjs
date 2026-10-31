// Event-level ownership changes from ORIGINAL completed Sleeper transactions.
// Not a complete ownership ledger: initial rosters, trade transfers and equal-timestamp
// sequencing may be missing. Never certify the unowned free-agent pool from this.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ranges=[[2020,18],[2021,18],[2022,18],[2023,18],[2024,18],[2025,18],[2026,8]];
const rows=[],coverage=[];
for(const [year,lastWeek] of ranges){
 const tx=[];
 for(let week=1;week<=lastWeek;week++){
  const p='data-integrity/provider-recovered-transactions-'+year+'-week'+week+'.json';
  if(!fs.existsSync(p))continue;
  tx.push(...read(p).transactions);
 }
 tx.sort((a,b)=>a.timestamp-b.timestamp||a.transactionId.localeCompare(b.transactionId));
 let unsupportedTrades=0,ambiguousTies=0;
 const timestampCounts=new Map();
 for(const x of tx)timestampCounts.set(x.timestamp,(timestampCounts.get(x.timestamp)??0)+1);
 const owner=new Map(),seen=new Set();
 for(const t of tx){
  if(t.status!=='complete')continue;
  const ambiguous=timestampCounts.get(t.timestamp)>1;
  if(ambiguous)ambiguousTies++;
  if(t.type==='trade'){unsupportedTrades++;continue;}
  const teamIds=(t.teamIds??[]).map(String);
  const team=teamIds.length===1?teamIds[0]:null;
  for(const p of t.dropped??[]){
   const pid=String(p.id),prior=owner.get(pid);
   let status='unknown_previous_owner';
   if(ambiguous)status='simultaneous_processing_uncertain';
   else if(!team)status='ambiguous_team';
   else if(prior&&prior===team){owner.delete(pid);status='released_from_observed_owner';}
   else if(prior&&prior!==team)status='conflict_with_observed_owner';
   else status='release_without_known_prior_owner';
   rows.push({year,week:t.week,transactionId:t.transactionId,timestamp:t.timestamp,playerId:pid,action:'drop',teamId:team,status});
  }
  for(const p of t.added??[]){
   const pid=String(p.id),prior=owner.get(pid);
   let status='ownership_unknown';
   if(ambiguous)status='simultaneous_processing_uncertain';
   else if(!team)status='ambiguous_team';
   else if(prior&&prior!==team)status='conflict_with_observed_owner';
   else if(prior===team)status='already_owned_in_observed_events';
   else status='acquired_after_no_recorded_owner';
   rows.push({year,week:t.week,transactionId:t.transactionId,timestamp:t.timestamp,playerId:pid,action:'add',teamId:team,status});
   if(!ambiguous&&team&&(!prior||prior===team))owner.set(pid,team);
  }
 }
 coverage.push({year,recoveredTransactions:tx.length,completedTradeTransactionsUnapplied:unsupportedTrades,completedTransactionsInTimestampTies:ambiguousTies});
}
const report={schema:'fellas-sleeper-observed-ownership-events-v1',status:'partial_event_ledger_not_certified_availability',
 limitations:['No initial draft rosters are seeded','Trade events are excluded from ownership mutation until verified sides are reconstructed','Same-millisecond events cannot be sorted by transaction ID into real processing priority','A missing observed owner is not evidence of free-agent availability','Potential transactions not present in recovery remain unknown'],coverage,rows};
const target='data-integrity/faab-observed-ownership-events-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),report,'Ownership event ledger stale');
else fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
console.log('FAAB ownership event ledger:',rows.length,'player actions; unverified availability');
