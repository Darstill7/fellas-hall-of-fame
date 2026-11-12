import {findOwnedRecords,recordCategoryLabels,nextRecordChallenger} from './manager-record-ownership.mjs';
const active=new Set(['Stilly','JMid','Thommy','Stew','Scott','Mitch','Tony','Stover','Kuhl','Birch']);
const categories=recordCategoryLabels;
const catalogGroups=['All','Single-game','Career','Season','Rivalries','Final standings'];
const expandedName=name=>name==='Thommy'?'Tom':name;
const displayName=name=>name==='Tom'?'Thommy':name;
const formatExpanded=(record,unit)=>{const val=Number(record.value);const formatted=Number.isFinite(val)?new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(val):String(record.value);return unit==='%'?formatted+'%':unit==='score / 100'?formatted+'/100':formatted+(unit?' '+unit:'')};
const toLabel=record=>{const n=Number(record.value);const value=Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:2}):String(record.value);return value+(record.unit==='pts'?' pts':record.unit==='%'?'%':' '+record.unit)};
const target=name=>'../managers/record-books.html?manager='+encodeURIComponent(name)+'#owned-records';
const tag=(name,value,cls)=>{const e=document.createElement(name);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e};
const currentManagers=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
let collectionWinners=[],managerRows=[],expandedData=null,fortuneRecord=null,scheduleLuckRows=[];
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
 const legacy=row.records.map(r=>({label:r.label,group:'Established records',value:toLabel(r),href:target(selected)}));
 const collection=collectionWinners.filter(r=>r.manager===selected).map(r=>({label:r.label,group:r.family,value:r.value+(r.year?' · '+r.year:''),href:'#'+r.anchor}));
  if(selected==='Birch'&&fortuneRecord)collection.unshift({label:'Most favorable career schedule draw · Schedule Luck',group:'Career',value:'+'+fortuneRecord.winSurplus.toFixed(2)+' wins',href:'#schedule-luck-record'});
 // A concept can appear in multiple historical catalogs; display a warning instead of adding counts.
 const sections=[['New historical collections',collection],['Expanded league records',expanded],['Established records',legacy]];
 const count=collection.length+expanded.length+legacy.length;
 selectedLabel.textContent=selected+' · '+count+' first-place category entries';
 results.replaceChildren();
 const warning=tag('p','These are first-place category entries, not '+count+' necessarily distinct records. Overlapping concepts across collections are retained for transparency. Ties share first place. Ongoing 2026 season watchlists are excluded.','muted');
 results.append(warning);
 const luck=scheduleLuckRows.find(r=>displayName(r.manager)===selected);
 if(luck){
  const metric=tag('section',undefined,'record-finder-section');
  const title=tag('h3','Career Schedule Luck · Statistical profile (not record count)');
  const signed=(x,d=2)=>(x>0?'+':'')+x.toFixed(d);
  const value=tag('strong',signed(luck.winSurplus)+' wins above expectation');
  const explanation=tag('p',luck.actualWinCredits+' actual win credits vs '+luck.expectedWins.toFixed(2)+' expected across '+luck.seasons+' completed seasons ('+luck.pairedWeeks+' paired weeks). Per-week differential: '+signed(luck.surplusPerWeek,4)+'.','muted');
  const source=tag('a','Compare every manager →');source.href='#schedule-luck-leaderboard';
  metric.append(title,value,explanation,source);
  results.append(metric);
 }
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
 const more=tag('a','See '+selected+'’s full personal record book →','record-finder-more');
 more.href=target(selected);results.append(more);
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
async function start(){
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
  if(expanded.version!==1||expanded.categoryCount!==44||expanded.categories?.length!==44||categories.length!==16)throw Error('Expanded and legacy record catalog mismatch');
  const leadersByManager=new Map();
  for(const category of expanded.categories){
   if(!category.key||!category.label||!Array.isArray(category.leaders)||!category.leaders.length)throw Error('Incomplete expanded category: '+category.key);
   const names=new Set(category.leaders.filter(r=>r.rank===1).map(r=>expandedName(r.manager)));
   for(const name of names){const records=leadersByManager.get(name)||[];records.push({key:category.key,label:category.label,group:category.group});leadersByManager.set(name,records)}
  }
  const postseason={espn,sleeper,placements,placementReceipts,allEra};
  if(!Array.isArray(archive.managers)||archive.managers.length<10||!archive.asOf)throw Error('Unexpected record archive');
  const rows=archive.managers.map(m=>({name:m.manager,records:findOwnedRecords(archive,guide,m.manager,postseason),expandedRecords:leadersByManager.get(expandedName(m.manager))||[]}))
   .sort((a,b)=>b.expandedRecords.length-a.expandedRecords.length||b.records.length-a.records.length||a.name.localeCompare(b.name));
  for(const [name,records] of leadersByManager)if(!rows.some(row=>expandedName(row.name)===name))rows.push({name,records:[],expandedRecords:records});
  rows.sort((a,b)=>b.expandedRecords.length-a.expandedRecords.length||b.records.length-a.records.length||a.name.localeCompare(b.name));
  managerRows=rows;expandedData=expanded;renderManagerFinder();
  fetch('../data/hall_of_fortune_2016_2026w9_v1.json').then(r=>{if(!r.ok)throw Error('Schedule Luck registry unavailable');return r.json()}).then(data=>{const ranks=data.careerScheduleSurplusNormalized||[];scheduleLuckRows=ranks;const leader=ranks[0];if(leader?.manager==='Birch'&&leader.winSurplus>0)fortuneRecord=leader;renderManagerFinder()}).catch(()=>{fortuneRecord=null});
  summary.textContent=expanded.categoryCount+' expanded categories + '+categories.length+' established categories · Tied first-place managers share credit · Some record concepts overlap.';
  list.replaceChildren();
  other.replaceChildren();
  const remaining=rows.filter(row=>!row.records.length&&!row.expandedRecords.length);
  otherDisclosure.hidden=remaining.length===0;
  for(const row of rows){
   const a=tag('a',undefined,'leader-card');a.href=target(row.name);
   const heading=tag('h3',row.name+(active.has(row.name)?'':' · Former manager'));
   const count=tag('span',row.expandedRecords.length+' expanded '+(row.expandedRecords.length===1?'record':'records'),'count');
   const breakdown=tag('span',row.records.length+' established-category leads · First-place records only','leader-count-breakdown');
   const preview=tag('small',row.expandedRecords.length?row.expandedRecords.slice(0,3).map(r=>r.label).join(' · '):row.records.length?row.records.slice(0,2).map(r=>r.label).join(' · '):'No current first-place category lead');
   const link=tag('span','Explore this manager’s records →','cta');
   a.append(heading,count,breakdown,preview,link);(row.records.length||row.expandedRecords.length?list:other).append(a);
  }
  // New primary catalog; the established legacy set remains under a separate disclosure.
  const drawExpanded=(selected)=>{
   expandedHost.replaceChildren();
   const filtered=expanded.categories.filter(c=>selected==='All'||c.group===selected);
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
    const exact=tag('a','View full ranked evidence →');exact.href='expanded-records.html?group='+encodeURIComponent(category.group)+'&category='+encodeURIComponent(category.key);exact.className='cta';exact.style.display='inline-flex';exact.style.minHeight='44px';exact.style.alignItems='center';exact.style.marginTop='8px';card.append(exact);
    expandedHost.append(card);
   }
  };
  familyNav.replaceChildren();
  for(const group of catalogGroups){
   const button=tag('button',group+(group==='All'?' ('+expanded.categoryCount+')':' ('+expanded.categories.filter(c=>c.group===group).length+')'));
   button.type='button';button.setAttribute('aria-pressed',group==='All'?'true':'false');
   button.addEventListener('click',()=>{for(const b of familyNav.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===button));drawExpanded(group)});
   familyNav.append(button);
  }
  drawExpanded('All');
  categoryHost.replaceChildren();
  for(const label of categories){
   const categoryHolders=rows.flatMap(r=>r.records.filter(record=>record.label===label).map(record=>({name:r.name,record})));
   const card=tag('article',undefined,'category-card');
   card.append(tag('h3',label));
   if(!categoryHolders.length){card.append(tag('p','No verified record holder available','empty'));categoryHost.append(card);continue}
   const value=tag('div',toLabel(categoryHolders[0].record),'category-meta');
   const names=tag('div',undefined,'category-owners');
   for(const holder of categoryHolders)names.append(detail(holder.name,holder.name));
   const context=tag('small',categoryHolders[0].record.context+' · '+categoryHolders[0].record.scope);
   card.append(value,names,context);
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
