import {makeReportCards} from './manager-report-card.mjs';
const targets=['v9_draft_engine.json','v9_trade_engine.json','career_core_generated.json','all_time_luck_ratings_v1.json','waiver_award_candidates.json','manager_verified_season_endings_v1.json','verified_sleeper_playoff_brackets_2020_2025.json','season_guide.json','verified_espn_playoff_brackets_2016_2019.json'];
const esc=v=>String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
const labels={drafting:'Drafting',trading:'Trading',championships:'Championships',finals:'Runner-up finishes',playoffs:'Playoff qualification',regular:'Winning',allPlay:'All-play',waivers:'Free agency / waivers',lineups:'Start / sit'};
try {
 const [drafts,trades,careers,luck,waivers,endings,brackets,guide,espn]=await Promise.all(targets.map(async p=>{const r=await fetch('../data/'+p);if(!r.ok)throw Error('Could not load '+p);return r.json()}));
 const rows=makeReportCards({drafts,trades,careers,luck,waivers,endings,brackets,guide,espn});
 const slugs={Stilly:'stilly',Stew:'stew',Thommy:'tom',Stover:'stover',Birch:'birch',Tony:'tony',Mitch:'mitch',Kuhl:'kuhl',JMid:'jmid',Scott:'scott'};
 const insights=rows.map(x=>{
  const wins=x.scores.regular,all=x.scores.allPlay,play=x.scores.playoffs;
  const strengths=[];
  if(x.coverage.verifiedChampionships>=2)strengths.push('multiple verified championship seasons');
  else if(x.coverage.verifiedChampionships===1)strengths.push('a verified league championship');
  if(x.coverage.playoffEligible>=3&&x.coverage.playoffVerified/x.coverage.playoffEligible>=.6)strengths.push('frequent playoff qualification');
  if(x.coverage.careerGames>=50&&wins>=55)strengths.push('above-average long-run winning');
  if(all>=55)strengths.push('positive all-play results independent of weekly opponents');
  const focus=[];
  if(x.coverage.verifiedChampionships===0)focus.push('turn playoff opportunities into a title');
  if(x.coverage.playoffEligible>=3&&x.coverage.playoffVerified/x.coverage.playoffEligible<.4)focus.push('improve playoff consistency');
  if(x.coverage.careerGames>=40&&wins<50)focus.push('strengthen regular-season results');
  return {name:x.name,strengths,focus,qualification:'Results-based observations only; not a certified grade for draft, trade, waiver or lineup skill.'};
 });
 const byName=Object.fromEntries(insights.map(x=>[x.name,x]));
 const managerQuery=new URLSearchParams(location.search).get('manager');
 const shown=managerQuery?rows.filter(x=>x.name.toLowerCase()===managerQuery.toLowerCase()||(managerQuery.toLowerCase()==='tom'&&x.name==='Thommy')):rows;
 document.getElementById('cards').innerHTML=shown.map(x=>'<section class="card" data-report-manager="'+esc(x.name)+'"><div class="head"><div><div class="label">#'+x.rank+' · Success-first preview</div><h2><a href="../managers/'+slugs[x.name]+'/">'+esc(x.name)+'</a></h2></div><div class="score">'+x.provisional.toFixed(1)+'<small>of 100 · provisional</small></div></div><div class="grid">'+Object.entries(x.scores).map(([key,score])=>'<div class="grade"><span>'+labels[key]+'</span><strong>'+(score===null?'N/A':score.toFixed(1))+'</strong></div>').join('')+'</div><p class="fine">Confirmed '+x.coverage.verifiedChampionships+' titles · '+x.coverage.verifiedRunnersUp+' runners-up · minimum '+x.coverage.minimumPlayoffs+' playoff berths · '+x.coverage.playoffVerified+'/'+x.coverage.playoffEligible+' qualified (2016–25) · '+x.coverage.playoffByes+' byes · '+x.coverage.draftPicks+' scored nonkeeper picks · '+x.coverage.verifiedTradeSides+' verified trade sides · '+x.coverage.careerGames+' regular-season games · '+x.coverage.waiverHighlights+' highlighted waiver candidates (not a full denominator). Scored dimensions: '+x.availableWeight+' of 100 possible weight points.</p><p class="fine"><strong>Scouting read:</strong> '+esc(byName[x.name].strengths.length?byName[x.name].strengths.join('; '):'No verified standout category yet')+'. <strong>Next competitive objective:</strong> '+esc(byName[x.name].focus.length?byName[x.name].focus.join('; '):'Sustain results and validate management decisions')+'. These are results-based observations, not certified decision-level grades.</p></section>').join('') || '<p>No matching manager report card.</p>';
} catch(e) {document.getElementById('cards').innerHTML='<p role="alert">Report cards could not load from the historical archive. No invented grades are shown.</p>';console.error(e)}
