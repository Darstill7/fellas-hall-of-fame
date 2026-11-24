import assert from 'node:assert/strict';
import {tradeSnapshot,enforceTradeFreeze} from './lib/trade-deadline-freeze.mjs';
const tx=(id,week)=>({transaction_id:id,week,status:'complete',type:'trade',status_updated:1700000000000+week,roster_ids:[2,1],adds:{'123':1,'456':2},drops:{'123':2,'456':1},waiver_budget:[],draft_picks:[]});
const original=[tx('a',5),tx('b',11)];
const snapshot=(cutoff,transactions=original)=>tradeSnapshot({season:2026,league:'1340027406009761792',deadline:11,cutoff,transactions});
let checks=0;
const eq=(a,b)=>{assert.deepEqual(a,b);checks++};
const rejects=(fn,pattern)=>{assert.throws(fn,pattern);checks++};
eq(snapshot(10).entries.length,1);
eq(enforceTradeFreeze(snapshot(10),null),'OPEN');
const baseline=snapshot(11);
eq(baseline.entries.length,2);
eq(enforceTradeFreeze(baseline,null,{allowInitialCandidate:true}),'INITIAL_FREEZE_CANDIDATE_NOT_APPROVED');
rejects(()=>enforceTradeFreeze(baseline,null),/Missing independently approved/);
for(const w of [11,12,14,15,16,17]){
 eq(snapshot(w).sha256,baseline.sha256);
 eq(enforceTradeFreeze(snapshot(w),baseline),'FROZEN_VERIFIED');
}
rejects(()=>enforceTradeFreeze(snapshot(12),null,{allowInitialCandidate:true}),/Missing independently approved/);
rejects(()=>enforceTradeFreeze(snapshot(12,[original[0]]),baseline),/Frozen trade mismatch/);
rejects(()=>enforceTradeFreeze(snapshot(12,[...original,tx('c',11)]),baseline),/Frozen trade mismatch/);
rejects(()=>snapshot(12,[...original,tx('c',12)]),/Trade after deadline/);
for(const patch of [{adds:{'123':2}},{drops:{'456':2}},{status_updated:1700000000009},{roster_ids:[1,3]},{waiver_budget:[{sender:1,receiver:2,amount:5}]},{draft_picks:[{season:'2027',round:1}]}]){
 rejects(()=>enforceTradeFreeze(snapshot(12,[original[0],{...original[1],...patch}]),baseline),/Frozen trade mismatch/);
}
eq(snapshot(15,original.slice().reverse()).sha256,baseline.sha256);
eq(snapshot(15,[...original,{...tx('waiver',15),type:'waiver'}]).sha256,baseline.sha256);
eq(snapshot(15,original.map(t=>({...t,points:999,receipts:[{week:15,points:99}]}))).sha256,baseline.sha256);
rejects(()=>snapshot(12,[...original,original[0]]),/Expected values/);
console.log('TRADE DEADLINE LIFECYCLE PASS '+JSON.stringify({checks,weeks:[10,11,12,14,15,16,17],synthetic:true}));
