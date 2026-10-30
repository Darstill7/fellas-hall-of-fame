import {makeRatings} from './fellas-rating-model.mjs';
import {earnedArchetypes} from './manager-madden-archetypes.mjs';
import {managerCardTier} from './manager-card-tiers.mjs';
import {weeklyOvrHistory} from './manager-weekly-ovr.mjs';
const slugName={stilly:'Stilly',stew:'Stew',tom:'Thommy',stover:'Stover',birch:'Birch',tony:'Tony',mitch:'Mitch',kuhl:'Kuhl',jmid:'JMid',scott:'Scott'};
const segments=location.pathname.split('/').filter(Boolean);
const slug=segments.at(-1)==='index.html'?segments.at(-2):segments.at(-1);
const name=slugName[slug];
if(name){
 const host=document.createElement('section');
 host.className='profile-madden';host.setAttribute('aria-label','Manager Madden scouting report');
 host.innerHTML='<p role="status">Loading verified Madden scouting report…</p>';
 const hero=document.querySelector('main .hero');hero?.after(host);
 const style=document.createElement('style');
 style.textContent=`.profile-madden{--accent:#8caec4;border:2px solid var(--accent);border-radius:18px;padding:22px;margin:5px 0 34px;background:linear-gradient(140deg,#2a4053,#122534);box-shadow:0 12px 34px #0007}.profile-madden.tier-dynasty{--accent:#f5cd54;background:radial-gradient(ellipse at 90% 0,#b3893080,transparent 50%),linear-gradient(140deg,#79561c,#30250d 65%,#15232c)}.profile-madden.tier-champion{--accent:#e7f0ff;background:radial-gradient(ellipse at 90% 0,#dceafa79,transparent 50%),linear-gradient(140deg,#697f94,#2a4053 65%,#132532)}.profile-madden.tier-contender{--accent:#75efd5;background:linear-gradient(140deg,#256b64,#163d42 70%,#102532)}.profile-madden-header{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}.profile-madden-label{font-weight:900;text-transform:uppercase;letter-spacing:.11em;font-size:11px;color:var(--accent)}.profile-madden-ovr{font-size:48px;font-weight:950;line-height:1;color:var(--accent)}.profile-madden-ovr small{font-size:12px}.profile-madden-facts{display:flex;flex-wrap:wrap;gap:9px;margin:16px 0}.profile-madden-facts span{background:#071722b8;border:1px solid #ffffff44;padding:8px 11px;border-radius:8px;font-size:12px}.profile-madden-trend{width:100%;height:70px;display:block}.profile-madden a{color:var(--accent);font-weight:800;text-decoration:underline;text-underline-offset:4px}.profile-madden .disclaimer{font-size:12px;color:#e0e5e8}`;
 document.head.append(style);
 const files=['season_guide.json','career_core_generated.json','all_time_luck_ratings_v1.json','manager_verified_season_endings_v1.json','verified_espn_playoff_brackets_2016_2019.json','verified_sleeper_playoff_brackets_2020_2025.json','unified_record_book_2016_2026.json'];
 try{
  const [guide,careers,luck,endings,espn,sleeper,ledger]=await Promise.all(files.map(async p=>{const response=await fetch('../../data/'+p,{cache:'no-store'});if(!response.ok)throw Error('Missing verified source: '+p);return response.json()}));
  const playoffBrackets=[...espn.seasons,...sleeper.seasons],rankings=makeRatings({guide,careers,luck,endings,playoffBrackets}),manager=rankings.find(r=>r.name===name);
  if(!manager)throw Error('Manager not present in canonical ratings');
  const archetypes=earnedArchetypes(manager),tier=managerCardTier(manager),history=weeklyOvrHistory({ledger,guide,careers,luck,endings,playoffBrackets}),points=history.map(w=>w.rows.find(r=>r.name===name)?.ovr);
  const latest=points.at(-1),previous=points.at(-2),delta=latest!=null&&previous!=null?Math.round((latest-previous)*10)/10:null;
  const trace=points.map((v,i)=>[points.length===1?0:i/(points.length-1)*100,100-v].join(',')).join(' ');
  host.classList.add('tier-'+tier.id);
  host.innerHTML='<div class="profile-madden-header"><div><div class="profile-madden-label">'+tier.name+' · All-time rank #'+manager.rank+'</div><h2 style="margin:6px 0">'+name+' · Madden scouting report</h2><div>'+archetypes[0].name+'</div></div><div class="profile-madden-ovr">'+manager.score.toFixed(1)+' <small>OVR</small></div></div><div class="profile-madden-facts"><span>'+manager.titleYears.length+' Championships</span><span>'+manager.qualifiedYears.length+' Playoff appearances</span><span>'+manager.career+' Career record</span>'+archetypes.slice(1).map(a=>'<span>'+a.name+(a.provisional?' (provisional)':'')+'</span>').join('')+'</div><p class="disclaimer">2026 weekly rating trend · verified through Week '+history.at(-1).week+(delta===null?'':' · latest change '+(delta>0?'+':'')+delta.toFixed(1))+'</p><svg class="profile-madden-trend" role="img" aria-label="Verified 2026 weekly OVR progression" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline fill="none" stroke="var(--accent)" stroke-width="3" vector-effect="non-scaling-stroke" points="'+trace+'"/></svg><p><a href="../../analytics/manager-madden-cards.html">Compare every manager and view rating explanations →</a></p><p class="disclaimer">Overall rating is based on verified achievements and results. Drafting and trading estimates are provisional; waiver and lineup grades remain unavailable.</p>';
 }catch(error){host.innerHTML='<p role="status">Madden scouting information is currently unavailable. Historical profile content remains accessible.</p>';console.error(error)}
}
