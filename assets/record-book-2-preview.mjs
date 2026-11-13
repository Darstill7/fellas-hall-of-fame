// Review-only browser UI. All numbers come from the generated static registry projection.
// No direct production-data writes, no invented game URLs, no hidden certification upgrades.
const $=s=>document.querySelector(s);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=x=>String(x??'');
const norm=x=>x==='Tom'?'Thommy':x;
const urlParam=new URL(location.href);
const fmt=(v,unit='')=>{
 if(v===undefined||v===null)return '—';
 const n=Number(v),x=Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:2}):clean(v);
 return x+(unit==='%'?'%':unit==='score / 100'?'/100':unit?' '+unit:'');
};
const link=(id)=>'#record-'+encodeURIComponent(id);
const sourceHref=(path)=>{
 if(!path||!/^([\w.-]+\/)*[\w.-]+$/.test(path))return null;
 return 'https://github.com/Darstill7/fellas-hall-of-fame/blob/research/record-book-2-audit-20261113/'+path;
};
const sourceText=(r)=>r.source||r.sourceGenerator||'Source cited in research audit';
const evidenceText=x=>{
 if(!x)return 'Archived league evidence';
 const parts=[];
 if(x.year)parts.push(String(x.year));
 if(x.week)parts.push('Week '+x.week);
 if(x.opponent)parts.push('vs '+norm(x.opponent));
 if(x.evidence?.fromYear&&x.evidence?.toYear)parts.push(x.evidence.fromYear+' → '+x.evidence.toYear);
 if(x.evidence?.points!==undefined&&x.evidence?.opponentPoints!==undefined)
   parts.push(fmt(x.evidence.points)+'–'+fmt(x.evidence.opponentPoints));
 if(x.years?.length)parts.push(x.years.join(', '));
 return parts.join(' · ')||'See source ledger for methodology';
};
const isResearch=r=>r.status==='candidate-awaiting-certification';
const normGroup=r=>r.family||'Other';
const statLabel=r=>isResearch(r)?'Provisional research':'Archived source';
const displayName=m=>norm(m);
let dataset,recordsById,portfolioFilter='all',selectedManager='Stilly';
function buildSummary(person){
 const rows=person.recordPlacements;
 // Current published winner counts may include negative records; label as rank placements.
 const first=rows.filter(x=>x.rank===1).length;
 const top3=rows.filter(x=>x.rank<=3).length;
 const completed=rows.filter(x=>!isResearch(recordsById.get(x.id))&&
    recordsById.get(x.id)?.family!=='Legendary').length;
 const slug=person.manager==='Thommy'?'tom':person.manager.toLowerCase();
 const isCurrent=dataset.currentManagers.includes(person.manager);
 return '<div class="summary"><div class="summary-head"><div><div class="eyebrow">Franchise record dossier</div>'
 +'<h3>'+esc(displayName(person.manager))+'</h3><p>All known category placements are generated from the same record registry as the league archive. First-place counts include historical lowlights and ties; they are not championship totals.</p></div>'
 +(isCurrent?'<a class="summary-link" href="../managers/'+encodeURIComponent(slug)+'/">Manager biography ↗</a>':'<span class="label">Historical manager</span>')
 +'</div><div class="stat-row"><div class="stat"><strong>'+rows.length+'</strong><span>Known placements</span></div>'
 +'<div class="stat"><strong>'+first+'</strong><span>No. 1 ranks (all types)</span></div>'
 +'<div class="stat"><strong>'+top3+'</strong><span>Top-three marks</span></div></div>'
 +'<p class="scope" style="margin-top:13px">Existing numeric-category placements: '+completed+' · Research and narratives are labeled below</p></div>';
}
function renderManager(){
 const person=dataset.managers.find(x=>x.manager===selectedManager)||dataset.managers[0];
 $('#manager-summary').innerHTML=buildSummary(person);
 const entries=person.recordPlacements.filter(x=>{
  const r=recordsById.get(x.id);if(!r)return false;
  if(portfolioFilter==='first')return x.rank===1;
  if(portfolioFilter==='top3')return x.rank<=3;
  if(portfolioFilter==='research')return isResearch(r);
  return true;
 }).sort((a,b)=>a.rank-b.rank||String(recordsById.get(a.id)?.family).localeCompare(String(recordsById.get(b.id)?.family))||a.id.localeCompare(b.id));
 $('#manager-results').innerHTML=entries.length?'<div class="result-count">'+entries.length+' category placements for '+esc(person.manager)+'</div><div class="portfolio-rows">'+entries.map(x=>{
 const r=recordsById.get(x.id),mark=r.managerBest.find(y=>y.manager===person.manager&&y.rank===x.rank)||r.managerBest.find(y=>y.manager===person.manager);
 const context=evidenceText(mark),status=statLabel(r);
 return '<article class="portfolio-record"><div class="ranking"><strong>#'+esc(x.rank)+'</strong><span>League rank</span></div>'
  +'<div class="record-caption"><h3><a href="'+esc(link(r.id))+'">'+esc(r.title)+'</a></h3><p>'+esc(r.family)+' · '+esc(context)+'</p><span class="label '+(isResearch(r)?'provisional':'')+'">'+esc(status)+'</span></div>'
  +'<div class="record-value">'+esc(fmt(x.value??mark?.value??r.metric,r.unit))+'</div></article>';
 }).join('')+'</div>':'<div class="empty">No entries in this filter. Choose another record type.</div>';
}
function renderRecord(r){
 const holders=r.knownLeaders||[],top=(r.leaders||[]).slice(0,7);
 // For Legendary records, text-based metrics and owner stories are the evidence.
 const held=holders.map(x=>displayName(x.manager)).filter((x,i,a)=>a.indexOf(x)===i);
 const names=held.length?held.join(' · '):'Unassigned';
 const mark=holders.length&&holders[0].value!==undefined&&holders[0].value!==null?fmt(holders[0].value,r.unit):r.metric;
 const source=sourceHref(sourceText(r));
 const status=statLabel(r);
 return '<article class="record-card" id="record-'+esc(r.id)+'"><div class="statusline"><span class="kicker">'+esc(normGroup(r))+'</span><span class="label '+(isResearch(r)?'provisional':'')+'">'+esc(status)+'</span></div>'
 +'<h3>'+esc(r.title)+'</h3><p class="holder">'+esc(names)+'</p>'
 +(mark?'<p class="metric">'+esc(mark)+'</p>':'')
 +(r.description?'<p>'+esc(r.description)+'</p>':'')
 +'<p>'+esc(r.coverage||'')+'</p>'
 +(r.eligibility?'<p>Rule: '+esc(r.eligibility)+'</p>':'')
 +'<details><summary>Evidence and ranking details</summary>'
 +(top.length?'<ul>'+top.map(x=>'<li>#'+esc(x.rank)+' '+esc(displayName(x.manager))+' — '+esc(fmt(x.value,r.unit))+' · '+esc(evidenceText(x))+'</li>').join('')+'</ul>':
    '<p>Historical exhibit. Source-linked narrative, not a numerical full-league ranking.</p>')
 +'<p>Manager index: '+(r.complete?'complete within recorded scope':'not a complete numerical ranking')+'</p>'
 +'<p>Source: '+esc(sourceText(r))+'</p>'
 +(source?'<a class="source" href="'+esc(source)+'" target="_blank" rel="noopener noreferrer">Inspect source dataset ↗</a>':'')
 +'</details></article>';
}
function renderCatalog(){
 const q=$('#record-search').value.trim().toLowerCase(),family=$('#family-picker').value,status=$('#status-picker').value;
 const filtered=dataset.records.filter(r=>{
  if(family!=='all'&&r.family!==family)return false;
  if(status==='research'&&!isResearch(r))return false;
  if(status==='existing'&&isResearch(r))return false;
  if(!q)return true;
  return [r.id,r.title,r.family,r.description,...(r.knownLeaders||[]).map(x=>x.manager)].some(s=>clean(s).toLowerCase().includes(q));
 });
 $('#results-count').textContent=filtered.length+' of '+dataset.records.length+' record and exhibit IDs in view. Research candidates are not certified public records.';
 $('#record-catalog').innerHTML=filtered.length?filtered.map(renderRecord).join(''):'<div class="empty">No records match. Try a broader search.</div>';
}
function syncManager(){
 const u=new URL(location.href);u.searchParams.set('manager',selectedManager);
 history.replaceState(null,'',u);
 renderManager();
}
async function start(){
 try{
  const res=await fetch('../data/record_book_2_preview.json',{cache:'no-cache'});
  if(!res.ok)throw Error('Preview registry not generated ('+res.status+')');
  dataset=await res.json();
  if(dataset.schema!=='fellas-record-book-2-static-preview-v1'||dataset.published!==false)throw Error('Unsupported preview manifest');
  dataset.currentManagers=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
  recordsById=new Map(dataset.records.map(r=>[r.id,r]));
  const managers=dataset.managers.map(x=>x.manager);
  selectedManager=managers.includes(urlParam.searchParams.get('manager'))?urlParam.searchParams.get('manager'):'Stilly';
  $('#manager-picker').innerHTML=managers.map(m=>'<option value="'+esc(m)+'">'+esc(m)+'</option>').join('');
  $('#manager-picker').value=selectedManager;
  const groups=[...new Set(dataset.records.map(r=>r.family))].sort();
  $('#family-picker').innerHTML='<option value="all">All categories</option>'+groups.map(g=>'<option value="'+esc(g)+'">'+esc(g)+'</option>').join('');
  $('#scope').textContent=dataset.records.length+' indexed records and exhibits · '+dataset.coverage.completeRankingCategories+
    ' complete statistical indexes · '+dataset.managers.length+' manager dossiers · '+dataset.cutoff;
  $('#manager-picker').addEventListener('change',e=>{selectedManager=e.target.value;syncManager()});
  $('#manager-filters').addEventListener('click',e=>{
   const btn=e.target.closest('button[data-pf]');if(!btn)return;
   portfolioFilter=btn.dataset.pf;
   $('#manager-filters').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
   renderManager();
  });
  for(const s of ['#record-search','#family-picker','#status-picker'])
   $(s).addEventListener(s==='#record-search'?'input':'change',renderCatalog);
  renderManager();renderCatalog();
 }catch(err){
  const m='Preview data unavailable: '+err.message+'. Run the review-only registry build before using this page.';
  $('#manager-summary').textContent=m;$('#manager-results').textContent='';
  $('#record-catalog').innerHTML='<p class="empty">'+esc(m)+'</p>';
  $('#scope').textContent='Preview is not ready';
 }
}
start();
