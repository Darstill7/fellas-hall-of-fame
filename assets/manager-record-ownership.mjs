// Archived category leaders, computed from verified manager record-book rows.
// Career-wide comparisons include former managers; 2026 is excluded from season wins.
export function findOwnedRecords(archive,guide,manager){
 const all=archive.managers||[];
 const categories=[
  {label:'Highest regular-season weekly score',rows:all.filter(m=>Number.isFinite(m.bestWeek?.points)).map(m=>({manager:m.manager,value:m.bestWeek.points,game:m.bestWeek})),direction:'max',unit:'pts'},
  {label:'Largest regular-season victory',rows:all.filter(m=>Number.isFinite(m.biggestWin?.margin)).map(m=>({manager:m.manager,value:m.biggestWin.margin,game:m.biggestWin})),direction:'max',unit:'pts'},
  {label:'Most career regular-season wins',rows:all.filter(m=>Number.isInteger(m.regular?.w)).map(m=>({manager:m.manager,value:m.regular.w})),direction:'max',unit:'wins'},
  {label:'Most wins in a completed regular season',rows:all.flatMap(m=>(m.annual||[]).filter(y=>y.year<=2025&&Number.isInteger(y.w)).map(y=>({manager:m.manager,value:y.w,year:y.year}))),direction:'max',unit:'wins'},
  {label:'Most championships',rows:all.map(m=>({manager:m.manager,value:Object.values(guide).filter(y=>(y.champion==='Tom'?'Thommy':y.champion)===m.manager).length})),direction:'max',unit:'titles'}
 ];
 return categories.flatMap(category=>{
  if(!category.rows.length)return [];
  const recordValue=Math[category.direction](...category.rows.map(x=>x.value));
  if(recordValue<=0)return [];
  const winners=category.rows.filter(x=>x.value===recordValue);
  return winners.filter(x=>x.manager===manager).map(x=>({
   label:category.label,value:x.value,unit:category.unit,
   shared:new Set(winners.map(w=>w.manager)).size>1,
   context:x.game?'Week '+x.game.week+', '+x.game.year+' vs '+x.game.opponent:
    x.year?'Season '+x.year:'Archived career through '+archive.asOf,
   scope:category.label==='Most championships'?'Verified title seasons through 2025':
    category.label==='Most wins in a completed regular season'?'Completed seasons through 2025':
    'Recorded 2016–'+archive.asOf
  }));
 });
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
    message.textContent='No league-leading record in these five verified categories yet. See personal records below for this manager’s biggest performances.';
    root.append(message);return;
   }
   const list=document.createElement('div');list.className='owned-record-grid';
   for(const r of owned){
    const card=document.createElement('article');card.className='owned-record';
    const label=document.createElement('h3');label.textContent=r.label;
    const value=document.createElement('strong');value.textContent=String(r.value)+(r.unit==='pts'?' pts':' '+r.unit);
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
