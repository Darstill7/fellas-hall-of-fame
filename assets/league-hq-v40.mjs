// League HQ briefing: interpret verified completed games, never replace Sleeper.
import {fellasLeague,normalizeManager,managerSlug} from './league-config.mjs';
import {managerArchivePortfolio} from './record-book-v30.mjs';
const format=n=>n.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2});
// The calendar controls editorial emphasis only; it never establishes a data cutoff.
export function hqCalendar(date=new Date()){
 const day=new Intl.DateTimeFormat('en-US',{timeZone:'America/Indiana/Indianapolis',weekday:'short'}).format(date);
 const themes={Mon:['REVIEW & CONTEXT','score','run','personal','playoff','rivalry'],Tue:['THE WEEK IN REVIEW','personal','run','score','playoff','rivalry'],Wed:['FRONT OFFICE','personal','playoff','run','rivalry','score'],Thu:['LOOKING AHEAD','rivalry','playoff','personal','run','score'],Fri:['WHAT IS AT STAKE','playoff','rivalry','run','personal','score'],Sat:['WEEKEND INTELLIGENCE','rivalry','playoff','run','personal','score'],Sun:['WEEKEND INTELLIGENCE','rivalry','playoff','personal','run','score']};
 const [theme,...order]=themes[day]??themes.Fri;
 return {day,theme,order};
}
export function buildHQBriefing(d,personal,date=new Date()){
 if(!d||!Number.isInteger(d.week)||d.week<1||d.week>fellasLeague.regularSeasonWeeks||d.standings?.length!==10)return [];
 const remaining=fellasLeague.regularSeasonWeeks-d.week,items=[];
 const add=(id,kicker,title,detail,href)=>items.push({id,kicker,title,detail,href});
 if(remaining>0)add('playoff','THE PLAYOFF PUSH',remaining===1?'One regular-season week left':remaining+' regular-season weeks remaining','Six playoff spots · two first-round byes. Explore the scenarios, not just the standings.','analytics/playoff-race.html');
 else add('playoff','POSTSEASON','The regular-season archive is complete','Explore the playoff center for verified scenarios and results.','analytics/playoff-race.html');
 if(personal?.opponent&&remaining>0)add('rivalry','YOUR NEXT CHAPTER',personal.team.name+' vs '+personal.opponent.name,'Week '+personal.week+' · explore the history between these franchises.','analytics/rivalry-war-room.html?a='+encodeURIComponent(personal.team.name)+'&b='+encodeURIComponent(personal.opponent.name));
 if(personal?.team&&typeof personal.team.streak==='string'){
  const code=personal.team.streak[0],count=Number(personal.team.streak.slice(1));
  if(Number.isInteger(count)&&count>=3&&['W','L'].includes(code))add('personal','FRANCHISE MOMENTUM',personal.team.name+' · '+count+' straight '+(code==='W'?'wins':'losses'),'Your current regular-season streak through Week '+d.week+'. Explore your franchise history.','managers/'+managerSlug(personal.team.name)+'/');
 }
 const runs=d.standings.filter(r=>r.streak?.startsWith('W')).sort((a,b)=>Number(b.streak.slice(1))-Number(a.streak.slice(1)));
 const best=Number(runs[0]?.streak.slice(1));
 if(best>=3){const leaders=runs.filter(r=>Number(r.streak.slice(1))===best);if(!(leaders.length===1&&leaders[0].name===personal?.team?.name&&items.some(i=>i.id==='personal')))add('run','LEAGUE TALKING POINT',leaders.map(r=>r.name).join(' & ')+' · '+best+' straight wins','Current regular-season streak through Week '+d.week+'. Not an all-game streak.',leaders.length===1?'managers/'+managerSlug(leaders[0].name)+'/':'#league')}
 if(d.leaders?.length&&Number.isFinite(d.leaders[0].latest))add('score','WEEK '+d.week+' SCORING LEAD',d.leaders.map(r=>r.name).join(' & ')+' · '+format(d.leaders[0].latest),'Completed matchup scoring leader'+(d.leaders.length>1?'s':'')+'.','analytics/sportscenter.html');
 const order=hqCalendar(date).order;return items.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id)).slice(0,3);
}
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n};
export function renderHQBriefing(d,personal){
 const host=document.getElementById('hq40-briefing');if(!host)return;
 host.replaceChildren();
 const date=new Date(),calendar=hqCalendar(date);const title=document.querySelector('#hq40-now-title');if(title){const note=el('p',calendar.theme+' · Verified through Week '+d.week,'hq40-calendar-note');host.append(note)}
 for(const item of buildHQBriefing(d,personal,date)){
  const a=el('a',null,'hq40-briefing-item');a.href=item.href;a.dataset.briefingId=item.id;
  const copy=el('div');copy.append(el('small',item.kicker),el('strong',item.title),el('p',item.detail));a.append(copy,el('span','›','hq40-arrow'));host.append(a);
 }
}
export function enhanceHQFranchise(card,p,d){
 if(!card||!p)return;
 card.classList.add('hq40-franchise-card');
 const header=el('div',null,'hq40-franchise-kicker');header.append(el('span','YOUR FRANCHISE'),el('span','THROUGH WEEK '+d.week));card.prepend(header);
 const form=card.querySelector('.team-form');
 if(form){const code=p.team.streak?.[0],run=Number(p.team.streak?.slice(1));if(run>=1&&['W','L','T'].includes(code))form.append(el('small',run+' consecutive '+(code==='W'?'wins':code==='L'?'losses':'ties')+' · regular season','hq40-form-context'))}
 const links=el('div',null,'hq40-franchise-actions');
 for(const [label,href,detail] of [['Franchise HQ','#my-team-section','Season & outlook'],['My records','analytics/records.html?manager='+encodeURIComponent(p.team.name)+'&app=1','Legacy & milestones'],['Playoff race','analytics/playoff-race.html','Scenarios & seeding']]){
  const a=el('a');a.href=href;a.append(el('strong',label),el('small',detail));links.append(a);
 }
 card.querySelector('.personal-home-cta')?.replaceWith(links);
 renderFranchiseIntelligence(card,p,d);
}

