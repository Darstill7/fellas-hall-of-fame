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
export function searchCategories(rows,query='',group=''){
 const tokens=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
 return rows.filter(c=>(!group||c.group===group)&&tokens.every(t=>(c.label+' '+c.group+' '+c.key.replaceAll('-',' ')+' '+c.description+' '+c.qualifier).toLowerCase().includes(t)));
}
export function categoryHref(row,manager=''){
 const params=new URLSearchParams({group:row.group,category:row.key});
 if(manager)params.set('manager',manager);
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
 if(fellasLeague.managers.includes(preferred))select.value=preferred;
 const link=document.querySelector('#personal-record-entry-link');
 const sync=()=>{if(!link)return;const name=select.value;link.href='../managers/record-books.html'+(name?'?manager='+encodeURIComponent(name):'')+'#owned-records';link.textContent=name?'Records '+name+' owns →':'Open manager record book →'};
 select.addEventListener('change',()=>{sync();paint()});
 personal?.insertBefore(label,link);personal?.insertBefore(select,link);sync();
 const search=el('input');search.id='rb30-search';search.type='search';search.placeholder='Try winning streak, scoring or rivalry';
 const searchLabel=el('label','Find a record');searchLabel.htmlFor=search.id;
 const family=el('select');family.id='rb30-family';family.append(new Option('All categories',''));
 const familyLabel=el('label','Record family');familyLabel.htmlFor=family.id;
 const controls=el('div',null,'rb30-controls');
 for(const [a,b] of [[searchLabel,search],[familyLabel,family]]){const field=el('div');field.append(a,b);controls.append(field)}
 const status=el('p','Loading archived categories…','rb30-status');status.setAttribute('role','status');
 const results=el('div',null,'rb30-results');let rows=[];
 host.append(controls,status,results);
 function paint(){
  const matching=searchCategories(rows,search.value,family.value);
  results.replaceChildren();
  status.textContent=matching.length+' of '+rows.length+' archived categories';
  for(const c of matching){const a=el('a',null,'rb30-result');a.href=categoryHref(c,select.value);a.append(el('small',c.group),el('strong',c.label),el('span','View ranking →'));results.append(a)}
  if(!matching.length)results.append(el('p','No matching categories. Try another search or choose All categories.'));
 }
 search.addEventListener('input',paint);family.addEventListener('change',paint);
 try{const response=await fetch(new URL('../data/expanded_records_verified_v1.json',import.meta.url));if(!response.ok)throw Error('Archive unavailable');const archive=await response.json();rows=indexPublishedCategories(archive);
  for(const group of [...new Set(rows.map(c=>c.group))])family.append(new Option(group,group));
  const note=el('p',String(archive.scope||'Archived expanded records; coverage varies.'),'rb30-status');host.insertBefore(note,controls);paint();
 }catch{status.textContent='Category index unavailable. The original record collections below remain accessible.';search.disabled=true;family.disabled=true}
}
if(typeof document!=='undefined')void mountRecordBookDiscovery();
