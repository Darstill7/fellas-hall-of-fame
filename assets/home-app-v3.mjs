// Derive every current statistic from the completed regular-season ledger; fail closed on disagreement.
import {fellasLeague,normalizeManager,managerSlug} from './league-config.mjs';
import {matchWeeklyRecordWatch,renderWeeklyRecordWatch} from './weekly-record-watch.mjs';
import {renderWinningStreakWatch} from './conditional-record-watch-v51.mjs';
import {mountLeagueComparison} from './league-intelligence-v51.mjs';
import {mountRoster} from './current-roster-v51.mjs';
const names=fellasLeague.managers;
const norm=n=>normalizeManager(n);
const cents=n=>Math.round(n*100);
// Hypothetical extra weekly game against the midpoint of scores 5 and 6.
export function buildMedianStandings(standings,by,week){
 const rows=standings.map(r=>({...r,medianW:0,medianL:0,medianT:0}));
 const thresholds=[];
 for(let i=0;i<week;i++){
  const scores=rows.map(r=>cents(by.get(r.name)[i].pf)).sort((a,b)=>a-b);
  if(scores.length!==10||scores.some(x=>!Number.isSafeInteger(x)))throw Error('Invalid median scores');
  const twiceMedian=scores[4]+scores[5];thresholds.push(twiceMedian/200);
  for(const r of rows){const score=2*cents(by.get(r.name)[i].pf);r[score>twiceMedian?'medianW':score<twiceMedian?'medianL':'medianT']++}
 }
 return {thresholds,rows:rows.map(r=>({...r,combinedW:r.w+r.medianW,combinedL:r.l+r.medianL,combinedT:(r.t??0)+r.medianT})).sort((a,b)=>(2*b.combinedW+b.combinedT)-(2*a.combinedW+a.combinedT)||b.pf-a.pf||a.name.localeCompare(b.name))};
}
export function buildHomeDashboard(guide,ledger){
 const s=guide['2026'],rows=s?.standings;if(!Array.isArray(rows)||rows.length!==10||new Set(rows.map(r=>r.name)).size!==10||rows.some(r=>!names.includes(r.name)))throw Error('Incomplete standings');
 const week=rows[0].games;if(!Number.isInteger(week)||week<1||week>14||rows.some(r=>r.games!==week))throw Error('Mixed week');
 const games=ledger.games.filter(g=>g.year===2026&&g.stage==='regular');if(games.length!==week*5)throw Error('Ledger cutoff mismatch');
 const by=new Map(names.map(n=>[n,[]]));for(const g of games){if(!Number.isInteger(g.week)||g.week<1||g.week>week||g.home===g.away||![g.homeScore,g.awayScore].every(Number.isFinite))throw Error('Invalid game');for(const [n,o,p,a] of [[norm(g.home),norm(g.away),g.homeScore,g.awayScore],[norm(g.away),norm(g.home),g.awayScore,g.homeScore]]){if(!by.has(n))throw Error('Unknown manager');by.get(n).push({week:g.week,opponent:o,pf:p,pa:a,result:cents(p)>cents(a)?'W':cents(p)<cents(a)?'L':'T'})}}
 const standings=rows.map(r=>{const h=by.get(r.name).sort((a,b)=>a.week-b.week);if(h.length!==week||h.some((x,i)=>x.week!==i+1)||h.filter(x=>x.result==='W').length!==r.w||h.filter(x=>x.result==='L').length!==r.l||h.filter(x=>x.result==='T').length!==(r.t??0)||h.reduce((n,x)=>n+cents(x.pf),0)!==cents(r.pf)||h.reduce((n,x)=>n+cents(x.pa),0)!==cents(r.pa))throw Error('Standings mismatch: '+r.name);let count=0;const result=h.at(-1).result;for(const x of h.slice().reverse()){if(x.result!==result)break;count++}return {...r,streak:result+count,latest:h.at(-1).pf}});
 const latest=games.filter(g=>g.week===week);const high=Math.max(...standings.map(r=>r.latest));return {week,standings,latest,median:buildMedianStandings(standings,by,week),leaders:standings.filter(r=>cents(r.latest)===cents(high))};
}
const el=(tag,txt,cls)=>{const n=document.createElement(tag);if(txt!=null)n.textContent=txt;if(cls)n.className=cls;return n};
const fmt=n=>n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const slug=n=>managerSlug(n);
const record=r=>r.w+'–'+r.l+(r.t?'–'+r.t:'');
function render(d){document.getElementById('cutoff').textContent='Through Week '+d.week+' · 2026';const pulse=document.getElementById('pulse');pulse.replaceChildren();for(const [label,title,sub] of [['Standings leader',d.standings[0].name,record(d.standings[0])+' · '+d.standings[0].streak],['Weekly scoring king',d.leaders.map(r=>r.name).join(' / '),fmt(d.leaders[0].latest)+' PF']]){const card=el('div',null,'pulse-card');card.append(el('small',label),el('strong',title),el('b',sub));pulse.append(card)}
 const panel=document.getElementById('standings');panel.replaceChildren();const header=el('div',null,'standing head');for(const x of ['#','MANAGER','W–L','PF','RUN'])header.append(el('span',x));panel.append(header);for(const [i,r] of d.standings.entries()){const a=el('a',null,'standing home-franchise-link');a.href='managers/'+slug(r.name)+'/';a.append(el('span',String(i+1),'rank'),el('strong',r.name),el('span',record(r)),el('span',fmt(r.pf)),el('span',r.streak,r.streak[0]==='W'?'win':r.streak[0]==='L'?'loss':''));panel.append(a)}
 const games=document.getElementById('matchups');games.replaceChildren();for(const g of d.latest){const row=el('div',null,'matchup');row.append(el('span',norm(g.home)),el('b',fmt(g.homeScore)+' – '+fmt(g.awayScore)),el('span',norm(g.away)));games.append(row)}}

