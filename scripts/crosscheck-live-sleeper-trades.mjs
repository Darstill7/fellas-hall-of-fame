// Live RAW Sleeper evidence collector for commissioner inspection only.
// CI artifact, no writes to canonical data or the public Trade Museum.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dataPath='data-integrity/trade-recovery/2026-weeks1-12-provider-review-20261123.json';
const review=JSON.parse(fs.readFileSync(dataPath,'utf8'));
assert.equal(review.status,'RESEARCH_ONLY_NOT_CERTIFIED');
const base='https://api.sleeper.app/v1/league/'+review.league_id+'/transactions/';
const fetchWeek=async week=>{
 const response=await fetch(base+week,{signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw Error('Sleeper raw Week '+week+': HTTP '+response.status);
 const rows=await response.json();
 if(!Array.isArray(rows))throw Error('Sleeper Week '+week+' response must be an array');
 return rows.filter(x=>x.type==='trade'&&x.status==='complete').map(x=>({
  id:String(x.transaction_id),week,created:x.created??null,status_updated:x.status_updated??null,
  roster_ids:x.roster_ids,adds:x.adds??{},drops:x.drops??{},
  waiver_budget:x.waiver_budget??[],draft_picks:x.draft_picks??[],
  status:x.status,type:x.type
 }));
};
const weekly=await Promise.all(Array.from({length:13},(_,w)=>fetchWeek(w)));
const all=weekly.flat();
const seen=new Set();
for(const tx of all){
 assert.match(tx.id,/^\d+$/,'Missing raw Sleeper ID');
 assert(!seen.has(tx.id),'Duplicate transaction across Sleeper weeks: '+tx.id);
 seen.add(tx.id);
}
const rawById=new Map(all.map(x=>[x.id,x]));
const issues=[],rawEvidence=[];
for(const t of review.trades){
 const raw=rawById.get(t.id);
 if(!raw){issues.push('Provider normalized ID missing from live raw Sleeper: '+t.id);continue}
 const owners=new Set(raw.roster_ids?.map(Number)||[]);
 const displayOwners=new Set(t.participants.map(p=>p.roster_id));
 if(owners.size!==displayOwners.size||[...owners].some(o=>!displayOwners.has(o)))issues.push('Participant roster count/identity mismatch: '+t.id);
 if(raw.week!==t.week)issues.push('Provider week mismatch: '+t.id);
 const adds=raw.adds||{},drops=raw.drops||{};
 const receiverSeen=new Set(),senderSeen=new Set();
 for(const side of t.participants){
  for(const p of side.received){
   if(receiverSeen.has(p.player_id))issues.push('Duplicate normalized received ID: '+t.id+'/'+p.player_id);
   receiverSeen.add(p.player_id);
   if(!Object.hasOwn(adds,p.player_id)||Number(adds[p.player_id])!==side.roster_id)
    issues.push('Raw receipt contradicts receiving side: '+t.id+'/'+p.player_id);
  }
  for(const p of side.sent){
   if(senderSeen.has(p.player_id))issues.push('Duplicate normalized sent ID: '+t.id+'/'+p.player_id);
   senderSeen.add(p.player_id);
   if(!Object.hasOwn(drops,p.player_id)||Number(drops[p.player_id])!==side.roster_id)
    issues.push('Raw receipt contradicts sending side: '+t.id+'/'+p.player_id);
  }
 }
 if(Object.keys(adds).length!==receiverSeen.size)issues.push('Raw adds count differs from normalized player list: '+t.id);
 if(Object.keys(drops).length!==senderSeen.size)issues.push('Raw drops count differs from normalized player list: '+t.id);
 for(const [player,to] of Object.entries(adds)){
  if(!Object.hasOwn(drops,player)||Number(to)===Number(drops[player]))issues.push('Missing/invalid raw sender: '+t.id+'/'+player);
 }
 rawEvidence.push({id:t.id,week:raw.week,existing_or_missing:t.museum_status,
  participant_rosters:[...owners].sort((a,b)=>a-b),
  raw_adds:adds,raw_drops:drops,raw_waiver_budget:raw.waiver_budget,
  raw_draft_picks:raw.draft_picks,
  manual_faab_review_required:Array.isArray(raw.waiver_budget)&&raw.waiver_budget.length>0,
  manual_pick_adjudication_required:Array.isArray(raw.draft_picks)&&raw.draft_picks.length>0
 });
}
const additional=all.filter(x=>!review.trades.some(t=>t.id===x.id));
const out={schema:'fellas-live-sleeper-trade-raw-crosscheck-v1',status:'RAW_RECEIPTS_UNAPPROVED',
 as_of:new Date().toISOString(),source:'Sleeper public API raw league transactions, Weeks 0–12',
 league_id:review.league_id,raw_week_counts:weekly.map((x,w)=>({week:w,count:x.length})),
 normalized_snapshot_count:review.trades.length,raw_total_complete:all.length,
 normalized_ids_missing_from_raw:review.trades.filter(t=>!rawById.has(t.id)).map(t=>t.id),
 raw_additional_since_snapshot:additional,
 recovered_snapshot_receipts:rawEvidence,issues,
 warnings:[
  'No manager has approved these transactions for Trade Museum publication',
  'Raw player ID direction verified here; human verification of player names remains necessary',
  'Raw waiver_budget is not fully represented in the normalized provider display and requires commissioner review',
  'Week 12 is ongoing, and this run cannot establish final season completeness'
 ]};
const target=process.env.FELLAS_TRADE_RAW_REPORT||'data-integrity/trade-recovery/live-raw-crosscheck.json';
fs.mkdirSync('data-integrity/trade-recovery',{recursive:true});
fs.writeFileSync(target,JSON.stringify(out,null,2)+'\n');
console.log('RAW RECEIPT REVIEW: '+all.length+' complete raw trades in Weeks 0–12; '+review.trades.length+' normalized snapshot; '+additional.length+' additional; '+issues.length+' integrity issues.');
console.log('Raw FAAB-bearing IDs: '+rawEvidence.filter(x=>x.manual_faab_review_required).map(x=>x.id).join(', '));
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
 '## Raw Sleeper source cross-check (unapproved)\n\n- Raw completed transactions Weeks 0–12: **'+all.length+'**\n- Normalized snapshot IDs: **'+review.trades.length+'**\n- Additional raw IDs: **'+additional.length+'**\n- Source integrity issues: **'+issues.length+'**\n- Archived or new raw transactions are **not commissioner-certified**. Download artifact for exact FAAB, player IDs and manager-source review.\n');
if(issues.length){
 for(const issue of issues)console.error('RAW SOURCE MISMATCH: '+issue);
 process.exitCode=1;
}
