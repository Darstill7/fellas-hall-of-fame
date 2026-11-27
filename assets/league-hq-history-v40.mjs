// Historical discovery: exact archived game receipts; no inferred record status.
import {fellasLeague,normalizeManager,managerSlug} from './league-config.mjs';
const cents=n=>Math.round(n*100);
export function historicalMatchups(archive,week,selected=''){
 if(!Array.isArray(archive?.games)||!Number.isInteger(week)||week<1||week>14)return [];
 const seen=new Map(),conflict=new Set();
 for(const g of archive.games){
  if(!Number.isInteger(g.year)||g.year<2016||g.year>=fellasLeague.season||g.week!==week||g.stage!=='regular'||typeof g.home!=='string'||typeof g.away!=='string'||!g.home.trim()||!g.away.trim()||!Number.isFinite(g.homeScore)||!Number.isFinite(g.awayScore)||typeof g.source!=='string'||!g.source.trim())continue;
  // 2020/21 Week 14 stage classification remains under separate historical review.
  if(week===14&&[2020,2021].includes(g.year))continue;
  const home=normalizeManager(g.home),away=normalizeManager(g.away);if(home===away)continue;
  const sides=[[home,cents(g.homeScore)],[away,cents(g.awayScore)]].sort((a,b)=>a[0].localeCompare(b[0]));
  const id=JSON.stringify([g.year,g.week,sides[0][0],sides[1][0]]);
  const signature=JSON.stringify(sides);
  if(seen.has(id)){if(seen.get(id).signature!==signature)conflict.add(id);continue}
  seen.set(id,{id,signature,year:g.year,week,home,away,homeScore:cents(g.homeScore)/100,awayScore:cents(g.awayScore)/100,margin:Math.abs(cents(g.homeScore)-cents(g.awayScore))/100,combined:(cents(g.homeScore)+cents(g.awayScore))/100,source:g.source,personal:[home,away].includes(selected)});
 }
 return [...seen.values()].filter(g=>!conflict.has(g.id));
}
export function buildHistoricalDiscovery(archive,week,selected=''){
 const games=historicalMatchups(archive,week,selected);if(!games.length)return [];
 const ordered=(pool,compare)=>[...pool].sort((a,b)=>compare(a,b)||b.year-a.year||a.id.localeCompare(b.id));
 const picked=[],used=new Set();
 function pick(pool,compare,label){const game=ordered(pool.filter(g=>!used.has(g.id)),compare)[0];if(game){used.add(game.id);picked.push({...game,label})}}
 if(fellasLeague.managers.includes(selected))pick(games.filter(g=>g.personal),(a,b)=>a.margin-b.margin,'YOUR FRANCHISE · A CLOSE ENCOUNTER');
 pick(games,(a,b)=>a.margin-b.margin,'A NAIL-BITER');
 pick(games,(a,b)=>b.combined-a.combined,'A SCORING SHOWCASE');
 pick(games,(a,b)=>b.margin-a.margin,'A LOPSIDED RESULT');
 return picked.slice(0,3);
}
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n};
const fmt=n=>n.toFixed(2);
let archivePromise;
export function mountHistoricalDiscovery(host,d,selected=''){
 if(!host)return;const token=String((Number(host.dataset.loadToken)||0)+1);host.dataset.loadToken=token;host.hidden=true;host.replaceChildren();
 if(!Number.isInteger(d?.week)||d.week<1||d.week>14)return;
 // Compare the most recently completed fantasy week, not a calendar-derived NFL week.
 const week=d.week;
 archivePromise??=fetch(new URL('../data/unified_record_book_2016_2026.json',import.meta.url)).then(r=>r.ok?r.json():null).catch(()=>null);
 void archivePromise.then(archive=>{
  if(host.dataset.loadToken!==token||!host.isConnected)return;
  const stories=buildHistoricalDiscovery(archive,week,selected);if(!stories.length)return;
  const title=el('h2','On this week in Fellas history');title.id='hq40-history-title';
  host.append(title,el('p','Historical Week '+week+' · same fantasy week as the latest completed results','source-note'));
  const card=el('article',null,'hq40-history-card');const controls=el('div',null,'hq40-history-controls');
  let index=0;
  function paint(){
   const g=stories[index];card.replaceChildren();
   card.append(el('small',g.label,'hq40-history-kicker'),el('h3',g.year+' · Week '+g.week));
   const score=el('div',null,'hq40-history-score');
   for(const [name,points,other] of [[g.home,g.homeScore,g.awayScore],[g.away,g.awayScore,g.homeScore]]){const col=el('div');col.append(el('span',name),el('strong',fmt(points),points>other?'win':points<other?'loss':''));score.append(col)}
   card.append(score,el('p',g.margin===0?'The game ended level.':(g.homeScore>g.awayScore?g.home:g.away)+' won by '+fmt(g.margin)+' points.'));
   const link=el('a','Explore the '+g.year+' season ›','personal-insight-link');link.href='seasons/'+g.year+'.html';card.append(link);
   const related=el('div',null,'hq40-history-related');
   for(const name of [g.home,g.away])if(fellasLeague.managers.includes(name)){const profile=el('a',name+' franchise ›');profile.href='managers/'+managerSlug(name)+'/?app=1';related.append(profile)}
   if([g.home,g.away].every(n=>fellasLeague.managers.includes(n))){const rivalry=el('a','Head-to-head history ›');rivalry.href='analytics/rivalry-war-room.html?a='+encodeURIComponent(g.home)+'&b='+encodeURIComponent(g.away);related.append(rivalry)}
   if(related.children.length)card.append(related);
   card.append(el('p','Archived matchup receipt · '+g.source.replaceAll('_',' ')+' · not a claim of an all-time record.','source-note'));
   position.textContent=(index+1)+' of '+stories.length;prev.disabled=index===0;next.disabled=index===stories.length-1;
  }
  const prev=el('button','Previous'),next=el('button','Next'),position=el('span');prev.type=next.type='button';position.setAttribute('role','status');prev.addEventListener('click',()=>{if(index>0){index--;paint()}});next.addEventListener('click',()=>{if(index<stories.length-1){index++;paint()}});
  controls.append(prev,position,next);host.append(card);if(stories.length>1)host.append(controls);paint();host.hidden=false;
 });
}
