// Deadline membership guard. Freeze source transaction facts, never derived scoring.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const sortObjects=xs=>xs.map(stable).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
export function tradeSnapshot({season,league,deadline,cutoff,transactions}){
 assert(Number.isInteger(cutoff)&&Number.isInteger(deadline));
 const trades=transactions.filter(t=>t.status==='complete'&&t.type==='trade');
 assert(trades.every(t=>Number.isInteger(t.week)&&t.week<=deadline),'Trade after deadline');
 const entries=trades.filter(t=>t.week<=cutoff).map(t=>({id:String(t.transaction_id),week:t.week,completed_ms:Number(t.status_updated),rosters:t.roster_ids.map(Number).sort((a,b)=>a-b),adds:stable(t.adds||{}),drops:stable(t.drops||{}),faab:sortObjects(t.waiver_budget||[]),draft_picks:sortObjects(t.draft_picks||[])})).sort((a,b)=>a.id.localeCompare(b.id));
 assert(entries.every(t=>t.id&&Number.isFinite(t.completed_ms)&&t.completed_ms>0));
 assert.equal(new Set(entries.map(t=>t.id)).size,entries.length);
 const facts={season,league,deadline,entries};
 return {...facts,cutoff,closed:cutoff>=deadline,sha256:createHash('sha256').update(JSON.stringify(facts)).digest('hex')};
}
export function enforceTradeFreeze(snapshot,baseline,{allowInitialCandidate=false}={}){
 if(!snapshot.closed){assert(!baseline,'Closed-season baseline cannot be applied before deadline');return 'OPEN';}
 if(!baseline){assert(allowInitialCandidate&&snapshot.cutoff===snapshot.deadline,'Missing independently approved deadline baseline');return 'INITIAL_FREEZE_CANDIDATE_NOT_APPROVED';}
 assert(baseline.closed&&baseline.cutoff===baseline.deadline,'Invalid deadline baseline');
 for(const k of ['season','league','deadline','sha256'])assert.equal(snapshot[k],baseline[k],'Frozen trade mismatch: '+k);
 assert.deepEqual(snapshot.entries,baseline.entries,'Frozen trade facts changed');
 return 'FROZEN_VERIFIED';
}