function renderMedian(d){
 const host=document.getElementById('standings');if(!host||!d.median)return;
 const disclosure=el('details',null,'panel archive');disclosure.id='median-standings';
 disclosure.append(el('summary','What if we played the median?'));
 const body=el('div');body.append(el('p','Unofficial simulation · Week '+d.week+' · '+(d.week*2)+' decisions per manager. One head-to-head and one median result each week; exact median ties count as ties.','source-note'));
 const table=el('table');table.style.width='100%';table.style.fontVariantNumeric='tabular-nums';table.setAttribute('aria-label','Hypothetical median scoring standings');
 const head=el('thead'),hr=el('tr');for(const label of ['Manager','Actual','Median','Combined']){const th=el('th',label);th.scope='col';hr.append(th)}head.append(hr);table.append(head);
 const tbody=el('tbody');for(const r of d.median.rows){const tr=el('tr'),th=el('th',r.name);th.scope='row';tr.append(th,el('td',record(r)),el('td',record({w:r.medianW,l:r.medianL,t:r.medianT})),el('td',record({w:r.combinedW,l:r.combinedL,t:r.combinedT})));tbody.append(tr)}table.append(tbody);body.append(table,el('p','Ranked by combined win percentage, then points for. Does not change official standings or playoff odds.','source-note'));disclosure.append(body);host.after(disclosure);
}

// Local preference is not authentication or an ownership claim.
export function readPreference(storage){try{const n=storage.getItem(fellasLeague.preferenceKey);return names.includes(n)?n:''}catch{return ''}}
export function savePreference(storage,name){try{if(names.includes(name))storage.setItem(fellasLeague.preferenceKey,name);else storage.removeItem(fellasLeague.preferenceKey)}catch{}}
export function buildPersonalDashboard(d,race,name){
 const index=d.standings.findIndex(r=>r.name===name);if(index<0)return null;const team=d.standings[index],week=d.week+1;
 let opponent=null,odds=null;
 if(race?.verified_through_week===d.week){
 const allMatch=d.standings.every(r=>{const x=race.teams?.[r.name]??race.teams?.[r.name==='Thommy'?'Tom':r.name];return x&&x.w===r.w&&x.l===r.l&&cents(x.pf)===cents(r.pf)});
 if(allMatch){const o=race.scenarios?.['6']?.[name]??race.scenarios?.['6']?.[name==='Thommy'?'Tom':name];if(o&&[o.playoff_pct,o.top2_pct].every(x=>Number.isFinite(x)&&x>=0&&x<=100)&&o.top2_pct<=o.playoff_pct)odds={playoff:o.playoff_pct,bye:o.top2_pct};
 const fixtures=race.fixtures?.[week];if(Array.isArray(fixtures)&&fixtures.length===5&&fixtures.every(x=>Array.isArray(x)&&x.length===2)){const flat=fixtures.flat().map(norm);if(new Set(flat).size===10&&flat.every(x=>names.includes(x))){const pair=fixtures.map(x=>x.map(norm)).find(x=>x.includes(name));opponent=d.standings.find(r=>r.name===pair?.find(x=>x!==name))??null}}}}
 return {team,rank:index+1,opponent,odds,week,cutoff:d.week};
}

