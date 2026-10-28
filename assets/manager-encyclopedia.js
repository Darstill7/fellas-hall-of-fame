// Shared, source-backed highlight renderer for modern manager encyclopedias.
(async()=>{
 const root=document.querySelector('#franchise-encyclopedia[data-manager-encyclopedia]');
 if(!root)return;
 const manager=root.dataset.managerEncyclopedia;
 try{
  const [wr,tr]=await Promise.all(['waiver_award_candidates.json','v9_trade_engine.json'].map(async name=>{
   const r=await fetch('../../data/'+name,{cache:'no-cache'});if(!r.ok)throw Error(name+' HTTP '+r.status);return r.json();
  }));
  const w=wr.managers?.[manager]?.[0];
  const t=tr.sides?.filter(x=>x.manager===manager&&x.direct_edge>0).sort((a,b)=>b.direct_edge-a.direct_edge)[0];
  if(!w||!t)throw Error('No qualifying source row');
  // Validate evidence before replacing any card; malformed or partial feeds must fail closed.
  const numeric=(v)=>typeof v==='number'&&Number.isFinite(v);
  if(typeof w.player!=='string'||!w.player.trim()||
     typeof w.acquisitionType!=='string'||!w.acquisitionType.trim()||
     ![w.year,w.acquisitionWeek,w.starts,w.points,w.par].every(numeric)||
     typeof t.year!=='number'||!numeric(t.week)||!numeric(t.starts)||
     !numeric(t.starter_points)||!numeric(t.direct_edge)||
     !Array.isArray(t.assets)||!t.assets.length||!t.assets.every(a=>typeof a==='string'&&a.trim()))
   throw Error('Invalid encyclopedia evidence');
  const waiver=root.querySelector('[data-encyclopedia-waiver]');
  const trade=root.querySelector('[data-encyclopedia-trade]');
  if(!waiver||!trade)throw Error('Missing encyclopedia mount');
  waiver.querySelector('h3').textContent=w.player;
  waiver.querySelector('p').textContent=w.year+' Week '+w.acquisitionWeek+' '+w.acquisitionType+' · '+w.starts+' subsequent credited starts · '+Number(w.points).toFixed(2)+' starter points · +'+Number(w.par).toFixed(2)+' above positional starter benchmark. Archived candidate, not comprehensive waiver ROI.';
  trade.querySelector('h3').textContent=t.assets.join(' + ');
  trade.querySelector('p').textContent=t.year+' Week '+t.week+' · '+t.starts+' credited starts · '+Number(t.starter_points).toFixed(2)+' subsequent starter points · +'+Number(t.direct_edge).toFixed(1)+' direct starter-point edge. '+(t.year===2026?'2026 in-season snapshot. ':'')+'Not positional WAR or decision-quality scoring.';
  root.dataset.encyclopediaUpdated='yes';
 }catch(e){
  // Never present baked-in historical figures as current when canonical source loading fails.
  for(const [selector,title] of [['[data-encyclopedia-waiver]','Waiver evidence unavailable'],['[data-encyclopedia-trade]','Trade evidence unavailable']]){
   const card=root.querySelector(selector);
   if(!card)continue;
   const heading=card.querySelector('h3'),detail=card.querySelector('p');
   if(heading)heading.textContent=title;
   if(detail)detail.textContent='Source-backed figures could not be loaded. The historical dossier remains available below, but its archived figures are not a verified current snapshot.';
  }
  root.dataset.encyclopediaUpdated='unavailable';
 }
})();
