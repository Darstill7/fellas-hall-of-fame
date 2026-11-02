import assert from 'node:assert/strict';
import {ownershipTimestampConflicts,ambiguousPlayerIds} from './faab-timestamp-conflicts.mjs';
const tx=(transactionId,status,timestamp,added=[],dropped=[])=>({transactionId,status,timestamp,added:added.map(id=>({id})),dropped:dropped.map(id=>({id}))});
const input=[
 tx('a','complete',100,['WR_A']),
 tx('b','complete',100,['DEF_B']),
 tx('c','failed',100,['WR_A']),
 tx('d','complete',200,['RB_C']),
 tx('e','complete',200,[],['RB_C']),
 tx('f','complete',300,['TE_D'],['TE_D']),
 tx('g','complete',400,['QB_E']),
 tx('h','failed',400,['QB_E'])
];
const counts=ownershipTimestampConflicts(input);
assert.deepEqual([...ambiguousPlayerIds(input[0],counts)],[],'Unrelated simultaneous completed claims must remain independent');
assert.deepEqual([...ambiguousPlayerIds(input[1],counts)],[],'A different player cannot taint a claim');
assert.deepEqual([...ambiguousPlayerIds(input[3],counts)],['RB_C'],'Same-player completed conflicts must be quarantined');
assert.deepEqual([...ambiguousPlayerIds(input[4],counts)],['RB_C'],'Both sides of an overlapping player conflict must be quarantined');
assert.deepEqual([...ambiguousPlayerIds(input[5],counts)],[],'Single transaction add/drop must count once');
assert.deepEqual([...ambiguousPlayerIds(input[6],counts)],[],'Failed claims must not taint successful ownership');
console.log('PASS: six player-specific timestamp conflict regression assertions');
