// Shared consumer contract. No research rows are exposed to public surfaces.
export const RECORD_WATCH_SCHEMA=1;
const priority={'broken':100,'tied':95,'extended':90,'approaching':80,'milestone-achieved':65,'milestone-approaching':40};
const norm=n=>n==='Tom'?'Thommy':n;
const owners=e=>[...new Set((e.participants??[e.manager]).filter(n=>typeof n==='string'&&n.length).map(norm))].sort();
export function buildRecordWatchFeed(report){
 const year=report?.year,week=report?.week;
 if(!Number.isInteger(year)||!Number.isInteger(week)||week<1||!Array.isArray(report?.items))return {schemaVersion:RECORD_WATCH_SCHEMA,year,throughWeek:week,status:'unavailable',items:[]};
 const seen=new Set(),items=[];
 for(const e of report.items){
  if(e.status!=='certified'||e.year!==year||e.week!==week||!Object.hasOwn(priority,e.type)||typeof e.id!=='string'||typeof e.eventId!=='string'||!owners(e).length||typeof e.scope!=='string'||seen.has(e.eventId))continue;
  seen.add(e.eventId);
  // Only explicitly approved rows and a minimal public data contract.
  items.push({id:e.id,eventId:e.eventId,type:e.type,year,week,owners:owners(e),manager:e.manager??null,opponent:e.opponent??null,value:e.value??e.run??null,target:e.target??null,record:e.record??null,priorRecord:e.priorRecord??null,toTie:e.toTie??null,toBreak:e.toBreak??null,gap:e.gap??null,remaining:e.remaining??null,scope:e.scope,status:'certified',priority:priority[e.type]});
 }
 items.sort((a,b)=>b.priority-a.priority||a.eventId.localeCompare(b.eventId));
 return {schemaVersion:RECORD_WATCH_SCHEMA,year,throughWeek:week,status:items.length?'certified':'no-certified-items',items};
}
export function selectRecordWatch(feed,{year,week,surface,manager=null}){
 if(feed?.schemaVersion!==RECORD_WATCH_SCHEMA||feed.year!==year||feed.throughWeek!==week||!Array.isArray(feed.items))return [];
 const limits={home:3,manager:6,recordBook:1000,editorial:1000,playoff:3};
 if(!Object.hasOwn(limits,surface))return [];
 const allowed=feed.items.filter(e=>e.status==='certified'&&e.year===year&&e.week===week&&Object.hasOwn(priority,e.type)&&typeof e.eventId==='string'&&Array.isArray(e.owners)&&e.owners.length&&typeof e.scope==='string'&&(!manager||e.owners.includes(norm(manager)))&&(surface!=='home'||priority[e.type]>=80)&&(surface!=='playoff'||/playoff|championship/.test(e.id)));
 const seen=new Set();
 return [...allowed].sort((a,b)=>priority[b.type]-priority[a.type]||a.eventId.localeCompare(b.eventId)).filter(e=>{if(seen.has(e.eventId))return false;seen.add(e.eventId);return true;}).slice(0,limits[surface]);
}
export function renderRecordWatchFeed(host,items,{href='analytics/records.html'}={}){
 if(!host)return;host.replaceChildren();host.hidden=!items.length;if(!items.length)return;
 const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
 host.append(el('h2','Record Watch'));
 for(const e of items){
  const row=el('article','');row.className='record-watch-row';
  row.append(el('strong',e.owners.join(' & ')+' · '+e.id.replaceAll('-',' ')),el('p',e.type.replaceAll('-',' ')+' · '+(e.value??'')+(e.toTie>0?' · '+e.toTie+' to tie':'')),el('small',e.scope+' · through Week '+e.week));
  const link=el('a','Explore Record Book ›');link.href=href;row.append(link);host.append(row);
 }
}
