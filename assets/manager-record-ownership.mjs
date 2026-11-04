// Archived category leaders, computed from verified manager record-book rows.
// Career-wide comparisons include former managers; 2026 is excluded from season wins.
export const recordCategoryLabels=[
 'Highest regular-season weekly score',
 'Largest regular-season victory',
 'Most career regular-season wins',
 'Most wins in a completed regular season',
 'Most championships',
 'Most points in a completed regular season',
 'Closest regular-season victory',
 'Highest career regular-season winning percentage (50+ games)'
];
export function buildRecordCategories(archive,guide){
 const all=archive.managers||[];
 const categories=[
  {label:'Highest regular-season weekly score',rows:all.filter(m=>Number.isFinite(m.bestWeek?.points)).map(m=>({manager:m.manager,value:m.bestWeek.points,game:m.bestWeek})),direction:'max',unit:'pts'},
  {label:'Largest regular-season victory',rows:all.filter(m=>Number.isFinite(m.biggestWin?.margin)).map(m=>({manager:m.manager,value:m.biggestWin.margin,game:m.biggestWin})),direction:'max',unit:'pts'},
  {label:'Most career regular-season wins',rows:all.filter(m=>Number.isInteger(m.regular?.w)).map(m=>({manager:m.manager,value:m.regular.w})),direction:'max',unit:'wins'},
  {label:'Most wins in a completed regular season',rows:all.flatMap(m=>(m.annual||[]).filter(y=>y.year<=2025&&Number.isInteger(y.w)).map(y=>({manager:m.manager,value:y.w,year:y.year}))),direction:'max',unit:'wins'},
  {label:'Most championships',rows:all.map(m=>({manager:m.manager,value:Object.values(guide).filter(y=>(y.champion==='Tom'?'Thommy':y.champion)===m.manager).length})),direction:'max',unit:'titles'},
  {label:'Most points in a completed regular season',rows:Object.entries(guide).filter(([year])=>Number(year)<=2025).flatMap(([year,season])=>(season.standings||[]).filter(row=>Number.isFinite(row.pf)).map(row=>({manager:row.name==='Tom'?'Thommy':row.name,value:row.pf,year:Number(year)}))),direction:'max',unit:'pts'},
  {label:'Closest regular-season victory',rows:all.filter(m=>Number.isFinite(m.closestWin?.margin)&&m.closestWin.margin>0).map(m=>({manager:m.manager,value:m.closestWin.margin,game:m.closestWin})),direction:'min',unit:'pts'},
  {label:'Highest career regular-season winning percentage (50+ games)',rows:all.filter(m=>m.regular?.games>=50&&Number.isInteger(m.regular.w)&&Number.isInteger(m.regular.t)).map(m=>({manager:m.manager,value:Number((100*(m.regular.w+m.regular.t/2)/m.regular.games).toFixed(2)),games:m.regular.games})),direction:'max',unit:'%'}
 ];
 return categories;
}
export function findOwnedRecords(archive,guide,manager){
 const categories=buildRecordCategories(archive,guide);
 return categories.flatMap(category=>{
  if(!category.rows.length)return [];
  const recordValue=Math[category.direction](...category.rows.map(x=>x.value));
  if(recordValue<=0)return [];
  const winners=category.rows.filter(x=>x.value===recordValue);
  // A manager may tie a season record in multiple years; that still owns one category.
  const selected=winners.find(x=>x.manager===manager);
  return (selected?[selected]:[]).map(x=>({
   label:category.label,value:x.value,unit:category.unit,
   shared:new Set(winners.map(w=>w.manager)).size>1,
   context:x.game?'Week '+x.game.week+', '+x.game.year+' vs '+x.game.opponent:
    x.year?'Season '+x.year:x.games?x.games+' regular-season games through '+archive.asOf:'Archived career through '+archive.asOf,
   scope:category.label==='Most championships'?'Verified title seasons through 2025':
    category.label==='Most wins in a completed regular season'||category.label==='Most points in a completed regular season'?'Completed seasons through 2025; raw ESPN/Sleeper scores are not normalized':
    category.unit==='%'?'At least 50 archived regular-season games, ties count as half a win':
    'Recorded 2016–'+archive.asOf
  }));
 });
}
// Compare with the next-best different manager, not the holder's second season.
export function nextRecordChallenger(archive,guide,label){
 const category=buildRecordCategories(archive,guide).find(c=>c.label===label);
 if(!category||category.rows.length<2)return null;
 const ordered=[...category.rows].sort((a,b)=>category.direction==='min'?a.value-b.value:b.value-a.value);
 const leader=ordered[0].value;
 const leadingManagers=new Set(ordered.filter(r=>r.value===leader).map(r=>r.manager));
 const next=ordered.find(r=>!leadingManagers.has(r.manager));
 if(!next)return null;
 return {
  manager:next.manager,value:next.value,unit:category.unit,
  context:next.game?'Week '+next.game.week+', '+next.game.year+' vs '+next.game.opponent:
   next.year?'Season '+next.year:next.games?next.games+' archived games':'Archived career',
  gap:Number(Math.abs(leader-next.value).toFixed(2))
 };
}
export async function mountRecordOwnership(){
 const root=document.getElementById('owned-records');
 const picker=document.getElementById('manager');
 if(!root||!picker)return;
 try{
  const [ar,gr]=await Promise.all([fetch('../data/manager_record_books_2016_2026.json'),fetch('../data/season_guide.json')]);
  if(!ar.ok||!gr.ok)throw Error('Data unavailable');
  const [archive,guide]=await Promise.all([ar.json(),gr.json()]);
  const draw=()=>{
   const manager=picker.value;
   const owned=findOwnedRecords(archive,guide,manager);
   root.replaceChildren();
   const heading=document.createElement('h2');heading.textContent='League records '+manager+' owns';root.append(heading);
   const intro=document.createElement('p');intro.className='muted';intro.textContent='Category leaders across current and former managers. Tied records are marked shared; personal bests appear below.';root.append(intro);
   if(!owned.length){
    const message=document.createElement('p');message.className='note';
    message.textContent='No league-leading record in these '+recordCategoryLabels.length+' verified categories yet. See personal records below for this manager’s biggest performances.';
    root.append(message);return;
   }
   const list=document.createElement('div');list.className='owned-record-grid';
   for(const r of owned){
    const card=document.createElement('article');card.className='owned-record';
    const label=document.createElement('h3');label.textContent=r.label;
    const value=document.createElement('strong');value.textContent=String(r.value)+(r.unit==='pts'?' pts':r.unit==='%'?'%':' '+r.unit);
    const context=document.createElement('p');context.textContent=r.context;
    const scope=document.createElement('small');scope.textContent=(r.shared?'Shared league record · ':'League record · ')+r.scope;
    card.append(label,value,context,scope);list.append(card);
   }
   root.append(list);
  };
  picker.addEventListener('change',draw);
  if(picker.options.length)draw();
  else{
   // The historical selector populates from a separate async fetch.
   // Do not render an empty state before its options and default selection exist.
   const observer=new MutationObserver(()=>{
    if(!picker.options.length)return;
    observer.disconnect();
    draw();
   });
   observer.observe(picker,{childList:true});
  }
 }catch(e){
  root.textContent='League record ownership is temporarily unavailable; personal records remain below.';
  console.error('Record ownership unavailable',e);
 }
}
if(typeof document!=='undefined')mountRecordOwnership();
