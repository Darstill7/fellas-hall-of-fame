import {makeReportCards} from './manager-report-card.mjs';
import {scoutingProfile} from './manager-scouting-profile.mjs';
import {pickupCostLabel} from './pickup-cost-label.mjs';
import {buildEvidenceSnapshots} from './manager-evidence-snapshots.mjs';
const targets=['manager_acquisition_distinct_v1.json','manager_acquisition_coverage_v1.json','v9_draft_engine.json','v9_trade_engine.json','career_core_generated.json','all_time_luck_ratings_v1.json','waiver_award_candidates.json','manager_verified_season_endings_v1.json','verified_sleeper_playoff_brackets_2020_2025.json','season_guide.json','verified_espn_playoff_brackets_2016_2019.json','fellas_final_placements_2016_2025_verified.json','keeper_2025_website_research_v1.json','manager_draft_trade_profile_evidence_v1.json'];
const esc=v=>String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
const categoryEvidence=k=>['drafting','trading'].includes(k)?'Provisional outcome': ['waivers','lineups','keepers'].includes(k)?'Not yet rated':'Verified results';
const labels={drafting:'Drafting',trading:'Trading',championships:'Championships',finals:'Runner-up finishes',playoffs:'Playoff qualification',regular:'Winning',allPlay:'All-play',waivers:'Free agency / waivers',lineups:'Start / sit',keepers:'Keeper decision'};

const scoreDefinitions={
 championships:'Championship success, with recent titles weighted more heavily and older titles still counting.',
 finals:'Runner-up finishes and their recency-weighted contribution.',
 playoffs:'Verified playoff qualifications, including bracket and bye evidence.',
 regular:'Career regular-season winning results, adjusted to avoid overreacting to small samples.',
 allPlay:'How often the team would win against the whole league, independent of its weekly opponent.',
 drafting:'Relative outcomes for recorded nonkeeper picks; a provisional estimate, not a full draft-skill audit.',
 trading:'Relative outcomes for qualifying verified trade sides; incomplete trade archives limit this estimate.',
 waivers:'Not rated: full waiver and free-agent decision opportunity sets are not yet verified.',
 lineups:'Not rated: hindsight lineup accuracy alone cannot establish decision skill.',
 keepers:'Not rated: keeper costs and realistic alternatives are not fully verified.'
};
const categoryScoreGuide=()=>'<details class="report-score-guide"><summary>What do these category ratings mean?</summary>'+
 '<p class="fine"><strong>A category number is a modeled score out of 100, not a percentage of correct decisions.</strong> Results-based categories use verified outcomes. Drafting and Trading are provisional estimates. N/A means not rated, not zero.</p>'+
 '<dl>'+Object.keys(labels).map(k=>'<div><dt>'+esc(labels[k])+'</dt><dd>'+esc(scoreDefinitions[k])+'</dd></div>').join('')+'</dl>'+
 '<p class="fine">The provisional overall score averages only available categories at their assigned weights. Missing skill grades are excluded, not counted as zeros. This report card is separate from the career Legacy OVR on manager profiles.</p></details>';
const scoreSummary=x=>'<p class="report-score-summary"><strong>'+x.provisional.toFixed(1)+' / 100 is a provisional report-card score.</strong> It is a weighted summary of the rated categories only ('+x.availableWeight+' of 100 possible weight points). It is not a win percentage, historical Legacy OVR, or a complete grade of manager decisions.</p>';

