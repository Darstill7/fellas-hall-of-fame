import {findOwnedRecords} from './manager-record-ownership.mjs';
const active=new Set(['Stilly','JMid','Thommy','Stew','Scott','Mitch','Tony','Stover','Kuhl','Birch']);
const categories=[
 'Highest regular-season weekly score',
 'Largest regular-season victory',
 'Most career regular-season wins',
 'Most wins in a completed regular season',
 'Most championships'
];
const toLabel=record=>record.value+(record.unit==='pts'?' pts':' '+record.unit);
const target=name=>'../managers/record-books.html?manager='+encodeURIComponent(name)+'#owned-records';
const tag=(name,value,cls)=>{const e=document.createElement(name);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e};
const detail=(name,label)=>{const a=tag('a',label);a.href=target(name);return a};
async function start(){
 const list=document.getElementById('record-leaders'),categoryHost=document.getElementById('record-categories');
 try{
  const responses=await Promise.all([
   fetch('../data/manager_record_books_2016_2026.json'),
   fetch('../data/season_guide.json')
  ]);
  if(responses.some(r=>!r.ok))throw Error('Record files unavailable');
  const [archive,guide]=await Promise.all(responses.map(r=>r.json()));
  if(archive.asOf!=='2026 Week 8'||!Array.isArray(archive.managers))throw Error('Unexpected record archive');
  const rows=archive.managers.map(m=>({name:m.manager,records:findOwnedRecords(archive,guide,m.manager)}))
   .sort((a,b)=>b.records.length-a.records.length||a.name.localeCompare(b.name));
  list.replaceChildren();
  for(const row of rows){
   const a=tag('a',undefined,'leader-card');a.href=target(row.name);
   const heading=tag('h3',row.name+(active.has(row.name)?'':' · Former manager'));
   const count=tag('span',row.records.length+' '+(row.records.length===1?'record':'records'),'count');
   const preview=tag('small',row.records.length?row.records.map(r=>r.label).join(' · '):'No league lead among these five categories');
   const link=tag('span','View exact records →','cta');
   a.append(heading,count,preview,link);list.append(a);
  }
  categoryHost.replaceChildren();
  for(const label of categories){
   const holders=rows.flatMap(r=>r.records.filter(record=>record.label===label).map(record=>({name:r.name,record})));
   const card=tag('article',undefined,'category-card');
   card.append(tag('h3',label));
   if(!holders.length){card.append(tag('p','No verified record holder available','empty'));categoryHost.append(card);continue}
   const value=tag('div',toLabel(holders[0].record),'category-meta');
   const names=tag('div',undefined,'category-owners');
   for(const holder of holders)names.append(detail(holder.name,holder.name));
   const context=tag('small',holders[0].record.context+' · '+holders[0].record.scope);
   card.append(value,names,context);categoryHost.append(card);
  }
 }catch(error){
  list.replaceChildren(tag('p','Record holders are temporarily unavailable. Try the personal record books below.','scope'));
  categoryHost.replaceChildren();
  console.error('Record holder leaderboard unavailable',error);
 }
}
start();
