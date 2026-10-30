// Profile navigation v1. Presentation only: the existing canonical data loaders remain the source of truth.
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
