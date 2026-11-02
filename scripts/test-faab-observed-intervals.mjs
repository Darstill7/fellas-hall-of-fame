import assert from 'node:assert/strict';
import {buildObservedIntervals} from './faab-observed-intervals.mjs';
const t=(id,time,type,team,adds=[],drops=[],status='complete')=>({
 transactionId:id,timestamp:time,type,status,week:1,teamIds:team?[team]:[],
 added:adds.map(id=>({id})),dropped:drops.map(id=>({id}))});
const tx=[
 t('a',100,'waiver','1',['A']),t('failed',150,'waiver','2',['A'],[],'failed'),
 t('b',200,'add','1',[],['A']),t('c',300,'add','2',['A']),
 t('d',400,'trade',null,['A']),t('e',500,'waiver','1',['B']),
 t('f',500,'waiver','2',['B']),t('g',600,'add','3',['C']),
 t('h',600,'add','3',[],['C']),t('i',700,'waiver','4',['D'])
];
const x=buildObservedIntervals(tx,2025);
const a=x.filter(v=>v.playerId==='A');
assert.equal(a.length,2);
assert.equal(a[0].startTimestamp,100);
assert.equal(a[0].endTimestamp,200,'Drop terminates prior observation');
assert.equal(a[1].startTimestamp,300);
assert.equal(a[1].endTimestamp,400,'Unknown trade terminates interval');
assert.equal(a[1].endReason,'trade_transfer_unresolved');
assert.ok(!x.some(v=>v.playerId==='B'),'Conflicting same-time claims cannot start ownership');
assert.ok(!x.some(v=>v.playerId==='C'),'Add and drop in same timestamp cannot start ownership');
const d=x.find(v=>v.playerId==='D');
assert.equal(d.endTimestamp,null,'Last observed add is right-censored');
assert.ok(x.every(v=>!v.continuousOwnershipCertified&&!v.freeAgentAvailabilityCertified));
console.log('PASS: observed ownership interval regression (drop, trade, ties, failed, censoring)');
