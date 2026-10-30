import {weeklyOvrHistory} from './manager-weekly-ovr.mjs';
import {makeRatings} from './fellas-rating-model.mjs';
import {makeReportCards} from './manager-report-card.mjs';
const files=['season_guide.json','career_core_generated.json','all_time_luck_ratings_v1.json','manager_verified_season_endings_v1.json','verified_espn_playoff_brackets_2016_2019.json','verified_sleeper_playoff_brackets_2020_2025.json','v9_draft_engine.json','v9_trade_engine.json','waiver_award_candidates.json','unified_record_book_2016_2026.json'];
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const active=new Set(['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott']);
const label={regular:'WIN',allPlay:'ALL',playoffs:'PLY',championships:'RNG',finals:'FIN',drafting:'DRF',trading:'TRD',waivers:'WVR',lineups:'LUP'};
const labelName={regular:'Winning',allPlay:'All-play',playoffs:'Playoffs',championships:'Championships',finals:'Finals',drafting:'Drafting',trading:'Trading',waivers:'Waivers',lineups:'Start/sit'};
try {
 const [guide,careers,luck,endings,espn,brackets,drafts,trades,waivers,ledger]=await Promise.all(files.map(async name=>{const r=await fetch('../data/'+name,{cache:'no-store'});if(!r.ok)throw Error(name+': HTTP '+r.status);return r.json()}));
 const playoffBrackets=[...espn.seasons,...brackets.seasons];
 const ratings=makeRatings({guide,careers,luck,endings,playoffBrackets});
 const reports=makeReportCards({drafts,trades,careers,luck,waivers,endings,brackets,guide,espn});
 const byName=new Map(reports.map(r=>[r.name,r]));
 const weekly=weeklyOvrHistory({ledger,guide,careers,luck,endings,playoffBrackets});
 const render=()=>{
  const selected=$('filter').value==='all'?ratings:ratings.filter(r=>active.has(r.name));
  const selectedWeek=Number($('week').value),snapshot=weekly.find(x=>x.week===selectedWeek);
  if(!snapshot)throw Error('Unverified week selected');
  const now=weekly.find(x=>x.week===Math.max(1,selectedWeek-1));
  $('cards').innerHTML=selected.map(r=>{
   const s=byName.get(r.name)?.scores||{};
   const historical=snapshot.rows.find(x=>x.name===r.name);
   const preceding=now?.rows.find(x=>x.name===r.name);
   const ovr=historical?.ovr??r.score;
   const componentLabels={titles:'Rings',finals:'Finals',playoffs:'Playoffs',regular:'W–L',allPlay:'All-play',recent:'Recent form',peak:'Peak',tenure:'Tenure'};
   const movements=historical&&preceding?Object.keys(historical.breakdown).map(k=>({label:componentLabels[k]||k,change:+(historical.breakdown[k]-preceding.breakdown[k]).toFixed(1)})).filter(x=>x.change!==0).sort((a,b)=>Math.abs(b.change)-Math.abs(a.change)):[];
   const explanation=movements.length?movements.slice(0,3).map(x=>x.label+' '+(x.change>0?'+':'')+x.change.toFixed(1)).join(' · '):'No component movement recorded';
   const delta=historical&&preceding?+(historical.ovr-preceding.ovr).toFixed(1):null;
   const trajectory=weekly.filter(x=>x.week<=selectedWeek).map(x=>({week:x.week,ovr:x.rows.find(y=>y.name===r.name)?.ovr}));
   const previousChanges=trajectory.slice(1).map((x,i)=>({week:x.week,delta:+(x.ovr-trajectory[i].ovr).toFixed(1)}));
   const peak=Math.max(...trajectory.map(x=>x.ovr));
   const biggest=previousChanges.slice().sort((a,b)=>b.delta-a.delta)[0];
   const line=trajectory.map((x,i)=>{const min=0,max=100;return (i?i/(trajectory.length-1)*100:0)+','+(100-(x.ovr-min)/(max-min)*100)}).join(' ');
   const props=[['regular',s.regular],['allPlay',s.allPlay],['playoffs',r.breakdown.playoffs/10*100],['championships',r.breakdown.titles/30*100],['finals',r.breakdown.finals/5*100],['drafting',s.drafting],['trading',s.trading],['waivers',null],['lineups',null]];
   return '<article class="card"><div class="top"><div><div class="rank">ALL-TIME RANK #'+r.rank+(r.historical?' · FORMER MANAGER':'')+'</div><h2>'+esc(r.name)+'</h2><div class="tag">'+esc(r.career)+' · '+r.titleYears.length+' titles · '+r.qualifiedYears.length+' verified playoff berths</div></div><div class="ovr">'+ovr.toFixed(1)+'<small>OVR'+(delta===null?'':' · '+(delta>0?'+':'')+delta.toFixed(1))+'</small></div></div><div class="attributes">'+props.map(([k,v])=>'<div class="attr"><span title="'+labelName[k]+'">'+label[k]+'</span><strong>'+(Number.isFinite(v)?Math.round(v):'N/A')+'</strong></div>').join('')+'</div><div class="tag">'+(delta===null?'Week 1 baseline':'OVR movement: '+esc(explanation))+'</div><div class="tag">2026 peak through W'+selectedWeek+': '+peak.toFixed(1)+' OVR · Biggest rise: '+(biggest?(biggest.delta>0?'+':'')+biggest.delta.toFixed(1)+' (W'+biggest.week+')':'N/A')+'</div><svg role="img" aria-label="'+esc(r.name)+' OVR trend through week '+selectedWeek+'" viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:64px;margin-top:10px;overflow:visible"><polyline fill="none" stroke="#e3bc75" stroke-width="2" vector-effect="non-scaling-stroke" points="'+line+'"/></svg><div class="tag">DRF / TRD are provisional evidence-limited grades · WVR / LUP unavailable</div></article>';
  }).join('');
  $('status').textContent=selected.length+' manager cards · Week '+selectedWeek+' source-backed OVR (0.0–100.0) · '+Object.values(guide).filter(x=>x.champion).length+' completed championship seasons';
 };
 $('filter').addEventListener('change',render);$('week').addEventListener('change',render);render();
}catch(e){$('status').textContent='Rating data unavailable; no fallback scores shown.';$('cards').innerHTML='<p class="error">Could not verify required sources.</p>';console.error(e)}