// Ranked, bounded activity derived exclusively from synchronized evidence.
// Probability estimates are not official clinches. No inferred editorial mentions.
export function buildActivityFeed(d,race,name){
 const p=buildPersonalDashboard(d,race,name);if(!p)return [];
 const t=p.team,items=[],week=d.week,profile='managers/'+slug(name)+'/?app=1';
 const add=(id,priority,title,detail,href)=>items.push({id:week+':'+name+':'+id,priority,title,detail,href,week});
 const run=Number(t.streak.slice(1)),result=t.streak[0];
 if(run>=3&&result!=='T')add('streak',run>=7?100:80,run+' consecutive '+(result==='W'?'wins':'losses'), 'Your current regular-season streak through Week '+week+'.',profile);
 if(d.leaders.some(r=>r.name===name))add('scoring',95,d.leaders.length>1?'Tied for weekly scoring lead':'Weekly scoring leader',fmt(t.latest)+' points in Week '+week+'.','analytics/sportscenter.html');
 if(p.odds&&p.odds.playoff>0&&p.odds.playoff<100)add('playoff',p.odds.playoff>=20&&p.odds.playoff<=80?85:45,'Playoff watch · '+p.odds.playoff+'%', 'Model estimate through Week '+week+'; not an official clinch.','analytics/playoff-race.html');
 const g=d.latest.find(g=>[norm(g.home),norm(g.away)].includes(name));if(g){const home=norm(g.home)===name,o=norm(home?g.away:g.home),pf=home?g.homeScore:g.awayScore,pa=home?g.awayScore:g.homeScore;add('result',Math.abs(pf-pa)>=30?75:60,(pf>pa?'Victory over ':pf<pa?'Loss to ':'Tie with ')+o,fmt(pf)+' – '+fmt(pa)+' · Week '+week,'analytics/sportscenter.html')}
 if(p.opponent)add('next',65,p.opponent.name+' awaits','Week '+p.week+' schedule preview · '+record(p.opponent), 'analytics/rivalry-war-room.html');
 return items.sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id)).slice(0,3);
}
function renderActivity(host,d,race,name){
 const items=buildActivityFeed(d,race,name);if(!items.length)return;
 const panel=el('section',null,'personal-activity');const heading=el('h3','Your franchise activity');panel.append(heading,el('small','Three most relevant verified updates · Week '+d.week,'activity-meta'));
 const list=el('div',null,'activity-list');for(const item of items){const a=el('a',null,'activity-item');a.href=item.href;a.dataset.activityId=item.id;const text=el('div');text.append(el('strong',item.title),el('small',item.detail));a.append(text,el('span','›','activity-arrow'));list.append(a)}panel.append(list);host.append(panel);
}

