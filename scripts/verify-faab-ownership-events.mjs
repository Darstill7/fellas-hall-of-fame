// Verify recovered event ledger provenance and prevent silently certified free agency.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ledger=read('data-integrity/faab-observed-ownership-events-v1.json');
assert.equal(ledger.status,'partial_event_ledger_not_certified_availability');
assert.deepEqual(ledger.coverage.map(x=>x.year),[2020,2021,2022,2023,2024,2025,2026]);
const tx=new Map(),expected=[];
for(const row of ledger.coverage){
 const end=row.year===2026?8:18;let count=0,trades=0;
 for(let week=1;week<=end;week++){
  const file=read('data-integrity/provider-recovered-transactions-'+row.year+'-week'+week+'.json');
  for(const t of file.transactions){
   count++;
   const key=row.year+'|'+t.transactionId;
   assert.ok(!tx.has(key),'Duplicate transaction across provider week files '+key);
   tx.set(key,t);
   if(t.status!=='complete')continue;
   if(t.type==='trade')trades++;
   else for(const player of t.dropped??[])expected.push(key+'|drop|'+String(player.id));
   if(t.type!=='trade')for(const player of t.added??[])expected.push(key+'|add|'+String(player.id));
  }
 }
 assert.equal(row.recoveredTransactions,count,'Bad recovered count '+row.year);
 assert.equal(row.completedTradeTransactionsUnapplied,trades,'Trade evidence miscount '+row.year);
}
const actual=new Set();
for(const e of ledger.rows){
 const key=e.year+'|'+e.transactionId;
 const source=tx.get(key);
 assert.ok(source,'Ownership event without provider receipt '+key);
 assert.equal(source.status,'complete','Failed transaction treated as ownership change');
 assert.equal(source.timestamp,e.timestamp,'Timestamp changed');
 assert.equal(source.week,e.week,'Week changed');
 const rowKey=key+'|'+e.action+'|'+e.playerId;
 assert.ok(!actual.has(rowKey),'Duplicate player action '+rowKey);actual.add(rowKey);
 assert.ok((e.action==='add'?source.added:source.dropped).some(p=>String(p.id)===e.playerId),'Action absent from original provider receipt '+rowKey);
 assert.ok(!['free_agent_confirmed','unowned_certified'].includes(e.status),'Unsupported ownership certification');
}
assert.equal(actual.size,expected.length,'Provider action counts differ from ledger');
for(const k of expected)assert.ok(actual.has(k),'Missing provider action '+k);
console.log('Sleeper ownership event provenance PASS:',actual.size,'completed player actions, no certified free-agent pool');
