// Event-bounded ownership intervals from completed provider transactions.
// These are NOT certified continuous ownership intervals or a free-agent availability pool.
export function buildObservedIntervals(transactions, year) {
 const byPlayer=new Map();
 for(const t of transactions){
  if(t.status!=='complete')continue;
  for(const id of new Set([...(t.added??[]),...(t.dropped??[])].map(p=>String(p.id)))){
   if(!byPlayer.has(id))byPlayer.set(id,[]);
   byPlayer.get(id).push({id,tx:t});
  }
 }
 const intervals=[];
 for(const [playerId,events] of byPlayer){
  events.sort((a,b)=>a.tx.timestamp-b.tx.timestamp||String(a.tx.transactionId).localeCompare(String(b.tx.transactionId)));
  let active=null;
  for(let i=0;i<events.length;){
   const timestamp=events[i].tx.timestamp;
   let end=i+1;
   while(end<events.length&&events[end].tx.timestamp===timestamp)end++;
   const batch=events.slice(i,end).map(x=>x.tx);
   if(active){
    intervals.push({...active,endTimestamp:timestamp,endTransactionIds:batch.map(t=>String(t.transactionId)),
     endReason:batch.length>1?'overlapping_same_timestamp_actions':batch[0].type==='trade'?'trade_transfer_unresolved':'next_completed_player_event',
     continuousOwnershipCertified:false,freeAgentAvailabilityCertified:false});
    active=null;
   }
   // Only a single, completed, one-team acquisition can start an observed interval.
   // A same-transaction drop/add of the same player is not clean acquisition evidence.
   const t=batch[0];
   const added=(t?.added??[]).some(p=>String(p.id)===playerId);
   const dropped=(t?.dropped??[]).some(p=>String(p.id)===playerId);
   const teams=(t?.teamIds??[]).map(String);
   if(batch.length===1&&t.type!=='trade'&&added&&!dropped&&teams.length===1){
    active={year,playerId,teamId:teams[0],startTimestamp:timestamp,
     startTransactionId:String(t.transactionId),startWeek:t.week,
     startEvidence:'single_completed_provider_add'};
   }
   i=end;
  }
  if(active)intervals.push({...active,endTimestamp:null,endTransactionIds:[],
    endReason:'no_later_completed_player_event_observed',continuousOwnershipCertified:false,freeAgentAvailabilityCertified:false});
 }
 return intervals.sort((a,b)=>a.year-b.year||a.startTimestamp-b.startTimestamp||
  a.playerId.localeCompare(b.playerId)||a.startTransactionId.localeCompare(b.startTransactionId));
}
