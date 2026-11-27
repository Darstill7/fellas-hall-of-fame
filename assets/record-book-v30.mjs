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
 if(fellasLeague.managers.includes(requested))select.value=requested;else if(fellasLeague.managers.includes(preferred))select.value=preferred;
 const link=document.querySelector('#personal-record-entry-link');
 const sync=()=>{if(!link)return;const name=select.value;link.href='../managers/record-books.html'+(name?'?manager='+encodeURIComponent(name):'')+'#owned-records';link.textContent=name?'Records '+name+' owns →':'Open manager record book →'};
 select.addEventListener('change',()=>{const url=new URL(location.href);if(select.value)url.searchParams.set('manager',select.value);else url.searchParams.delete('manager');history.replaceState(null,'',url);sync();paintOwnership();paint()});
 personal?.insertBefore(label,link);personal?.insertBefore(select,link);sync();
 const search=el('input');search.id='rb30-search';search.type='search';search.placeholder='Try winning streak, scoring or rivalry';
 const searchLabel=el('label','Find a record');searchLabel.htmlFor=search.id;
 const family=el('select');family.id='rb30-family';family.append(new Option('All categories',''));
 const familyLabel=el('label','Record family');familyLabel.htmlFor=family.id;
 const controls=el('div',null,'rb30-controls');
 for(const [a,b] of [[searchLabel,search],[familyLabel,family]]){const field=el('div');field.append(a,b);controls.append(field)}
 const status=el('p','Loading archived categories…','rb30-status');status.setAttribute('role','status');
 const results=el('div',null,'rb30-results');let rows=[],archive=null;
 const ownership=el('div',null,'rb30-ownership');ownership.setAttribute('aria-live','polite');personal?.insertBefore(ownership,link);
 host.append(controls,status,results);
 function paint(){
  const matching=searchCategories(rows,search.value,family.value);
  results.replaceChildren();
  status.textContent=matching.length+' of '+rows.length+' archived categories';
  for(const c of matching){const a=el('a',null,'rb30-result');a.href=categoryHref(c,select.value);a.append(el('small',c.group),el('strong',c.label),el('span','View ranking →'));results.append(a)}
  if(!matching.length)results.append(el('p','No matching categories. Try another search or choose All categories.'));
 }
 function paintOwnership(){
  ownership.replaceChildren();
  if(!select.value){ownership.append(el('p','Choose a manager to view archived league rankings.','rb30-status'));return}
  if(!archive){ownership.append(el('p','Archived ownership unavailable until the category data loads.','rb30-status'));return}
  const d=managerArchivePortfolio(archive,select.value);
  const metrics=el('div',null,'rb30-metrics');
  for(const [value,title] of [[d.owned.length,'First-place categories'],[d.podium.length,'Top-three categories']]){
   const card=el('div');card.append(el('strong',String(value)),el('small',title));metrics.append(card);
  }
  ownership.append(metrics,el('p',archive.scope+' · Shared first place counts once per category.','rb30-status'));
  const list=el('div',null,'rb30-ownership-list');
  const format=(v,u)=>v.toLocaleString('en-US',{maximumFractionDigits:2})+(u==='%'?'%':u?' '+u:'');
  for(const c of d.owned){
   const a=el('a');a.href=categoryHref(c,d.manager);
   const copy=el('span');copy.append(el('strong',c.label),el('small',c.shared?'Shared with '+c.holders.filter(n=>n!==d.manager).join(', '):'Sole first-place manager'));
   a.append(copy,el('strong',format(c.marks[0].value,c.unit)));if(c.marks.length>1)copy.append(el('small',c.marks.length+' tied archived entries'));list.append(a);
  }
  if(!d.owned.length)ownership.append(el('p','No first-place categories in this archive snapshot. Other personal marks remain accessible.','rb30-status'));
  else{const fold=el('details');fold.append(el('summary','Explore all '+d.owned.length+' first-place categories'),list);ownership.append(fold)}
 }
 search.addEventListener('input',paint);family.addEventListener('change',paint);
 try{const response=await fetch(new URL('../data/expanded_records_verified_v1.json',import.meta.url));if(!response.ok)throw Error('Archive unavailable');const candidate=await response.json();rows=indexPublishedCategories(candidate);for(const name of fellasLeague.managers)managerArchivePortfolio(candidate,name);archive=candidate;
  for(const group of [...new Set(rows.map(c=>c.group))])family.append(new Option(group,group));
  const note=el('p',String(archive.scope||'Archived expanded records; coverage varies.'),'rb30-status');host.insertBefore(note,controls);paintOwnership();paint();
 }catch{status.textContent='Category index unavailable. The original record collections below remain accessible.';search.disabled=true;family.disabled=true;archive=null;paintOwnership()}
}
if(typeof document!=='undefined')void mountRecordBookDiscovery();
