import {fellasLeague,normalizeManager} from './league-config.mjs';
// Search the already published archive, not the uncertified research candidates.
export function indexPublishedCategories(archive){
 if(archive?.version!==1||!Array.isArray(archive.categories)||archive.categoryCount!==archive.categories.length)throw Error('Invalid record archive');
 const seen=new Set();
 return archive.categories.map(c=>{
  if(typeof c.key!=='string'||!c.key||seen.has(c.key)||typeof c.group!=='string'||typeof c.label!=='string')throw Error('Invalid category');
  seen.add(c.key);
  return {key:c.key,group:c.group,label:c.label,description:String(c.description??''),qualifier:String(c.qualifier??'')};
 });
}
// A category counts once per manager, even with multiple tied performances.
export function managerArchivePortfolio(archive,name){
 const categories=indexPublishedCategories(archive);
 const who=normalizeManager(name);
 if(!fellasLeague.managers.includes(who))return null;
 const ranked=categories.flatMap((c,i)=>{
  const source=archive.categories[i];
  if(!Array.isArray(source.leaders)||source.leaders.some(r=>!Number.isInteger(r.rank)||r.rank<1||!Number.isFinite(r.value)||typeof r.manager!=='string'))throw Error('Invalid archived ranking');
  const mine=source.leaders.filter(r=>normalizeManager(r.manager)===who);
  if(!mine.length)return [];
  const best=Math.min(...mine.map(r=>r.rank));
  const holders=[...new Set(source.leaders.filter(r=>r.rank===1).map(r=>normalizeManager(r.manager)))];
  return [{...c,unit:source.unit,rank:best,marks:mine.filter(r=>r.rank===best),holders,shared:holders.length>1}];
 });
 return {manager:who,total:categories.length,owned:ranked.filter(r=>r.rank===1),podium:ranked.filter(r=>r.rank<=3),ranked};
}
export function searchCategories(rows,query='',group=''){
 const tokens=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
 return rows.filter(c=>(!group||c.group===group)&&tokens.every(t=>(c.label+' '+c.group+' '+c.key.replaceAll('-',' ')+' '+c.description+' '+c.qualifier).toLowerCase().includes(t)));
}
export function categoryHref(row,manager=''){
 const params=new URLSearchParams({group:row.group,category:row.key});
 if(manager)params.set('manager',normalizeManager(manager));
 return 'expanded-records.html?'+params;
}
export function archivedRanking(archive,key,manager=''){
 const category=archive.categories.find(c=>c.key===key);if(!category)return null;
 const rows=category.leaders.slice().sort((a,b)=>a.rank-b.rank);
 const first=rows.filter(r=>r.rank===1);
 const mine=rows.filter(r=>normalizeManager(r.manager)===normalizeManager(manager));
 const best=mine[0]?.rank??null;
 return {category,rows,first,holders:[...new Set(first.map(r=>normalizeManager(r.manager)))],personalRank:best,personalMarks:best===null?[]:mine.filter(r=>r.rank===best)};
}
const formatMark=(v,u)=>v.toLocaleString('en-US',{maximumFractionDigits:2})+(u==='%'?'%':u==='score / 100'?'/100':u?' '+u:'');
export function archivedContext(row,category){
 const e=row.evidence??{},year=e.year??row.year,week=e.week??row.week;
 if(Number.isInteger(year)&&Number.isInteger(week))return year+' · Week '+week+(e.opponent?' vs '+normalizeManager(e.opponent):'')+(Number.isFinite(e.points)&&Number.isFinite(e.opponentPoints)?' · '+e.points.toFixed(2)+'–'+e.opponentPoints.toFixed(2):'');
 if(e.endingYear)return 'Ending '+e.endingYear+(e.endingWeek?' · Week '+e.endingWeek:'')+' · archived regular-season appearances';
 if(e.opponent)return 'vs '+normalizeManager(e.opponent)+(Number.isFinite(e.meetings)?' · '+e.meetings+' meetings':'');
 if(e.fromYear&&e.toYear)return e.fromYear+' → '+e.toYear+' · finish #'+e.fromRank+' → #'+e.toRank;
 if(year)return year+' season'+(Number.isFinite(e.games)?' · '+e.games+' archived games':'');
 if(Number.isFinite(e.games))return e.games+' archived regular-season games';
 if(category.group==='Final standings')return 'Completed-season placement archive';
 return 'See category qualification and source evidence';
}
// Derive narrative solely from the same evidence as the displayed rank.
export function archivedStory(row,category){
 const e=row.evidence??{},name=normalizeManager(row.manager),opponent=normalizeManager(e.opponent??'');
 if(Number.isInteger(e.year)&&Number.isInteger(e.week)&&opponent&&Number.isFinite(e.points)&&Number.isFinite(e.opponentPoints)){
  const delta=Math.round((e.points-e.opponentPoints)*100)/100;
  const outcome=delta>0?'defeated':delta<0?'lost to':'tied';
  return 'In Week '+e.week+' of '+e.year+', '+name+' '+outcome+' '+opponent+' '+e.points.toFixed(2)+' to '+e.opponentPoints.toFixed(2)+'. '+(delta?'The margin was '+Math.abs(delta).toFixed(2)+' points.':'The scores were level.');
 }
 if(category.key==='winning-streak'&&e.endingYear)return name+' recorded '+row.value+' consecutive archived regular-season wins, ending in '+e.endingYear+' Week '+e.endingWeek+'. Postseason results are excluded; this is not an uninterrupted all-game winning streak.';
 if(e.fromYear&&e.toYear&&Number.isInteger(e.fromRank)&&Number.isInteger(e.toRank))return name+' finished #'+e.fromRank+' in '+e.fromYear+' and #'+e.toRank+' in '+e.toYear+'.';
 if(opponent&&Number.isInteger(e.meetings)&&Number.isInteger(e.wins)&&Number.isInteger(e.losses))return name+' recorded '+e.wins+' wins and '+e.losses+' losses against '+opponent+' across '+e.meetings+' archived meetings.'+(e.meetings===e.wins+e.losses?'':' Other results are included in the meeting count.');
 if(Number.isInteger(e.year)&&Number.isInteger(e.games)&&Number.isInteger(e.wins)&&Number.isInteger(e.losses))return name+' finished the archived '+e.year+' regular season with '+e.wins+' wins and '+e.losses+' losses across '+e.games+' games.'+(Number.isFinite(e.points)?' The matchup ledger totals '+formatMark(e.points,'pts')+'.':'');
 return null;
}
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e};
export async function mountRecordBookDiscovery(){
 const host=document.querySelector('#record-book-v30-discovery');if(!host||host.dataset.mounted)return;host.dataset.mounted='yes';
 const personal=document.querySelector('#personal-record-entry');
 const select=el('select');select.id='rb30-manager';
 const label=el('label','Choose your manager');label.htmlFor=select.id;
 select.append(new Option('Choose a manager',''));
 for(const name of fellasLeague.managers)select.append(new Option(name,name));
 let preferred='';try{preferred=normalizeManager(localStorage.getItem(fellasLeague.preferenceKey)||'')}catch{}
 const requested=normalizeManager(new URL(location.href).searchParams.get('manager')||'');
 if(fellasLeague.managers.includes(requested))select.value=requested;else if(!new URL(location.href).searchParams.has('manager')&&fellasLeague.managers.includes(preferred))select.value=preferred;
 const link=document.querySelector('#personal-record-entry-link');
 const sync=()=>{if(!link)return;const name=select.value;link.href='../managers/record-books.html'+(name?'?manager='+encodeURIComponent(name):'')+'#owned-records';link.textContent=name?'League records held by '+name+' →':'Open manager record book →'};
 select.addEventListener('change',()=>{const url=new URL(location.href);url.searchParams.set('manager',select.value);history.replaceState(null,'',url);sync();paintOwnership();paint();if(selectedKey)paintRanking(false)});
 personal?.insertBefore(label,link);personal?.insertBefore(select,link);sync();
 const search=el('input');search.id='rb30-search';search.type='search';search.placeholder='Try winning streak, scoring or rivalry';
 const searchLabel=el('label','Find a record');searchLabel.htmlFor=search.id;
 const family=el('select');family.id='rb30-family';family.append(new Option('All categories',''));
 const familyLabel=el('label','Record type');familyLabel.htmlFor=family.id;
 const controls=el('div',null,'rb30-controls');
 for(const [a,b] of [[searchLabel,search],[familyLabel,family]]){const field=el('div');field.append(a,b);controls.append(field)}
 const status=el('p','Loading archived categories…','rb30-status');status.setAttribute('role','status');
 const results=el('div',null,'rb30-results');let rows=[],archive=null;
 const ownership=el('div',null,'rb30-ownership');ownership.setAttribute('aria-live','polite');personal?.insertBefore(ownership,link);
 const ranking=el('section',null,'rb30-ranking');ranking.hidden=true;ranking.id='rb30-ranking';
 let selectedKey='',returnFocus=null,limit=8;
 const more=el('button','Show more categories','rb30-more');more.type='button';more.hidden=true;more.addEventListener('click',()=>{const previous=limit;limit+=8;paint();results.children[previous]?.focus();});
 host.append(controls,status,ranking,results,more);
 function paint(){
  const matching=searchCategories(rows,search.value,family.value);
  results.replaceChildren();
  status.textContent='Showing '+Math.min(limit,matching.length)+' of '+matching.length+' matching categories · '+rows.length+' in archive';
  more.hidden=matching.length<=limit;more.textContent='Show '+Math.min(8,Math.max(0,matching.length-limit))+' more categories';
  for(const c of matching.slice(0,limit)){const a=el('a',null,'rb30-result');a.href=categoryHref(c,select.value);a.append(el('small',c.group),el('strong',c.label),el('span','Preview ranking →'));a.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();selectedKey=c.key;returnFocus=c.key;paintRanking(true)});a.dataset.category=c.key;results.append(a)}
  if(!matching.length)results.append(el('p','No matching categories. Try another search or choose All categories.'));
 }
 function paintRanking(focus){
  const d=archive&&archivedRanking(archive,selectedKey,select.value);if(!d)return;
  const c=d.category;
  ranking.replaceChildren();ranking.hidden=false;
  const header=el('div',null,'rb30-ranking-head'),heading=el('h3',c.label);heading.tabIndex=-1;
  const close=el('button','Close preview');close.type='button';close.className='rb30-more';close.addEventListener('click',()=>{selectedKey='';ranking.hidden=true;const target=[...results.querySelectorAll('[data-category]')].find(a=>a.dataset.category===returnFocus);(target??search).focus()});
  header.append(heading,close);ranking.append(el('small',c.group),header,el('p',c.description,'rb30-status'));
  if(c.qualifier)ranking.append(el('p','Qualification: '+c.qualifier,'rb30-status'));
  if(d.first.length){
   const leader=el('div',null,'rb30-ranking-leader');leader.append(el('small',d.holders.length>1?'SHARED LEAGUE RECORD':'FIRST PLACE'),el('strong',formatMark(d.first[0].value,c.unit)),el('p',d.holders.join(' · ')));
   for(const row of d.first){leader.append(el('p',normalizeManager(row.manager)+' · '+archivedContext(row,c),'rb30-status'))}
   ranking.append(leader);
   const stories=d.first.map(row=>archivedStory(row,c)).filter(Boolean);
   if(stories.length){const story=el('aside',null,'rb30-story');story.append(el('small','THE STORY BEHIND THE MARK'));for(const line of [...new Set(stories)])story.append(el('p',line));ranking.append(story)}
  }
  if(select.value){
   const mine=el('div',null,'rb30-ranking-personal');
   mine.append(el('small',select.value+' · best rank in this list'),el('strong',d.personalRank===null?'Not in displayed rankings':'#'+d.personalRank));
   for(const row of d.personalMarks)mine.append(el('p',formatMark(row.value,c.unit)+' · '+archivedContext(row,c),'rb30-status'));
   if(d.personalRank===null)mine.append(el('p','This is not proof of ineligibility or a missing personal best. The archive may show only its leading entries.','rb30-status'));
   ranking.append(mine);
  }
  const list=el('ol',null,'rb30-ranking-list');
  for(const row of d.rows){const item=el('li');const copy=el('div');copy.append(el('strong',normalizeManager(row.manager)),el('small',archivedContext(row,c)));item.append(el('span','#'+row.rank),copy,el('strong',formatMark(row.value,c.unit)));if(normalizeManager(row.manager)===select.value)item.classList.add('rb30-ranking-selected');list.append(item)}
  const fold=el('details');fold.append(el('summary','View '+d.rows.length+' ranked performances'),list);ranking.append(fold);
  const full=el('a','View full rankings and supporting results →','rb30-more');full.href=categoryHref(c,select.value);ranking.append(full,el('p',archive.scope+' · Historical ranks may change after certification.','rb30-status'));
  if(focus){heading.focus({preventScroll:true});ranking.scrollIntoView({block:'start',behavior:'auto'})}
 }
 function paintOwnership(){
  ownership.replaceChildren();
  if(!select.value){ownership.append(el('p','Choose a manager to view archived league rankings.','rb30-status'));return}
  if(!archive){ownership.append(el('p','Archived ownership unavailable until the category data loads.','rb30-status'));return}
  const d=managerArchivePortfolio(archive,select.value);
  const metrics=el('div',null,'rb30-metrics');
  for(const [value,title] of [[d.owned.length,'League records held'],[d.podium.length,'Records ranked in top 3']]){
   const card=el('div');card.append(el('strong',String(value)),el('small',title));metrics.append(card);
  }
  ownership.append(metrics,el('p',archive.scope+' · Shared first place counts once per category.','rb30-status'));
  const list=el('div',null,'rb30-ownership-list');
  const format=formatMark;
  for(const c of d.owned){
   const a=el('a');a.href=categoryHref(c,d.manager);
   const copy=el('span');copy.append(el('strong',c.label),el('small',c.shared?'Shared with '+c.holders.filter(n=>n!==d.manager).join(', '):'Outright record holder'));
   a.append(copy,el('strong',format(c.marks[0].value,c.unit)));if(c.marks.length>1)copy.append(el('small',c.marks.length+' tied archived entries'));list.append(a);
  }
  if(!d.owned.length)ownership.append(el('p','No league records held in this collection. You can still explore your personal bests.','rb30-status'));
  else{const fold=el('details');fold.append(el('summary','View all '+d.owned.length+' league records held'),list);ownership.append(fold)}
 }
 const resetSearch=()=>{limit=8;paint()};search.addEventListener('input',resetSearch);family.addEventListener('change',resetSearch);
 try{const response=await fetch(new URL('../data/expanded_records_verified_v1.json',import.meta.url));if(!response.ok)throw Error('Archive unavailable');const candidate=await response.json();rows=indexPublishedCategories(candidate);for(const name of fellasLeague.managers)managerArchivePortfolio(candidate,name);archive=candidate;
  for(const group of [...new Set(rows.map(c=>c.group))])family.append(new Option(group,group));
  const note=el('p',String(archive.scope||'Archived expanded records; coverage varies.'),'rb30-status');host.insertBefore(note,controls);paintOwnership();paint();
 }catch{status.textContent='Category index unavailable. The original record collections below remain accessible.';search.disabled=true;family.disabled=true;archive=null;paintOwnership()}
}
if(typeof document!=='undefined')void mountRecordBookDiscovery();
