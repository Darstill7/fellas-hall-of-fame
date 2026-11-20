// Safely render canonically derived regular-season streaks and closed-season marks.
const host=document.getElementById('ledger-milestones');
if(host){
 const grid=document.getElementById('ledger-milestones-grid');
 const label=document.getElementById('ledger-milestones-week');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=x=>Number(x).toLocaleString('en-US',{maximumFractionDigits:2});
 fetch('../data/ledger_milestones_live_v1.json',{cache:'no-store'})
  .then(r=>{if(!r.ok)throw Error('Milestone HTTP '+r.status);return r.json()})
  .then(data=>{
   if(data.schema!=='fellas-ledger-milestones-v1'||!Number.isInteger(data.verified2026ThroughWeek)||
      !Array.isArray(data.records)||data.records.length!==7)throw Error('Invalid milestone source');
   label.textContent='Latest 2026 data: Week '+data.verified2026ThroughWeek+' · season trophies through 2025';
   grid.innerHTML=data.records.map(r=>{
    const owners=r.holders.map(h=>esc(h.manager)+(h.year?' ('+esc(h.year)+')':h.endingYear?' (ended '+esc(h.endingYear)+' W'+esc(h.endingWeek)+')':''));
    return '<article class="current-record-card"><small>'+esc(r.title)+'</small><strong>'+fmt(r.value)+'</strong>'+
     '<p>'+owners.join(' · ')+'</p><p>'+esc(r.unit)+' · '+r.holderCount+' '+(r.holderCount===1?'record holder':'co-holders')+'</p></article>';
   }).join('');
   host.dataset.ready='true';
  })
  .catch(()=>{label.textContent='Historical milestones unavailable';grid.textContent='Milestone verification unavailable; refer to the archived research below.';host.dataset.ready='error';});
}
