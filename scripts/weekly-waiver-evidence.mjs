// Validate an explicit-week provider export. Empty results never prove processing.
import assert from 'node:assert/strict';
export function buildWaiverEvidence(snapshot,{leagueId,year,week,rosters,processingReceipt=null}){
 const d=snapshot?.data;
 assert(snapshot?.success&&d?.platform==='sleeper'&&String(d.league_id)===String(leagueId)&&d.season_year===year,'Wrong or unavailable league evidence');
 assert(d.window?.mode==='explicit_week'&&d.window.weeks?.length===1&&d.window.weeks[0]===week,'Wrong transaction window');
 assert(Array.isArray(d.transactions)&&d.count===d.transactions.length,'Incomplete transaction envelope');
 assert(Object.keys(rosters).length===10&&new Set(Object.values(rosters)).size===10,'Unverified roster identities');
 const limitations=Object.entries(d.limitations??{}).filter(([,v])=>v===true||(typeof v==='number'&&v>0));
 const completeWindow=!d.warning&&!d.truncated&&!limitations.length&&d.transactions.length<100;
 const seen=new Set(),moves=[],excluded=[];
 for(const t of d.transactions){
  assert(typeof t.transaction_id==='string'&&t.transaction_id&&!seen.has(t.transaction_id),'Missing or duplicate transaction ID');seen.add(t.transaction_id);
  if(!['waiver','add','drop'].includes(t.type)||t.status!=='complete'){excluded.push({id:t.transaction_id,type:t.type,status:t.status??'unknown'});continue}
  assert(t.week===week&&t.team_ids?.length===1&&Object.hasOwn(rosters,String(t.team_ids[0])),'Ambiguous completed move');
  const players=xs=>(xs??[]).map(p=>{assert(typeof p.id==='string'&&p.id,'Missing player ID');return {id:p.id,name:p.name??null}});
  const adds=players(t.players_added),drops=players(t.players_dropped);
  assert(adds.length+drops.length>0,'No player evidence');
  assert(t.faab_bid==null||(Number.isInteger(t.faab_bid)&&t.faab_bid>=0),'Invalid FAAB');
  moves.push({id:t.transaction_id,manager:rosters[String(t.team_ids[0])],type:t.type,adds,drops,faab:t.faab_bid??null,date:t.date??null});
 }
 // The receipt must be independently reviewed; a mere timestamp or empty export is not proof.
 const reviewed=processingReceipt?.status==='COMMISSIONER_CONFIRMED'&&processingReceipt.week===week&&processingReceipt.year===year&&String(processingReceipt.leagueId)===String(leagueId)&&typeof processingReceipt.evidence==='string'&&processingReceipt.evidence.trim().length>0;
 const ready=completeWindow&&reviewed&&!d.transactions.some(t=>t.type==='waiver'&&t.status==='pending');
 return {status:ready?'REVIEWED_WINDOW':'NOT_VERIFIED',year,week,completeWindow,processingConfirmed:Boolean(reviewed),moves,excluded,knownFaab:moves.reduce((n,m)=>n+(m.faab??0),0),unknownFaabCount:moves.filter(m=>m.type==='waiver'&&m.faab===null).length,caution:'Known FAAB is not total spending when bids are missing. No unsuccessful claim amounts inferred. No automatic article publication.'};
}
