import {historicalOvrHistory,singleSeasonOvrHistory} from './manager-historical-ovr.mjs';
import {maddenOvr,seasonMaddenOvr} from './manager-madden-scale.mjs';
import {managerCardTier} from './manager-card-tiers.mjs';
import {earnedArchetypes} from './manager-madden-archetypes.mjs';
import {seasonResume} from './manager-season-resume.mjs';
import {weeklyOvrHistory} from './manager-weekly-ovr.mjs';
import {makeRatings} from './fellas-rating-model.mjs';
import {makeReportCards} from './manager-report-card.mjs';
const files=['season_guide.json','career_core_generated.json','all_time_luck_ratings_v1.json','manager_verified_season_endings_v1.json','verified_espn_playoff_brackets_2016_2019.json','verified_sleeper_playoff_brackets_2020_2025.json','v9_draft_engine.json','v9_trade_engine.json','waiver_award_candidates.json','unified_record_book_2016_2026.json'];
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const profileSlug={Stilly:'stilly',Stew:'stew',Thommy:'tom',Stover:'stover',Birch:'birch',Tony:'tony',Mitch:'mitch',Kuhl:'kuhl',JMid:'jmid',Scott:'scott'};
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
 const historicalSeasons=historicalOvrHistory({guide,careers,luck,endings,playoffBrackets});
 const seasonOnly=singleSeasonOvrHistory({guide,careers,luck,playoffBrackets});
 const years=historicalSeasons.map(s=>s.year);
 $('history-year').innerHTML=years.slice().reverse().map(y=>'<option value="'+y+'">'+y+'</option>').join('');
 const renderHistorical=()=>{
  const year=Number($('history-year').value),season=historicalSeasons.find(s=>s.year===year);
  if(!season)throw Error('Unverified historical year selected');
  const rows=season.rows.slice().sort((a,b)=>a.rank-b.rank);
  $('history-leaderboard').querySelector('tbody').innerHTML=rows.map(r=>'<tr><td>#'+r.rank+'</td><th scope="row">'+esc(r.name)+'</th><td><strong>'+maddenOvr(r.ovr).toFixed(1)+'</strong></td><td>'+r.titles+'</td><td>'+r.playoffs+'</td></tr>').join('');
  const single=seasonOnly.find(s=>s.year===year);
  $('season-ovr-leaderboard').querySelector('tbody').innerHTML=single.rows.map(r=>'<tr><td>#'+r.rank+'</td><th scope="row">'+esc(r.name)+'</th><td><strong>'+seasonMaddenOvr(r.score).toFixed(1)+'</strong></td><td>'+esc(r.record)+'</td><td>'+r.allPlayPct.toFixed(1)+'%</td><td>'+(r.champion?'Champion':r.finalist?'Runner-Up':r.playoff?'Playoffs':'—')+'</td></tr>').join('');
  $('history-status').textContent=year+' complete · '+rows.length+' verified managers ranked · historical OVR uses a stable 65–99 Madden presentation scale';
 };
 $('history-year').addEventListener('change',renderHistorical);
 renderHistorical();
 const seasonRecords=seasonOnly.flatMap(s=>s.rows).slice();
 const priorByManager=new Map();
 const changes=[];
 for(const row of seasonRecords.slice().sort((a,b)=>a.year-b.year)){
  const previous=priorByManager.get(row.name);
  if(previous&&previous.year===row.year-1)changes.push({...row,delta:+(seasonMaddenOvr(row.score)-seasonMaddenOvr(previous.score)).toFixed(1),priorYear:previous.year});
  priorByManager.set(row.name,row);
 }
 const seasonManagers=[...new Set(seasonRecords.map(r=>r.name))].sort((a,b)=>a.localeCompare(b));
 $('season-record-manager').innerHTML='<option value="all">All managers</option>'+seasonManagers.map(name=>'<option value="'+esc(name)+'">'+esc(name)+'</option>').join('');
 const renderSeasonRecords=()=>{
  const category=$('season-extreme').value,selected=$('season-record-manager').value;
  const movement=category==='improvements'||category==='declines';
  const source=movement?changes:seasonRecords;
  const sorted=source.filter(r=>(selected==='all'||r.name===selected)&&(category!=='champions'||r.champion)&&(category!=='nonchampions'||!r.champion)).sort((a,b)=>movement?(category==='declines'?a.delta-b.delta:b.delta-a.delta)||a.year-b.year||a.name.localeCompare(b.name):(category==='worst'?a.score-b.score:b.score-a.score)||a.year-b.year||a.name.localeCompare(b.name));
  $('season-records').querySelector('tbody').innerHTML=sorted.slice(0,20).map((r,i)=>'<tr><td>#'+(i+1)+'</td><th scope="row">'+esc(r.name)+'</th><td>'+r.year+'</td><td title="Win percentage: '+r.regularWinPct.toFixed(1)+'%; all-play percentage: '+r.allPlayPct.toFixed(1)+'%"><strong>'+seasonMaddenOvr(r.score).toFixed(1)+(movement?' ('+(r.delta>0?'+':'')+r.delta.toFixed(1)+' vs '+r.priorYear+')':'')+'</strong></td><td>'+esc(r.record)+'</td><td>'+(r.champion?'Champion':r.finalist?'Runner-Up':r.playoff?'Playoffs':'—')+'</td></tr>').join('');
 };
 $('season-extreme').addEventListener('change',renderSeasonRecords);
 const requestedManager=new URLSearchParams(location.search).get('manager');
 if(requestedManager&&seasonManagers.includes(requestedManager))$('season-record-manager').value=requestedManager;
 $('season-record-manager').addEventListener('change',renderSeasonRecords);
 renderSeasonRecords();
 if(!weekly.length)throw Error('No complete canonical weekly ratings available');
 $('week').innerHTML=weekly.slice().reverse().map((w,i)=>'<option value="'+w.week+'">Week '+w.week+(i===0?' (latest verified)':'')+'</option>').join('');
 const managerOptions=ratings.filter(r=>active.has(r.name));
 for(const id of ['compare-a','compare-b'])$(''+id).innerHTML=managerOptions.map(r=>'<option value="'+esc(r.name)+'">'+esc(r.name)+'</option>').join('');
 $('compare-a').value='Stilly';$('compare-b').value='Thommy';
 const historicalComparison=(nameA,nameB)=>{
  const rows=historicalSeasons.map(season=>{
   const a=season.rows.find(r=>r.name===nameA),b=season.rows.find(r=>r.name===nameB);
   if(!a&&!b)return '';
   const cell=r=>r?maddenOvr(r.ovr).toFixed(1)+' · #'+r.rank:'—';
   return '<tr><th scope="row">'+season.year+'</th><td>'+cell(a)+'</td><td>'+cell(b)+'</td></tr>';
  }).filter(Boolean);
  return '<details class="duel-history"><summary>Compare historical year-end OVR ('+rows.length+' seasons)</summary><p class="note">Retrospective Madden-scale scores and rankings, using only verified results available at each season end. A dash means the manager was not ranked in that season.</p><div class="duel-scroll"><table class="duel-table"><caption>Year-end OVR · league rank</caption><thead><tr><th scope="col">Season</th><th scope="col">'+esc(nameA)+'</th><th scope="col">'+esc(nameB)+'</th></tr></thead><tbody>'+rows.join('')+'</tbody></table></div></details>';
 };
 const compare=()=>{
  const a=ratings.find(r=>r.name===$('compare-a').value),b=ratings.find(r=>r.name===$('compare-b').value),week=Number($('week').value);
  const result=$('duel-results');
  if(!a||!b||a.name===b.name){result.textContent='Choose two different managers.';return}
  const snapshot=weekly.find(x=>x.week===week),score=r=>snapshot.rows.find(x=>x.name===r.name)?.ovr;
  const aOvr=maddenOvr(score(a)),bOvr=maddenOvr(score(b));
  if(!Number.isFinite(aOvr)||!Number.isFinite(bOvr)){result.textContent='A rating is unavailable for this comparison.';return}
  const attributes=[['Overall Rating',aOvr,bOvr],['Regular-season winning',byName.get(a.name)?.scores.regular,byName.get(b.name)?.scores.regular],['All-play performance',byName.get(a.name)?.scores.allPlay,byName.get(b.name)?.scores.allPlay],['Playoff success',a.breakdown.playoffs/10*100,b.breakdown.playoffs/10*100],['Championships',a.breakdown.titles/30*100,b.breakdown.titles/30*100],['Championship game appearances',a.breakdown.finals/5*100,b.breakdown.finals/5*100],['Drafting',byName.get(a.name)?.scores.drafting,byName.get(b.name)?.scores.drafting],['Trading',byName.get(a.name)?.scores.trading,byName.get(b.name)?.scores.trading],['Waiver pickups',null,null],['Start/sit decisions',null,null]];
  result.innerHTML='<table class="duel-table"><caption>Week '+week+' overall rating; other attributes use the current archive</caption><thead><tr><th scope="col">Attribute</th><th scope="col">'+esc(a.name)+'</th><th scope="col">'+esc(b.name)+'</th></tr></thead><tbody>'+attributes.map(([label,x,y])=>{const valid=Number.isFinite(x)&&Number.isFinite(y),win=valid?(x>y?1:x<y?2:0):0,format=v=>Number.isFinite(v)?v.toFixed(1):'N/A';return '<tr><th scope="row">'+esc(label)+'</th><td'+(win===1?' class="advantage"':'')+'>'+format(x)+'</td><td'+(win===2?' class="advantage"':'')+'>'+format(y)+'</td></tr>'}).join('')+'</tbody></table><p class="note">Gold highlights the higher available score; equal scores and N/A are not treated as wins.</p>'+historicalComparison(a.name,b.name);
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
   const ovr=maddenOvr(historical?.ovr??r.score);
   const componentLabels={titles:'Rings',finals:'Finals',playoffs:'Playoffs',regular:'W–L',allPlay:'All-play',recent:'Recent form',peak:'Peak',tenure:'Tenure'};
   const movements=historical&&preceding?Object.keys(historical.breakdown).map(k=>({label:componentLabels[k]||k,change:+(historical.breakdown[k]-preceding.breakdown[k]).toFixed(1)})).filter(x=>x.change!==0).sort((a,b)=>Math.abs(b.change)-Math.abs(a.change)):[];
   const explanation=movements.length?movements.slice(0,3).map(x=>x.label+' '+(x.change>0?'+':'')+x.change.toFixed(1)).join(' · '):'No component movement recorded';
   const delta=historical&&preceding?+(maddenOvr(historical.ovr)-maddenOvr(preceding.ovr)).toFixed(1):null;
   const trajectory=historical?weekly.filter(x=>x.week<=selectedWeek).map(x=>({week:x.week,ovr:maddenOvr(x.rows.find(y=>y.name===r.name)?.ovr)})):[];
   const previousChanges=trajectory.slice(1).map((x,i)=>({week:x.week,delta:+(x.ovr-trajectory[i].ovr).toFixed(1)}));
   const peak=trajectory.length?Math.max(...trajectory.map(x=>x.ovr)):null;
   const biggest=previousChanges.slice().sort((a,b)=>b.delta-a.delta)[0];
   const line=trajectory.map((x,i)=>{const min=0,max=100;return (i?i/(trajectory.length-1)*100:0)+','+(100-(x.ovr-min)/(max-min)*100)}).join(' ');
   const resume=seasonResume(r.name,careers,playoffBrackets,guide);
   const yearEndRatings=historicalSeasons.map(s=>({year:s.year,row:s.rows.find(x=>x.name===r.name)})).filter(x=>x.row);
   const historicalDetails='<details class="historical-ovr"><summary>Historical Madden OVR ('+yearEndRatings.length+' completed seasons)</summary><p class="note">Retrospective year-end ratings use only results verified through that season; not ratings published at the time.</p><div class="historical-ovr-grid">'+yearEndRatings.map(x=>'<div><strong>'+x.year+'</strong><span>'+maddenOvr(x.row.ovr).toFixed(1)+' OVR</span><small>Rank #'+x.row.rank+'</small></div>').join('')+'</div></details>';
   const accomplishmentHtml='<div class="accomplishments"><div><strong>'+r.titleYears.length+'</strong><span>Championships</span><small>'+(r.titleYears.length?r.titleYears.join(', '):'None verified')+'</small></div><div><strong>'+r.qualifiedYears.length+'</strong><span>Playoff appearances</span><small>'+(r.qualifiedYears.length?r.qualifiedYears.join(', '):'None verified')+'</small></div><div><strong>'+r.tenure+'</strong><span>Completed seasons</span><small>Through 2025</small></div></div>';
   const seasonsHtml=resume.map(x=>'<div class="attr"><span>'+x.year+' · '+esc(x.record)+'</span><strong>'+esc(x.badge)+'</strong></div>').join('');
   const props=[['regular',s.regular],['allPlay',s.allPlay],['playoffs',r.breakdown.playoffs/10*100],['championships',r.breakdown.titles/30*100],['finals',r.breakdown.finals/5*100],['drafting',s.drafting],['trading',s.trading],['waivers',null],['lineups',null]];
   return '<article class="card tier-'+esc(tier.id)+'"><div class="tier-ribbon" title="'+esc(tier.reason)+'">'+esc(tier.name)+'</div><div class="top"><div><div class="rank">ALL-TIME RANK #'+r.rank+(r.historical?' · FORMER MANAGER':'')+'</div><h2>'+esc(r.name)+'</h2><div class="archetype">'+esc(archetype.name)+(archetype.provisional?' · Provisional':'')+'</div><div class="tag">'+esc(archetype.reason)+'</div>'+(specialtyHtml?'<div class="specialties"><span>Also earned:</span> '+specialtyHtml+'</div>':'')+'<div class="tag">'+esc(r.career)+' · '+r.titleYears.length+' titles · '+r.qualifiedYears.length+' verified playoff berths</div></div><div class="ovr">'+ovr.toFixed(1)+'<small>OVR'+(delta===null?'':' · '+(delta>0?'+':'')+delta.toFixed(1))+'</small></div></div><div class="attributes">'+props.map(([k,v])=>'<div class="attr" title="'+esc(labelHelp[k])+'"><span>'+esc(labelName[k])+'</span><strong>'+(Number.isFinite(v)?Math.round(v):'N/A')+'</strong></div>').join('')+'</div><div class="tag">'+(!historical?'Historical career OVR · no 2026 weekly games':delta===null?'Week 1 baseline':'OVR movement: '+esc(explanation))+'</div><div class="tag">'+(peak===null?'No 2026 weekly rating available':'2026 peak through W'+selectedWeek+': '+peak.toFixed(1)+' OVR')+' · Biggest rise: '+(biggest?(biggest.delta>0?'+':'')+biggest.delta.toFixed(1)+' (W'+biggest.week+')':'N/A')+'</div>'+(trajectory.length?'<svg role="img" aria-label="'+esc(r.name)+' OVR trend through week '+selectedWeek+'" viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:64px;margin-top:10px;overflow:visible"><polyline fill="none" stroke="#e3bc75" stroke-width="2" vector-effect="non-scaling-stroke" points="'+line+'"/></svg>':'')+accomplishmentHtml+historicalDetails+'<details><summary>Season-by-season résumé ('+resume.length+')</summary><div class="attributes">'+seasonsHtml+'</div></details>'+(profileSlug[r.name]?'<a class="profile-link" href="../managers/'+profileSlug[r.name]+'/">Open '+esc(r.name)+' full profile →</a>':'')+'<div class="tag">Drafting and trading scores are provisional · Waiver and start/sit scores are unavailable</div></article>';
  }).join('');
  compare();
  $('status').textContent=selected.length+' manager cards · Week '+selectedWeek+' source-backed Madden OVR (65.0–99.0) · '+Object.values(guide).filter(x=>x.champion).length+' completed championship seasons';
 };
 $('filter').addEventListener('change',render);$('week').addEventListener('change',render);render();
}catch(e){$('status').textContent='Rating data unavailable; no fallback scores shown.';$('cards').innerHTML='<p class="error">Could not verify required sources.</p>';console.error(e)}
