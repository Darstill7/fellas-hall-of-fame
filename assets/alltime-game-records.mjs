// Ledger-sourced all-time single-game record cards; does not reinterpret research-only awards.
const section=document.getElementById('ledger-alltime-records');
if(section){
 const grid=document.getElementById('ledger-alltime-grid');
 const note=document.getElementById('ledger-alltime-week');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
 fetch('../data/alltime_game_records_live_v1.json',{cache:'no-store'})
  .then(r=>{if(!r.ok)throw Error('Source HTTP '+r.status);return r.json()})
  .then(data=>{
   if(data.schema!=='fellas-ledger-alltime-single-game-v1'||!Number.isInteger(data.verified2026ThroughWeek)||
      !Array.isArray(data.records)||data.records.length!==8)throw Error('Unsupported record feed');
   note.textContent='2026 verified through Week '+data.verified2026ThroughWeek+' · '+data.sourceGames.toLocaleString('en-US')+' historical games';
   grid.innerHTML=data.records.map(r=>{
    const holders=r.holders.map(h=>esc(h.manager)+' ('+esc(h.year)+' W'+esc(h.week)+' vs '+esc(h.opponent)+')');
    return '<article class="current-record-card"><small>'+esc(r.title)+'</small><strong>'+fmt(r.value)+'</strong>'+
     '<p>'+holders.join(' · ')+'</p><p>'+r.holderCount+' verified '+(r.holderCount===1?'holder':'co-holders')+'</p></article>';
   }).join('');
   section.dataset.ready='true';
  })
  .catch(()=>{note.textContent='Verified historical records unavailable';grid.textContent='The historical records projection could not be verified. Archived records remain available below.';section.dataset.ready='error';});
}
