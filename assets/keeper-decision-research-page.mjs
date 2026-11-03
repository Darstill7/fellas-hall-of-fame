const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slugs={Stilly:'stilly',Stew:'stew',Thommy:'tom',Stover:'stover',Birch:'birch',Tony:'tony',Mitch:'mitch',Kuhl:'kuhl',JMid:'jmid',Scott:'scott'};
const pts=n=>Number(n).toFixed(1),signed=n=>(n>0?'+':'')+Number(n).toFixed(1);
const target=document.getElementById('keeper-results');
const sort=document.getElementById('keeper-sort');
const filter=document.getElementById('keeper-manager');
try{
 const response=await fetch('../data/keeper_2025_website_research_v1.json');
 if(!response.ok)throw Error('Research dataset unavailable ('+response.status+')');
 const data=await response.json();
 if(data.schema!=='fellas-2025-keeper-website-research-v1'||data.status!=='research_only_no_public_ovr_changes'||!Array.isArray(data.rows)||data.rows.length!==10)throw Error('Research data not certified for this view');
 const managers=data.rows;
 if(managers.some(m=>m.officialKeeperDecisionGrade!==null||!Array.isArray(m.keepers)||m.keepers.length!==2||!Number.isFinite(m.researchScore)))throw Error('Incomplete research or official grade conflict');
 for(const m of [...managers].sort((a,b)=>a.manager.localeCompare(b.manager))){
  const option=document.createElement('option');option.value=m.manager;option.textContent=m.manager;filter.append(option);
 }
 const initial=new URLSearchParams(location.search).get('manager');
 if(managers.some(x=>x.manager===initial))filter.value=initial;
 const ranking=[...managers].sort((a,b)=>b.researchScore-a.researchScore).map(x=>x.manager);
 const component=(label,value)=>'<div><small>'+label+'</small><strong>'+pts(value)+'</strong><small>out of 100</small></div>';
 const draw=()=>{
  const field=sort.value;
  let list=managers.filter(m=>!filter.value||m.manager===filter.value);
  list=[...list].sort((a,b)=>{
   const key={score:'researchScore',regular:'regularStartedPoints',median:'regularVsStarterMedian',playoff:'championshipStarterPoints',capital:'nominalDraftCapital'}[field];
   if(!key)return a.manager.localeCompare(b.manager);
   const av=field==='capital'?a.components.nominalDraftCapital:a[key];
   const bv=field==='capital'?b.components.nominalDraftCapital:b[key];
   return bv-av||a.manager.localeCompare(b.manager);
  });
  target.innerHTML=list.map(m=>{
   const keeperNames=m.keepers.map(k=>esc(k.name)+' <span class="sub">(R'+k.round+' · '+esc(k.position)+')</span>').join(' · ');
   const drops=m.verifiedDrops.length?'<span class="badge">Keeper released</span>':'';
   return '<details class="entry"><summary><span class="rank">#'+(ranking.indexOf(m.manager)+1)+'</span><span class="summary-name"><span class="name">'+esc(m.manager)+drops+'</span><span class="sub">'+m.keepers.map(k=>esc(k.name)+' (R'+k.round+')').join(' · ')+'</span></span><span class="value"><strong>'+pts(m.researchScore)+'</strong><small>research / 100</small></span></summary><div class="detail"><div class="detail-grid">'+
    component('Weekly starter context',m.components.observedProduction)+
    component('Nominal draft capital',m.components.nominalDraftCapital)+
    component('Championship contribution',m.components.championshipContribution)+
    '</div><p><strong>2025 original-manager keeper starters:</strong> '+pts(m.regularStartedPoints)+' regular-season points; '+signed(m.regularVsStarterMedian)+' vs. same-week positional starter medians.</p>'+
    '<p><strong>Championship-bracket starts:</strong> '+pts(m.championshipStarterPoints)+' points. <strong>Other Weeks 15–17 games:</strong> '+pts(m.otherWeek15to17StartedPoints)+' points (excluded from playoff score).</p>'+
    '<p><strong>Kept:</strong> '+keeperNames+'</p>'+
    (m.verifiedDrops.length?'<p><strong>Verified original-keeper releases:</strong> '+m.verifiedDrops.map(esc).join(', ')+'. No abandonment penalty has been applied.</p>':'')+
    '<p class="sub">Weights: 55% weekly production, 30% round context, 15% championship contribution. Official Keeper Decision grade: unavailable.</p>'+
    '<div class="actions"><a href="../managers/'+slugs[m.manager]+'/">View '+esc(m.manager)+' profile</a><a href="manager-report-cards.html?manager='+encodeURIComponent(m.manager)+'">Full report card</a></div></div></details>';
  }).join('')||'<p>No managers match this filter.</p>';
 };
 sort.addEventListener('change',draw);
 filter.addEventListener('change',()=>{draw();const next=new URL(location.href);if(filter.value)next.searchParams.set('manager',filter.value);else next.searchParams.delete('manager');history.replaceState(null,'',next)});
 draw();
}catch(err){target.innerHTML='<p class="error" role="alert">Keeper research is temporarily unavailable. No scores are shown until the verified source can be loaded.</p>';console.error('Keeper decision research:',err)}
