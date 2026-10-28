(()=>{'use strict';
const targets=[...document.querySelectorAll('[data-canonical-manager-record]')];
if(!targets.length)return;
const prefix=targets[0].dataset.canonicalRoot||'../';
fetch(prefix+'data/career_core_generated.json',{cache:'no-cache'})
.then(r=>{if(!r.ok)throw Error('generated career core unavailable');return r.json()})
.then(data=>{
 for(const node of targets){
  const id=node.dataset.canonicalManagerRecord==='Tom'?'Thommy':node.dataset.canonicalManagerRecord;
  const m=data.managers[id];
  if(!m){node.dataset.canonicalUpdated='missing';continue}
  node.textContent=m.w+'–'+m.l+(m.t?'–'+m.t:'');
  node.dataset.canonicalUpdated='yes';
  const years=Object.keys(m.annual).map(Number).sort((a,b)=>a-b);
  const range=years.length?years[0]+'–'+years[years.length-1]:'Archived';
  const pct=m.games?((m.w+0.5*m.t)/m.games*100).toFixed(1):'0.0';
  if(node.classList.contains('metric')){
   const parent=node.closest('.callout');
   if(parent){
    const b=parent.querySelector('b');if(b)b.textContent=pct+'% career win rate';
    const label=parent.querySelector('.label');if(label)label.textContent='ALL-TIME REGULAR SEASON · '+range;
    const note=parent.querySelector('.muted');if(note)note.textContent=m.games+' archived regular-season games · ESPN + Sleeper';
   }
  }
  node.title=range+' regular season, '+m.games+' archived games · ESPN + Sleeper';
  for(const countNode of document.querySelectorAll('[data-canonical-manager-games="'+node.dataset.canonicalManagerRecord+'"]')){
   countNode.textContent=String(m.games);
   countNode.dataset.canonicalUpdated='yes';
  }
 }
}).catch(()=>{for(const node of targets)node.dataset.canonicalUpdated='fallback'});
})();
