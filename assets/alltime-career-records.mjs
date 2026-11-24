// Career scoring record cards; values are derived exclusively from approved regular-season game receipts.
const section=document.getElementById('ledger-career-records');
if(section){
 const grid=document.getElementById('ledger-career-grid'),note=document.getElementById('ledger-career-week');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
 fetch('../data/alltime_career_records_live_v1.json',{cache:'no-store'})
 .then(r=>{if(!r.ok)throw Error('Career source HTTP '+r.status);return r.json()})
 .then(data=>{
  if(data.schema!=='fellas-ledger-career-records-v1'||!Number.isInteger(data.verified2026ThroughWeek)||
    !Array.isArray(data.records)||data.records.length!==11)throw Error('Unsupported career projection');
  note.textContent='2026 through Week '+data.verified2026ThroughWeek+' · '+data.managerCount+' historical managers';
  grid.innerHTML=data.records.map(r=>'<article class="current-record-card"><small>'+esc(r.title)+'</small>'+
   '<strong>'+fmt(r.value)+'</strong><p>'+r.holders.map(h=>esc(h.manager)).join(' · ')+'</p>'+
   '<p>'+r.holderCount+' '+(r.holderCount===1?'record holder':'tied record holders')+(r.minGames?' · minimum '+r.minGames+' games':'')+'</p></article>').join('');
  section.dataset.ready='true';
 })
 .catch(()=>{note.textContent='Verified career records unavailable';grid.textContent='Career record data could not be verified; historical exhibits remain available below.';section.dataset.ready='error';});
}
