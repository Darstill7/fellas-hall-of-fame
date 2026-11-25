import {findOwnedRecords,recordCategoryLabels,nextRecordChallenger,summarizeOwnedRecords,establishedRecordAnchor,establishedRecordSources} from './manager-record-ownership.mjs';
const active=new Set(['Stilly','JMid','Thommy','Stew','Scott','Mitch','Tony','Stover','Kuhl','Birch']);
const categories=recordCategoryLabels;
const catalogGroups=['All','Single-game','Career','Season','Rivalries','Final standings'];
const categorySearchAliases={
 'narrowest-win':'closest win smallest winning margin',
 'narrowest-defeat':'closest loss smallest losing margin',
 'biggest-win':'biggest win largest winning margin blowout',
 'biggest-defeat':'biggest loss largest losing margin blowout'
};
const expandedName=name=>name==='Thommy'?'Tom':name;
const displayName=name=>name==='Tom'?'Thommy':name;
const formatExpanded=(record,unit)=>{const val=Number(record.value);const formatted=Number.isFinite(val)?new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(val):String(record.value);return unit==='%'?formatted+'%':unit==='score / 100'?formatted+'/100':formatted+(unit?' '+unit:'')};
const toLabel=record=>{const n=Number(record.value);const value=Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:2}):String(record.value);return value+(record.unit==='pts'?' pts':record.unit==='%'?'%':' '+record.unit)};
const target=name=>'../managers/record-books.html?manager='+encodeURIComponent(name)+'#owned-records';
const tag=(name,value,cls)=>{const e=document.createElement(name);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e};
const currentManagers=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
let collectionWinners=[],managerRows=[],expandedData=null,fortuneRecord=null,scheduleLuckRows=[],championshipTradeRecord=null,tradeRevenge=null;
function renderManagerFinder(){
 // Read the source snapshot as well as event updates; either module may load first.
 if(Array.isArray(document.__fellasVerifiedRecordOwners))collectionWinners=document.__fellasVerifiedRecordOwners;
 const root=document.getElementById('manager-record-finder');
 if(!root||!managerRows.length||!expandedData)return;
 const requested=new URLSearchParams(location.search).get('manager');
 const names=new Set(managerRows.map(r=>r.name));
 const selected=names.has(requested)?requested:'Stilly';
 const chooser=document.getElementById('record-manager-choices');
 const selectedLabel=document.getElementById('record-manager-selected');
 const results=document.getElementById('record-manager-results');
 chooser.replaceChildren();
 for(const name of currentManagers){
  if(!names.has(name))continue;
  const button=tag('button',name,'record-manager-choice');
  button.type='button';button.setAttribute('aria-pressed',String(name===selected));
  button.addEventListener('click',()=>chooseManager(name));
  chooser.append(button);
 }
 const former=document.getElementById('record-former-manager');
 former.replaceChildren();
 const placeholder=tag('option','Former managers');placeholder.value='';former.append(placeholder);
 for(const name of [...names].filter(n=>!active.has(n)).sort()){
  const opt=tag('option',name);opt.value=name;former.append(opt);
 }
 former.value=active.has(selected)?'':selected;
 former.onchange=()=>{if(former.value)chooseManager(former.value)};
 const row=managerRows.find(r=>r.name===selected);
 if(!row)return;
 const expanded=expandedData.categories.flatMap(c=>{
  const winners=c.leaders.filter(r=>r.rank===1&&displayName(r.manager)===selected);
  return winners.length?[{label:c.label,group:c.group,value:formatExpanded(winners[0],c.unit),href:'expanded-records.html?group='+encodeURIComponent(c.group)+'&category='+encodeURIComponent(c.key)+'&manager='+encodeURIComponent(expandedName(selected))}]:[];
 });
 const legacy=row.records.map(r=>({label:r.label,group:'Established records',value:toLabel(r),href:'#'+r.anchor}));
 const collection=collectionWinners.filter(r=>r.manager===selected).map(r=>({label:r.label,group:r.family,value:r.value+(r.year?' · '+r.year:''),href:'#'+r.anchor}));
  if(selected==='Birch'&&fortuneRecord)collection.push({label:'Most favorable career schedule draw · Schedule Luck',group:'Career',value:'+'+fortuneRecord.winSurplus.toFixed(2)+' wins',href:'#schedule-luck-record'});
  if(championshipTradeRecord&&selected===championshipTradeRecord.holder)collection.push({label:'Most championship-run starter points from one trade · 2020–2025',group:'Postseason',value:championshipTradeRecord.value.toFixed(2)+' points · '+championshipTradeRecord.year,href:'#championship-trade-record'});
  if(tradeRevenge?.recordA?.holder===selected)collection.push({label:'Former players scoring against their original manager · 2020–2025',group:'Postseason',value:tradeRevenge.recordA.points.toFixed(2)+' points · 2024',href:'#playoff-trade-revenge-records'});
  if(tradeRevenge?.recordB?.holder===selected)collection.push({label:'Former-player playoff points from one direct trade · 2020–2025',group:'Postseason',value:tradeRevenge.recordB.points.toFixed(2)+' points · 2023',href:'#playoff-trade-revenge-records'});
 const totals=summarizeOwnedRecords(row.records);
 selectedLabel.textContent=selected+' · '+totals.total+' established record '+(totals.total===1?'lead':'leads');
 results.replaceChildren(tag('p',totals.sole+' sole · '+totals.shared+
  ' shared. Archive exhibits below use their own source coverage.','muted'));
 const sections=[['Established records',legacy],['Expanded record archive',expanded],['Specialty historical collections',collection]];
 const luck=scheduleLuckRows.find(r=>displayName(r.manager)===selected);
 for(const [heading,items] of sections){
  const section=tag('section',undefined,'record-finder-section');
  const h=tag('h3',heading+' · '+items.length);section.append(h);
  if(!items.length)section.append(tag('p','No current first-place record in this collection.','muted'));
  else{
   const grid=tag('div',undefined,'record-finder-results');
   for(const item of items){
    const a=tag('a',undefined,'record-finder-result');a.href=item.href;
    a.append(tag('span',item.label,'record-finder-record'),tag('strong',item.value,'record-finder-value'));
    grid.append(a);
   }
   section.append(grid);
  }
  results.append(section);
 }
 if(luck){
  const metric=tag('details',undefined,'record-finder-section');
  const title=tag('summary','Advanced metric · Career Schedule Luck');
  const signed=(x,d=2)=>(x>0?'+':'')+x.toFixed(d);
  const value=tag('strong',signed(luck.winSurplus)+' wins above expectation');
  const explanation=tag('p',luck.actualWinCredits+' actual win credits vs '+luck.expectedWins.toFixed(2)+' expected across '+luck.seasons+' completed seasons ('+luck.pairedWeeks+' paired weeks). Per-week differential: '+signed(luck.surplusPerWeek,4)+'. This describes schedule fortune, not a championship or a league record.','muted');
  const source=tag('a','Compare every manager →');source.href='#schedule-luck-leaderboard';
  metric.append(title,value,explanation,source);
  results.append(metric);
 }
 const more=tag('a','See '+selected+'’s full personal record book →','record-finder-more');
 more.href=target(selected);results.append(more);
}
// Compare canonical expanded-category *ownership* only. The 16 legacy and
// specialty catalogs overlap with these records and must not be summed here.
function renderManagerComparison(){
 if(!expandedData||!managerRows.length)return;
 const left=document.getElementById('record-compare-left');
 const right=document.getElementById('record-compare-right');
 const results=document.getElementById('record-compare-results');
 if(!left||!right||!results)return;
 const names=[...new Set(managerRows.map(row=>row.name))];
 const requested=new URLSearchParams(location.search).get('manager');
 const first=names.includes(left.value)?left.value:names.includes(requested)?requested:names.includes('Stilly')?'Stilly':names[0];
 const second=names.includes(right.value)&&right.value!==first?right.value:
  (names.includes('Stew')&&first!=='Stew'?'Stew':names.find(n=>n!==first));
 const populate=(select,chosen)=>{
  select.replaceChildren();
  for(const name of names){const option=tag('option',name);option.value=name;select.append(option)}
  select.value=chosen;
 };
 populate(left,first);populate(right,second);
 const recordMap=name=>expandedData.categories.filter(c=>
  c.leaders.some(record=>record.rank===1&&displayName(record.manager)===name));
 const draw=()=>{
  results.replaceChildren();
  if(!left.value||!right.value||left.value===right.value){
   results.append(tag('p','Choose two different managers to compare verified record ownership.','muted'));return;
  }
  const a=recordMap(left.value),b=recordMap(right.value);
  const keysA=new Set(a.map(c=>c.key)),keysB=new Set(b.map(c=>c.key));
  const shared=a.filter(c=>keysB.has(c.key));
  const firstOnly=a.filter(c=>!keysB.has(c.key));
  const secondOnly=b.filter(c=>!keysA.has(c.key));
  const scoreboard=tag('div',undefined,'record-compare-scoreboard');
  for(const [value,label] of [[a.length,left.value+' leads'],[shared.length,'Shared first-place categories'],[b.length,right.value+' leads']]){
   const stat=tag('div',undefined,'record-compare-stat');
   stat.append(tag('strong',String(value)),tag('span',label));
   scoreboard.append(stat);
  }
  results.append(scoreboard);
  const board=tag('div',undefined,'record-compare-evidence');
  const groups=[[left.value+' only',firstOnly],['Shared leads',shared],[right.value+' only',secondOnly]];
  for(const [label,categoriesOwned] of groups){
   const section=tag('div');
   section.append(tag('h3',label+' · '+categoriesOwned.length));
   if(!categoriesOwned.length)section.append(tag('p','No categories in this group.'));
   for(const category of categoriesOwned){
    const link=tag('a',category.label+' →');
    link.href='expanded-records.html?group='+encodeURIComponent(category.group)+
     '&category='+encodeURIComponent(category.key);
    section.append(link);
   }
   board.append(section);
  }
  results.append(board);
 };
 left.onchange=draw;right.onchange=draw;draw();
}
function chooseManager(name){
 const url=new URL(location.href);url.searchParams.set('manager',name);
 history.replaceState(null,'',url);
 renderManagerFinder();
 const summary=document.getElementById('record-manager-selected');
 if(summary)summary.focus({preventScroll:true});
}
document.addEventListener('fellas:verified-record-owners',event=>{
 collectionWinners=Array.isArray(event.detail?.records)?event.detail.records:[];
 renderManagerFinder();
});

