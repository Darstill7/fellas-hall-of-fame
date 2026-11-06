// Verified postseason records, separate from regular-season career totals.
// Source: verified ESPN/Sleeper championship brackets + audited single-week archive.
const stylesheet=new URL('./postseason-records.css',import.meta.url).href;
if(!document.querySelector('link[data-postseason-styles]')){
 const link=document.createElement('link');link.rel='stylesheet';link.href=stylesheet;
 link.dataset.postseasonStyles='';document.head.append(link);
}
const E=value=>String(value??'—').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmt=n=>Number(n).toFixed(2);
const active=new Set(['Stilly','Stew','Tom','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott']);
const recordLink=n=>'../managers/record-books.html?manager='+encodeURIComponent(n)+'#postseason-manager-panel';
const managerAnchor=(name,fromAnalytics=true)=>{
 const link=(fromAnalytics?'../managers/':'./')+'record-books.html?manager='+encodeURIComponent(name)+'#postseason-manager-panel';
 return '<a href="'+E(link)+'">'+E(name)+'</a>';
};
function yearLabel(years){return years?.length?years.join(', '):'No verified occurrence'}
function card(title,value,detail){
 return '<article class="postseason-metric"><span class="postseason-label">'+E(title)+'</span><strong>'+E(value)+'</strong><p>'+E(detail)+'</p></article>';
}
const tips=[
 'Championship brackets only for berths, semifinals, finals, top seeds and byes; third-place and consolation games never count as playoff appearances.',
 'Single-week postseason scoring can include consolation and bracket-unclassified Sleeper games. It is not a ranking of championship-bracket wins.',
 '2016–17 two-week ESPN aggregates and 2019 running consolation totals are excluded from the one-week scoring lists.',
 'Scoring and rounding rules changed between ESPN eras and Sleeper. Raw-point records are descriptive, not era-adjusted.'
];
function caveat(){return '<p class="postseason-note">'+tips.map(E).join(' ')+'</p>'}
function singleGame(item){
 if(!item)return 'Not available in recovered single-week archive';
 return E(fmt(item.points)+' pts · '+item.year+' W'+item.week+' vs '+item.opponent+' · '+item.stage);
}
function managerCards(m){
 return '<div class="postseason-grid">'
 +card('Playoff berths',m.appearances.length,yearLabel(m.appearances))
 +card('Championship games',m.finals.length,yearLabel(m.finals))
 +card('Semifinal appearances',m.semifinals.length,yearLabel(m.semifinals))
 +card('First-round byes',m.byes.length,yearLabel(m.byes))
 +'</div>';
}
function showLeague(data){
 const el=document.getElementById('postseason-league-panel');if(!el)return;
 const entries=[['Most playoff berths','playoffBerths'],['Most championship games','finals'],['Most semifinals','semifinals'],['Most first-round byes','byes']];
 el.innerHTML='<div class="postseason-grid">'+entries.map(([label,key])=>{
  const arr=data.leaders[key],top=arr[0]?.count||0;
  const leaders=arr.filter(x=>x.count===top).map(x=>x.manager).join(' · ');
  return card(label,String(top),leaders);
 }).join('')+'</div><p class="postseason-intro">Verified championship brackets from 2016–2025. Championship appearances are separate from consolation games and unclassified postseason scores.</p><a class="postseason-action" href="postseason-records.html">Explore postseason records →</a>';
}
function showProfile(data){
 const el=document.querySelector('[data-postseason-profile]');if(!el)return;
 const name=el.dataset.postseasonProfile||document.querySelector('main .hero h1')?.textContent?.trim();
 const m=data.managers.find(x=>x.manager===name);
 if(!m){el.textContent='Historical postseason summary unavailable.';return}
 const recordHref='../record-books.html?manager='+encodeURIComponent(name)+'#postseason-manager-panel';
 el.classList.add('postseason-profile-strip');
 el.innerHTML='<details><summary>Postseason résumé · '+m.appearances.length+' playoff berths · '+m.finals.length+' title games</summary><div class="postseason-profile-body">'
 +managerCards(m)
 +'<p><strong>Championships:</strong> '+E(yearLabel(m.championships))+' · <strong>No. 1 seeds:</strong> '+E(yearLabel(m.topSeeds))+'</p>'
 +'<p><strong>Best recovered single-week postseason score:</strong> '+singleGame(m.bestSingleWeek)+'</p>'
 +'<a class="postseason-action" href="'+E(recordHref)+'">View all '+E(name)+' postseason records →</a>'
 +'</div></details>';
}
function showManagerBook(data){
 const el=document.getElementById('postseason-manager-panel'),picker=document.getElementById('manager');
 if(!el||!picker)return;
 el.classList.add('postseason-manager-book');
 const paint=()=>{
  const name=picker.value==='Thommy'?'Tom':picker.value;
  const m=data.managers.find(x=>x.manager===name);
  if(!m){el.innerHTML='<h2>Postseason record</h2><p class="muted">No source-verified championship bracket record for this manager.</p>';return}
  el.innerHTML='<h2>Postseason records · '+E(name)+'</h2><p class="muted">Verified championship-bracket achievements, completed 2016–2025 seasons.</p>'
   +managerCards(m)
   +'<div class="postseason-grid postseason-grid--three">'
   +card('Championship titles',m.championships.length,yearLabel(m.championships))
   +card('Runner-up finishes',m.runnerUps.length,yearLabel(m.runnerUps))
   +card('No. 1 playoff seeds',m.topSeeds.length,yearLabel(m.topSeeds))
   +'</div><p><strong>Longest playoff-berth streak:</strong> '+m.longestPlayoffBerthStreak+' consecutive seasons.</p>'
   +'<p><strong>Highest recovered one-week postseason score:</strong> '+singleGame(m.bestSingleWeek)+'</p>'
   +'<p><strong>Closest recovered postseason victory:</strong> '+(m.closestPostseasonWin?E(m.closestPostseasonWin.year+' W'+m.closestPostseasonWin.week+' · '+fmt(m.closestPostseasonWin.margin)+' points over '+m.closestPostseasonWin.loser+' · '+m.closestPostseasonWin.stage):'None available')+'</p>'
   +caveat()
   +'<a class="postseason-action" href="../analytics/postseason-records.html">League postseason leaderboards →</a>';
 };
 picker.addEventListener('change',paint);
 paint();
}
function showDetail(data){
 const el=document.getElementById('postseason-detail');if(!el)return;
 const achievementKeys=[
  ['playoffBerths','Playoff berths'],['finals','Championship games'],['semifinals','Semifinals'],
  ['championships','Championship titles'],['byes','First-round byes'],['topSeeds','No. 1 seeds'],['berthStreak','Playoff-berth streak']
 ];
 const scoringKeys=[
  ['highestSingleWeek','Highest single-week score'],['lowestSingleWeek','Lowest single-week score'],
  ['biggestWins','Biggest postseason wins'],['closestGames','Closest postseason games']
 ];
 let mode='achievements',selected=achievementKeys[0][0];
 el.classList.add('postseason-archive');
 el.innerHTML='<div class="postseason-tabs" id="postseason-modes" aria-label="Postseason record type">'
 +'<button type="button" data-mode="achievements" aria-pressed="true">Playoff achievements</button>'
 +'<button type="button" data-mode="scores" aria-pressed="false">Postseason scoring</button></div>'
 +'<div class="postseason-tabs" id="postseason-categories" aria-label="Choose record category"></div>'
 +'<h2 id="postseason-table-title"></h2><p class="postseason-intro" id="postseason-table-summary"></p>'
 +'<div class="postseason-table-scroll"><table class="postseason-table"><thead id="postseason-table-head"></thead><tbody id="postseason-table-body"></tbody></table></div>'
 +'<h2 style="margin-top:29px">Championships by season</h2><div class="postseason-season-list">'
 +data.brackets.map(b=>'<article><strong>'+b.year+' · '+E(b.champion)+'</strong><p>Finalists: '+E(b.finalists.join(' vs '))+' · Byes: '+E(yearLabel(b.byes))+'</p></article>').join('')
 +'</div>'+caveat()+'<p class="postseason-intro">Sources: <a href="../data/verified_espn_playoff_brackets_2016_2019.json">ESPN brackets</a>, <a href="../data/verified_sleeper_playoff_brackets_2020_2025.json">Sleeper brackets</a>, <a href="../data/unified_record_book_2016_2026.json">unified matchup archive</a>.</p>';
 const render=()=>{
  el.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  const keys=mode==='achievements'?achievementKeys:scoringKeys;
  el.querySelector('#postseason-categories').innerHTML=keys.map(([key,label])=>'<button type="button" data-key="'+key+'" aria-pressed="'+String(selected===key)+'">'+E(label)+'</button>').join('');
  const label=keys.find(x=>x[0]===selected)?.[1]||'Postseason';
  el.querySelector('#postseason-table-title').textContent=label;
  el.querySelector('#postseason-table-summary').textContent=mode==='achievements'
   ?'Verified championship-bracket accomplishments only; years identify completed seasons.'
   :'Recovered one-week postseason matchups, including consolation and Sleeper bracket-unclassified games. Multiweek aggregates excluded.';
  let head='',rows='';
  if(mode==='achievements'){
   const ranking=data.leaders[selected].filter(x=>x.count>0);
   head='<tr><th>Rank</th><th>Manager</th><th>Total</th><th>Seasons</th></tr>';
   rows=ranking.map((x,i)=>'<tr><td>'+(i+1)+'</td><td>'+managerAnchor(x.manager)+'</td><td>'+x.count+'</td><td>'+E(yearLabel(x.years))+'</td></tr>').join('');
  }else if(['highestSingleWeek','lowestSingleWeek'].includes(selected)){
   head='<tr><th>Rank</th><th>Manager</th><th>Points</th><th>Matchup</th></tr>';
   rows=data.records[selected].map((x,i)=>'<tr><td>'+(i+1)+'</td><td>'+managerAnchor(x.manager)+'</td><td>'+fmt(x.points)+'</td><td>'+x.year+' W'+x.week+' vs '+E(x.opponent)+' · '+E(x.stage)+'</td></tr>').join('');
  }else{
   head='<tr><th>Rank</th><th>Winner</th><th>Margin</th><th>Matchup</th></tr>';
   rows=data.records[selected].map((x,i)=>'<tr><td>'+(i+1)+'</td><td>'+managerAnchor(x.winner)+'</td><td>'+fmt(x.margin)+'</td><td>'+x.year+' W'+x.week+' vs '+E(x.loser)+' · '+E(x.stage)+'</td></tr>').join('');
  }
  el.querySelector('#postseason-table-head').innerHTML=head;
  el.querySelector('#postseason-table-body').innerHTML=rows||'<tr><td colspan="4">No verified entries.</td></tr>';
 };
 el.querySelector('#postseason-modes').addEventListener('click',ev=>{
  const b=ev.target.closest('button[data-mode]');if(!b)return;
  mode=b.dataset.mode;selected=(mode==='achievements'?achievementKeys:scoringKeys)[0][0];render();
 });
 el.querySelector('#postseason-categories').addEventListener('click',ev=>{
  const b=ev.target.closest('button[data-key]');if(!b)return;selected=b.dataset.key;render();
 });
 render();
}
try{
 const response=await fetch(new URL('../data/postseason_records_verified_v1.json',import.meta.url));
 if(!response.ok)throw Error('Postseason archive request returned '+response.status);
 const data=await response.json();
 if(data.version!==1||data.seasonCount!==10)throw Error('Postseason dataset version or season coverage mismatch');
 showLeague(data);showProfile(data);showManagerBook(data);showDetail(data);
}catch(error){
 for(const id of ['postseason-league-panel','postseason-manager-panel','postseason-detail']){
  const el=document.getElementById(id);if(el)el.textContent='Postseason records could not load. Please refresh or use the original verified playoff history.';
 }
 const mini=document.querySelector('[data-postseason-profile]');
 if(mini)mini.textContent='Postseason summary temporarily unavailable.';
 console.error('Verified postseason records unavailable:',error);
}
