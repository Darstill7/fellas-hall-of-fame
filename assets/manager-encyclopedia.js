// Independent, evidence-backed highlights: missing trade evidence must not suppress a verified waiver.
(async()=>{
 const root=document.querySelector('#franchise-encyclopedia[data-manager-encyclopedia]');
 if(!root)return;
 const manager=root.dataset.managerEncyclopedia;
 const mounts={
  waiver:root.querySelector('[data-encyclopedia-waiver]'),
  trade:root.querySelector('[data-encyclopedia-trade]')
 };
 const set=(mount,heading,detail)=>{
  if(!mount)return;
  const h=mount.querySelector('h3'),p=mount.querySelector('p');
  if(h)h.textContent=heading;
  if(p)p.textContent=detail;
 };
 for(const mount of Object.values(mounts))
  set(mount,'Loading historical evidence…','Checking verified records.');
 root.dataset.encyclopediaUpdated='loading';
 const fetchJSON=async file=>{
  const response=await fetch('../../data/'+file,{cache:'no-cache'});
  if(!response.ok)throw Error(file+' HTTP '+response.status);
  return response.json();
 };
 const numeric=x=>typeof x==='number'&&Number.isFinite(x);
 const canonical=x=>x==='Tom'?'Thommy':x;
 const waiverWork=fetchJSON('waiver_award_candidates.json').then(source=>{
  const w=source.managers?.[manager]?.[0];
  if(!w||typeof w.player!=='string'||!w.player.trim()||
     typeof w.acquisitionType!=='string'||!w.acquisitionType.trim()||
     ![w.year,w.acquisitionWeek,w.starts,w.points,w.par].every(numeric))
   throw Error('Qualifying waiver evidence unavailable');
  set(mounts.waiver,w.player,w.year+' Week '+w.acquisitionWeek+' '+w.acquisitionType+
   ' · '+w.starts+' subsequent credited starts · '+w.points.toFixed(2)+
   ' starter points · '+(w.par>=0?'+':'')+w.par.toFixed(2)+
   ' relative to the positional starter benchmark. Selected archived pickup, not complete waiver ROI.');
  return true;
 }).catch(()=>{
  set(mounts.waiver,'Pickup highlight unavailable',
   'No qualifying source-backed pickup highlight could be loaded. This does not mean the manager made no pickups.');
  return false;
 });
 const tradeWork=fetchJSON('v9_trade_engine.json').then(source=>{
  if(!Array.isArray(source.sides))throw Error('Trade sides unavailable');
  const qualified=source.sides.filter(x=>canonical(x.manager)===canonical(manager)&&
   x.provisional===false&&String(x.confidence).startsWith('verified')&&
   numeric(x.direct_edge)&&numeric(x.starter_points)&&numeric(x.starts)&&
   x.direct_edge>0&&x.trade_id&&Array.isArray(x.assets)&&x.assets.length);
  // A positive edge is an observed candidate, NOT proof that a trade was a wise decision.
  const t=qualified.sort((a,b)=>b.direct_edge-a.direct_edge)[0];
  if(!t)throw Error('No qualifying positive trade candidate');
  const counterparts=source.sides.filter(x=>x.year===t.year&&
   String(x.trade_id)===String(t.trade_id)&&
   canonical(x.manager)!==canonical(manager));
  const partners=[...new Set(counterparts.map(x=>canonical(x.manager)))];
  const partnerLabel=partners.length?' · With '+partners.join(', '):' · Counterparty unverified';
  const otherAssets=counterparts.filter(x=>Array.isArray(x.assets)&&x.assets.length)
   .map(x=>canonical(x.manager)+' recorded receiving: '+x.assets.join(', '));
  set(mounts.trade,t.assets.join(' + '),t.year+' Week '+t.week+partnerLabel+
   ' · '+canonical(manager)+' recorded receiving: '+t.assets.join(', ')+
   (otherAssets.length?' · '+otherAssets.join(' · '):' · Opposing assets not fully verified')+
   ' · '+t.starts+' credited starts · '+t.starter_points.toFixed(2)+
   ' starter points · +'+t.direct_edge.toFixed(1)+
   ' observed direct starter-point edge. Selected historical example, not a trade grade or causal WAR.');
  return true;
 }).catch(()=>{
  set(mounts.trade,'Trade highlight unavailable',
   'No qualifying nonprovisional positive trade example is available in this model. This does not mean no trades occurred; use the full trade archive.');
  return false;
 });
 const [waiverReady,tradeReady]=await Promise.all([waiverWork,tradeWork]);
 root.dataset.encyclopediaUpdated=waiverReady&&tradeReady?'yes':waiverReady||tradeReady?'partial':'unavailable';
})();