import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {captureRecordOwnership,compareRecordOwnership,ownershipWatchPath,verifyOwnershipWatch} from './weekly-record-ownership.mjs';

const read = file=>JSON.parse(readFileSync(file,'utf8'));
const report = read(ownershipWatchPath);
assert.equal(verifyOwnershipWatch(report,captureRecordOwnership(read)).length,report.changes.length);
const mark = (id,value,holders,direction='max')=>({id,label:id,value,holders,unit:'points',direction});
const previous = {year:2026,week:10,ledgerHash:'prior',marks:[
  mark('extends',10,['Birch']),mark('wins',10,['Birch']),mark('ties',10,['Birch']),
  mark('rate',60,['Birch']),mark('close',3,['Birch'],'min'),mark('unchanged',10,['Birch'])
]};
const current = {year:2026,week:11,priorLedgerHash:'prior',marks:[
  mark('extends',11,['Birch']),mark('wins',11,['Stilly']),mark('ties',10,['Birch','Stilly']),
  mark('rate',59,['Stilly']),mark('close',2,['Stilly'],'min'),mark('unchanged',10,['Birch'])
]};
const changes = compareRecordOwnership(previous,current).changes;
assert.deepEqual(changes.map(entry=>entry.type),['EXTENDED','BROKEN','TIED','OWNERSHIP_CHANGED','BROKEN']);
assert.deepEqual(changes[2].joined,['Stilly']);
assert.deepEqual(changes[3].left,['Birch']);
assert.throws(()=>compareRecordOwnership(previous,{...current,week:12}),/adjacent approved weeks/);
assert.throws(()=>compareRecordOwnership(previous,{...current,priorLedgerHash:'rewritten'}),/Prior approved game ledger changed/);
assert.throws(()=>compareRecordOwnership(previous,{...current,marks:current.marks.slice(1)}),/Record definitions changed/);
assert.throws(()=>verifyOwnershipWatch(report,{...report.current,asOf:'wrong'}),/differs from the approved data/);
console.log('PASS: ownership review checks live cutoff, ties, lower-is-better records, and rewritten history');