const detail=(name,label)=>{const a=tag('a',label);a.href=target(name);return a};
const archiveSection=document.getElementById('complete-record-index');
function openLinkedSearch(){
 if(location.hash!=='#complete-record-index')return;
 const disclosure=archiveSection?.querySelector('details');
 if(disclosure)disclosure.open=true;
 archiveSection?.scrollIntoView({block:'start',behavior:'instant'});
}
function openLinkedRecord(){
 const id=location.hash.slice(1);
 if(!id.startsWith('established-record-'))return;
 const card=document.getElementById(id);
 if(!card)return;
 card.closest('details').open=true;
 const evidence=card.querySelector('.established-record-evidence');
 if(evidence)evidence.open=true;
 card.scrollIntoView({block:'start',behavior:'instant'});
}
window.addEventListener('hashchange',()=>{
 openLinkedSearch();
 openLinkedRecord();
});
openLinkedSearch();

async function showWeeklyOwnershipWatch(watchPromise,archive,guide,rows){
 const host=document.getElementById('weekly-record-watch');
 if(!host)return;
 try{
  const watch=await watchPromise;
  if(!watch)return;
  const week=guide[watch.year]?.standings?.[0]?.games;
  if(watch.schemaVersion!==1||watch.week!==week||watch.current?.asOf!==archive.asOf||
    !Array.isArray(watch.changes)||!watch.changes.length)return;
  const verbs={BROKEN:'New record',EXTENDED:'Record extended',TIED:'Record tied',OWNERSHIP_CHANGED:'Holders changed'};
  const list=tag('ul');
  for(const change of watch.changes){
   const holders=rows.filter(row=>row.records.some(record=>record.anchor===change.id&&record.value===change.value))
    .map(row=>row.name).sort();
   if(!holders.length||holders.join('|')!==change.holders?.join('|')||!Object.hasOwn(verbs,change.type))return;
   const item=tag('li');
   item.append(tag('strong',verbs[change.type]+' · '+holders.join(', ')));
   const link=tag('a',change.label+' · '+toLabel(change));
   link.href='#'+change.id;
   item.append(tag('br'),link);
   list.append(item);
  }
  const heading=tag('h3','Record Watch · Week '+week);
  heading.id='weekly-record-watch-title';
  host.append(heading,list);
  host.hidden=false;
 }catch(error){
  console.warn('Weekly record changes unavailable',error);
 }
}

