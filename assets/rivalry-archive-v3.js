(()=>{'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const M=['Stilly','JMid','Tom','Stew','Scott','Mitch','Tony','Stover','Kuhl','Birch'];
const canonical=n=>n==='Tom'?'Thommy':n;
const display=n=>n==='Thommy'?'Tom':n;
const path=location.pathname;
const depth=path.includes('/rivalries/')?(path.endsWith('/')||path.endsWith('/index.html')?'../../':'../'):'../';
// All rivalry entries share the same accessible visual foundation as the
// homepage and ten manager profiles, without modifying their archived results.
document.body.classList.add('fellas-polished');
const sharedStyle=document.createElement('link');
sharedStyle.rel='stylesheet';sharedStyle.href=depth+'assets/fellas-ui-system.css';
document.head.append(sharedStyle);
// Give rivalry content a real main landmark while leaving the legacy
// header, navigation and source data in place.
const rivalryShell=document.querySelector('body > .wrap');
const rivalrySections=rivalryShell?[...rivalryShell.children].filter(node=>node.matches('section.section')):[];
if(rivalrySections.length){
 const main=document.createElement('main');
 main.className='rivalry-main';
 main.setAttribute('aria-label','Rivalry content');
 rivalrySections[0].before(main);
 for(const section of rivalrySections)main.append(section);
}
const rivalryWrapper=document.querySelector('.wrap');
if(rivalryWrapper)rivalryWrapper.setAttribute('role','main');
const legacyMenuSummary=document.querySelector('.mobile-menu>summary');
if(legacyMenuSummary)legacyMenuSummary.textContent='Menu';
const heading=document.querySelector('.top h1');
if(heading){
 heading.id='main-content';heading.tabIndex=-1;
 const skip=document.createElement('a');
 skip.className='fellas-skip';skip.href='#main-content';skip.textContent='Skip to matchup';
 document.body.prepend(skip);
}

const fmt=n=>Number(n).toFixed(2);
// One consistent visitor-level menu across the rivalry finder and all 45 files.
// Historic research destinations remain available elsewhere; keep five core links.
const primaryLinks=[
 ['Home','../index.html'],
 ['Managers','../managers/'],
 ['Report Cards','../analytics/manager-report-cards.html'],
 ['Records','../analytics/records.html'],
 ['Rivalries','../analytics/rivalries.html']
];
const nav=document.querySelector('.nav');
if(nav){
 nav.setAttribute('aria-label','Rivalry navigation');
 nav.replaceChildren(...primaryLinks.map(([label,href])=>{
  const a=document.createElement('a');a.href=href;a.textContent=label;
  if(label==='Rivalries')a.setAttribute('aria-current','page');
  return a;
 }));
}
const mobileMenu=document.querySelector('.mobile-menu .menu-grid');
if(mobileMenu)mobileMenu.replaceChildren(...primaryLinks.map(([label,href])=>{
 const a=document.createElement('a');a.href=href;a.textContent=label;return a;
}));
document.querySelector('.mobile-dock')?.remove();
const navStyles=document.createElement('style');
navStyles.dataset.rivalryCoreNavigation='';
navStyles.textContent='body.rivalry-page,body[data-rivalry-matrix]{padding-bottom:0}.nav a{min-height:44px;display:inline-flex;align-items:center;line-height:1.5;font-size:13px;padding-inline:15px}.mobile-menu>summary{min-height:44px;display:inline-flex;align-items:center;padding:10px 14px;font-size:13px}.mobile-menu .menu-grid a{min-height:44px;display:flex;align-items:center;font-size:13px;line-height:1.5}.nav a:focus-visible,.mobile-menu a:focus-visible,.mobile-menu summary:focus-visible{outline:3px solid #f2d28f;outline-offset:2px}@media(max-width:760px){.mobile-menu{margin:12px 0 18px}.mobile-menu .menu-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}}';
document.head.append(navStyles);
// Do not leave old static scoreboards visible while the canonical archive loads.
if(document.body.dataset.rivalryPair){
 const hero=document.querySelector('.rival-hero');
 if(hero){hero.textContent='Loading verified head-to-head results…';hero.setAttribute('role','status');}
}
// Keep all 45 legacy rivalry files readable without rewriting their historical data.
if(document.body.dataset.rivalryPair){
 const style=document.createElement('style');
 style.dataset.rivalryReadability='';
 style.textContent='.rivalry-page .top h1{font-size:clamp(32px,6vw,60px);line-height:1.14;overflow-wrap:anywhere;max-width:24ch}.rivalry-page .top p{font-size:14px;line-height:1.75}.rivalry-page .section{margin:23px 0}.rivalry-page .rival-hero{gap:16px;padding:clamp(16px,3vw,27px);min-width:0}.rivalry-page .rival-hero .metric{font-size:clamp(26px,5vw,40px);line-height:1.25}.rivalry-page .rival-hero .vs{font-size:clamp(21px,4vw,32px);line-height:1.4;white-space:nowrap}.rivalry-page .rivalry-key-facts{font-size:14px;line-height:1.7}.rivalry-page .rivalry-game-history{border:1px solid #526e81;border-radius:12px;background:#112634;padding:0 16px;margin:15px 0}.rivalry-page .rivalry-game-history>summary{display:flex;align-items:center;min-height:54px;cursor:pointer;line-height:1.5;color:#f2d28f;font-weight:850;font-size:15px;padding:12px 0}.rivalry-page .rivalry-game-content{padding:0 0 16px}.rivalry-page .rivalry-game-content p{font-size:13px;line-height:1.7;margin:10px 0}.rivalry-page .rivalry-game-content .table-wrap{max-width:100%;overflow-x:auto}.rivalry-page .rivalry-game-content table{min-width:560px}.rivalry-page .rivalry-game-content th,.rivalry-page .rivalry-game-content td{padding:12px;line-height:1.55;text-align:left;font-size:12px}.rivalry-page .rivalry-game-content th{font-size:11px;letter-spacing:.02em}.rivalry-page .rivalry-back{display:inline-flex;align-items:center;min-height:44px;margin-top:12px;font-size:14px;color:#f2d28f;font-weight:850}.rivalry-page .rivalry-source-details{border:1px solid #4d6375;border-radius:10px;padding:0 12px;margin:13px 0;color:#cbd9e3}.rivalry-page .rivalry-source-details>summary{cursor:pointer;display:flex;align-items:center;min-height:44px;line-height:1.5;font-size:13px;font-weight:800;color:#f1d18f}.rivalry-page .rivalry-source-details p{font-size:12px;line-height:1.7}.rivalry-page .rivalry-game-history summary:focus-visible,.rivalry-page .rivalry-source-details summary:focus-visible,.rivalry-page .rivalry-back:focus-visible{outline:3px solid #f1d18f;outline-offset:3px}.rivalry-page .page-kicker,.rivalry-page .live-chip,.rivalry-page .footer{display:none}@media(max-width:700px){.rivalry-page .rival-hero{display:grid;grid-template-columns:1fr auto 1fr;text-align:center;align-items:center;gap:8px}.rivalry-page .rival-hero>div:last-child{text-align:center!important}.rivalry-page .rivalry-game-history{padding:0 12px}.rivalry-page .top{padding:18px 0 12px}.rivalry-page .section h2{font-size:clamp(21px,6vw,28px);line-height:1.3}}';
 document.head.append(style);
 const notices=[...document.querySelectorAll('.fellas-review-notice,#fellas-stage13-audit')];
 if(notices.length){
  const details=document.createElement('details');details.className='rivalry-source-details';
  details.innerHTML='<summary>Source coverage and verification notes</summary>';
  for(const notice of notices){const p=document.createElement('p');p.append(...[...notice.childNodes]);details.append(p);notice.remove()}
  (document.querySelector('.rival-hero')?.closest('section')||document.querySelector('.top')||document.querySelector('.brandbar'))?.after(details);
 }
 const heading=document.querySelector('.top');
 if(heading){
  const back=document.createElement('a');back.className='rivalry-back';
  back.href='../analytics/rivalries.html';back.textContent='← All rivalries';
  heading.before(back);
 }
 for(const link of document.querySelectorAll('a[href="../managers/stilly.html"]'))link.href='../managers/';
}

fetch(depth+'data/unified_record_book_2016_2026.json').then(r=>{if(!r.ok)throw Error('Historical matchups unavailable');return r.json()}).then(d=>{
 const all=d.games.filter(g=>g.stage==='regular');
 const get=(a,b)=>all.filter(g=>(g.home===canonical(a)&&g.away===canonical(b))||(g.away===canonical(a)&&g.home===canonical(b))).sort((x,y)=>y.year-x.year||y.week-x.week);
 const win=(g,n)=>g.homeScore===g.awayScore?false:(g.homeScore>g.awayScore?g.home:g.away)===canonical(n);
 const margin=g=>Math.abs(g.homeScore-g.awayScore);
 const big=(games,n)=>games.filter(g=>win(g,n)).sort((x,y)=>margin(y)-margin(x))[0];
 const desc=g=>g?g.year+' Week '+g.week+' · '+fmt(margin(g))+' pts ('+fmt(g.homeScore)+'–'+fmt(g.awayScore)+')':'—';
 if(document.body.dataset.rivalryPair){
  const [a,b]=document.body.dataset.rivalryPair.split('|').map(n=>n.toLowerCase()==='jmid'?'JMid':n);
  const games=get(a,b),w=games.filter(g=>win(g,a)).length,l=games.filter(g=>win(g,b)).length,t=games.length-w-l;
  for(const managerLink of document.querySelectorAll('.rivalry-page a.manager-card[href^="../managers/"]')){
   const name=managerLink.querySelector('h2')?.textContent?.trim();
   const slug=name?.toLowerCase()==='tom'?'tom':name?.toLowerCase();
   if(slug&&M.some(n=>n.toLowerCase()===slug))managerLink.href='../managers/'+slug+'/';
  }
  const introduction=document.querySelector('.rivalry-page .top p');
  if(introduction)introduction.textContent='Head-to-head results from verified archived regular-season games. Historical franchise ownership is reconciled; postseason games are excluded.';
  const hero=document.querySelector('.rival-hero');
  if(hero){
   hero.removeAttribute('role');
   hero.innerHTML=games.length
    ?'<div><div class="label">'+E(a)+'</div><div class="metric">'+w+'</div></div><div class="vs">'+w+'–'+l+(t?'–'+t:'')+'</div><div style="text-align:right"><div class="label">'+E(b)+'</div><div class="metric">'+l+'</div></div>'
    :'<p class="muted rivalry-no-results">No verified regular-season meetings found for '+E(a)+' and '+E(b)+'. This is missing evidence, not a 0–0 record.</p>';
  }
  const section=document.createElement('section');section.className='section';section.dataset.canonicalRivalry='true';
  section.innerHTML='<h2>Regular-season matchup history</h2><p class="muted rivalry-key-facts">'+(games.length?games.length+' documented meetings · '+w+' '+E(a)+' wins · '+l+' '+E(b)+' wins'+(t?' · '+t+' ties':''):'No recovered regular-season meetings for this pair. This is missing evidence, not a 0–0 record or proof that the managers never played.')+'</p><details class="rivalry-game-history"><summary>View all '+games.length+' games and biggest wins</summary><div class="rivalry-game-content"><p class="muted">Largest '+E(a)+' victory: '+E(desc(big(games,a)))+'</p><p class="muted">Largest '+E(b)+' victory: '+E(desc(big(games,b)))+'</p><div class="table-wrap"><table><thead><tr><th>Season</th><th>Week</th><th>'+E(a)+'</th><th>'+E(b)+'</th><th>Winner</th><th>Margin</th></tr></thead><tbody>'+games.map(g=>{const pa=g.home===canonical(a)?g.homeScore:g.awayScore,pb=g.home===canonical(b)?g.homeScore:g.awayScore,winner=g.homeScore===g.awayScore?'Tie':display(g.homeScore>g.awayScore?g.home:g.away);return '<tr><td>'+g.year+'</td><td>'+g.week+'</td><td>'+fmt(pa)+'</td><td>'+fmt(pb)+'</td><td>'+E(winner)+'</td><td>'+fmt(margin(g))+'</td></tr>'}).join('')+'</tbody></table></div><p class="muted">ESPN 2016–2019 and Sleeper 2020 onward, through the latest archived week. Regular season only; postseason excluded. Former owners remain separate.</p></div></details>';

  hero?.closest('section')?.insertAdjacentElement('afterend',section);
  for(const s of document.querySelectorAll('section.section'))if(s!==section&&(s.textContent||'').includes('Series leader')&&(s.textContent||'').includes('Meetings'))s.remove();
 }
 if(document.body.dataset.rivalryMatrix){
  const root=document.getElementById('verified-rivalry-matrix');
  if(root){const cards=[];for(let i=0;i<M.length;i++)for(let j=i+1;j<M.length;j++){
   const a=M[i],b=M[j],games=get(a,b);
   const w=games.filter(g=>win(g,a)).length,l=games.filter(g=>win(g,b)).length,t=games.length-w-l;
   cards.push('<a class="card c4 manager-card" href="../rivalries/'+a.toLowerCase()+'-vs-'+b.toLowerCase()+'.html"><div class="label">'+(games.length?games.length+' archived regular-season matchups':'No archived regular-season meetings')+'</div><h2>'+E(a)+' vs '+E(b)+'</h2><div class="metric">'+(games.length?w+'–'+l+(t?'–'+t:''):'No results')+'</div><p class="muted">'+(games.length?'Biggest '+E(a)+' win: '+(big(games,a)?fmt(margin(big(games,a))):'—')+' · '+E(b)+': '+(big(games,b)?fmt(margin(big(games,b))):'—'):'View the rivalry page for coverage and source notes.')+'</p></a>');
  }root.innerHTML=cards.join('');const picker=document.getElementById('rivalry-picker');
  if(picker){
   const first=picker.querySelector('#rivalry-first'),second=picker.querySelector('#rivalry-second');
   const go=picker.querySelector('#rivalry-go'),status=picker.querySelector('#rivalry-picker-status');
   for(const choice of [first,second])for(const name of M){
    const option=document.createElement('option');option.value=name;option.textContent=name;choice.append(option);
   }
   first.value='Stilly';second.value='Tom';
   const update=()=>{
    const valid=first.value!==second.value;
    go.disabled=!valid;
    status.textContent=valid?'Choose two managers to open their matchup history.':'Choose two different managers.';
   };
   first.addEventListener('change',update);
   second.addEventListener('change',update);
   go.addEventListener('click',()=>{
    if(first.value===second.value)return;
    const i=M.indexOf(first.value),j=M.indexOf(second.value);
    const names=i<j?[first.value,second.value]:[second.value,first.value];
    location.href='../rivalries/'+names[0].toLowerCase()+'-vs-'+names[1].toLowerCase()+'.html';
   });
   update();
  }
  }
 }
}).catch(()=>{const root=document.getElementById('verified-rivalry-matrix');if(root)root.textContent='Rivalry history is temporarily unavailable. No records can be verified.';const picker=document.getElementById('rivalry-picker');if(picker){const status=picker.querySelector('#rivalry-picker-status');const go=picker.querySelector('#rivalry-go');if(status){status.textContent='Matchup records are unavailable. Please try again later.';status.setAttribute('role','alert')}if(go)go.disabled=true}const hero=document.querySelector('body[data-rivalry-pair] .rival-hero');if(hero){hero.textContent='Verified rivalry history is temporarily unavailable. No archived record can be confirmed.';hero.setAttribute('role','alert')}});
})();
