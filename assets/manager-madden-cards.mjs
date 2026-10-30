import {managerCardTier} from './manager-card-tiers.mjs';
import {earnedArchetypes} from './manager-madden-archetypes.mjs';
import {seasonResume} from './manager-season-resume.mjs';
import {weeklyOvrHistory} from './manager-weekly-ovr.mjs';
import {makeRatings} from './fellas-rating-model.mjs';
import {makeReportCards} from './manager-report-card.mjs';
const files=['season_guide.json','career_core_generated.json','all_time_luck_ratings_v1.json','manager_verified_season_endings_v1.json','verified_espn_playoff_brackets_2016_2019.json','verified_sleeper_playoff_brackets_2020_2025.json','v9_draft_engine.json','v9_trade_engine.json','waiver_award_candidates.json','unified_record_book_2016_2026.json'];
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const active=new Set(['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott']);
const labelName={regular:'Regular-season winning',allPlay:'All-play performance',playoffs:'Playoff success',championships:'Championships',finals:'Championship game appearances',drafting:'Drafting',trading:'Trading',waivers:'Waiver pickups',lineups:'Start/sit decisions'};
const labelHelp={regular:'Win-loss performance over the recorded regular season, adjusted for sample size.',allPlay:'How often a manager would beat the rest of the league in the same week, regardless of actual opponent.',playoffs:'Verified championship-bracket qualifications; repeat appearances and recent success matter.',championships:'Verified league titles, weighted toward more recent seasons.',finals:'Verified runner-up finishes and championship-game appearances, weighted toward recent seasons.',drafting:'Estimated draft-pick value versus comparable managers. Provisional, based on available non-keeper picks.',trading:'Estimated value gained from verified trades. Provisional and limited by documented trade coverage.',waivers:'Free-agent and waiver acquisition skill. Not rated: full pickup and opportunity history is incomplete.',lineups:'Start/sit decision-making skill. Not rated: hindsight bench points do not prove pregame decision quality.'};
try {
 const [guide,careers,luck,endings,espn,brackets,drafts,trades,waivers,ledger]=await Promise.all(files.map(async name=>{const r=await fetch('../data/'+name,{cache:'no-store'});if(!r.ok)throw Error(name+': HTTP '+r.status);return r.json()}));
 const playoffBrackets=[...espn.seasons,...brackets.seasons];
 const ratings=makeRatings({guide,careers,luck,endings,playoffBrackets});
 const reports=makeReportCards({drafts,trades,careers,luck,waivers,endings,brackets,guide,espn});
 const byName=new Map(reports.map(r=>[r.name,r]));
 const weekly=weeklyOvrHistory({ledger,guide,careers,luck,endings,playoffBrackets});
 const managerOptions=ratings.filter(r=>active.has(r.name));
 for(const id of ['compare-a','compare-b'])$(''+id).innerHTML=managerOptions.map(r=>'<option value="'+esc(r.name)+'">'+esc(r.name)+'</option>').join('');
 $('compare-a').value='Stilly';$('compare-b').value='Thommy';
 const compare=()=>{
  const a=ratings.find(r=>r.name===$('compare-a').value),b=ratings.find(r=>r.name===$('compare-b').value),week=Number($('week').value);
  const result=$('duel-results');
  if(!a||!b||a.name===b.name){result.textContent='Choose two different managers.';return}
  const snapshot=weekly.find(x=>x.week===week),score=r=>snapshot.rows.find(x=>x.name===r.name)?.ovr;
  const aOvr=score(a),bOvr=score(b);
  if(!Number.isFinite(aOvr)||!Number.isFinite(bOvr)){result.textContent='A rating is unavailable for this comparison.';return}
  const attributes=[['Overall Rating',aOvr,bOvr],['Regular-season winning',byName.get(a.name)?.scores.regular,byName.get(b.name)?.scores.regular],['All-play performance',byName.get(a.name)?.scores.allPlay,byName.get(b.name)?.scores.allPlay],['Playoff success',a.breakdown.playoffs/10*100,b.breakdown.playoffs/10*100],['Championships',a.breakdown.titles/30*100,b.breakdown.titles/30*100],['Championship game appearances',a.breakdown.finals/5*100,b.breakdown.finals/5*100],['Drafting',byName.get(a.name)?.scores.drafting,byName.get(b.name)?.scores.drafting],['Trading',byName.get(a.name)?.scores.trading,byName.get(b.name)?.scores.trading],['Waiver pickups',null,null],['Start/sit decisions',null,null]];
  result.innerHTML='<table class="duel-table"><caption>Week '+week+' overall rating; other attributes use the current archive</caption><thead><tr><th scope="col">Attribute</th><th scope="col">'+esc(a.name)+'</th><th scope="col">'+esc(b.name)+'</th></tr></thead><tbody>'+attributes.map(([label,x,y])=>{const valid=Number.isFinite(x)&&Number.isFinite(y),win=valid?(x>y?1:x<y?2:0):0,format=v=>Number.isFinite(v)?v.toFixed(1):'N/A';return '<tr><th scope="row">'+esc(label)+'</th><td'+(win===1?' class="advantage"':'')+'>'+format(x)+'</td><td'+(win===2?' class="advantage"':'')+'>'+format(y)+'</td></tr>'}).join('')+'</tbody></table><p class="note">Gold highlights the higher available score; equal scores and N/A are not treated as wins.</p>';
 };
 $('compare-a').addEventListener('change',compare);$('compare-b').addEventListener('change',compare);
 const render=()=>{
  const selected=$('filter').value==='all'?ratings:ratings.filter(r=>active.has(r.name));
  const selectedWeek=Number($('week').value),snapshot=weekly.find(x=>x.week===selectedWeek);
  if(!snapshot)throw Error('Unverified week selected');
  const now=weekly.find(x=>x.week===Math.max(1,selectedWeek-1));
  $('cards').innerHTML=selected.map(r=>{
   const s=byName.get(r.name)?.scores||{};
   const archetypes=earnedArchetypes(r,byName.get(r.name));
   const archetype=archetypes[0];
   const tier=managerCardTier(r);
   const specialtyHtml=archetypes.slice(1).map(a=>'<span class="specialty" title="'+esc(a.reason)+'">'+esc(a.name)+(a.provisional?' · Provisional':'')+'</span>').join('');
   const historical=snapshot.rows.find(x=>x.name===r.name);
   const preceding=now?.rows.find(x=>x.name===r.name);
   const ovr=historical?.ovr??r.score;
   const componentLabels={titles:'Rings',finals:'Finals',playoffs:'Playoffs',regular:'W–L',allPlay:'All-play',recent:'Recent form',peak:'Peak',tenure:'Tenure'};
   const movements=historical&&preceding?Object.keys(historical.breakdown).map(k=>({label:componentLabels[k]||k,change:+(historical.breakdown[k]-preceding.breakdown[k]).toFixed(1)})).filter(x=>x.change!==0).sort((a,b)=>Math.abs(b.change)-Math.abs(a.change)):[];
   const explanation=movements.length?movements.slice(0,3).map(x=>x.label+' '+(x.change>0?'+':'')+x.change.toFixed(1)).join(' · '):'No component movement recorded';
   const delta=historical&&preceding?+(historical.ovr-preceding.ovr).toFixed(1):null;
   const trajectory=historical?weekly.filter(x=>x.week<=selectedWeek).map(x=>({week:x.week,ovr:x.rows.find(y=>y.name===r.name)?.ovr})):[];
   const previousChanges=trajectory.slice(1).map((x,i)=>({week:x.week,delta:+(x.ovr-trajectory[i].ovr).toFixed(1)}));
   const peak=trajectory.length?Math.max(...trajectory.map(x=>x.ovr)):null;
   const biggest=previousChanges.slice().sort((a,b)=>b.delta-a.delta)[0];
   const line=trajectory.map((x,i)=>{const min=0,max=100;return (i?i/(trajectory.length-1)*100:0)+','+(100-(x.ovr-min)/(max-min)*100)}).join(' ');
   const resume=seasonResume(r.name,careers,playoffBrackets,guide);
   const accomplishmentHtml='<div class="accomplishments"><div><strong>'+r.titleYears.length+'</strong><span>Championships</span><small>'+(r.titleYears.length?r.titleYears.join(', '):'None verified')+'</small></div><div><strong>'+r.qualifiedYears.length+'</strong><span>Playoff appearances</span><small>'+(r.qualifiedYears.length?r.qualifiedYears.join(', '):'None verified')+'</small></div><div><strong>'+r.tenure+'</strong><span>Completed seasons</span><small>Through 2025</small></div></div>';
   const seasonsHtml=resume.map(x=>'<div class="attr"><span>'+x.year+' · '+esc(x.record)+'</span><strong>'+esc(x.badge)+'</strong></div>').join('');
   const props=[['regular',s.regular],['allPlay',s.allPlay],['playoffs',r.breakdown.playoffs/10*100],['championships',r.breakdown.titles/30*100],['finals',r.breakdown.finals/5*100],['drafting',s.drafting],['trading',s.trading],['waivers',null],['lineups',null]];
   return '<article class="card tier-'+esc(tier.id)+'"><div class="tier-ribbon" title="'+esc(tier.reason)+'">'+esc(tier.name)+'</div><div class="top"><div><div class="rank">ALL-TIME RANK #'+r.rank+(r.historical?' · FORMER MANAGER':'')+'</div><h2>'+esc(r.name)+'</h2><div class="archetype">'+esc(archetype.name)+(archetype.provisional?' · Provisional':'')+'</div><div class="tag">'+esc(archetype.reason)+'</div>'+(specialtyHtml?'<div class="specialties"><span>Also earned:</span> '+specialtyHtml+'</div>':'')+'<div class="tag">'+esc(r.career)+' · '+r.titleYears.length+' titles · '+r.qualifiedYears.length+' verified playoff berths</div></div><div class="ovr">'+ovr.toFixed(1)+'<small>OVR'+(delta===null?'':' · '+(delta>0?'+':'')+delta.toFixed(1))+'</small></div></div><div class="attributes">'+props.map(([k,v])=>'<div class="attr" title="'+esc(labelHelp[k])+'"><span>'+esc(labelName[k])+'</span><strong>'+(Number.isFinite(v)?Math.round(v):'N/A')+'</strong></div>').join('')+'</div><div class="tag">'+(!historical?'Historical career OVR · no 2026 weekly games':delta===null?'Week 1 baseline':'OVR movement: '+esc(explanation))+'</div><div class="tag">'+(peak===null?'No 2026 weekly rating available':'2026 peak through W'+selectedWeek+': '+peak.toFixed(1)+' OVR')+' · Biggest rise: '+(biggest?(biggest.delta>0?'+':'')+biggest.delta.toFixed(1)+' (W'+biggest.week+')':'N/A')+'</div>'+(trajectory.length?'<svg role="img" aria-label="'+esc(r.name)+' OVR trend through week '+selectedWeek+'" viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:64px;margin-top:10px;overflow:visible"><polyline fill="none" stroke="#e3bc75" stroke-width="2" vector-effect="non-scaling-stroke" points="'+line+'"/></svg>':'')+accomplishmentHtml+'<details><summary>Season-by-season résumé ('+resume.length+')</summary><div class="attributes">'+seasonsHtml+'</div></details><div class="tag">Drafting and trading scores are provisional · Waiver and start/sit scores are unavailable</div></article>';
  }).join('');
  compare();
  $('status').textContent=selected.length+' manager cards · Week '+selectedWeek+' source-backed OVR (0.0–100.0) · '+Object.values(guide).filter(x=>x.champion).length+' completed championship seasons';
 };
 $('filter').addEventListener('change',render);$('week').addEventListener('change',render);render();
}catch(e){$('status').textContent='Rating data unavailable; no fallback scores shown.';$('cards').innerHTML='<p class="error">Could not verify required sources.</p>';console.error(e)}