function renderPersonal(d,race,name){
 const host=document.getElementById('my-team');host.replaceChildren();const compact=document.body.classList.contains('personal-v51');const p=buildPersonalDashboard(d,race,name);if(!p){host.append(el('p','Choose your franchise to personalize this device. No account required.','source-note'));return}
 const card=el('div',null,'personal-card'),top=el('div',null,'personal-top'),identity=el('div'),avatar=el('span',name.slice(0,2).toUpperCase(),'team-avatar');identity.append(el('strong',name),el('small',compact?'2026 season':'Franchise headquarters'));const form=el('div',null,'team-form');form.append(el('strong',record(p.team)),el('small',p.team.streak+' streak',p.team.streak[0]==='W'?'win':'loss'));top.append(avatar,identity,form);card.append(top);
 const stats=el('div',null,'personal-stats');for(const [label,value] of [['Standing','#'+p.rank],[compact?'Avg. points':'Weekly PF',fmt(p.team.pf/d.week)],['Playoff odds',p.odds?p.odds.playoff+'%':'—']]){const x=el('div');x.append(el('strong',value),el('small',label));stats.append(x)}card.append(stats);const median=d.median?.rows.find(r=>r.name===name);if(median&&!compact){card.append(el('p','Median format: '+record({w:median.combinedW,l:median.combinedL,t:median.combinedT})+' · hypothetical, not official','source-note'))}host.append(card);
 if(compact){
 const g=d.latest.find(g=>[norm(g.home),norm(g.away)].includes(name));
 if(g){const home=norm(g.home)===name,o=norm(home?g.away:g.home),pf=home?g.homeScore:g.awayScore,pa=home?g.awayScore:g.homeScore;
 const result=el('div',null,'personal-latest-result');result.append(el('span','Week '+d.week+' · '+(pf>pa?'Win over ':pf<pa?'Loss to ':'Tie with ')+o,pf>pa?'win':pf<pa?'loss':''),el('strong',fmt(pf)+'–'+fmt(pa)));card.append(result)}
 const more=el('a','My Team dashboard ›','personal-home-cta');more.href='#my-team-section';card.append(more);
 }
 if(compact){
 const watch=el('section',null,'approved-record-watch');watch.id='team-record-watch';watch.hidden=true;
 watch.setAttribute('aria-labelledby','team-record-watch-title');host.append(watch);
 }
 const match=el('div',null,'personal-detail');match.append(el('h3','Your next matchup'));if(p.opponent){match.append(el('small','Week '+p.week+' · schedule preview'),el('strong',name+' vs '+p.opponent.name),el('p',record(p.team)+' vs '+record(p.opponent)+' · Avg PF '+fmt(p.team.pf/d.week)+' – '+fmt(p.opponent.pf/d.week)))}else match.append(el('p','Matching future fixture unavailable.'));if(compact&&p.opponent){const a=el('a','Head-to-head history ›','personal-insight-link');a.href='analytics/rivalry-war-room.html?a='+encodeURIComponent(name)+'&b='+encodeURIComponent(p.opponent.name);match.append(a);const diff=p.team.pf/d.week-p.opponent.pf/d.week;match.append(el('p',Math.abs(diff)<.005?'Equal season scoring averages.':(diff>0?name:p.opponent.name)+' averages '+fmt(Math.abs(diff))+' more points per game. Not a projection.','source-note'))}host.append(match);
 const outlook=el('div',null,'personal-detail');outlook.append(el('h3','Your playoff picture'));if(p.odds){for(const [label,value] of [['Playoffs',p.odds.playoff],['First-round bye',p.odds.bye]]){const row=el('div',null,'odds-row'),meter=el('meter');meter.min=0;meter.max=100;meter.value=value;meter.setAttribute('aria-label',label);row.append(el('span',label),el('b',value+'%'),meter);outlook.append(row)}outlook.append(el('small','Model estimates through Week '+d.week+'; not official clinches.'))}else outlook.append(el('p','Matching playoff model unavailable.'));if(compact){const a=el('a','Playoff scenarios ›','personal-insight-link');a.href='analytics/playoff-race.html';outlook.append(a)}host.append(outlook);
 const links=el('div',null,'personal-links');for(const [label,href] of [[compact?'Franchise':'Career','managers/'+slug(name)+'/'],['Records','managers/record-books.html?manager='+encodeURIComponent(name)+(compact?'#owned-records':'#career-first')],[compact?'Trade history':'Trades','analytics/trade-museum.html?manager='+encodeURIComponent(name)],['Rivalries','analytics/rivalry-war-room.html?a='+encodeURIComponent(name)+'&b='+encodeURIComponent(p.opponent?.name??names.find(n=>n!==name))]]){const a=el('a',label);a.href=href;links.append(a)}host.append(links);renderActivity(host,d,race,name);
 if(compact){const activity=host.querySelector('.personal-activity');if(activity){const summary=el('summary','Franchise activity · '+activity.querySelectorAll('.activity-item').length+' updates');const details=el('details',null,'personal-activity-fold');details.append(summary);activity.before(details);details.append(activity)}mountRoster(host,name);}
}

