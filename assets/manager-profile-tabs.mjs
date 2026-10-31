import {managerPersonas} from './manager-personas.mjs';
// Upgrade the older seven-link chapter navigator without discarding existing archive sections.
const profileName=document.querySelector('main .hero h1')?.textContent?.trim();
const persona=managerPersonas[profileName]||managerPersonas[profileName==='Tom'?'Thommy':profileName];
const profileHero=document.querySelector('main .hero');
if(persona&&profileHero&&!profileHero.querySelector('.manager-nickname-origin')){
 const panel=document.createElement('details');
 panel.className='manager-nickname-origin';
 panel.innerHTML='<summary><strong>'+persona.name+'</strong> <span>· Why the nickname?</span></summary><p>'+persona.origin+'</p><p class="muted">Editorial nickname based on archived Fellas history, not an official league award.</p>';
 const heading=profileHero.querySelector('h1');
 heading?.after(panel);
 const style=document.createElement('style');
 style.textContent='.manager-nickname-origin{margin:12px 0 18px;border-left:4px solid #d6b976;padding:9px 14px;background:#122735;border-radius:0 9px 9px 0}.manager-nickname-origin summary{cursor:pointer;font-size:15px;min-height:44px;display:flex;align-items:center;flex-wrap:wrap;gap:8px}.manager-nickname-origin summary span{font-weight:500;font-size:12px;color:#cfdee7}.manager-nickname-origin p{font-size:13px;margin:8px 0}';
 document.head.append(style);
}
const legacyNav=document.querySelector('nav.profile-chapters');
if(legacyNav&&!document.querySelector('[data-manager-profile-tabs]')){
 const manager=document.querySelector('main .hero h1')?.textContent?.trim()||'Manager';
 const nav=document.createElement('nav');
 nav.id='profile-navigation';nav.className='profile-tabs';
 nav.dataset.managerProfileTabs='';nav.setAttribute('aria-label','Manager profile sections');
 nav.innerHTML='<div class="eyebrow">Pick what you want to see</div><div class="profile-tab-row" role="tablist" aria-label="Profile sections">'+
 [['overview','Career'],['seasons','Each Year'],['rivalries','Head-to-Head'],['advanced','Deep Stats']].map(([id,label])=>'<button type="button" role="tab" data-profile-tab="'+id+'" aria-selected="'+(id==='overview')+'">'+label+'</button>').join('')+
 '</div><p class="muted" data-profile-tab-description>Start here: the story, championships and career record.</p>';
 const story=document.querySelector('#franchise-story');
 const lead=story?.querySelector('p.lead');
 if(lead){
  const brief=lead.textContent.trim().split(/(?<=[.!?])\s+/)[0];
  const preview=document.createElement('p');
  preview.className='lead';
  preview.textContent=brief.length<175?brief:brief.slice(0,172)+'…';
  const details=document.createElement('details');
  details.className='story-detail';
  const summary=document.createElement('summary');
  summary.textContent='Read the full story';
  lead.before(preview);
  details.append(summary);
  lead.replaceWith(details);
  details.append(lead);
 }
 legacyNav.replaceWith(nav);
 const hero=document.querySelector('main .hero');
 const actions=hero?.querySelector('.buttons');
 if(actions)actions.innerHTML='<a class="btn" href="#profile-navigation">Explore '+manager+'’s career ↓</a><a class="btn secondary" href="../../index.html#home-manager-title">All manager cards</a>';
 const quick=document.createElement('section');
 quick.className='profile-quickstart';quick.setAttribute('aria-label',manager+' career at a glance');
 quick.innerHTML='<h2>'+manager+' at a glance</h2><p class="muted">Choose what to explore.</p><div class="profile-quick-grid">'+
 [['overview','#verified-history-panel','Championships','Titles and finishes'],['seasons','#season-history','Every Season','Annual results'],['rivalries','#head-to-head','Head-to-Head','Who owns whom?'],['advanced','#franchise-encyclopedia','Trades & Pickups','The deeper research']].map(([tab,target,label,description])=>'<button type="button" data-profile-jump="'+tab+'"><strong>'+label+'</strong><span>'+description+' ↓</span></button>').join('')+'</div>';
 nav.after(quick);
 const css=document.createElement('style');
 css.textContent='.profile-tabs{background:#0d1923f5;border:1px solid var(--line);border-radius:14px;padding:15px 17px;margin:12px 0 24px}.profile-tab-row{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.profile-tab-row button{cursor:pointer;border:1px solid #607483;border-radius:9px;background:#182c3b;color:#d9e3e9;font:inherit;font-size:13px;font-weight:800;padding:11px 16px;min-height:44px}.profile-tab-row button[aria-selected="true"]{background:var(--gold);border-color:var(--gold);color:#10212d}.profile-tab-row button:focus-visible{outline:3px solid white;outline-offset:3px}.section[hidden]{display:none!important}.profile-quick-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:14px 0}.profile-quick-grid button{display:flex;cursor:pointer;text-align:left;color:#fff;font:inherit;flex-direction:column;gap:6px;background:#172b3a;border:1px solid #486174;border-radius:12px;padding:17px;min-height:94px}.profile-quick-grid button[aria-pressed="true"]{border-color:var(--gold);box-shadow:inset 4px 0 0 var(--gold)}.profile-quick-grid span{font-size:13px;color:#d0dce4}@media(max-width:600px){.profile-tab-row{display:grid;grid-template-columns:1fr 1fr}.profile-quick-grid{grid-template-columns:1fr}}';
 document.head.append(css);
}
// Profile navigation v1. Presentation only: the existing canonical data loaders remain the source of truth.
// The old overview tiles and archive teaser repeat destinations available in the tabs.
// Remove only these two identified promotional sections; preserve all data-backed sections.
const duplicateHeadings=new Set(['More from the archive']);
for(const section of document.querySelectorAll('main > section.section:not([id])')){
 const heading=section.querySelector('h2')?.textContent?.trim()||'';
 if(duplicateHeadings.has(heading)||/^Explore .+('s|’s) franchise$/.test(heading))section.remove();
}
const main=document.querySelector('main');
const tabs=document.querySelector('[data-manager-profile-tabs]');
if(main&&tabs){
 const categories={
  overview:new Set(['franchise-story','legacy-resume','verified-history-panel']),
  seasons:new Set(['season-history','weekly-game-log']),
  rivalries:new Set(['rivalry-analytics','head-to-head','rivalry-resume']),
  advanced:new Set(['franchise-legends','franchise-encyclopedia','front-office-archive','full-franchise-dossier'])
 };
 const sections=[...main.children].filter(node=>node.matches?.('section.section'));
 // Ancillary link collections and preserved dossier material live in Advanced, rather than disappearing.
 const sectionTab=new Map(sections.map(node=>[node,Object.entries(categories).find(([,ids])=>ids.has(node.id))?.[0]||'advanced']));
 const buttons=[...tabs.querySelectorAll('button[data-profile-tab]')];
 function activate(key,{focus=false}={}){
  if(!categories[key])key='overview';
  for(const [section,group] of sectionTab)section.hidden=group!==key;
  for(const button of buttons){const selected=button.dataset.profileTab===key;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;}
  const heading=tabs.querySelector('[data-profile-tab-description]');
  const descriptions={overview:'Career story, verified accomplishments, and the all-time résumé.',seasons:'Season results, postseason finishes, and weekly matchup archive.',rivalries:'Head-to-head results and the matchups that define this franchise.',advanced:'Player history, transactions, research coverage, and the preserved detailed dossier.'};
  if(heading)heading.textContent=descriptions[key];
  if(focus)buttons.find(b=>b.dataset.profileTab===key)?.focus();
  history.replaceState(null,'','#'+key);
 }
 // Quick actions switch the panel in place. Never jump visitors down the long archive.
 main.addEventListener('click',event=>{
  const jump=event.target.closest('button[data-profile-jump],a[data-profile-jump]');
  if(!jump)return;
  event.preventDefault();
  const key=jump.dataset.profileJump;
  activate(key);
  for(const item of main.querySelectorAll('[data-profile-jump]'))
   item.setAttribute('aria-pressed',String(item===jump));
 });
 tabs.addEventListener('click',event=>{const button=event.target.closest('button[data-profile-tab]');if(button)activate(button.dataset.profileTab)});
 tabs.addEventListener('keydown',event=>{const index=buttons.indexOf(document.activeElement);if(index<0)return;const direction=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;if(direction){event.preventDefault();activate(buttons[(index+direction+buttons.length)%buttons.length].dataset.profileTab,{focus:true})}});
 // A persistent escape hatch for long historical sections; only appears after scrolling.
 const back=document.createElement('button');
 back.type='button';back.className='profile-back-to-sections';
 back.textContent='↑ Profile sections';
 back.setAttribute('aria-label','Return to manager profile section choices');
 back.hidden=true;
 document.body.append(back);
 back.addEventListener('click',()=>tabs.scrollIntoView({behavior:'smooth',block:'start'}));
 let framePending=false;
 const updateBack=()=>{
  framePending=false;
  const bounds=tabs.getBoundingClientRect();
  back.hidden=bounds.bottom>=0||window.scrollY<400;
 };
 window.addEventListener('scroll',()=>{
  if(!framePending){framePending=true;requestAnimationFrame(updateBack)}
 },{passive:true});
 updateBack();
 const backStyle=document.createElement('style');
 backStyle.textContent='.profile-back-to-sections{position:fixed;bottom:max(18px,env(safe-area-inset-bottom));right:16px;z-index:100;padding:13px 17px;border-radius:999px;border:2px solid #f3d69d;background:#142736;color:#fff;font:inherit;font-weight:850;font-size:13px;box-shadow:0 6px 24px #000b;cursor:pointer}.profile-back-to-sections[hidden]{display:none!important}.profile-back-to-sections:focus-visible{outline:3px solid white;outline-offset:3px}.profile-tabs{scroll-margin-top:16px}@media(prefers-reduced-motion:reduce){html:focus-within{scroll-behavior:auto}}';
 document.head.append(backStyle);
 // Keep the opponent explorer first; detailed rivalry research expands only on request.
 const rivalry=document.querySelector('#rivalry-analytics');
 const rivalryResume=document.querySelector('#rivalry-resume');
 for(const [section,label] of [[rivalry,'Scoring trends and toughest opponents'],[rivalryResume,'Signature matchups and rivalry history']]){
  if(!section||section.dataset.inlineDisclosure)return;
  section.dataset.inlineDisclosure='yes';
  const details=document.createElement('details');
  details.className='profile-inline-disclosure';
  const summary=document.createElement('summary');
  summary.textContent=label;
  const content=document.createElement('div');
  content.className='profile-inline-detail';
  while(section.firstChild)content.append(section.firstChild);
  details.append(summary,content);
  section.append(details);
 }
 // Advanced research opens locally, with a clear heading instead of a giant initial scroll.
 for(const [id,label] of [['franchise-legends','Player history'],['front-office-archive','Trades and roster research'],['full-franchise-dossier','Complete historical dossier']]){
  const section=document.getElementById(id);
  if(!section||section.querySelector(':scope > .profile-deep-disclosure'))continue;
  const details=document.createElement('details');
  details.className='profile-inline-disclosure profile-deep-disclosure';
  const summary=document.createElement('summary');
  summary.textContent=label;
  const content=document.createElement('div');
  content.className='profile-inline-detail';
  while(section.firstChild)content.append(section.firstChild);
  details.append(summary,content);
  section.append(details);
 }
 const inlineCss=document.createElement('style');
 inlineCss.textContent='.profile-inline-disclosure{border:1px solid #537186;border-radius:12px;background:#152b3a;margin:14px 0;overflow:hidden}.profile-inline-disclosure>summary{cursor:pointer;list-style:none;display:flex;align-items:center;min-height:56px;padding:14px 16px;font-size:15px;font-weight:850}.profile-inline-disclosure>summary:after{content:"+";margin-left:auto;font-size:22px}.profile-inline-disclosure[open]>summary:after{content:"−"}.profile-inline-detail{padding:3px 15px 18px;border-top:1px solid #456174}.profile-inline-disclosure>summary:focus-visible{outline:3px solid #fff;outline-offset:-3px}';
 document.head.append(inlineCss);
 // Mobile tabs stay within thumb reach without covering page content.
 const stickyStyle=document.createElement('style');
 stickyStyle.textContent='@media(max-width:650px){.profile-tabs{position:sticky;top:0;z-index:70;margin:8px 0 12px;padding:8px;background:#0d1923f5;box-shadow:0 5px 14px #0007;backdrop-filter:blur(10px)}.profile-tabs>.eyebrow,.profile-tabs>[data-profile-tab-description]{display:none}.profile-tab-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin:0}.profile-tab-row button{padding:9px 3px;min-height:45px;font-size:clamp(10px,2.7vw,12px);white-space:normal}.profile-back-to-sections{display:none!important}}';
 document.head.append(stickyStyle);
 // Browser back/forward restores the selected panel without jumping into a hidden section.
 window.addEventListener('popstate',()=>{
  const key=location.hash.slice(1);
  if(categories[key])activate(key);
 });
 // Restore scroll after a visitor opens another report and returns.
 // Keep it per-tab so each manager section remembers its own reading position.
 const scrollKey='fellas-profile-position:'+location.pathname;
 const savePosition=()=>{
  try{sessionStorage.setItem(scrollKey,JSON.stringify({tab:buttons.find(b=>b.getAttribute('aria-selected')==='true')?.dataset.profileTab||'overview',y:window.scrollY,at:Date.now()}))}catch{}
 };
 window.addEventListener('pagehide',savePosition);
 window.addEventListener('pageshow',event=>{
  if(event.persisted)requestAnimationFrame(updateBack);
 });
 const initial=location.hash.slice(1).toLowerCase();
 const target=document.getElementById(location.hash.slice(1));
 const chosen=categories[initial]?initial:target&&sectionTab.has(target)?sectionTab.get(target):'overview';
 activate(chosen);
 if(!target&&!location.hash){try{const saved=JSON.parse(sessionStorage.getItem(scrollKey)||'null');if(saved&&Date.now()-saved.at<30*60*1000&&categories[saved.tab]){activate(saved.tab);requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top:saved.y,behavior:'instant'})))}}catch{}}
 if(target&&!categories[initial])requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
}
