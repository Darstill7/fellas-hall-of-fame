// Shared, source-backed highlight renderer for modern manager encyclopedias.
(async()=>{
 const root=document.querySelector('#franchise-encyclopedia[data-manager-encyclopedia]');
 if(!root)return;
 const manager=root.dataset.managerEncyclopedia;
 // Suppress the archived numeric HTML immediately, before awaiting network requests.
 // Otherwise a slow connection can briefly advertise old figures as current.
 for(const selector of ['[data-encyclopedia-waiver]','[data-encyclopedia-trade]']){
  const card=root.querySelector(selector);
  if(!card)continue;
  const heading=card.querySelector('h3'),detail=card.querySelector('p');
  if(heading)heading.textContent='Loading player and trade history…';
  if(detail)detail.textContent='Checking historical records.';
 }
 root.dataset.encyclopediaUpdated='loading';
 try{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),10000);
  let wr,tr;
  try{
   [wr,tr]=await Promise.all(['waiver_award_candidates.json','v9_trade_engine.json'].map(async name=>{
    const r=await fetch('../../data/'+name,{cache:'no-cache',signal:controller.signal});
    if(!r.ok)throw Error(name+' HTTP '+r.status);
    return r.json();
   }));
  }finally{clearTimeout(timeout)}
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
  if(!waiver||!trade||!waiver.querySelector('h3')||!waiver.querySelector('p')||!trade.querySelector('h3')||!trade.querySelector('p'))throw Error('Missing encyclopedia mount');
  waiver.querySelector('h3').textContent=w.player;
  waiver.querySelector('p').textContent=w.year+' Week '+w.acquisitionWeek+' '+w.acquisitionType+' · '+w.starts+' subsequent credited starts · '+Number(w.points).toFixed(2)+' starter points · +'+Number(w.par).toFixed(2)+' above positional starter benchmark. Archived candidate, not comprehensive waiver ROI.';
  trade.querySelector('h3').textContent=t.assets.join(' + ');
  trade.querySelector('p').textContent=t.year+' Week '+t.week+' · '+t.starts+' credited starts · '+Number(t.starter_points).toFixed(2)+' subsequent starter points · +'+Number(t.direct_edge).toFixed(1)+' direct starter-point edge. '+(t.year===2026?'2026 in-season snapshot. ':'')+'Not positional WAR or decision-quality scoring.';
  root.dataset.encyclopediaUpdated='yes';
 }catch(e){
  // Never present baked-in historical figures as current when canonical source loading fails.
  for(const [selector,title] of [['[data-encyclopedia-waiver]','Pickup history unavailable'],['[data-encyclopedia-trade]','Trade history unavailable']]){
   const card=root.querySelector(selector);
   if(!card)continue;
   const heading=card.querySelector('h3'),detail=card.querySelector('p');
   if(heading)heading.textContent=title;
   if(detail)detail.textContent='Verified figures could not be loaded. The full profile remains available, but these cards cannot show reliable results right now.';
  }
  root.dataset.encyclopediaUpdated='unavailable';
 }
})();

// A source-scoped top-ten trade spotlight for all current manager encyclopedia pages.
// Keep this separate from the legacy trade highlight: the metrics and eligibility differ.
(async()=>{
 const root=document.querySelector('#franchise-encyclopedia[data-manager-encyclopedia]');
 if(!root||root.querySelector('[data-trade-legacy]'))return;
 const name=root.dataset.managerEncyclopedia==='Tom'?'Thommy':root.dataset.managerEncyclopedia;
 const wrap=root.querySelector(':scope > .wrap');
 if(!wrap)return;
 const panel=document.createElement('section');
 panel.setAttribute('data-trade-legacy','');
 panel.setAttribute('aria-label','Researched trade legacy');
 panel.style.cssText='margin:22px 0;padding:clamp(17px,3vw,24px);border:1px solid #5d6d72;border-top:3px solid #e3bd71;border-radius:12px;background:#142735';
 const kicker=document.createElement('div');
 kicker.textContent='TRADE LEGACY · COMPLETED 2020–2025 SEASONS';
 kicker.style.cssText='font-size:11px;letter-spacing:.11em;color:#e3bd71;font-weight:850';
 const title=document.createElement('h3');
 title.textContent='Researched historical trades';
 title.style.cssText='font:600 clamp(21px,3vw,28px)/1.25 Georgia,serif;margin:9px 0';
 const detail=document.createElement('p');
 detail.textContent='Checking the source-audited top-ten trade study…';
 detail.style.cssText='color:#cfdae2;font-size:14px;max-width:75ch';
 const link=document.createElement('a');
 link.href='../../analytics/greatest-worst-trades.html?manager='+encodeURIComponent(name)+'#research-heading';
 link.textContent='Explore the Greatest & Worst Trades archive →';
 link.style.cssText='display:inline-flex;align-items:center;min-height:44px;color:#f4d48f;font-weight:850;text-decoration:underline;text-underline-offset:3px';
 panel.append(kicker,title,detail,link);
 wrap.append(panel);
 try{
  const response=await fetch('../../data/greatest_worst_trades_research_v1.json',{cache:'no-store'});
  if(!response.ok)throw Error('Trade legacy feed unavailable');
  const data=await response.json();
  if(data.schema!=='fellas-greatest-worst-trades-research-v1'||data.rankedObservedPARAdvantage?.length!==10)throw Error('Unexpected research schema');
  const entries=data.rankedObservedPARAdvantage.filter(row=>row.betterReturn?.manager===name||row.lowerReturn?.manager===name);
  if(entries.length){
   const best=entries[0]; // Source is already ordered by observed PAR gap.
   const higher=best.betterReturn.manager===name;
   const other=higher?best.lowerReturn.manager:best.betterReturn.manager;
   title.textContent='#'+best.rank+' · '+name+' vs. '+other+' ('+best.year+')';
   detail.textContent=(higher?'Higher':'Lower')+' observed post-trade starter production · '+Number(best.observedPARGap).toFixed(2)+' position-relative points separated the two sides. '+name+' appears in '+entries.length+' of the ten ranked transactions. Regular-season production only; not a definitive best/worst trade verdict.';
   link.href='../../analytics/greatest-worst-trades.html?manager='+encodeURIComponent(name)+'#research-heading';
  }else{
   title.textContent='Explore '+name+'\'s trade history';
   detail.textContent='No entry in the qualified top-ten observed PAR study. This is not a grade on every trade: the study covers 18 fully matched two-manager deals from 2020–2025, excludes ESPN-era comparisons and does not rank unfinished 2026 returns.';
  }
  panel.dataset.tradeLegacy='verified';
 }catch{
  title.textContent='Trade research archive';
  detail.textContent='The ranked research data could not be verified right now. Browse the source-audited archive for the latest available cases.';
  panel.dataset.tradeLegacy='unavailable';
 }
})();
