// Manager directory comparison: current career games from approved canonical ledger,
// championship counts from the named profile-title ledger. No synthetic outcomes.
export const managerIdentity={stilly:'Stilly',jmid:'JMid',tom:'Thommy',stew:'Stew',scott:'Scott',mitch:'Mitch',tony:'Tony',stover:'Stover',kuhl:'Kuhl',birch:'Birch'};
export function directoryMetrics(ledger,summary){
 if(!Array.isArray(ledger?.games)||!summary?.managers)throw Error('Approved manager sources unavailable');
 const approved=ledger.games.filter(g=>g.year===2026&&g.stage==='regular');
 const week=Math.max(0,...approved.map(g=>g.week));
 if(week<1||week>14||!Number.isInteger(week))throw Error('Invalid current-season cutoff');
 for(let w=1;w<=week;w++){
  const games=approved.filter(g=>g.week===w);
  if(games.length!==5||new Set(games.flatMap(g=>[g.home,g.away])).size!==10||
   games.some(g=>!Number.isFinite(g.homeScore)||!Number.isFinite(g.awayScore)))
   throw Error('Incomplete current week '+w);
 }
 const result={};
 for(const [slug,name] of Object.entries(managerIdentity)){
  const profile=summary.managers[name];
  if(!profile||!Array.isArray(profile.titles))throw Error('Missing manager championship source '+name);
  const games=ledger.games.filter(g=>g.stage==='regular'&&(g.home===name||g.away===name));
  if(!games.length||games.some(g=>!Number.isFinite(g.homeScore)||!Number.isFinite(g.awayScore)))throw Error('Missing documented games for '+name);
  let w=0,l=0,t=0;
  for(const g of games){
   const forPoints=g.home===name?g.homeScore:g.awayScore;
   const against=g.home===name?g.awayScore:g.homeScore;
   if(forPoints>against)w++;else if(forPoints<against)l++;else t++;
  }
  const titles=[...new Set(profile.titles.map(item=>item.year))];
  if(titles.some(y=>!Number.isInteger(y)||y<2016||y>=2026))throw Error('Invalid verified title year '+name);
  result[slug]={slug,name,games:games.length,w,l,t,pct:(w+t/2)/games.length,titles:titles.length,years:titles,week};
 }
 return result;
}
export function orderedSlugs(metrics,sort,original){
 const list=[...original];
 if(sort==='championships')list.sort((a,b)=>metrics[b].titles-metrics[a].titles||metrics[b].pct-metrics[a].pct||original.indexOf(a)-original.indexOf(b));
 else if(sort==='winpct')list.sort((a,b)=>metrics[b].pct-metrics[a].pct||metrics[b].games-metrics[a].games||original.indexOf(a)-original.indexOf(b));
 else if(sort==='games')list.sort((a,b)=>metrics[b].games-metrics[a].games||metrics[b].pct-metrics[a].pct||original.indexOf(a)-original.indexOf(b));
 else if(sort!=='original')throw Error('Unknown directory sort');
 return list;
}
const percent=n=>new Intl.NumberFormat('en-US',{style:'percent',minimumFractionDigits:1,maximumFractionDigits:1}).format(n);
export function applyDirectoryStats(cards,metrics,sort='original'){
 const original=cards.map(card=>card.getAttribute('href').split('/')[0]);
 if(original.length!==10||new Set(original).size!==10)throw Error('Expected ten unique manager profile links');
 const target=cards[0]?.parentNode;
 if(!target)throw Error('No manager grid');
 for(const card of cards){
  const slug=card.getAttribute('href').split('/')[0],info=metrics[slug];
  if(!info)throw Error('Missing approved profile '+slug);
  let line=card.querySelector('.manager-comparison-stats');
  if(!line){line=document.createElement('div');line.className='manager-comparison-stats';card.querySelector('p')?.after(line);}
  line.textContent='';
  for(const [label,value] of [['W–L'+(info.t?'–T':''),info.w+'–'+info.l+(info.t?'–'+info.t:'')],['Win rate',percent(info.pct)],['Titles',String(info.titles)]]){
   const item=document.createElement('span'),strong=document.createElement('strong');
   strong.textContent=value;item.textContent=label+' ';item.append(strong);line.append(item);
  }
 }
 const reorder=key=>{for(const slug of orderedSlugs(metrics,key,original))target.append(cards.find(card=>card.getAttribute('href').split('/')[0]===slug));};
 reorder(sort);
 return reorder;
}
export async function mountDirectoryComparison(){
 const select=document.querySelector('#manager-sort'),count=document.querySelector('#manager-comparison-source'),cards=[...document.querySelectorAll('#manager-directory-cards>a.manager')];
 if(!select||!count||cards.length!==10)return;
 try{
  const responses=await Promise.all([
   fetch('../data/unified_record_book_2016_2026.json',{cache:'no-store'}),
   fetch('../data/manager_profile_career_summary_v2.json',{cache:'no-store'})
  ]);
  if(responses.some(r=>!r.ok))throw Error('Missing approved sources');
  const metrics=directoryMetrics(...await Promise.all(responses.map(r=>r.json())));
  const reorder=applyDirectoryStats(cards,metrics,select.value);
  select.addEventListener('change',()=>reorder(select.value));
  const week=metrics.stilly.week;
  count.textContent='Documented regular-season records · 2026 through approved Week '+week+' · Titles from verified championship history';
  select.disabled=false;
 }catch{
  select.disabled=true;
  count.textContent='Career comparison unavailable. Manager links and name search still work; no statistics have been estimated.';
 }
}
if(typeof document!=='undefined')mountDirectoryComparison();
