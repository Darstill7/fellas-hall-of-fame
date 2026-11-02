// Pure player-level processing-time conflict detector.
// Only completed transactions concerning the same player at the same timestamp conflict.
export function ownershipTimestampConflicts(transactions) {
 const counts=new Map();
 for(const t of transactions) {
  if(t.status!=='complete')continue;
  const ids=new Set([...(t.added??[]),...(t.dropped??[])].map(p=>String(p.id)));
  for(const id of ids){const key=t.timestamp+'|'+id;counts.set(key,(counts.get(key)??0)+1);}
 }
 return counts;
}
export function ambiguousPlayerIds(transaction,counts) {
 const ids=new Set([...(transaction.added??[]),...(transaction.dropped??[])].map(p=>String(p.id)));
 return new Set([...ids].filter(id=>(counts.get(transaction.timestamp+'|'+id)??0)>1));
}