export function buildFranchiseLegacy(name,placements,records){
 if(!fellasLeague.managers.includes(name))return null;
 let titles=null,completed=null,owned=null;
 if(placements?.version===1&&Array.isArray(placements.seasons)&&placements.seasons.length===10&&new Set(placements.seasons.map(s=>s.year)).size===10&&placements.seasons.every(s=>Number.isInteger(s.year)&&s.year>=2016&&s.year<=2025&&Array.isArray(s.finishes)&&s.finishes.length===s.teams&&new Set(s.finishes.map(f=>f.rank)).size===s.teams&&new Set(s.finishes.map(f=>normalizeManager(f.manager))).size===s.teams&&s.finishes.every(f=>Number.isInteger(f.rank)&&f.rank>=1&&f.rank<=s.teams&&typeof f.manager==='string')&&normalizeManager(s.finishes.find(f=>f.rank===1)?.manager)===normalizeManager(s.champion))){
  const finishes=placements.seasons.flatMap(s=>s.finishes.filter(f=>normalizeManager(f.manager)===name).map(f=>({year:s.year,rank:f.rank})));
  completed=finishes.length;titles=finishes.filter(f=>f.rank===1).map(f=>f.year).sort((a,b)=>a-b);
 }
 try{if(typeof records?.scope==='string'&&records.scope.trim()){const p=managerArchivePortfolio(records,name);owned={count:p.owned.length,scope:records.scope,total:p.total}}}catch{}
 return {name,titles,completed,owned};
}
export function buildRecentForm(d,name,limit=5){
 const rows=d?.history?.[name];if(!Array.isArray(rows)||rows.length!==d.week||rows.some((r,i)=>r.week!==i+1||!Number.isFinite(r.pf)||!Number.isFinite(r.pa)||!['W','L','T'].includes(r.result)))return [];
 return rows.slice(-limit);
}
let legacyPromise;
function loadLegacy(){
 if(!legacyPromise){const get=async file=>{try{const r=await fetch(new URL('../data/'+file,import.meta.url));return r.ok?await r.json():null}catch{return null}};legacyPromise=Promise.all([get('fellas_final_placements_2016_2025_verified.json'),get('expanded_records_verified_v1.json')])}
 return legacyPromise;
}
export function renderFranchiseIntelligence(card,p,d){
 const rows=buildRecentForm(d,p.team.name);
 if(rows.length){
  const form=el('section',null,'hq40-recent-form');form.append(el('h3','Recent form'));
  const strip=el('div',null,'hq40-form-strip');strip.setAttribute('aria-label','Last '+rows.length+' completed regular-season matchups');
  const max=Math.max(1,...rows.map(r=>Math.max(0,r.pf)));
  for(const row of rows){const cell=el('div',null,'hq40-form-cell');const track=el('div',null,'hq40-form-track');const bar=el('div',null,'hq40-form-bar '+(row.result==='W'?'win':row.result==='L'?'loss':'tie'));bar.style.height=Math.max(0,row.pf)/max*100+'%';track.append(bar);track.setAttribute('aria-hidden','true');cell.append(el('small','Wk '+row.week),track,el('strong',format(row.pf)),el('span',row.result+' vs '+row.opponent,'hq40-form-result'));strip.append(cell)}
  form.append(strip,el('p','Points scored · completed regular-season matchups only','source-note'));card.append(form);
 }
 const legacy=el('section',null,'hq40-legacy');legacy.hidden=true;card.append(legacy);
 void loadLegacy().then(([placements,records])=>{
  if(!card.isConnected)return;const data=buildFranchiseLegacy(p.team.name,placements,records);if(!data)return;
  const metrics=el('div',null,'hq40-legacy-grid');
  const metric=(label,value,href)=>{const a=el('a');a.href=href;a.append(el('strong',String(value)),el('small',label));metrics.append(a)};
  if(data.titles!==null){metric('Championships',data.titles.length,'hall/');metric('Completed seasons',data.completed,'managers/'+managerSlug(data.name)+'/')}
  if(data.owned)metric('First-place categories',data.owned.count,'analytics/records.html?manager='+encodeURIComponent(data.name)+'&app=1');
  if(!metrics.children.length)return;
  const summary=el('a',null,'hq40-legacy-glance');summary.href='#my-team-section';const parts=[];if(data.titles!==null)parts.push(data.titles.length+' championship'+(data.titles.length===1?'':'s'));if(data.owned)parts.push(data.owned.count+' archived first-place categories');if(parts.length){summary.append(el('small','FRANCHISE LEGACY'),el('strong',parts.join(' · ')),el('span','Explore your legacy ›'));card.insertBefore(summary,card.querySelector('.hq40-franchise-actions'));}
  legacy.append(el('h3','Your legacy'),metrics);
  if(data.titles?.length)legacy.append(el('p','Championship years: '+data.titles.join(' · '),'source-note'));
  if(data.completed!==null)legacy.append(el('p','Final placements · completed seasons 2016–2025','source-note'));
  if(data.owned)legacy.append(el('p','Record ownership: '+data.owned.scope+' · Shared first place counts once per category.','source-note'));
  legacy.hidden=false;
 });
}
