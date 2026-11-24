// Stage completed Sleeper trade events as raw, ungraded receipts for weekly human review.
// Does not update the Trade Museum, asset directions, starter points or the canonical ledger.
import fs from 'node:fs';
const league='1340027406009761792';
const ledger=JSON.parse(fs.readFileSync('data/unified_record_book_2016_2026.json','utf8'));
const last=Math.max(0,...ledger.games.filter(x=>x.year===2026&&x.stage==='regular').map(x=>x.week));
const week=Number(process.env.FELLAS_STAGE_TRADE_THROUGH_WEEK||last+1);
if(!Number.isInteger(week)||week<1||week>14||week>last+1)
 throw Error('Trade staging must target the canonical week or next proposed review week');
const api=async path=>{
 const response=await fetch('https://api.sleeper.app/v1/'+path,{signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw Error('Sleeper '+path+' HTTP '+response.status);
 const body=await response.json();
 if(!Array.isArray(body))throw Error('Sleeper did not return transactions array for '+path);
 return body;
};
const weeks=await Promise.all(Array.from({length:week+1},(_,w)=>w).map(async w=>{
 const rows=await api('league/'+league+'/transactions/'+w);
 return rows.filter(x=>x.type==='trade'&&x.status==='complete').map(x=>({
  week:w,
  transaction_id:String(x.transaction_id||''),
  roster_ids:Array.isArray(x.roster_ids)?x.roster_ids:[],
  adds:x.adds||null,
  drops:x.drops||null,
  draft_picks:x.draft_picks||[],
  waiver_budget:x.waiver_budget||[],
  created:x.created||null,
  status_updated:x.status_updated||null
 }));
}));
const all=weeks.flat();
if(all.some(x=>!/^\d+$/.test(x.transaction_id)))throw Error('Trade receipt missing numeric transaction ID');
const ids=new Set();
for(const t of all){if(ids.has(t.transaction_id))throw Error('Duplicate completed trade ID '+t.transaction_id);ids.add(t.transaction_id)}
all.sort((a,b)=>a.week-b.week||a.transaction_id.localeCompare(b.transaction_id));
const path='data-integrity/sleeper-sync-candidates/2026-trades-through-week'+week+'.json';
fs.mkdirSync('data-integrity/sleeper-sync-candidates',{recursive:true});
fs.writeFileSync(path,JSON.stringify({
 schema:'fellas-sleeper-raw-trade-review-v1',status:'REVIEW_REQUIRED',year:2026,league,
 through_week:week,
 source:'Sleeper public API completed trade transactions, weeks 0-'+week,
 caveats:[
  'Raw player IDs and roster IDs require independent identity and asset-direction validation.',
  'Draft-pick and FAAB components are recorded as raw receipts, not asserted to be legal or assignable.',
  'No starter-point totals, post-trade ownership chains or trade grades are calculated here.',
  'Do not publish these provisional receipts until the commissioner verifies them.'
 ],
 trades:all
},null,2)+'\n');
console.log('STAGED '+all.length+' completed Sleeper trade receipts through Week '+week+' for manual review at '+path);