if(typeof document!=='undefined'){if(document.body.classList.contains('personal-v51')){const updateView=()=>{document.body.classList.toggle('home-overview',['','#main','#news'].includes(location.hash));document.body.classList.toggle('team-view',['#my-team-section','#my-team'].includes(location.hash));document.body.classList.toggle('league-view',location.hash==='#league');document.body.classList.toggle('more-view',location.hash==='#more')};updateView();addEventListener('hashchange',updateView)}const get=async file=>{const r=await fetch('data/'+file);if(!r.ok)throw Error('HTTP '+r.status);return r.json()};Promise.all([get('season_guide.json'),get('home-current-season-v1.json').catch(()=>null),get('playoff_race_v1.json').catch(()=>null)]).then(async ([g,l,race])=>{let d;let source=l;try{if(l?.schemaVersion!==1||l.year!==2026||l.throughWeek!==g['2026']?.standings?.[0]?.games)throw Error('Compact projection stale or unavailable');d=buildHomeDashboard(g,l)}catch{source=await get('unified_record_book_2016_2026.json');d=buildHomeDashboard(g,source)}render(d);renderMedian(d);mountLeagueComparison(document.getElementById('league-intelligence'),d,name=>buildPersonalDashboard(d,race,name));const watchHost=document.getElementById('conditional-record-watch');if(watchHost)void get('conditional-record-watch-v51.json').then(x=>{if(x.schemaVersion===1&&x.year===2026&&x.throughWeek===d.week&&Array.isArray(x.items))renderWinningStreakWatch(watchHost,x.items)}).catch(()=>{});const select=document.getElementById('my-manager');let storage;try{storage=window.localStorage}catch{}select.value=readPreference(storage);renderPersonal(d,race,select.value);
 const homeWatch=document.getElementById('home-record-watch');
 let report=null;
 const updateTeamWatch=()=>renderWeeklyRecordWatch(document.getElementById('team-record-watch'),report,select.value);
 select.addEventListener('change',()=>{
  savePreference(storage,select.value);
  renderPersonal(d,race,select.value);
  updateTeamWatch();
 });
 if(homeWatch)void get('weekly-record-ownership-v57.json')
  .then(watch=>matchWeeklyRecordWatch(watch,source,d.week)).then(verified=>{
   report=verified;
   renderWeeklyRecordWatch(homeWatch,report);
   updateTeamWatch();
  }).catch(()=>{});}).catch(e=>{document.getElementById('cutoff').textContent='Verified data unavailable';for(const id of ['pulse','standings','matchups'])document.getElementById(id).replaceChildren(el('p','Current data could not be verified. Open the season archive.'));console.warn('Home app:',e.message)})}


 // Public archive indexes are the publication boundary. Never enumerate draft files.
export async function refreshEditorialFeed(doc=document, fetcher=fetch){
 const series=[
  {key:'hangover',archive:'tuesday-hangover/',selector:'main section.game',link:'a[href]',title:'h2',meta:'.kicker',pattern:/^\d{4}-week-\d{1,2}\.html$/,label:'THE TUESDAY HANGOVER',cta:'Read the roast ↗'},
  {key:'shitter',archive:'weekly-shitter/',selector:'main a.story',link:null,title:'h3',meta:'.story-info .eyebrow',pattern:/^issue-\d+\.html$/,label:'THE WEEKLY SHITTER',cta:'Read the issue ↗'}
 ];
 await Promise.all(series.map(async s=>{
  const card=doc.querySelector('[data-news="'+s.key+'"]');if(!card)return;
  try{
   const archiveURL=new URL(s.archive,doc.baseURI);
   const response=await fetcher(archiveURL.href,{cache:'no-cache'});
   if(!response.ok)throw Error('Archive unavailable');
   const archive=new DOMParser().parseFromString(await response.text(),'text/html');
   const entry=archive.querySelector(s.selector);
   const link=s.link?entry?.querySelector(s.link):entry;
   const href=link?.getAttribute('href')||'';
   const title=entry?.querySelector(s.title)?.textContent.trim();
   const meta=entry?.querySelector(s.meta)?.textContent.trim();
   if(!s.pattern.test(href)||!title||!meta)throw Error('Invalid archive entry');
   const target=new URL(href,archiveURL);
   if(target.origin!==archiveURL.origin||!target.pathname.startsWith(archiveURL.pathname))throw Error('Invalid article URL');
   const article=await fetcher(target.href,{cache:'no-cache'});
   if(!article.ok)throw Error('Article unavailable');
   const articleDoc=new DOMParser().parseFromString(await article.text(),'text/html');
   if(articleDoc.querySelector('meta[name="robots" i][content*="noindex" i]'))throw Error('Article not public');
   const make=(tag,value)=>{const e=doc.createElement(tag);e.textContent=value;return e};
   card.href=target.href;
   card.replaceChildren(make('small',s.label+' · '+meta),make('strong',title),make('b',s.cta));
  }catch{
   // Fail closed: archive access remains available, but no unverified issue is promoted.
   card.href=s.archive;
   card.replaceChildren(...[['small',s.label],['strong','Browse published editions'],['b','Open archive ↗']].map(([tag,value])=>{const e=doc.createElement(tag);e.textContent=value;return e}));
  }
 }));
}
if(typeof document!=='undefined')void refreshEditorialFeed();
