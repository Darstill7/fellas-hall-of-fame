import {buildDraftTradeCareer} from './manager-draft-trade-career.mjs';
import {buildDraftProduction} from './manager-draft-production.mjs';
import {buildDraftRoundPeers} from './manager-draft-round-peers.mjs';
import {tradeEvents} from './manager-trade-intelligence.mjs';
// Compact, original-manager career archive. No performance or skill grades.
const root='../../';
const elt=(tag,cls,value)=>{
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 if(value!==undefined)e.textContent=String(value);
 return e;
};
const fetchJSON=async path=>{
 const r=await fetch(root+path);
 if(!r.ok)throw Error('Career source unavailable');
 return r.json();
};
const deepLink=(year,manager)=>{
 const link=elt('a','career-resume-link','Review trade archive');
 link.href=root+'analytics/manager-trade-intelligence.html?manager='+
  encodeURIComponent(manager)+'&year='+year;
 return link;
};
export async function mountDraftTradeCareer(host,manager){
 const box=elt('details','profile-career-resume');
 box.dataset.managerCareerResume=manager;
 const summary=elt('summary',null,'Drafting & trading · Career overview');
 box.append(summary,elt('p','muted','Loading documented draft and trade history…'));
 host.append(box);
 try{
  const [source,trade,espnBoard,draftProductionRows]=await Promise.all([
   fetchJSON('data/manager_draft_trade_profile_evidence_v1.json'),
   fetchJSON('data/v9_trade_engine.json'),
   fetchJSON('data/espn_draft_boards_named_2016_2019.json'),
   fetchJSON('data/v9_draft_engine.json')
  ]);
  if(source.status!=='research_only_no_draft_or_trade_skill_grades'||
     source.seasonCutoff?.year!==2026||
     source.seasonCutoff?.throughWeek!==8||
     !Array.isArray(trade.sides)||
     espnBoard.coverage?.totalSelections!==598||espnBoard.coverage?.unresolvedSelections!==0||
     !espnBoard.seasons?.['2018']?.playerPicks)
   throw Error('Career research provenance changed');
  const career=buildDraftTradeCareer(source.rows,manager);
  const production=buildDraftProduction(draftProductionRows,manager);
  const peerStudy=buildDraftRoundPeers(draftProductionRows,manager);
  if(peerStudy.selectedPicks!==production.selectionCount)throw Error('Round-peer receipt scope differs from draft production');
  const related=tradeEvents(trade).filter(event=>
   event.complete&&event.managers.includes(manager)&&event.year<=2025).slice(0,3);
  box.replaceChildren(summary);
  box.append(elt('p','muted career-resume-intro',
   'Recorded draft picks and trades across available seasons. These counts are evidence, not drafting or trading grades.'));
  const metrics=elt('div','career-resume-metrics');
  for(const [value,label] of [
   [career.seasons,'Draft seasons · '+career.firstYear+'–'+career.lastYear],
   [career.documentedPicks,'Recorded draft selections'],
   [career.keeperSlots,'Recorded keeper slots'],
   [career.representedTrades,'Qualifying trade events']
  ]){
   const tile=elt('div','career-resume-metric');
   tile.append(elt('strong',null,value),elt('span',null,label));
   metrics.append(tile);
  }
  box.append(metrics);
  // Keep the verified count tiles immediately readable. Supporting receipts
  // are available in one optional disclosure instead of a wall of raw data.
  const details=elt('details','career-resume-receipts');
  const detailSummary=elt('summary',null,'View draft picks, trades & source coverage');
  details.append(detailSummary);
  const coverage=elt('p','muted career-resume-coverage',
   career.espnSeasons+' ESPN seasons · '+career.sleeperSeasons+' Sleeper seasons · '+
   'ESPN original player names recovered · '+
   career.fullyRepresentedTrades+' multi-side qualifying trade events · '+
   career.partialTrades+' partial qualifying trade events.');
  details.append(coverage);
  const draftSection=elt('section','career-resume-section');
  draftSection.append(elt('h4',null,'Recent Sleeper draft snapshots'));
  for(const season of career.latestPicks.filter(season=>season.platform==='Sleeper')){
   const line=elt('p','career-resume-example');
   line.append(elt('strong',null,season.year+' · '));
   line.append(document.createTextNode(season.picks.map(p=>
    'R'+p.round+' '+p.player).join(' · ')));
   draftSection.append(line);
  }
  if(!career.latestPicks.some(season=>season.platform==='Sleeper'))draftSection.append(
   elt('p','muted','No named recent Sleeper draft selections available.'));
  details.append(draftSection);
  // The legacy career research snapshot predates full ESPN athlete ID recovery.
  // Use the named original board for ESPN selections, never stale early-pick
  // labels or offline 2018 import positions.
  const esSection=elt('section','career-resume-section career-espn-history');
  esSection.append(elt('h4',null,'Original ESPN drafts · 2016–2019'));
  const identityManager=manager==='Tom'?'Thommy':manager;
  let esYears=0,esPicks=0;
  for(const year of [2016,2017,2018,2019]){
   const sourceYear=espnBoard.seasons[String(year)];
   if(!Array.isArray(sourceYear?.playerPicks))throw Error('Missing ESPN draft '+year);
   const picks=sourceYear.playerPicks.filter(p=>p.manager===identityManager);
   if(!picks.length)continue;
   esYears++;esPicks+=picks.length;
   if(picks.some(p=>!p.player||!p.position))throw Error('Incomplete recovered ESPN identity '+year);
   const row=elt('div','career-resume-example');
   row.append(elt('strong',null,year+' · '+picks.length+' selections'));
   const positionCounts=new Map();
   for(const pick of picks)positionCounts.set(pick.position,(positionCounts.get(pick.position)||0)+1);
   row.append(elt('p','muted',[...positionCounts].map(([position,count])=>position+' '+count).join(' · ')));
   if(year===2018){
    row.append(elt('p','muted','Offline draft · original round and overall pick order not verified.'));
   }else{
    const first=picks.filter(p=>p.round===1).sort((a,b)=>a.overall-b.overall);
    row.append(elt('p','muted',first.length?'Recorded first-round selection: '+first.map(p=>p.player+' (#'+p.overall+')').join(', '):'No first-round selection recorded for this manager.'));
   }
   if(year===2017&&identityManager==='Tony')
    row.append(elt('p','muted','Original pick: Glenn Gronkowski; manually replaced after the draft with Rob Gronkowski. Not a second selection.'));
   const link=elt('a','career-resume-link','Explore '+year+' selections');
   link.href=root+'seasons/espn-draft-history.html?manager='+encodeURIComponent(identityManager)+'&year='+year;
   row.append(link);esSection.append(row);
  }
  if(esYears){
   const heading=elt('p','muted',esPicks+' named original selections across '+esYears+' ESPN draft seasons; counts indicate activity, not value.');
   esSection.insertBefore(heading,esSection.children[1]||null);
  }else esSection.append(elt('p','muted','No original ESPN draft selections attributed to this manager.'));
  details.append(esSection);
  const productionSection=elt('section','career-resume-section career-draft-production');
  productionSection.append(elt('h4',null,'Sleeper draft contribution · completed 2020–2025 seasons'));
  productionSection.append(elt('p','muted',
   'Observed regular-season points from games in which original draft selections started for their drafting manager. Excludes keepers, playoff starts, other managers’ starts and incomplete 2026. This is not total player production, surplus value or a drafting grade.'));
  if(production.status==='observed_original_manager_starts_only'){
   productionSection.append(elt('p',null,production.selectionCount+' non-keeper selections · '+production.starts+
    ' recorded regular-season starts · '+production.points.toFixed(1)+' starter points across '+production.seasonCount+' documented seasons.'));
   for(const season of production.byYear){
    productionSection.append(elt('p','career-resume-example',season.year+' · '+season.selections+
     ' picks · '+season.starts+' starts · '+season.points.toFixed(1)+' points'));
   }
   const examples=elt('details','career-resume-receipts');
   examples.append(elt('summary',null,'View highest observed draft-pick contributions'));
   for(const pick of production.top){
    examples.append(elt('p','career-resume-example',pick.year+' · R'+pick.round+' '+pick.player+
     ' · '+pick.starts+' starts · '+pick.points.toFixed(1)+' pts'+
     (pick.tradedSameSeason?' · traded during season':'') ));
   }
   productionSection.append(examples);
  }else productionSection.append(elt('p','muted','No original non-keeper draft selections documented for completed Sleeper seasons.'));
  details.append(productionSection);
  const peersSection=elt('section','career-resume-section career-draft-round-peers');
  peersSection.append(elt('h4',null,'Compared with same-year draft rounds · research only'));
  peersSection.append(elt('p','muted',
   'For each original non-keeper selection, compare points earned in the drafting manager’s regular-season starting lineup against the median of other original picks from the same year and round. The selected pick is excluded from its own peer median. Comparisons require at least five peers.'));
  peersSection.append(elt('p','muted',
   'This measures observed lineup contribution, not draft skill, player-season total points, injury-adjusted value, replacement value, or position-adjusted opportunity. Round peers may play different positions; trades and manager starting choices also affect results. No OVR or report-card grade is changed.'));
  if(peerStudy.selectedPicks){
   peersSection.append(elt('p',null,peerStudy.comparablePicks+' of '+peerStudy.selectedPicks+
    ' completed-season selections have enough same-round peers.'));
   for(const year of peerStudy.byYear){
    peersSection.append(elt('p','career-resume-example',year.year+' · '+year.aboveMedian+
     ' above / '+year.atMedian+' equal / '+year.belowMedian+' below peer median · '+
     year.comparablePicks+' comparable picks'+(year.unavailable?' · '+year.unavailable+' not comparable':'')));
   }
   if(peerStudy.examples.length){
    const examples=elt('details','career-resume-receipts');
    examples.append(elt('summary',null,'See three largest positive observed differences'));
    for(const pick of peerStudy.examples)
     examples.append(elt('p','career-resume-example',pick.year+' · R'+pick.round+' '+pick.player+
      ' · '+pick.points.toFixed(1)+' started pts vs '+pick.peerMedian.toFixed(1)+
      ' peer median · difference +'+pick.difference.toFixed(1)+' · '+pick.peerCount+' other picks'));
    peersSection.append(examples);
   }
  }else peersSection.append(elt('p','muted','No completed-season non-keeper picks to compare.'));
  details.append(peersSection);
  const tradeSection=elt('section','career-resume-section career-resume-trades');
  tradeSection.append(elt('h4',null,'Recent source-verified trade records'));
  if(!related.length)tradeSection.append(elt('p','muted',
   'No fully represented qualifying trades in this archive. This does not mean no trades occurred.'));
  for(const trade of related){
   const mySide=trade.sides.find(side=>side.manager===manager);
   const others=trade.managers.filter(n=>n!==manager);
   const item=elt('article','career-resume-trade');
   item.append(elt('strong',null,trade.year+' · Week '+trade.week+' · With '+others.join(', ')));
   item.append(elt('p',null,'Assets on this manager\'s recorded trade side: '+
    (mySide.assets?.join(', ')||'Not identified in archive')));
   item.append(deepLink(trade.year,manager));
   tradeSection.append(item);
  }
  details.append(tradeSection);
  box.append(details);
  box.append(elt('p','muted career-resume-caveat',
   'Event counts are not all-time trade totals or wins. The 2026 trade sides are provisional and excluded; incomplete events and missing earlier trade archives are not scored. The complete ESPN original-player archive is authoritative for 2016–2019 names; the older research summary may contain pre-recovery placeholders. Original selections do not establish draft value.'));
 }catch(error){
  box.replaceChildren(summary,elt('p','muted',
   'Career evidence is unavailable; no substitute totals or trade grades shown.'));
 }
}
