import {makeReportCards} from './manager-report-card.mjs';
import {scoutingProfile} from './manager-scouting-profile.mjs';
const targets=['manager_acquisition_distinct_v1.json','manager_acquisition_coverage_v1.json','v9_draft_engine.json','v9_trade_engine.json','career_core_generated.json','all_time_luck_ratings_v1.json','waiver_award_candidates.json','manager_verified_season_endings_v1.json','verified_sleeper_playoff_brackets_2020_2025.json','season_guide.json','verified_espn_playoff_brackets_2016_2019.json'];
const esc=v=>String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
const categoryEvidence=k=>['drafting','trading'].includes(k)?'Provisional outcome': ['waivers','lineups','keepers'].includes(k)?'Not yet rated':'Verified results';
const labels={drafting:'Drafting',trading:'Trading',championships:'Championships',finals:'Runner-up finishes',playoffs:'Playoff qualification',regular:'Winning',allPlay:'All-play',waivers:'Free agency / waivers',lineups:'Start / sit',keepers:'Keeper decision'};
try {
 const [distinctCoverage,acquisitionCoverage,drafts,trades,careers,luck,waivers,endings,brackets,guide,espn]=await Promise.all(targets.map(async p=>{const r=await fetch('../data/'+p);if(!r.ok)throw Error('Could not load '+p);return r.json()}));
 const rows=makeReportCards({drafts,trades,careers,luck,waivers,endings,brackets,guide,espn});
 const acquisitionByManager=new Map(acquisitionCoverage.byManager.map(x=>[x.manager,x]));
 const distinctByManager=new Map(distinctCoverage.byManager.map(x=>[x.manager,x]));
 const startSitNote=name=>'<p class="fine"><strong>Start/Sit history:</strong> <a href="manager-lineup-research.html?season=career&amp;manager='+encodeURIComponent(name)+'">Explore '+esc(name)+'\'s season-by-season accuracy and coverage</a>. Descriptive Sleeper-style hindsight efficiency only; report-card Start/Sit decision grade stays N/A.</p>';
 const acquisitionNote=name=>{
  const x=distinctByManager.get(name);
  if(!x)return '';
  const total=x.distinctSeasonPlayerAcquisitions,started=x.withRecordedLaterStart;
  if(!Number.isInteger(total)||!Number.isInteger(started)||started<0||started>total)
   throw Error('Invalid acquisition usage evidence for '+name);
  const rate=total?(100*started/total).toFixed(1)+'%':'N/A';
  return '<p class="fine"><strong>Pickup usage (2020–2026):</strong> '+started+' of '+total+
   ' distinct season-player pickups later started ('+rate+'); '+x.reacquisitions+
   ' repeat acquisitions shown separately. A pickup that never started is not automatically a bad pickup. 2026 remains incomplete. Descriptive usage only — not a FAAB skill grade or points-above-replacement claim.</p>';
 };
 const notablePickups=name=>{
  // Source is a selected, retrospectively verified highlight set, not every pickup.
  // Do not import its positional-replacement estimate into the public UI.
  const sourceName=name==='Thommy'?'Tom':name;
  const entries=(waivers.managers[sourceName]??[]).filter(x=>
   x.manager===sourceName&&Number.isInteger(x.year)&&x.year>=2020&&x.year<=2026&&
   Number.isInteger(x.starts)&&x.starts>0&&Number.isFinite(x.points)&&
   typeof x.player==='string'&&x.player.trim());
  const sorted=[...entries].sort((a,b)=>b.points-a.points||b.starts-a.starts||a.year-b.year).slice(0,3);
  if(!sorted.length)return '';
  const label=sorted.map(x=>'<li><strong>'+esc(x.player)+'</strong> ('+x.year+') · '+
   x.starts+' recorded starts · '+x.points.toFixed(1)+' lineup points'+
   ' · <span class="pickup-cost" data-pickup-year="'+x.year+'" data-pickup-week="'+x.acquisitionWeek+
   '" data-pickup-transaction="'+esc(x.transactionId)+'" data-pickup-player="'+esc(x.player)+
   '" data-pickup-type="'+esc(x.acquisitionType)+'">Cost: open to verify</span></li>').join('');
  return '<details class="pickup-highlights"><summary>Notable pickups · selected examples</summary><p class="fine">Verified later-start highlights from the archival research, ranked here only by recorded starter points. Not all pickups; 2026 coverage is partial. Not a FAAB skill grade, bid-cost comparison, or replacement value.</p><ul>'+label+'</ul></details>';
 };
 const slugs={Stilly:'stilly',Stew:'stew',Thommy:'tom',Stover:'stover',Birch:'birch',Tony:'tony',Mitch:'mitch',Kuhl:'kuhl',JMid:'jmid',Scott:'scott'};
 const compareA=document.getElementById('compare-a'),compareB=document.getElementById('compare-b');
 const params=new URLSearchParams(location.search);
 for(const select of [compareA,compareB])for(const row of rows){const option=document.createElement('option');option.value=row.name;option.textContent=row.name;select.append(option)}
 const defaultA=params.get('a'),defaultB=params.get('b');
 compareA.value=rows.some(x=>x.name===defaultA)?defaultA:rows[0].name;
 compareB.value=rows.some(x=>x.name===defaultB)?defaultB:(rows.find(x=>x.name!==compareA.value)||rows[0]).name;
 function drawComparison(){
  const a=rows.find(x=>x.name===compareA.value),b=rows.find(x=>x.name===compareB.value);
  if(!a||!b||a.name===b.name){document.getElementById('comparison').textContent='Select two different managers to compare.';return}
  document.getElementById('comparison').innerHTML=[a,b].map(x=>'<article class="card"><h3>'+esc(x.name)+'</h3><div class="score">'+x.provisional.toFixed(1)+'<small>provisional / 100 · '+x.availableWeight+'% evidence weight</small></div><div class="grid">'+Object.entries(x.scores).map(([key,v])=>'<div class="grade"><span>'+labels[key]+'</span><strong>'+(v===null?'N/A':v.toFixed(1))+'</strong><small>'+categoryEvidence(key)+'</small></div>').join('')+'</div><p>Verified: '+x.coverage.verifiedChampionships+' championships; '+x.coverage.playoffVerified+'/'+x.coverage.playoffEligible+' playoff seasons; '+x.coverage.careerGames+' regular-season games.</p></article>').join('');
  const next=new URL(location.href);next.searchParams.set('a',a.name);next.searchParams.set('b',b.name);history.replaceState(null,'',next);
 }
 document.getElementById('compare-go').addEventListener('click',drawComparison);
 drawComparison();
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
 const dossierByName=Object.fromEntries(rows.map(x=>[x.name,scoutingProfile(x)]));
 const managerQuery=new URLSearchParams(location.search).get('manager');
 const shown=managerQuery?rows.filter(x=>x.name.toLowerCase()===managerQuery.toLowerCase()||(managerQuery.toLowerCase()==='tom'&&x.name==='Thommy')):rows;
 document.getElementById('cards').innerHTML=shown.map(x=>'<section class="card" data-report-manager="'+esc(x.name)+'"><div class="head"><div><div class="label">#'+x.rank+' · Success-first preview</div><h2><a href="../managers/'+slugs[x.name]+'/">'+esc(x.name)+'</a></h2></div><div class="score">'+x.provisional.toFixed(1)+'<small>of 100 · provisional</small></div></div><div class="grid">'+Object.entries(x.scores).map(([key,score])=>'<div class="grade"><span>'+labels[key]+'</span><strong>'+(score===null?'N/A':score.toFixed(1))+'</strong><small>'+categoryEvidence(key)+'</small></div>').join('')+'</div>'+acquisitionNote(x.name)+notablePickups(x.name)+startSitNote(x.name)+'<p class="fine">Confirmed '+x.coverage.verifiedChampionships+' titles · '+x.coverage.verifiedRunnersUp+' runners-up · '+x.coverage.championshipGameAppearances+' championship-game appearances · minimum '+x.coverage.minimumPlayoffs+' playoff berths · '+x.coverage.playoffVerified+'/'+x.coverage.playoffEligible+' qualified (2016–25) · '+x.coverage.playoffByes+' byes · '+x.coverage.draftPicks+' scored nonkeeper picks · '+x.coverage.verifiedTradeSides+' verified trade sides · '+x.coverage.careerGames+' regular-season games · '+x.coverage.waiverHighlights+' highlighted waiver candidates (not a full denominator). Scored dimensions: '+x.availableWeight+' of 100 possible weight points ('+x.evidence.status+' evidence coverage; not a statistical confidence interval).</p><p class="fine"><strong>Scouting read:</strong> '+esc(byName[x.name].strengths.length?byName[x.name].strengths.join('; '):'No verified standout category yet')+'. <strong>Next competitive objective:</strong> '+esc(byName[x.name].focus.length?byName[x.name].focus.join('; '):'Sustain results and validate management decisions')+'. These are results-based observations, not certified decision-level grades.</p><details><summary>Career scouting dossier</summary><p><strong>'+esc(dossierByName[x.name].headline)+'</strong></p><p><strong>Documented strengths:</strong> '+esc(dossierByName[x.name].strengths.join('; ')||'No qualifying standout yet')+'</p><p><strong>Evidence limitations:</strong> '+esc(dossierByName[x.name].limitations.join('; '))+'</p><p>'+esc(dossierByName[x.name].decisionRead)+'</p><p class="fine">'+esc(dossierByName[x.name].evidence)+'</p></details></section>').join('') || '<p>No matching manager report card.</p>';
 // Load original provider receipts only when the selected pickup set is opened.
 // No speculative $0 values: ordinary add receipts without a bid remain N/A.
 const receiptCache=new Map();
 async function verifyPickupCost(node){
  const year=Number(node.dataset.pickupYear),week=Number(node.dataset.pickupWeek);
  const id=node.dataset.pickupTransaction,player=node.dataset.pickupPlayer;
  const requestedType=node.dataset.pickupType;
  if(!Number.isInteger(year)||year<2020||year>2026||
     !Number.isInteger(week)||week<1||week>18||!/^\d+$/.test(id)){
   node.textContent='Cost: N/A (invalid receipt reference)';return;
  }
  const file='../data-integrity/provider-recovered-transactions-'+year+'-week'+week+'.json';
  try{
   if(!receiptCache.has(file)){
    receiptCache.set(file,fetch(file).then(r=>{
     if(!r.ok)throw Error('Source not available');
     return r.json();
    }));
   }
   const source=await receiptCache.get(file);
   const hits=(source.transactions??[]).filter(t=>
    String(t.transactionId)===id&&t.status==='complete'&&t.type===requestedType&&
    (t.added??[]).some(p=>p.name===player));
   if(hits.length!==1){node.textContent='Cost: N/A (player receipt not matched)';return;}
   const bid=hits[0].faabBid;
   node.textContent=Number.isSafeInteger(bid)&&bid>=0?'Cost: '+String.fromCharCode(36)+bid+' FAAB':'Cost: N/A (bid not recorded)';
  }catch(e){node.textContent='Cost: N/A (receipt unavailable)';}
 }
 for(const details of document.querySelectorAll('#cards details.pickup-highlights')){
  details.addEventListener('toggle',()=>{
   if(!details.open||details.dataset.costsRequested==='yes')return;
   details.dataset.costsRequested='yes';
   for(const node of details.querySelectorAll('.pickup-cost')){
    node.textContent='Cost: checking receipt…';
    void verifyPickupCost(node);
   }
  });
 }
} catch(e) {document.getElementById('cards').innerHTML='<p role="alert">Report cards could not load from the historical archive. No invented grades are shown.</p>';console.error(e)}
