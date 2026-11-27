// League HQ competitive intelligence. All-play is descriptive; SOS is not a forecast.
import {fellasLeague,normalizeManager,managerSlug} from './league-config.mjs';
const cents=n=>Math.round(n*100);
const names=fellasLeague.managers;
export function buildCompetitiveIntelligence(d,race){
 if(!Number.isInteger(d?.week)||d.week<1||d.week>fellasLeague.regularSeasonWeeks||d.standings?.length!==names.length||new Set(d.standings.map(r=>r.name)).size!==names.length||!names.every(n=>d.standings.some(r=>r.name===n)))return null;
 const by=new Map(d.standings.map(r=>[r.name,r]));
 const valid=names.every(n=>{const h=d.history?.[n];return Array.isArray(h)&&h.length===d.week&&h.every((v,i)=>v.week===i+1&&Number.isFinite(v.pf))});
 if(!valid)return null;
 const remaining=fellasLeague.regularSeasonWeeks-d.week;
 const modelValid=race?.verified_through_week===d.week&&race.assumed_regular_season_end_week===fellasLeague.regularSeasonWeeks&&race.playoff_format?.teams===fellasLeague.playoffTeams&&race.playoff_format?.first_round_byes===fellasLeague.playoffByes&&names.every(n=>{const a=by.get(n),b=race.teams?.[n]??race.teams?.[n==='Thommy'?'Tom':n];return b&&a.w===b.w&&a.l===b.l&&(a.t??0)===(b.t??0)&&cents(a.pf)===cents(b.pf)});
 let fixtures=null;
 if(modelValid&&remaining>0){
  const weeks=Array.from({length:remaining},(_,i)=>d.week+i+1);
  const pairs=weeks.map(week=>({week,pairs:race.fixtures?.[week]}));
  if(pairs.every(({pairs:p})=>Array.isArray(p)&&p.length===5&&p.every(x=>Array.isArray(x)&&x.length===2&&x.every(n=>typeof n==='string'))&&new Set(p.flat().map(n=>normalizeManager(n))).size===10&&p.flat().map(n=>normalizeManager(n)).every(n=>names.includes(n))))fixtures=pairs.map(({week,pairs:p})=>({week,pairs:p.map(x=>x.map(n=>normalizeManager(n)))}));
 }
 const rows=d.standings.map((r,i)=>{
  let wins=0,losses=0,ties=0;
  for(let w=0;w<d.week;w++){const score=cents(d.history[r.name][w].pf);for(const n of names){if(n===r.name)continue;const other=cents(d.history[n][w].pf);if(score>other)wins++;else if(score<other)losses++;else ties++}}
  const expected=(wins+ties/2)/(names.length-1),actual=r.w+(r.t??0)/2;
  const opponents=fixtures?.map(({week,pairs})=>{const opponent=pairs.find(p=>p.includes(r.name)).find(n=>n!==r.name);return {week,name:opponent,average:by.get(opponent).pf/d.week}});
  const sos=opponents?.length?opponents.reduce((sum,o)=>sum+o.average,0)/opponents.length:null;
  return {name:r.name,standing:i+1,zone:i<2?'Bye position':i<6?'Playoff position':'Outside playoff positions',wins,losses,ties,expected,actual,luck:actual-expected,sos,opponents:opponents??null};
 });
 return {week:d.week,remaining,rows,fixturesAvailable:fixtures!==null};
}
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n};
const signed=n=>(n>0?'+':'')+n.toFixed(2);
export function mountCompetitiveIntelligence(host,d,race,selected=''){
 if(!host)return;host.replaceChildren();const data=buildCompetitiveIntelligence(d,race);if(!data){host.hidden=true;return}host.hidden=false;
 const heading=el('h2','Competitive intelligence');host.append(heading,el('p','Through Week '+data.week+' · completed regular-season games','source-note'));
 const seeding=el('section',null,'hq40-competition-card');seeding.append(el('h3','The playoff line'),el('p','Current standings positions, not clinches or projected seeds.','source-note'));
 const seed=el('div',null,'hq40-seed-grid');
 for(const row of data.rows){const a=el('a',null,'hq40-seed '+(row.standing<=2?'bye':row.standing<=6?'in':'out'));a.href='managers/'+managerSlug(row.name)+'/?app=1';a.setAttribute('aria-label',row.standing+' '+row.name+' · '+row.zone+(row.name===selected?' · your franchise':''));if(row.name===selected)a.classList.add('selected');a.append(el('small','#'+row.standing),el('strong',row.name));seed.append(a)}
 seeding.append(seed,el('p','1–2: bye positions · 3–6: playoff positions · 7–10: outside','source-note'));host.append(seeding);
 const mine=data.rows.find(r=>r.name===selected);
 if(mine){
  const spotlight=el('section',null,'hq40-competition-card hq40-playoff-spotlight');
  spotlight.append(el('h3','Your playoff picture'),el('p','Through Week '+data.week+' · '+mine.name,'source-note'));
  const headline=el('div',null,'hq40-playoff-position');
  headline.append(el('strong','#'+mine.standing),el('span',mine.zone));spotlight.append(headline);
  const standings=d.standings.find(r=>r.name===selected);
  const match=race?.teams?.[selected]??race?.teams?.[selected==='Thommy'?'Tom':selected];
  const model=race?.verified_through_week===d.week&&race.assumed_regular_season_end_week===fellasLeague.regularSeasonWeeks&&race.playoff_format?.teams===fellasLeague.playoffTeams&&race.playoff_format?.first_round_byes===fellasLeague.playoffByes&&d.standings.every(r=>{const t=race.teams?.[r.name]??race.teams?.[r.name==='Thommy'?'Tom':r.name];return t&&r.w===t.w&&r.l===t.l&&(r.t??0)===(t.t??0)&&cents(r.pf)===cents(t.pf)});
  const odds=race?.scenarios?.[String(fellasLeague.playoffTeams)]?.[selected]??race?.scenarios?.[String(fellasLeague.playoffTeams)]?.[selected==='Thommy'?'Tom':selected];
  if(model&&standings&&match&&odds&&[odds.playoff_pct,odds.top2_pct].every(v=>Number.isFinite(v)&&v>=0&&v<=100)&&odds.top2_pct<=odds.playoff_pct){
   for(const [label,value] of [['Make playoffs',odds.playoff_pct],['First-round bye',odds.top2_pct]]){const row=el('div',null,'hq40-probability');const meter=el('meter');meter.min=0;meter.max=100;meter.value=value;meter.setAttribute('aria-label',label+' simulated probability');row.append(el('span',label),el('strong',value+'%'),meter);spotlight.append(row)}
   spotlight.append(el('p','Simulated estimates, not official odds or clinches. '+String(race.caution??''),'source-note'));
  }else spotlight.append(el('p','Synchronized playoff probabilities unavailable.','source-note'));
  const next=el('a','Explore playoff scenarios ›','personal-insight-link');next.href='analytics/playoff-race.html';spotlight.append(next);host.append(spotlight);
 }
 const card=el('section',null,'hq40-competition-card');card.append(el('h3','How good is your team, really?'),el('p','All-play compares each weekly score with all nine other managers. Expected wins = (all-play wins + half of ties) ÷ 9. Actual minus expected is descriptive schedule variance, not proof of luck.','source-note'));
 const label=el('label','Compare franchises');const select=el('select');select.id='hq40-compare-sort';label.htmlFor=select.id;for(const [v,t] of [['standing','Current standings'],['allplay','All-play performance'],['luck','Actual minus expected wins'],['sos','Remaining schedule difficulty']])select.append(new Option(t,v));select.querySelector('[value=sos]').disabled=!data.fixturesAvailable;card.append(label,select);
 const list=el('div',null,'hq40-competition-list');card.append(list);
 function paint(){list.replaceChildren();const rows=[...data.rows];if(select.value==='allplay')rows.sort((a,b)=>b.expected-a.expected||a.standing-b.standing);if(select.value==='luck')rows.sort((a,b)=>b.luck-a.luck||a.standing-b.standing);if(select.value==='sos')rows.sort((a,b)=>b.sos-a.sos||a.standing-b.standing);
  for(const row of rows){const detail=el('details',null,'hq40-competition-row');detail.dataset.manager=row.name;if(row.name===selected)detail.classList.add('selected');const summary=el('summary');const text=el('span');text.append(el('strong',row.name),el('small',row.wins+'–'+row.losses+(row.ties?'–'+row.ties:'')+' all-play'));const metric=el('span',null,'hq40-comp-value');metric.append(el('strong',select.value==='sos'?row.sos.toFixed(2):select.value==='allplay'?(row.expected/data.week*100).toFixed(1)+'%':select.value==='standing'?'#'+row.standing:signed(row.luck)),el('small',select.value==='sos'?'Opp. avg PF':select.value==='allplay'?'All-play win %':select.value==='standing'?'Standing':'Win variance'));summary.append(text,metric);detail.append(summary);const bar=el('div',null,'hq40-allplay-track');bar.setAttribute('aria-hidden','true');const fill=el('div',null,'hq40-allplay-fill');fill.style.width=(row.expected/data.week*100)+'%';bar.append(fill);detail.append(bar);
   const body=el('div',null,'hq40-comp-detail');body.append(el('p','Actual win equivalents: '+row.actual.toFixed(1)+' · All-play expected: '+row.expected.toFixed(2)));
   if(row.opponents){body.append(el('p','Remaining opponent scoring average: '+row.sos.toFixed(2)+' points per game. Historical average, not a prediction.'));for(const o of row.opponents){const a=el('a','Week '+o.week+' · '+o.name+' · '+o.average.toFixed(2)+' avg PF');a.href='analytics/rivalry-war-room.html?a='+encodeURIComponent(row.name)+'&b='+encodeURIComponent(o.name);body.append(a)}}else body.append(el('p',data.remaining?'Complete synchronized remaining schedule unavailable.':'Regular season complete.'));
   const profile=el('a','Explore franchise ›');profile.href='managers/'+managerSlug(row.name)+'/?app=1';body.append(profile);detail.append(body);list.append(detail)}
 }
 select.addEventListener('change',paint);paint();host.append(card);
 const links=el('div',null,'league-compare-links');for(const [label,href] of [['Playoff Command Center','analytics/playoff-race.html'],['Historical schedule luck','analytics/schedule-draw-all-play.html']]){const a=el('a',label);a.href=href;links.append(a)}host.append(links);
}
