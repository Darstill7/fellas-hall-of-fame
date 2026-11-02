import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildObservedIntervals} from './faab-observed-intervals.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const rows=[],coverage=[];
for(let year=2020;year<=2026;year++){
 const transactions=[];
 for(let week=1;week<=(year===2026?8:18);week++){
  const file=read('data-integrity/provider-recovered-transactions-'+year+'-week'+week+'.json');
  transactions.push(...file.transactions);
 }
 const intervals=buildObservedIntervals(transactions,year);
 const keys=new Set();
 for(const v of intervals){
  const key=v.playerId+'|'+v.startTransactionId;
  assert.ok(!keys.has(key),'Duplicate interval '+year+'/'+key);keys.add(key);
  assert.ok(v.endTimestamp===null||v.endTimestamp>=v.startTimestamp,'Negative ownership interval');
  assert.equal(v.continuousOwnershipCertified,false);
  assert.equal(v.freeAgentAvailabilityCertified,false);
 }
 rows.push(...intervals);
 coverage.push({year,providerTransactions:transactions.length,observedEventBoundedIntervals:intervals.length,
  intervalsWithSubsequentEvent:intervals.filter(v=>v.endTimestamp!==null).length,
  rightCensoredIntervals:intervals.filter(v=>v.endTimestamp===null).length,
  continuousOwnershipCertified:false,freeAgentAvailabilityCertified:false});
}
const output={schema:'fellas-event-bounded-ownership-intervals-v1',
 status:'research_only_observed_event_bounds_not_continuous_ownership',
 caveats:['An interval starts at a single completed provider add and ends at the next known completed transaction affecting the same player.',
 'Unseen opening roster ownership, intermediate trades, and provider recovery gaps prevent certifying uninterrupted possession.',
 'Same-timestamp overlapping actions never begin a new inferred interval.',
 'A missing later event is right censoring, not proof of continued ownership.',
 'No interval proves any alternative player was a legal free agent before another claim.'],
 coverage,rows};
const path='data-integrity/faab-event-bounded-ownership-intervals-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(path),output,'Ownership interval research stale');
else fs.writeFileSync(path,JSON.stringify(output,null,2)+'\n');
console.log('Event-bounded ownership research:',rows.length,'intervals; none certified as continuous ownership');