async function start(){
 const watchPromise=fetch('../data/weekly-record-ownership-v57.json')
  .then(response=>response.ok?response.json():null).catch(()=>null);
 const list=document.getElementById('record-leaders'),other=document.getElementById('record-other'),otherDisclosure=document.getElementById('leader-other'),categoryHost=document.getElementById('record-categories');
 const expandedHost=document.getElementById('expanded-record-categories'),familyNav=document.getElementById('record-family-nav'),summary=document.getElementById('record-count-summary');
 try{
  const responses=await Promise.all([
   fetch('../data/manager_record_books_2016_2026.json'),
   fetch('../data/season_guide.json'),
   fetch('../data/verified_espn_playoff_brackets_2016_2019.json'),
   fetch('../data/verified_sleeper_playoff_brackets_2020_2025.json'),
   fetch('../data/fellas_final_placements_2020_2025.json'),
   fetch('../data/sleeper_postseason_placement_receipts_2020_2025.json'),
   fetch('../data/fellas_final_placements_2016_2025_verified.json'),
   fetch('../data/expanded_records_verified_v1.json')
  ]);
  if(responses.some(r=>!r.ok))throw Error('Record files unavailable');
  const [archive,guide,espn,sleeper,placements,placementReceipts,allEra,expanded]=await Promise.all(responses.map(r=>r.json()));
  if(expanded.version!==1||expanded.categoryCount!==44||expanded.categories?.length!==44)throw Error('Expanded and legacy record catalog mismatch');
  for(const category of expanded.categories){
   if(!category.key||!category.label||!Array.isArray(category.leaders)||!category.leaders.length)throw Error('Incomplete expanded category: '+category.key);
  }
  const postseason={espn,sleeper,placements,placementReceipts,allEra};
  if(!Array.isArray(archive.managers)||archive.managers.length<10||!archive.asOf)throw Error('Unexpected record archive');
  const rows=archive.managers.map(m=>({name:m.manager,records:findOwnedRecords(archive,guide,m.manager,postseason)}));
  rows.sort((a,b)=>b.records.length-a.records.length||a.name.localeCompare(b.name));
  managerRows=rows;expandedData=expanded;renderManagerFinder();renderManagerComparison();
  await showWeeklyOwnershipWatch(watchPromise,archive,guide,rows);
  fetch('../data/hall_of_fortune_2016_2026w9_v1.json').then(r=>{if(!r.ok)throw Error('Schedule Luck registry unavailable');return r.json()}).then(data=>{const ranks=data.careerScheduleSurplusNormalized||[];scheduleLuckRows=ranks;const leader=ranks[0];if(leader?.manager==='Birch'&&leader.winSurplus>0)fortuneRecord=leader;renderManagerFinder()}).catch(()=>{fortuneRecord=null});
  fetch('../data/championship_trade_awards_2020_2025_v1.json').then(response=>{if(!response.ok)throw Error('Championship trade awards unavailable');return response.json()}).then(data=>{const record=data.officialScopedRecord;if(data.schema==='fellas-championship-trade-awards-2020-2025-v1'&&record?.holder==='Stilly'&&record?.value===57.68){championshipTradeRecord=record;renderManagerFinder()}}).catch(()=>{championshipTradeRecord=null});
  fetch('../data/playoff_trade_revenge_2020_2025_v1.json').then(r=>{if(!r.ok)throw Error('Trade revenge archive unavailable');return r.json()}).then(data=>{if(data.schema==='fellas-playoff-trade-revenge-2020-2025-v1'&&data.recordA?.holder==='Thommy'&&data.recordB?.holder==='Stilly'){tradeRevenge=data;renderManagerFinder()}}).catch(()=>{tradeRevenge=null});
  summary.textContent='Ranked by '+categories.length+' established categories · Tied first-place managers share credit. Browse '+expanded.categoryCount+' expanded categories in the archive.';
  list.replaceChildren();
  other.replaceChildren();
  const remaining=rows.filter(row=>!row.records.length);
  otherDisclosure.hidden=remaining.length===0;
  for(const row of rows){
   const a=tag('a',undefined,'leader-card');a.href=target(row.name);
   const heading=tag('h3',row.name+(active.has(row.name)?'':' · Former manager'));
   const totals=summarizeOwnedRecords(row.records);
   const count=tag('span',totals.total+' established '+(totals.total===1?'record':'records'),'count');
   const breakdown=tag('span',totals.sole+' sole · '+totals.shared+' shared','leader-count-breakdown');
   const preview=tag('small',row.records.length?row.records.slice(0,3).map(r=>r.label).join(' · '):'No established category lead');
   const link=tag('span','Explore this manager’s records →','cta');
   a.append(heading,count,breakdown,preview,link);(row.records.length?list:other).append(a);
  }
  const established=new Map(categories.map(label=>[label,[]]));
  for(const {name,records} of rows){
   for(const record of records)established.get(record.label).push({name,record});
  }
  const establishedSearch=document.getElementById('established-record-search');
  const establishedResults=document.getElementById('established-record-results');
  const drawEstablished=parts=>{
   establishedResults.replaceChildren();
   establishedSearch.hidden=parts.length===0;
   if(establishedSearch.hidden)return 0;
   let matches=0;
   for(const [label,holders] of established){
    if(!holders.length)continue;
    const record=holders[0].record;
    const searchable=[label,record.anchor.replaceAll('-',' '),record.scope,
     ...holders.flatMap(holder=>[holder.name,holder.record.context])].join(' ').toLocaleLowerCase('en-US');
    if(!parts.every(part=>searchable.includes(part)))continue;
    matches++;
    const item=tag('li');
    const link=tag('a');
    link.href='#'+record.anchor;
    link.append(tag('strong',label),tag('small',toLabel(record)+' · '+holders.map(holder=>holder.name).join(', ')));
    item.append(link);
    establishedResults.append(item);
   }
   if(!matches)establishedResults.append(tag('li','No established records match.'));
   return matches;
  };

  // Families filter the expanded archive. The keyword searches both collections.
  const queryInput=document.getElementById('record-category-query');
  const resultCount=document.getElementById('record-category-results-count');
  if(!queryInput||!resultCount)throw Error('Record category search controls unavailable');
  document.getElementById('record-category-coverage').textContent='Archive coverage · '+expanded.scope+'.';
  let selectedFamily='All';
  const searchableCategory=c=>{
   const winners=c.leaders.filter(r=>r.rank===1);
   return [c.label,c.group,c.qualifier||'',c.key,categorySearchAliases[c.key]||'',
     ...winners.flatMap(r=>[displayName(r.manager),r.year||'',r.week?'Week '+r.week:'',
       r.evidence?.opponent||''])].join(' ').toLocaleLowerCase('en-US');
  };
  const drawExpanded=()=>{
   const normalized=queryInput.value.trim().replace(/\s+/g,' ').toLocaleLowerCase('en-US');
   const parts=normalized?normalized.split(' '):[];
   const establishedMatches=drawEstablished(parts);
   expandedHost.replaceChildren();
   const filtered=expanded.categories.filter(c=>
     (selectedFamily==='All'||c.group===selectedFamily)&&
     parts.every(part=>searchableCategory(c).includes(part)));
   const archiveCount='Showing '+filtered.length+' of '+expanded.categories.length+
     ' expanded archive categories'+(selectedFamily==='All'?'':' in '+selectedFamily)+'.';
   resultCount.textContent=normalized?establishedMatches+' established '+(establishedMatches===1?'match':'matches')+
     ' for “'+queryInput.value.trim()+'”. '+archiveCount:archiveCount;
   if(!filtered.length){
    const empty=tag('div',undefined,'record-category-empty');
    empty.append(tag('p','No expanded archive categories match these filters.'));
    const clear=tag('button','Clear search and filters','record-category-clear');
    clear.type='button';
    clear.addEventListener('click',()=>{
     queryInput.value='';selectedFamily='All';
     for(const button of familyNav.querySelectorAll('button'))
      button.setAttribute('aria-pressed',String(button.dataset.family==='All'));
     drawExpanded();queryInput.focus();
    });
    empty.append(clear);expandedHost.append(empty);return;
   }
   for(const category of filtered){
    const winners=category.leaders.filter(r=>r.rank===1);
    const card=tag('article',undefined,'category-card');
    card.append(tag('h3',category.label));
    if(!winners.length){card.append(tag('p','No verified leader','empty'));expandedHost.append(card);continue}
    card.append(tag('div',formatExpanded(winners[0],category.unit),'category-meta'));
    const owners=tag('div',undefined,'category-owners');
    for(const name of new Set(winners.map(r=>expandedName(r.manager))))owners.append(detail(displayName(name),displayName(name)));
    card.append(owners);
    const receipt=winners[0];const evidence=receipt.evidence||{};
    const context=[receipt.year?String(receipt.year):'',receipt.week?'Week '+receipt.week:'',evidence.opponent?'vs '+evidence.opponent:''].filter(Boolean).join(' · ');
    card.append(tag('small',category.group+(context?' · '+context:'')+(category.qualifier?' · '+category.qualifier:''),'record-source'));
    const exact=tag('a','View full ranked evidence →');exact.href='expanded-records.html?group='+encodeURIComponent(category.group)+'&category='+encodeURIComponent(category.key)+'#expanded-records-explorer';exact.className='cta';exact.style.display='inline-flex';exact.style.minHeight='44px';exact.style.alignItems='center';exact.style.marginTop='8px';card.append(exact);
    expandedHost.append(card);
   }
  };
  familyNav.replaceChildren();
  for(const group of catalogGroups){
   const button=tag('button',group+(group==='All'?' ('+expanded.categoryCount+')':' ('+expanded.categories.filter(c=>c.group===group).length+')'));
   button.type='button';button.dataset.family=group;button.setAttribute('aria-pressed',group==='All'?'true':'false');
   button.addEventListener('click',()=>{selectedFamily=group;
    for(const b of familyNav.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===button));
    drawExpanded();
   });
   familyNav.append(button);
  }
  queryInput.addEventListener('input',drawExpanded);
  drawExpanded();
  categoryHost.replaceChildren();
  for(const label of categories){
   const categoryHolders=established.get(label);
   const card=tag('article',undefined,'category-card');
   card.id=establishedRecordAnchor(label);
   card.append(tag('h3',label));
   if(!categoryHolders.length){card.append(tag('p','No verified record holder available','empty'));categoryHost.append(card);continue}
   const value=tag('div',toLabel(categoryHolders[0].record),'category-meta');
   const names=tag('div',undefined,'category-owners');
   for(const holder of categoryHolders)names.append(detail(holder.name,holder.name));
   const scope=tag('small',categoryHolders[0].record.scope);
   const evidence=tag('details',undefined,'established-record-evidence');
   evidence.append(tag('summary','Record evidence'));
   for(const {name,record} of categoryHolders)evidence.append(tag('p',name+' · '+record.context));
   for(const [sourceLabel,href] of establishedRecordSources(label)){
    const link=tag('a',sourceLabel,'cta');link.href=href;evidence.append(link);
   }
   card.append(value,names,scope,evidence);
   const challenger=nextRecordChallenger(archive,guide,label,postseason);
   if(challenger){
    const disclosure=tag('details',undefined,'record-context');
    const summary=tag('summary','How close is the next manager?');
    const explanation=tag('p',
      'Next-best different manager: '+challenger.manager+' · '+toLabel(challenger)+
      ' · '+challenger.context+'. Gap to the record: '+(Number.isFinite(Number(challenger.gap))?Number(challenger.gap).toLocaleString('en-US',{maximumFractionDigits:2}):String(challenger.gap))+
      (challenger.unit==='%'?' percentage points':challenger.unit==='pts'?' points':' '+challenger.unit)+'.');
    disclosure.append(summary,explanation);card.append(disclosure);
   }
   categoryHost.append(card);
  }
  // The sections above the search grow when their archive data arrives.
  openLinkedSearch();
  openLinkedRecord();
 }catch(error){
  list.replaceChildren(tag('p','Record holders are temporarily unavailable. Try the personal record books below.','scope'));
  categoryHost.replaceChildren();
  expandedHost.replaceChildren(tag('p','Expanded records are temporarily unavailable. Try the full expanded Record Book.','scope'));
  const link=tag('a','Open expanded Record Book →');link.href='expanded-records.html';expandedHost.append(link);
  summary.textContent='Record categories temporarily unavailable.';
  const finder=document.getElementById('record-manager-results');
  if(finder){finder.replaceChildren(tag('p','The combined manager finder is temporarily unavailable. The individual record books remain accessible.','scope'));const link=tag('a','Open manager record books →');link.href='../managers/record-books.html';finder.append(link)}
  const selectedLabel=document.getElementById('record-manager-selected');if(selectedLabel)selectedLabel.textContent='Manager record finder unavailable';
  console.error('Record holder leaderboard unavailable',error);
 }
}
start();
