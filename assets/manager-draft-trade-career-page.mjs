import {buildDraftTradeCareer} from './manager-draft-trade-career.mjs';
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
 const summary=elt('summary',null,'Career Drafting & Trading Résumé');
 box.append(summary,elt('p','muted','Loading documented draft and trade history…'));
 host.append(box);
 try{
  const [source,trade]=await Promise.all([
   fetchJSON('data/manager_draft_trade_profile_evidence_v1.json'),
   fetchJSON('data/v9_trade_engine.json')
  ]);
  if(source.status!=='research_only_no_draft_or_trade_skill_grades'||
     source.seasonCutoff?.year!==2026||
     source.seasonCutoff?.throughWeek!==8||
     !Array.isArray(trade.sides))
   throw Error('Career research provenance changed');
  const career=buildDraftTradeCareer(source.rows,manager);
  const related=tradeEvents(trade).filter(event=>
   event.complete&&event.managers.includes(manager)&&event.year<=2025).slice(0,3);
  box.replaceChildren(summary);
  box.append(elt('p','muted career-resume-intro',
   'A documented career résumé, not Drafting or Trading skill grades. ESPN draft names are incomplete; qualifying trades are a conservative archive subset.'));
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
  const coverage=elt('p','muted career-resume-coverage',
   career.espnSeasons+' ESPN seasons · '+career.sleeperSeasons+' Sleeper seasons · '+
   career.unresolvedNames+' unresolved draft player names · '+
   career.fullyRepresentedTrades+' multi-side qualifying trade events · '+
   career.partialTrades+' partial qualifying trade events.');
  box.append(coverage);
  const draftSection=elt('section','career-resume-section');
  draftSection.append(elt('h4',null,'Recent draft snapshots'));
  for(const season of career.latestPicks){
   const line=elt('p','career-resume-example');
   line.append(elt('strong',null,season.year+' · '));
   line.append(document.createTextNode(season.picks.map(p=>
    'R'+p.round+' '+p.player).join(' · ')));
   draftSection.append(line);
  }
  if(!career.latestPicks.length)draftSection.append(
   elt('p','muted','No named early draft selections available.'));
  box.append(draftSection);
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
  box.append(tradeSection);
  box.append(elt('p','muted career-resume-caveat',
   'Event counts are not all-time trade totals or wins. The 2026 trade sides are provisional and excluded; incomplete events and missing earlier trade archives are not scored. Draft examples are original selections, not proof of draft value.'));
 }catch(error){
  box.replaceChildren(summary,elt('p','muted',
   'Career evidence is unavailable; no substitute totals or trade grades shown.'));
 }
}
