
import {makeRatings,WEIGHTS} from './fellas-rating-model.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const slugs={Stilly:'stilly',Stew:'stew',Thommy:'tom',Stover:'stover',Birch:'birch',Tony:'tony',Mitch:'mitch',Kuhl:'kuhl',JMid:'jmid',Scott:'scott'};
try{
 const paths=['season_guide.json','career_core_generated.json','all_time_luck_ratings_v1.json','manager_verified_season_endings_v1.json'];
 const [guide,careers,luck,endings]=await Promise.all(paths.map(async p=>{const r=await fetch('../data/'+p,{cache:'no-store'});if(!r.ok)throw Error('Missing '+p);return r.json()}));
 const rows=makeRatings({guide,careers,luck,endings});
 const names={titles:'Rings',finals:'Finals',regular:'W–L',allPlay:'All-play',recent:'Form',peak:'Peak',tenure:'Tenure'};
 document.getElementById('ranking').innerHTML=rows.map(row=>'<article class="card" data-rating-manager="'+esc(row.name)+'"><div class="place">#'+row.rank+'</div><div><div class="name"><a href="../managers/'+slugs[row.name]+'/">'+esc(row.name)+'</a></div><div class="fine">'+row.career+' career · '+row.titleYears.length+' title'+(row.titleYears.length===1?'':'s')+' · '+row.tenure+' finished seasons</div><div class="bar"><span style="width:'+row.score+'%"></span></div><div class="components">'+Object.entries(row.breakdown).map(([k,v])=>'<div class="component">'+names[k]+'<strong>'+v.toFixed(1)+' / '+WEIGHTS[k]+'</strong></div>').join('')+'</div></div><div class="score">'+row.score.toFixed(1)+'<small>of 100</small></div></article>').join('');
}catch(e){document.getElementById('ranking').innerHTML='<p class="error">Rating archive could not be loaded. No fallback scores are shown.</p>';console.error(e)}
