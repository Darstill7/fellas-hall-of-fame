import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pickupCostLabel} from '../assets/pickup-cost-label.mjs';
const get=(year,week,id,player)=>{
 const data=JSON.parse(fs.readFileSync('data-integrity/provider-recovered-transactions-'+year+'-week'+week+'.json','utf8'));
 const receipts=data.transactions.filter(t=>t.transactionId===id&&
  t.status==='complete'&&(t.added??[]).some(p=>p.name===player));
 assert.equal(receipts.length,1,'Expected exactly one completed player receipt '+year+'/'+id);
 return receipts[0];
};
assert.equal(pickupCostLabel(get(2020,1,'608867432567746560','James Robinson')),
 'Cost: $0 · Free agent (after waivers)');
assert.equal(pickupCostLabel(get(2025,1,'1271211932283568128','Justin Herbert')),
 'Cost: $12 FAAB · Waiver claim');
assert.equal(pickupCostLabel(get(2023,7,'1022705051338604544','Tyler Allgeier')),
 'Cost: $0 FAAB · Waiver claim');
assert.equal(pickupCostLabel({type:'waiver',status:'complete',faabBid:null}),
 'Cost: N/A (incomplete bid evidence)');
assert.equal(pickupCostLabel({type:'add',status:'failed',faabBid:null}),
 'Cost: N/A (receipt not completed)');
assert.equal(pickupCostLabel({type:'trade',status:'complete',faabBid:null}),
 'Cost: N/A (incomplete bid evidence)');
console.log('Pickup cost classification PASS: paid waiver, zero-bid waiver, free-agent add, missing and failed receipts');
