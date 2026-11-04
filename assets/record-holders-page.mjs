import {findOwnedRecords,recordCategoryLabels,nextRecordChallenger} from './manager-record-ownership.mjs';
const active=new Set(['Stilly','JMid','Thommy','Stew','Scott','Mitch','Tony','Stover','Kuhl','Birch']);
const categories=recordCategoryLabels;
const toLabel=record=>record.value+(record.unit==='pts'?' pts':record.unit==='%'?'%':' '+record.unit);
const target=name=>'../managers/record-books.html?manager='+encodeURIComponent(name)+'#owned-records';
const tag=(name,value,cls)=>{const e=document.createElement(name);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e};
const detail=(name,label)=>{const a=tag('a',label);a.href=target(name);return a};
async function start(){
 const list=document.getElementById('record-leaders'),other=document.getElementById('record-other'),otherDisclosure=document.getElementById('leader-other'),categoryHost=document.getElementById('record-categories');
 try{
  const responses=await Promise.all([
   fetch('../data/manager_record_books_2016_2026.json'),
   fetch('../data/season_guide.json'),
   fetch('../data/verified_espn_playoff_brackets_2016_2019.json'),
   fetch('../data/verified_sleeper_playoff_brackets_2020_2025.json'),
   fetch('../data/fellas_final_placements_2020_2025.json'),
   fetch('../data/sleeper_postseason_placement_receipts_2020_2025.json')
  ]);
  if(responses.some(r=>!r.ok))throw Error('Record files unavailable');
  const [archive,guide,espn,sleeper,placements,placementReceipts]=await Promise.all(responses.map(r=>r.json()));
  const postseason={espn,sleeper,placements,placementReceipts};
  if(archive.asOf!=='2026 Week 8'||!Array.isArray(archive.managers))throw Error('Unexpected record archive');
  const rows=archive.managers.map(m=>({name:m.manager,records:findOwnedRecords(archive,guide,m.manager,postseason)}))
   .sort((a,b)=>b.records.length-a.records.length||a.name.localeCompare(b.name));
  list.replaceChildren();
  other.replaceChildren();
  const remaining=rows.filter(row=>row.records.length===0);
  otherDisclosure.hidden=remaining.length===0;
  for(const row of rows){
   const a=tag('a',undefined,'leader-card');a.href=target(row.name);
   const heading=tag('h3',row.name+(active.has(row.name)?'':' · Former manager'));
   const count=tag('span',row.records.length+' '+(row.records.length===1?'record':'records'),'count');
   const preview=tag('small',row.records.length?row.records.map(r=>r.label).join(' · '):'No league lead among these '+categories.length+' categories');
   const link=tag('span','View exact records →','cta');
   a.append(heading,count,preview,link);(row.records.length?list:other).append(a);
  }
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
      ' · '+challenger.context+'. Gap to the record: '+challenger.gap+
      (challenger.unit==='%'?' percentage points':challenger.unit==='pts'?' points':' '+challenger.unit)+'.');
    disclosure.append(summary,explanation);card.append(disclosure);
   }
   categoryHost.append(card);
  }
 }catch(error){
  list.replaceChildren(tag('p','Record holders are temporarily unavailable. Try the personal record books below.','scope'));
  categoryHost.replaceChildren();
  console.error('Record holder leaderboard unavailable',error);
 }
}
start();
