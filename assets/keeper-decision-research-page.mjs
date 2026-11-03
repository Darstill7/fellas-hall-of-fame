const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const slugs={Stilly:'stilly',Stew:'stew',Thommy:'tom',Stover:'stover',Birch:'birch',Tony:'tony',Mitch:'mitch',Kuhl:'kuhl',JMid:'jmid',Scott:'scott'};
const pts=n=>Number(n).toFixed(1),signed=n=>(n>0?'+':'')+Number(n).toFixed(1);
const target=document.getElementById('keeper-results');
const sort=document.getElementById('keeper-sort');
const filter=document.getElementById('keeper-manager');
const year=document.getElementById('keeper-year');
const note=document.getElementById('keeper-notice');
const heading=document.getElementById('heading');
const seasonNote=document.getElementById('keeper-season-note');
const methodology=document.getElementById('keeper-methodology');
const query=new URLSearchParams(location.search);
const requestedYear=query.get('year')==='2026'?'2026':'2025';
try{
 const [completed,inProgress]=await Promise.all(['keeper_2025_website_research_v1.json','keeper_2026_website_research_v1.json'].map(async path=>{
  const r=await fetch('../data/'+path);
  if(!r.ok)throw Error('Keeper evidence unavailable: '+path+' ('+r.status+')');
  return r.json();
 }));
 if(completed.schema!=='fellas-2025-keeper-website-research-v1'||completed.status!=='research_only_no_public_ovr_changes'||!Array.isArray(completed.rows)||completed.rows.length!==10)
  throw Error('2025 research evidence is incomplete');
 if(inProgress.schema!=='fellas-2026-keeper-website-research-v1'||inProgress.status!=='in_progress_2026_week1_to_week8_no_completed_season_score'||!Array.isArray(inProgress.rows)||inProgress.rows.length!==10||inProgress.throughWeek!==8)
  throw Error('2026 weekly evidence is incomplete');
 for(const dataset of [completed,inProgress]){
  if(dataset.rows.some(m=>m.officialKeeperDecisionGrade!==null||!Array.isArray(m.keepers)||m.keepers.length!==2||!Number.isFinite(m.regularStartedPoints)||!Number.isFinite(m.regularVsStarterMedian)))throw Error('Invalid keeper evidence');
 }
 if(inProgress.rows.some(m=>m.researchScore!==null||m.championshipStarterPoints!==null))throw Error('In-progress scores must remain unavailable');
 const all=[...new Set(completed.rows.map(x=>x.manager).concat(inProgress.rows.map(x=>x.manager)))].sort();
 if(all.length!==10)throw Error('Historical manager coverage mismatch');
 for(const name of all){const option=document.createElement('option');option.value=name;option.textContent=name;filter.append(option)}
 if(all.includes(query.get('manager')))filter.value=query.get('manager');
 year.value=requestedYear;
 const originalMethod=methodology.innerHTML;
 const component=(label,value)=>'<div><small>'+label+'</small><strong>'+pts(value)+'</strong><small>out of 100</small></div>';
 function updateUrl(){
  const next=new URL(location.href);
  if(year.value==='2026')next.searchParams.set('year','2026');else next.searchParams.delete('year');
  if(filter.value)next.searchParams.set('manager',filter.value);else next.searchParams.delete('manager');
  history.replaceState(null,'',next);
 }
 function draw(){
  const isComplete=year.value==='2025';
  const data=isComplete?completed:inProgress;
  const managers=data.rows;
  const scoreOption=sort.querySelector('option[value="score"]'),playoffOption=sort.querySelector('option[value="playoff"]');
  scoreOption.disabled=!isComplete;playoffOption.disabled=!isComplete;
  if(!isComplete&&['score','playoff'].includes(sort.value))sort.value='regular';
  if(isComplete&&sort.value==='regular'&&sort.dataset.autoYearSort==='yes')sort.value='score';
  if(!isComplete)sort.dataset.autoYearSort='yes';else sort.dataset.autoYearSort='no';
  heading.textContent=isComplete?'2025 completed-season comparison':'2026 season-to-date comparison';
  document.getElementById('keeper-count').textContent='20 / 20';
  document.getElementById('keeper-context').textContent=isComplete?'6 teams':'8 weeks';
  document.getElementById('keeper-context-label').textContent=isComplete?'2025 championship playoff bracket':'2026 archived starters (Weeks 1–8)';
  document.getElementById('keeper-drops').textContent=isComplete?'2 verified':'Not audited';
  document.getElementById('keeper-drops-label').textContent=isComplete?'2025 original-manager outright drops':'2026 keeper drop coverage incomplete';
  if(isComplete){
   note.innerHTML='<strong>Research index, not an official grade.</strong> The 0–100 research score describes completed 2025 keeper performance, nominal draft capital and championship-bracket points. It does not change manager OVR. Abandonment penalties are <strong>not applied</strong>.';
   seasonNote.textContent='2025 is a completed-season retrospective research index; no public Keeper Decision grades are assigned.';
   methodology.innerHTML=originalMethod;
  }else{
   note.innerHTML='<strong>2026 is in progress.</strong> Data covers original-manager starting production in archived Weeks 1–8 only. Draft-engine totals stop at Week 6; Weeks 7–8 are independently sourced. There is <strong>no comparable Keeper Decision Score</strong>, no playoff component and no certified abandonment deduction.';
   seasonNote.textContent='2026 weekly evidence is provisional. Sort by observed starts and points; no complete-season or official score is available.';
   methodology.innerHTML='<p><strong>2026 season-to-date methodology:</strong> We sum actual starting points earned while each retained player remained with the manager who kept him. The comparison uses the median at the same position and week, over only the weeks the keeper started.</p><p>Weeks 1–6 have been reconciled against the draft engine. Weeks 7–8 are taken from newer weekly scored rosters. A transferred keeper points for later owners are not credited to the original manager.</p><p>No 2026 playoff score, official Keeper Decision grade, release penalty or combined 100-point index is available while this season is incomplete. The 2025 research index is not directly comparable to 2026 partial totals.</p>';
  }
  const list=[...managers].filter(m=>!filter.value||m.manager===filter.value);
  const key={score:'researchScore',regular:'regularStartedPoints',median:'regularVsStarterMedian',playoff:'championshipStarterPoints',capital:isComplete?'nominalDraftCapital':'nominalDraftCapital'}[sort.value];
  list.sort((a,b)=>{const av=key==='nominalDraftCapital'&&isComplete?a.components.nominalDraftCapital:a[key];const bv=key==='nominalDraftCapital'&&isComplete?b.components.nominalDraftCapital:b[key];return key?(bv-av||a.manager.localeCompare(b.manager)):a.manager.localeCompare(b.manager)});
  const rankKey=isComplete?'researchScore':'regularStartedPoints';
  const rank=[...managers].sort((a,b)=>b[rankKey]-a[rankKey]).map(x=>x.manager);
  target.innerHTML=list.map(m=>{
   const keeperNames=m.keepers.map(k=>esc(k.name)+' <span class="sub">(R'+k.round+' · '+esc(k.position)+(isComplete?'':' · '+k.starts+' starts, '+pts(k.startedPoints)+' pts')+')</span>').join(' · ');
   const drops=isComplete&&m.verifiedDrops.length?'<span class="badge">Keeper released</span>':'';
   const detail=isComplete?
    '<div class="detail-grid">'+component('Weekly starter context',m.components.observedProduction)+component('Nominal draft capital',m.components.nominalDraftCapital)+component('Championship contribution',m.components.championshipContribution)+'</div>'+
    '<p><strong>Original-manager keeper starters:</strong> '+pts(m.regularStartedPoints)+' regular-season points; '+signed(m.regularVsStarterMedian)+' vs. same-week positional starter medians.</p>'+
    '<p><strong>Championship-bracket starts:</strong> '+pts(m.championshipStarterPoints)+' points. <strong>Other Weeks 15–17 games:</strong> '+pts(m.otherWeek15to17StartedPoints)+' points (excluded from playoff score).</p>'+
    (m.verifiedDrops.length?'<p><strong>Verified original-keeper releases:</strong> '+m.verifiedDrops.map(esc).join(', ')+'. No abandonment penalty has been applied.</p>':'')+
    '<p class="sub">Research weights: 55% weekly production, 30% draft-round context, 15% championship contribution.</p>':
    '<div class="detail-grid"><div><small>Weeks recorded</small><strong>1–8</strong><small>2026 season so far</small></div><div><small>Original-team keeper starts</small><strong>'+m.verifiedOriginalManagerStarts+'</strong><small>Both retained players</small></div><div><small>Draft capital context</small><strong>'+pts(m.nominalDraftCapital)+'</strong><small>Informational; not a score</small></div></div>'+
    '<p><strong>2026 verified keeper points:</strong> '+pts(m.regularStartedPoints)+' in original-manager starts, '+signed(m.regularVsStarterMedian)+' relative to same-week positional starter medians.</p>'+
    '<p class="sub">Season in progress: no 100-point score or certified keeper-release deductions. These are observed totals, not full-season predictions.</p>';
   return '<details class="entry"><summary><span class="rank">#'+(rank.indexOf(m.manager)+1)+'</span><span class="summary-name"><span class="name">'+esc(m.manager)+drops+'</span><span class="sub">'+m.keepers.map(k=>esc(k.name)+' (R'+k.round+')').join(' · ')+'</span></span><span class="value"><strong>'+ (isComplete?pts(m.researchScore):pts(m.regularStartedPoints)) +'</strong><small>'+(isComplete?'research / 100':'starter pts · 8 weeks')+'</small></span></summary><div class="detail">'+detail+'<p><strong>Kept:</strong> '+keeperNames+'</p><p class="sub">Official Keeper Decision grade: unavailable.</p><div class="actions"><a href="../managers/'+slugs[m.manager]+'/">View '+esc(m.manager)+' profile</a><a href="manager-report-cards.html?manager='+encodeURIComponent(m.manager)+'">Full report card</a></div></div></details>';
  }).join('')||'<p>No managers match this filter.</p>';
 }
 year.addEventListener('change',()=>{draw();updateUrl()});
 sort.addEventListener('change',draw);
 filter.addEventListener('change',()=>{draw();updateUrl()});
 draw();
}catch(err){target.innerHTML='<p class="error" role="alert">Keeper research is temporarily unavailable. No scores are shown until the source evidence can be loaded.</p>';console.error('Keeper decision research:',err)}
