import {makeRatings} from './fellas-rating-model.mjs';
import {makeReportCards} from './manager-report-card.mjs';
const files=['season_guide.json','career_core_generated.json','all_time_luck_ratings_v1.json','manager_verified_season_endings_v1.json','verified_espn_playoff_brackets_2016_2019.json','verified_sleeper_playoff_brackets_2020_2025.json','v9_draft_engine.json','v9_trade_engine.json','waiver_award_candidates.json'];
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const active=new Set(['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott']);
const label={regular:'WIN',allPlay:'ALL',playoffs:'PLY',championships:'RNG',finals:'FIN',drafting:'DRF',trading:'TRD',waivers:'WVR',lineups:'LUP'};
const labelName={regular:'Winning',allPlay:'All-play',playoffs:'Playoffs',championships:'Championships',finals:'Finals',drafting:'Drafting',trading:'Trading',waivers:'Waivers',lineups:'Start/sit'};
try {
 const [guide,careers,luck,endings,espn,brackets,drafts,trades,waivers]=await Promise.all(files.map(async name=>{const r=await fetch('../data/'+name,{cache:'no-store'});if(!r.ok)throw Error(name+': HTTP '+r.status);return r.json()}));
 const playoffBrackets=[...espn.seasons,...brackets.seasons];
 const ratings=makeRatings({guide,careers,luck,endings,playoffBrackets});
 const reports=makeReportCards({drafts,trades,careers,luck,waivers,endings,brackets,guide,espn});
 const byName=new Map(reports.map(r=>[r.name,r]));
 const render=()=>{
  const selected=$('filter').value==='all'?ratings:ratings.filter(r=>active.has(r.name));
  $('cards').innerHTML=selected.map(r=>{
   const s=byName.get(r.name)?.scores||{};
   const props=[['regular',s.regular],['allPlay',s.allPlay],['playoffs',r.breakdown.playoffs/10*100],['championships',r.breakdown.titles/30*100],['finals',r.breakdown.finals/5*100],['drafting',s.drafting],['trading',s.trading],['waivers',null],['lineups',null]];
   return '<article class="card"><div class="top"><div><div class="rank">ALL-TIME RANK #'+r.rank+(r.historical?' · FORMER MANAGER':'')+'</div><h2>'+esc(r.name)+'</h2><div class="tag">'+esc(r.career)+' · '+r.titleYears.length+' titles · '+r.qualifiedYears.length+' verified playoff berths</div></div><div class="ovr">'+r.score.toFixed(1)+'<small>OVR</small></div></div><div class="attributes">'+props.map(([k,v])=>'<div class="attr"><span title="'+labelName[k]+'">'+label[k]+'</span><strong>'+(Number.isFinite(v)?Math.round(v):'N/A')+'</strong></div>').join('')+'</div><div class="tag">DRF / TRD are provisional evidence-limited grades · WVR / LUP unavailable</div></article>';
  }).join('');
  $('status').textContent=selected.length+' manager cards · source-backed OVR (0.0–100.0) · '+Object.values(guide).filter(x=>x.champion).length+' completed championship seasons';
 };
 $('filter').addEventListener('change',render);render();
}catch(e){$('status').textContent='Rating data unavailable; no fallback scores shown.';$('cards').innerHTML='<p class="error">Could not verify required sources.</p>';console.error(e)}