try {
 const [distinctCoverage,acquisitionCoverage,drafts,trades,careers,luck,waivers,endings,brackets,guide,espn,placements,keeperResearch,draftTrade]=await Promise.all(targets.map(async p=>{const r=await fetch('../data/'+p);if(!r.ok)throw Error('Could not load '+p);return r.json()}));
 const [startSitResponse,faabResponse]=await Promise.all([
  fetch('../data-integrity/sleeper-start-sit-ui-benchmarks-2026-week8.json'),
  fetch('../data-integrity/faab-manager-spend-research-v1.json')
 ]);
 if(!startSitResponse.ok||!faabResponse.ok)throw Error('Could not load source-backed lineup and FAAB evidence');
 const [startSit,faab]=await Promise.all([startSitResponse.json(),faabResponse.json()]);
 const evidenceByManager=new Map(buildEvidenceSnapshots({placements,acquisitions:distinctCoverage,keeperResearch,startSit,draftTrade,faab}).map(e=>[e.manager,e]));
 const unratedEvidence=(name,key)=>{
  const e=evidenceByManager.get(name);
  if(!e)return '';
  if(key==='waivers')return ' · '+e.faab.completedClaims+' successful claims recorded';
  if(key==='lineups')return ' · '+e.startSit.accuracyPercent.toFixed(1)+'% measured (2026 W8)';
  if(key==='keepers')return ' · '+e.keepers.startedPoints.toFixed(2)+' started pts (2025)';
  return '';
 };
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
 const evidenceSnapshot=name=>{
  const e=evidenceByManager.get(name);
  if(!e)return '';
  const tile=(title,value)=>'<div class="report-fact"><strong>'+esc(String(value))+'</strong><span>'+esc(title)+'</span></div>';
  return '<div class="report-fact-grid" aria-label="Historical evidence for '+esc(name)+'">'+
   tile('Career top-three finishes',e.finishing.topThree)+
   tile('Recorded pickups later started',e.pickups.started+' / '+e.pickups.distinct)+
   tile('2026 W8 start/sit accuracy',e.startSit.accuracyPercent.toFixed(1)+'%')+
   '</div><details class="report-fact-method"><summary>Evidence and coverage for these figures</summary>'+
   '<p class="fine"><strong>Career results:</strong> '+e.finishing.seasons+' completed seasons, '+e.finishing.score.toFixed(2)+'/100 field-adjusted finish score, '+e.finishing.lastPlace+' final last-place finishes. ESPN final ranks and verified Sleeper brackets (2016–2025).</p>'+
   '<p class="fine"><strong>Pickups:</strong> '+e.pickups.started+' of '+e.pickups.distinct+' distinct season-player pickups had a documented later start ('+e.pickups.percent.toFixed(1)+'%). Sleeper records 2020–2026; 2026 partial. Not a waiver skill grade.</p>'+
   '<p class="fine"><strong>FAAB claims:</strong> '+e.faab.completedClaims+' successful waiver claims ('+e.faab.paidWins+' paid, '+e.faab.zeroDollarWins+' won for $0), '+e.faab.failedClaims+' failed claims, $'+e.faab.winningSpend+' provider-observed winning spend. '+e.faab.period+'. Failed attempts are not spending; successful $0 waiver claims are not free-agent adds. '+e.faab.sourceOnlyClaims+' winning provider claims were absent from the earlier archived transaction extract and remain separately identified. Not a waiver-skill grade.</p>'+
   '<details class="report-faab-history"><summary>View provider FAAB by season</summary><ul>'+e.faab.years.map(y=>'<li><strong>'+y.year+(y.year===2026?' (through W7)':'')+'</strong><span>$'+y.winningSpend+' winning spend · '+y.paidWins+' paid · '+y.zeroDollarWins+' $0 wins · '+y.failedClaims+' failed claims</span></li>').join('')+'</ul></details>'+
   '<p class="fine"><strong>Start/sit:</strong> '+e.startSit.accuracyPercent.toFixed(1)+'% Sleeper-displayed average through 2026 Week 8, from user-provided screenshots. Descriptive, not a decision-quality grade.</p>'+
   '<p class="fine"><strong>2025 keepers:</strong> '+e.keepers.recorded+' recorded, '+e.keepers.startedPoints.toFixed(2)+' regular-season points started by the original manager. Not a keeper decision grade.</p>'+
   '<p class="fine"><strong>Draft history:</strong> '+e.drafts.documentedSeasonCount+' seasons with documented selections. Historical coverage varies; outcome estimates do not establish decision skill.</p>'+
   '<p class="fine"><strong>Grade status:</strong> Waivers, lineups, and keeper decisions remain <strong>Not rated</strong> until their full evidence checks pass.</p>'+
   '</details>';
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
  const label=sorted.map(x=>'<li><div class="pickup-name"><strong>'+esc(x.player)+'</strong><span>'+x.year+'</span></div>'+
   '<div class="pickup-facts"><span><b>'+x.starts+'</b> starts</span><span><b>'+x.points.toFixed(1)+'</b> lineup pts</span></div>'+
   '<span class="pickup-cost" data-pickup-year="'+x.year+'" data-pickup-week="'+x.acquisitionWeek+
   '" data-pickup-transaction="'+esc(x.transactionId)+'" data-pickup-player="'+esc(x.player)+
   '" data-pickup-type="'+esc(x.acquisitionType)+'">Cost: checking records…</span></li>').join('');
  return '<details class="pickup-highlights"><summary>Pickup highlights <span class="pickup-summary-meta">' +sorted.length+' examples · starts and points</span></summary><p class="fine">Verified later-start highlights from the archival research, ranked here only by recorded starter points. Not all pickups; 2026 coverage is partial. Not a FAAB skill grade, bid-cost comparison, or replacement value.</p><ul>'+label+'</ul></details>';
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
  document.getElementById('comparison').setAttribute('aria-label','Provisional results-only and evidence-limited manager comparison');
  document.getElementById('comparison').innerHTML=[a,b].map(x=>'<article class="card"><h3>'+esc(x.name)+'</h3><div class="score">'+x.provisional.toFixed(1)+'<small>provisional / 100 · '+x.availableWeight+'% evidence weight</small></div><div class="grid">'+Object.entries(x.scores).map(([key,v])=>'<div class="grade"><span>'+labels[key]+'</span><strong>'+(v===null?'N/A':v.toFixed(1))+'</strong><small>'+categoryEvidence(key)+unratedEvidence(x.name,key)+'</small></div>').join('')+'</div><p>Verified: '+x.coverage.verifiedChampionships+' championships; '+x.coverage.playoffVerified+'/'+x.coverage.playoffEligible+' playoff seasons; '+x.coverage.careerGames+' regular-season games.</p></article>').join('');
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
 if(managerQuery&&shown.length===1){
  // Keep a profile-specific view focused on this manager, not a competing
  // comparison form. The full report-card list still supports comparisons.
  const current=shown[0],profileUrl='../managers/'+slugs[current.name]+'/';
  const heading=document.querySelector('main h1');
  if(heading)heading.textContent=current.name+"'s Report Card";
  const navigation=document.querySelector('nav.report-top-nav');
  if(navigation&&!navigation.querySelector('[data-report-return-profile]')){
   const back=document.createElement('a');
   back.className='btn';
   back.dataset.reportReturnProfile='';
   back.href=profileUrl;
   back.textContent='← Back to '+current.name+"'s profile";
   navigation.prepend(back);
   const all=document.createElement('a');
   all.className='btn';
   all.dataset.reportAllManagers='';
   all.href='manager-report-cards.html';
   all.textContent='All report cards';
   navigation.append(all);
  }
  const comparison=document.querySelector('section[aria-label="Compare managers"]');
  if(comparison)comparison.hidden=true;
 }
 document.getElementById('cards').innerHTML=shown.map(x=>'<section class="card" data-report-manager="'+esc(x.name)+'"><div class="head"><div><div class="label">Report-card rank #'+x.rank+'</div><h2><a href="../managers/'+slugs[x.name]+'/">'+esc(x.name)+'</a></h2></div><div class="score">'+x.provisional.toFixed(1)+'<small>of 100 · provisional</small></div></div>'+scoreSummary(x)+'<p class="report-first-glance">'+x.coverage.verifiedChampionships+' verified championships · '+x.coverage.playoffVerified+' playoff appearances · '+x.coverage.careerGames+' regular-season games</p>'+evidenceSnapshot(x.name)+'<details class="report-category-details"><summary>View all 10 category ratings</summary><div class="grid">'+Object.entries(x.scores).map(([key,score])=>'<div class="grade"><span>'+labels[key]+'</span><strong>'+(score===null?'N/A':score.toFixed(1))+'</strong><small>'+categoryEvidence(key)+unratedEvidence(x.name,key)+'</small></div>').join('')+'</div>'+categoryScoreGuide()+'</details>'+notablePickups(x.name)+'<details class="report-evidence-details"><summary>Career evidence and scouting notes</summary>'+acquisitionNote(x.name)+startSitNote(x.name)+'<p class="fine">Confirmed '+x.coverage.verifiedChampionships+' titles · '+x.coverage.verifiedRunnersUp+' runners-up · '+x.coverage.championshipGameAppearances+' championship-game appearances · minimum '+x.coverage.minimumPlayoffs+' playoff berths · '+x.coverage.playoffVerified+'/'+x.coverage.playoffEligible+' qualified (2016–25) · '+x.coverage.playoffByes+' byes · '+x.coverage.draftPicks+' scored nonkeeper picks · '+x.coverage.verifiedTradeSides+' verified trade sides · '+x.coverage.careerGames+' regular-season games · '+x.coverage.waiverHighlights+' highlighted waiver candidates (not a full denominator). Scored dimensions: '+x.availableWeight+' of 100 possible weight points ('+x.evidence.status+' evidence coverage; not a statistical confidence interval).</p><p class="fine"><strong>Scouting read:</strong> '+esc(byName[x.name].strengths.length?byName[x.name].strengths.join('; '):'No verified standout category yet')+'. <strong>Next competitive objective:</strong> '+esc(byName[x.name].focus.length?byName[x.name].focus.join('; '):'Sustain results and validate management decisions')+'. These are results-based observations, not certified decision-level grades.</p><details class="report-scouting-more"><summary>Detailed scouting dossier</summary><p><strong>'+esc(dossierByName[x.name].headline)+'</strong></p><p><strong>Documented strengths:</strong> '+esc(dossierByName[x.name].strengths.join('; ')||'No qualifying standout yet')+'</p><p><strong>Evidence limitations:</strong> '+esc(dossierByName[x.name].limitations.join('; '))+'</p><p>'+esc(dossierByName[x.name].decisionRead)+'</p><p class="fine">'+esc(dossierByName[x.name].evidence)+'</p></details></details></section>').join('') || '<p>No matching manager report card.</p>';
 // Allow league visitors to jump directly to one report card without
 // changing scores, rerendering data, or hiding any source research permanently.
 const reportPicker=document.getElementById('report-manager-picker');
 const reportSelect=document.getElementById('report-manager-select');
 const reportCount=document.getElementById('report-manager-count');
 if(managerQuery&&shown.length===1){
  if(reportPicker)reportPicker.hidden=true;
 }else if(reportPicker&&reportSelect&&reportCount){
  for(const row of rows){
   const option=document.createElement('option');
   option.value=row.name;option.textContent=row.name;
   reportSelect.append(option);
  }
  const items=[...document.querySelectorAll('#cards [data-report-manager]')];
  const choose=()=>{
   const selected=reportSelect.value;
   let count=0;
   for(const item of items){
    const matches=!selected||item.dataset.reportManager===selected;
    item.hidden=!matches;
    if(matches)count++;
   }
   reportCount.textContent=selected
    ?'Showing '+selected+' report card'
    :'All '+count+' report cards';
  };
  reportSelect.addEventListener('change',choose);
  choose();
 }
 // Load original provider receipts only when the selected pickup set is opened.
 // A completed free-agent add costs $0; a successful $0 waiver is a separate route.
 // Invalid/missing provider receipts remain N/A rather than being assumed free.
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
   node.textContent=pickupCostLabel(hits[0]);
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
 // A manager's profile deep-link should land directly on the relevant
 // pickups, already expanded, without opening all ten archival sections.
 if(managerQuery&&shown.length===1&&location.hash==='#cards'){
  const selected=document.querySelector('#cards [data-report-manager] details.pickup-highlights');
  if(selected){
   selected.open=true;
   // The async toggle handler verifies costs without blocking navigation.
   document.getElementById('cards').scrollIntoView({block:'start'});
  }
 }
} catch(e) {document.getElementById('cards').innerHTML='<p role="alert">Report cards could not load from the historical archive. No invented grades are shown.</p>';console.error(e)}
