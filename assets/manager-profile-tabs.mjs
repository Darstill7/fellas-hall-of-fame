// Upgrade the older seven-link chapter navigator without discarding existing archive sections.
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
 [['overview','#verified-history-panel','Championships','Titles and finishes'],['seasons','#season-history','Every Season','Annual results'],['rivalries','#head-to-head','Head-to-Head','Who owns whom?'],['advanced','#franchise-encyclopedia','Trades & Pickups','The deeper research']].map(([tab,target,label,description])=>'<a data-profile-jump="'+tab+'" href="'+target+'"><strong>'+label+'</strong><span>'+description+' →</span></a>').join('')+'</div>';
 nav.after(quick);
 const css=document.createElement('style');
 css.textContent='.profile-tabs{background:#0d1923f5;border:1px solid var(--line);border-radius:14px;padding:15px 17px;margin:12px 0 24px}.profile-tab-row{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.profile-tab-row button{cursor:pointer;border:1px solid #607483;border-radius:9px;background:#182c3b;color:#d9e3e9;font:inherit;font-size:13px;font-weight:800;padding:11px 16px;min-height:44px}.profile-tab-row button[aria-selected="true"]{background:var(--gold);border-color:var(--gold);color:#10212d}.profile-tab-row button:focus-visible{outline:3px solid white;outline-offset:3px}.section[hidden]{display:none!important}.profile-quick-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:14px 0}.profile-quick-grid a{display:flex;flex-direction:column;gap:6px;background:#172b3a;border:1px solid #486174;border-radius:12px;padding:17px;min-height:94px}.profile-quick-grid span{font-size:13px;color:#d0dce4}@media(max-width:600px){.profile-tab-row{display:grid;grid-template-columns:1fr 1fr}.profile-quick-grid{grid-template-columns:1fr}}';
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
 main.addEventListener('click',event=>{
  const jump=event.target.closest('a[data-profile-jump]');
  if(!jump)return;
  const section=document.getElementById(jump.getAttribute('href').slice(1));
  if(!section)return;
  event.preventDefault();
  activate(jump.dataset.profileJump);
  history.replaceState(null,'',jump.getAttribute('href'));
  requestAnimationFrame(()=>section.scrollIntoView({block:'start',behavior:'smooth'}));
 });
 tabs.addEventListener('click',event=>{const button=event.target.closest('button[data-profile-tab]');if(button)activate(button.dataset.profileTab)});
 tabs.addEventListener('keydown',event=>{const index=buttons.indexOf(document.activeElement);if(index<0)return;const direction=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;if(direction){event.preventDefault();activate(buttons[(index+direction+buttons.length)%buttons.length].dataset.profileTab,{focus:true})}});
 const initial=location.hash.slice(1).toLowerCase();
 const target=document.getElementById(location.hash.slice(1));
 const chosen=categories[initial]?initial:target&&sectionTab.has(target)?sectionTab.get(target):'overview';
 activate(chosen);
 if(target&&!categories[initial])requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
}
