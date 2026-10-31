import {maddenOvr} from './manager-madden-scale.mjs';
import {makeRatings} from './fellas-rating-model.mjs';
import {managerCardTier} from './manager-card-tiers.mjs';
import {earnedArchetypes} from './manager-madden-archetypes.mjs';
const files=['season_guide.json','career_core_generated.json','all_time_luck_ratings_v1.json','manager_verified_season_endings_v1.json','verified_espn_playoff_brackets_2016_2019.json','verified_sleeper_playoff_brackets_2020_2025.json'];
const slug={Stilly:'stilly',Stew:'stew',Thommy:'tom',Stover:'stover',Birch:'birch',Tony:'tony',Mitch:'mitch',Kuhl:'kuhl',JMid:'jmid',Scott:'scott'};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try{
 const [guide,careers,luck,endings,espn,sleeper]=await Promise.all(files.map(async file=>{const response=await fetch('data/'+file,{cache:'no-store'});if(!response.ok)throw Error('Missing canonical source '+file);return response.json()}));
 const ratings=makeRatings({guide,careers,luck,endings,playoffBrackets:[...espn.seasons,...sleeper.seasons]});
 const current=ratings.filter(r=>Object.hasOwn(slug,r.name));
 const cards=document.getElementById('home-manager-cards');
 cards.innerHTML=current.map(r=>{
  const tier=managerCardTier(r),archetypes=earnedArchetypes(r),specialties=archetypes.slice(1).map(a=>a.name);
  return '<a class="home-manager-card home-tier-'+tier.id+'" href="managers/'+slug[r.name]+'/" aria-label="Open '+escape(r.name)+' manager profile, career Legacy OVR '+maddenOvr(r.score).toFixed(1)+'"><span class="home-card-edition">'+escape(tier.name)+'</span><span class="home-card-rank">ALL-TIME #'+r.rank+'</span><span class="home-card-name">'+escape(r.name)+'</span><span class="home-card-ovr">'+maddenOvr(r.score).toFixed(1)+'<small>LEGACY OVR</small></span><span class="home-card-archetype">'+escape(archetypes[0].name)+'</span><span class="home-card-resume">'+r.titleYears.length+' titles · '+r.qualifiedYears.length+' playoffs · '+escape(r.career)+'</span>'+(specialties.length?'<span class="home-card-specialties">'+escape(specialties.slice(0,2).join(' · '))+'</span>':'')+'<span class="home-card-open">View manager profile →</span></a>';
 }).join('');
 const compact=document.getElementById('home-manager-mobile');
 if(compact)compact.innerHTML=current.map(r=>{
  const tier=managerCardTier(r),rating=maddenOvr(r.score).toFixed(1),identity=earnedArchetypes(r)[0].name;
  return '<details data-manager-name="'+escape(r.name.toLowerCase())+'" data-manager-ovr="'+rating+'" class="mobile-manager-row mobile-tier-'+tier.id+'"><summary aria-label="Expand '+escape(r.name)+' manager rating"><span class="mobile-manager-badge">'+escape(identity)+'</span><strong class="mobile-manager-name">'+escape(r.name)+'</strong><span class="mobile-manager-ovr" aria-label="Legacy overall rating '+rating+'">'+rating+'</span><span class="mobile-manager-chevron" aria-hidden="true">⌄</span></summary><div class="mobile-manager-expanded"><div class="mobile-manager-metrics"><span><strong>#'+r.rank+'</strong> All-time</span><span><strong>'+r.titleYears.length+'</strong> Titles</span><span><strong>'+r.qualifiedYears.length+'</strong> Playoffs</span></div><p>Career record: <strong>'+escape(r.career)+'</strong></p><a class="mobile-manager-link" href="managers/'+slug[r.name]+'/">View '+escape(r.name)+'’s profile →</a></div></details>';
 }).join('');
 const finder=document.getElementById('home-manager-search');
 const clear=document.getElementById('home-manager-clear');
 const empty=document.getElementById('home-manager-empty');
 if(finder&&compact){
  const rows=[...compact.querySelectorAll('.mobile-manager-row')];
  function filter(){
   const query=finder.value.trim().toLocaleLowerCase();
   let visible=0;
   for(const row of rows){
    const match=row.dataset.managerName.includes(query);
    row.hidden=!match;
    if(!match)row.open=false;
    if(match)visible++;
   }
   if(clear)clear.hidden=!query;
   if(empty)empty.hidden=visible!==0;
  }
  const sorter=document.getElementById('home-manager-sort');
  function sortRows(){
   const mode=sorter?.value||'name';
   const sorted=[...rows].sort((a,b)=>{
    if(mode==='ovr-desc')return Number(b.dataset.managerOvr)-Number(a.dataset.managerOvr)||a.dataset.managerName.localeCompare(b.dataset.managerName);
    if(mode==='ovr-asc')return Number(a.dataset.managerOvr)-Number(b.dataset.managerOvr)||a.dataset.managerName.localeCompare(b.dataset.managerName);
    return a.dataset.managerName.localeCompare(b.dataset.managerName);
   });
   for(const row of sorted)compact.append(row);
  }
  sorter?.addEventListener('change',sortRows);
  sortRows();
  finder.addEventListener('input',filter);
  clear?.addEventListener('click',()=>{finder.value='';filter();finder.focus()});
 }
 document.getElementById('home-manager-status').textContent=current.length+' active manager profiles · Career Legacy OVR from verified league history · 2026 ongoing';
}catch(error){document.getElementById('home-manager-status').textContent='Manager ratings are temporarily unavailable; explore the complete cards or manager directory.';console.error(error)}
