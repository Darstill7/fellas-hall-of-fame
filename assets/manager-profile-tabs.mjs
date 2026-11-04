import {mountDraftTradeCareer} from './manager-draft-trade-career-page.mjs';
import {mountManagerSeasonEvidence} from './manager-season-evidence.mjs';
import {managerPersonas} from './manager-personas.mjs';
import {findOwnedRecords,recordCategoryLabels} from './manager-record-ownership.mjs';
// Upgrade the older seven-link chapter navigator without discarding existing archive sections.
const profileName=document.querySelector('main .hero h1')?.textContent?.trim();
const persona=managerPersonas[profileName]||managerPersonas[profileName==='Tom'?'Thommy':profileName];
const profileHero=document.querySelector('main .hero');
// A compact site menu preserves the five primary destinations without
// crowding manager identities on phones. Desktop keeps its visible links.
const desktopSiteNav=document.querySelector('header.nav nav.navlinks');
if(desktopSiteNav&&!document.querySelector('.fellas-mobile-site-menu')){
 const disclosure=document.createElement('details');
 disclosure.className='fellas-mobile-site-menu';
 const summary=document.createElement('summary');
 summary.textContent='Explore site';
 const links=desktopSiteNav.cloneNode(true);
 links.className='fellas-mobile-site-links';
 links.setAttribute('aria-label','Mobile site navigation');
 disclosure.append(summary,links);
 desktopSiteNav.after(disclosure);
 document.body.classList.add('fellas-mobile-ready');
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&disclosure.open){
   event.preventDefault();event.stopImmediatePropagation();
   disclosure.open=false;summary.focus();
  }
 });
}

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
// Give all ten profiles the same first-screen hierarchy without replacing
// canonical stat values or historical source labels.
if(profileHero&&!profileHero.querySelector('[data-profile-career-snapshot]')){
 const eyebrow=profileHero.querySelector(':scope > .eyebrow');
 if(eyebrow)eyebrow.textContent='The Fellas · Manager profile';
 const originalStats=profileHero.querySelector(':scope > .stats');
 if(originalStats){
  const snapshot=document.createElement('section');
  snapshot.className='profile-career-snapshot';
  snapshot.dataset.profileCareerSnapshot='';
  snapshot.setAttribute('aria-label','Career snapshot');
  const heading=document.createElement('h2');
  heading.textContent='Career snapshot';
  heading.className='profile-snapshot-heading';
  snapshot.append(heading);
  // Read adjacent provenance before moving the stat grid out of the hero.
  const source=originalStats.nextElementSibling;
  originalStats.classList.add('profile-snapshot-stats');
  snapshot.append(originalStats);
  for(const stat of originalStats.querySelectorAll(':scope > .stat')){
   const number=stat.querySelector(':scope > strong');
   const label=stat.querySelector(':scope > small');
   if(!number||!label)continue;
   const rawLabel=label.textContent.trim();
   const labelKey=/regular.season|all.time.*W.L/i.test(rawLabel)?'Regular-season record':
    /title season|year he won|championship year/i.test(rawLabel)?'Championship '+(/years|seasons/i.test(rawLabel)?'seasons':'season'):
    /championship/i.test(rawLabel)?'Championships':null;
   if(labelKey){
    label.textContent=labelKey;
    if(rawLabel!==labelKey){
     const explanation=document.createElement('span');
     explanation.className='profile-snapshot-detail';
     explanation.textContent=rawLabel;
     stat.append(explanation);
    }
   }
  }
  if(source?.matches('p.muted')&&/ESPN|Sleeper|verified|records include/i.test(source.textContent||'')){
   source.classList.add('profile-snapshot-source');
   snapshot.append(source);
  }
  const lead=profileHero.querySelector(':scope > .lead');
  (lead||profileHero.querySelector('h1'))?.after(snapshot);
 }
}
// A compact source-backed ownership preview sits beneath the career snapshot.
// Verified categories only; zero does not diminish other accomplishments.
async function mountProfileRecordOwnership(){
 const snapshot=document.querySelector('main .hero .profile-career-snapshot');
 if(!snapshot||!profileName||snapshot.querySelector('[data-profile-owned-records]'))return;
 const normalized=profileName==='Tom'?'Thommy':profileName;
 const link=document.createElement('a');
 link.className='profile-owned-records';
 link.dataset.profileOwnedRecords='';
 link.href='../record-books.html?manager='+encodeURIComponent(normalized)+'#owned-records';
 link.setAttribute('aria-label','View '+profileName+' league records and personal bests');
 const heading=document.createElement('strong');
 heading.textContent='Records you own';
 const result=document.createElement('span');
 result.className='profile-owned-record-count';
 result.textContent='Checking records…';
 const arrow=document.createElement('span');
 arrow.className='profile-owned-record-arrow';
 arrow.setAttribute('aria-hidden','true');
 arrow.textContent='→';
 link.append(heading,result,arrow);
 snapshot.append(link);
 try{
  const responses=await Promise.all([
   fetch('../../data/manager_record_books_2016_2026.json'),
   fetch('../../data/season_guide.json'),
   fetch('../../data/verified_espn_playoff_brackets_2016_2019.json'),
   fetch('../../data/verified_sleeper_playoff_brackets_2020_2025.json')
  ]);
  if(responses.some(r=>!r.ok))throw Error('Record sources unavailable');
  const [archive,guide,espn,sleeper]=await Promise.all(responses.map(r=>r.json()));
  if(archive.asOf!=='2026 Week 8')throw Error('Unexpected record archive scope');
  const owned=findOwnedRecords(archive,guide,normalized,{espn,sleeper});
  result.textContent=owned.length
   ?owned.length+' league '+(owned.length===1?'record':'records')+' held · '+owned.map(x=>x.label).slice(0,2).join(' / ')
   :'No league leads in '+recordCategoryLabels.length+' tracked categories · View personal bests';
 }catch(error){
  result.textContent='View personal bests and archived records';
  console.warn('Profile record ownership preview unavailable',error);
 }
}
mountProfileRecordOwnership();
const recordPreviewCss=document.createElement('style');
recordPreviewCss.textContent='.profile-owned-records{display:flex;align-items:center;gap:10px 15px;flex-wrap:wrap;margin-top:15px;padding:14px 16px;border-radius:11px;border:1px solid #607a86;background:#102b39;color:#f8f1df;text-decoration:none;line-height:1.5;min-height:52px}.profile-owned-records:hover{border-color:#e3bd71;background:#183749}.profile-owned-records:focus-visible{outline:3px solid #f5d594;outline-offset:3px}.profile-owned-records strong{font-size:14px;white-space:nowrap}.profile-owned-record-count{font-size:12px;color:#d0dce3;flex:1 1 200px;overflow-wrap:break-word}.profile-owned-record-arrow{margin-left:auto;color:#e3bd71;font-size:20px;font-weight:800}@media(max-width:650px){.profile-owned-records{gap:4px 9px;padding:12px 14px}.profile-owned-record-count{flex-basis:100%;order:3}.profile-owned-record-arrow{margin-left:auto}}';
document.head.append(recordPreviewCss);

const legacyNav=document.querySelector('nav.profile-chapters');
if(legacyNav&&!document.querySelector('[data-manager-profile-tabs]')){
 const manager=document.querySelector('main .hero h1')?.textContent?.trim()||'Manager';
 const nav=document.createElement('nav');
 nav.id='profile-navigation';nav.className='profile-tabs';
 nav.dataset.managerProfileTabs='';nav.setAttribute('aria-label','Manager profile sections');
 nav.innerHTML='<div class="eyebrow">Explore this manager</div><div class="profile-tab-row" role="tablist" aria-label="Profile sections">'+
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
 if(actions){
  // Start/Sit is a named feature below; no duplicate hero shortcut.
  actions.innerHTML='<a class="btn" href="#profile-features">Browse profile topics ↓</a><a class="btn secondary" href="../">All managers</a>';
 }
 const quick=document.createElement('section');
 quick.className='profile-quickstart';quick.setAttribute('aria-label',manager+' career at a glance');
 quick.innerHTML='<h2>'+manager+' at a glance</h2><p class="muted">Tap a shortcut to jump to the section below.</p><div class="profile-quick-grid">'+
 [['overview','#verified-history-panel','Championships','Titles and finishes'],['seasons','#season-history','Every Season','Annual results'],['rivalries','#head-to-head','Head-to-Head','Who owns whom?'],['advanced','#franchise-encyclopedia','Trades & Pickups','The deeper research']].map(([tab,target,label,description])=>'<button type="button" data-profile-jump="'+tab+'"><strong>'+label+'</strong><span>'+description+' ↓</span></button>').join('')+'</div>';
 nav.after(quick);
 // Keeper research remains a separate preview; it must not be confused with OVR.
 populateManagerResearch(quick,manager);
 quick.after(nav); // The feature list comes before optional legacy section tabs.
}
// Both generated profiles and the hand-curated Stover profile share exactly
// the same evidence cards, source gates and responsive presentation.
// Single feature directory used by every manager profile, including Stover.
function mountProfileFeatureDirectory(quick,manager){
 if(!quick||quick.querySelector('[data-profile-feature-menu]'))return;
 const name=manager==='Tom'?'Thommy':manager;
 const features=[
  {label:'Championships & career record',detail:'Titles, finals, playoff berths and winning history',tab:'overview',target:'#verified-history-panel',icon:'🏆'},
  {label:'Season-by-season results',detail:'Every year, standings and postseason outcomes',tab:'seasons',target:'#season-history',icon:'📅'},
  {label:'Head-to-head & rivalries',detail:'Records against each Fella and memorable matchups',tab:'rivalries',target:'#head-to-head',icon:'⚔️'},
  {label:'Legacy OVR progression',detail:'Year-end ratings, career peak and championship milestones',target:'.profile-madden-history:not(.profile-season-ovr)',icon:'📈'},
  {label:'Season OVR ratings',detail:'The best and worst completed individual seasons',target:'.profile-season-ovr',icon:'⭐'},
  {label:'Drafting & trading résumé',detail:'Documented picks and trades — no invented decision grades',target:'.profile-career-resume',icon:'🔄'},
  {label:'Roster decisions by season',detail:'Draft picks, trades, pickups and keepers, year by year',target:'.profile-season-evidence',icon:'📋'},
  {label:'Pickup & keeper totals',detail:'Which acquisitions started and how many points keepers scored',target:'.profile-front-office-snapshot',icon:'📊'},
  {label:'Pickup highlights',detail:'Up to three recorded additions, starts and points; costs when available',href:'../../analytics/manager-report-cards.html?manager='+encodeURIComponent(name)+'#cards',icon:'💰'},
  {label:'Start/Sit accuracy',detail:'Weekly lineup efficiency and coverage',href:'../../analytics/manager-lineup-research.html?season=career&manager='+encodeURIComponent(name),icon:'🎯'},
  {label:'Keeper research',detail:'2025 and in-progress 2026 keeper evidence',href:'../../analytics/keeper-decision-research.html?year=2026&manager='+encodeURIComponent(name),icon:'🔒'},
  {label:'Manager report card',detail:'Category ratings, verified achievements and evidence limitations',href:'../../analytics/manager-report-cards.html?manager='+encodeURIComponent(name)+'#cards',icon:'📋'},
  {label:'Records you own',detail:'League records, personal bests and season-by-season history',href:'../record-books.html?manager='+encodeURIComponent(manager)+'#owned-records',icon:'📖'}
 ];
 const shell=document.createElement('section');
 shell.className='profile-feature-directory';
 shell.id='profile-features';
 shell.setAttribute('aria-label','Manager features');
 shell.dataset.profileFeatureMenu='';
 shell.innerHTML='<h2>Explore '+name+'\'s profile</h2><p class="muted">Five topics. Open a category, then choose a feature to explore the records and what they mean.</p>';
 const groups=[
  {title:'Career & Results',help:'Championships, records and every season',items:[0,1,12]},
  {title:'Ratings & Report Card',help:'Legacy OVR, individual seasons and how ratings work',items:[3,4,11]},
  {title:'Drafts, Trades & Pickups',help:'Documented player and roster decisions',items:[5,6,7,8]},
  {title:'Rivals & Matchups',help:'Head-to-head records and memorable games',items:[2]},
  {title:'Lineups & Keepers',help:'Start/Sit accuracy and keeper research',items:[9,10]}
 ];
 const groupHosts=new Map();
 const menu=document.createElement('div');menu.className='profile-feature-groups';
 for(const group of groups){
  const disclosure=document.createElement('details');disclosure.className='profile-feature-group';
  if(group.title==='Career & Results')disclosure.open=true;
  const heading=document.createElement('summary');
  const title=document.createElement('strong');title.textContent=group.title;
  const detail=document.createElement('span');detail.textContent=group.help;
  heading.append(title,detail);
  const list=document.createElement('div');list.className='profile-feature-list';
  disclosure.append(heading,list);menu.append(disclosure);
  for(const index of group.items)groupHosts.set(index,list);
 }
 for(const [index,feature] of features.entries()){
  const item=document.createElement(feature.href?'a':'button');
  if(item.tagName==='BUTTON'){item.type='button';item.dataset.profileFeature='';item.dataset.featureTarget=feature.target;if(feature.tab)item.dataset.featureTab=feature.tab;}
  else item.href=feature.href;
  item.className='profile-feature-button';
  const symbol=document.createElement('span');symbol.className='profile-feature-icon';symbol.setAttribute('aria-hidden','true');symbol.textContent=feature.icon;
  const body=document.createElement('span');body.className='profile-feature-copy';
  const title=document.createElement('strong');title.textContent=feature.label;
  const description=document.createElement('small');description.textContent=feature.detail;
  body.append(title,description);
  const arrow=document.createElement('span');arrow.className='profile-feature-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='→';
  item.append(symbol,body,arrow);groupHosts.get(index).append(item);
 }
 shell.append(menu);
 const ratingGuide=document.createElement('details');
 ratingGuide.className='profile-rating-guide';
 const ratingSummary=document.createElement('summary');
 ratingSummary.textContent='What do the ratings mean?';
 const ratingContent=document.createElement('div');
 ratingContent.className='profile-rating-guide-content';
 for(const [term,definition] of [
  ['Legacy OVR','A career-level rating based on historical performance and accomplishments. It is not a player rating or a prediction.'],
  ['Season OVR','A rating for a specific season; it may differ from the career-level Legacy OVR.'],
  ['Report Card','Category-by-category evaluation with supporting evidence and stated data limitations.']
 ]){
  const paragraph=document.createElement('p');
  const termLabel=document.createElement('strong');
  termLabel.textContent=term+': ';
  paragraph.append(termLabel,document.createTextNode(definition));
  ratingContent.append(paragraph);
 }
 ratingGuide.append(ratingSummary,ratingContent);
 shell.append(ratingGuide);
 quick.prepend(shell);
 // Retire the redundant four-item quick grid; these destinations now have
 // individually labeled buttons instead of nested and competing menus.
 quick.querySelector('.profile-quick-grid')?.remove();
 quick.querySelector(':scope > h2')?.remove();
 quick.querySelector(':scope > p.muted')?.remove();
 const css=document.createElement('style');
 css.textContent='.profile-feature-directory{margin:0 0 18px}.profile-feature-directory h2{margin:0 0 4px;font-size:clamp(22px,3vw,29px)}.profile-feature-directory>.muted{margin:4px 0 15px;font-size:13px}.profile-feature-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.profile-feature-button{display:flex;align-items:center;gap:12px;min-width:0;min-height:74px;text-align:left;background:#142d3d;color:#f7f2e8;border:1px solid #557587;border-radius:11px;padding:12px 14px;font:inherit;text-decoration:none;cursor:pointer}.profile-feature-button:hover{background:#1d4053;border-color:#e3bd71;color:#fff}.profile-feature-button:focus-visible{outline:3px solid #ffe3a0;outline-offset:2px}.profile-feature-icon{font-size:23px;flex:none}.profile-feature-copy{display:flex;flex-direction:column;gap:3px;min-width:0}.profile-feature-copy strong{font-size:14px;line-height:1.3;color:#fff}.profile-feature-copy small{font-size:12px;line-height:1.4;color:#c7d7e2}.profile-feature-arrow{margin-left:auto;color:#e3bd71;font-weight:900;font-size:20px;flex:none}@media(max-width:650px){.profile-feature-list{grid-template-columns:1fr}.profile-feature-button{min-height:69px;padding:12px}}';
 css.textContent+='.profile-feature-groups{display:grid;gap:9px}.profile-feature-group{margin:0;border:1px solid #557587;border-radius:12px;background:#112b3b;padding:0;overflow:hidden}.profile-feature-group>summary{min-height:66px;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 17px;list-style:none;cursor:pointer}.profile-feature-group>summary::-webkit-details-marker{display:none}.profile-feature-group>summary strong{font-size:15px}.profile-feature-group>summary span{font-size:12px;color:#c7d7e2}.profile-feature-group>summary:after{content:"+";font-size:23px;font-weight:700;color:#e3bd71}.profile-feature-group[open]>summary:after{content:"−"}.profile-feature-group>.profile-feature-list{padding:0 10px 10px}.profile-feature-group[open]{border-color:#b08f55}@media(max-width:650px){.profile-feature-group>summary{align-items:flex-start;flex-direction:column;gap:2px;padding:13px 14px;position:relative}.profile-feature-group>summary:after{position:absolute;right:14px;top:12px}.profile-feature-group>summary span{padding-right:15px}}';
 css.textContent+=`
 .profile-feature-directory{max-width:960px;margin:0 auto 24px}
 .profile-feature-directory h2{font-size:clamp(23px,3vw,32px);font-weight:850;letter-spacing:-.045em}
 .profile-feature-directory>.muted{margin-bottom:18px;color:#bacbd5}
 .profile-feature-groups{gap:11px}
 .profile-feature-group{background:linear-gradient(145deg,#183142,#102330);border:1px solid #3d5969;border-radius:14px;box-shadow:0 6px 17px #0002;transition:border-color .15s,background .15s}
 .profile-feature-group>summary{min-height:66px;padding:13px 18px;position:relative;padding-right:54px}
 .profile-feature-group>summary strong{display:block;font-size:16px;letter-spacing:-.02em;color:#f8f6ee}
 .profile-feature-group>summary span{display:block;font-size:12px;color:#b9cbd5;line-height:1.45}
 .profile-feature-group>summary:after{position:absolute;right:22px;top:50%;transform:translateY(-50%);font-size:22px}
 .profile-feature-group[open]{border-color:#d6b976;background:#132c3b}
 .profile-feature-group>summary:hover{background:#ffffff08}
 .profile-feature-group>summary:focus-visible{outline:3px solid #f5d594;outline-offset:-3px}
 .profile-feature-group>.profile-feature-list{padding:0 12px 12px;gap:8px}
 .profile-feature-button{min-height:58px;background:#0d2331;border-color:#314e60;border-radius:9px;padding:10px 12px}
 .profile-feature-copy strong{font-size:13px}.profile-feature-copy small{font-size:11px}
 .profile-feature-icon{font-size:20px}
 .profile-quickstart{max-width:930px;margin-left:auto;margin-right:auto}
 body.profile-landing .profile-quickstart{padding-bottom:18px}
 body.profile-feature-focused .profile-feature-group:not([open]){display:block}
 body.profile-feature-focused .profile-feature-group[open]>summary{min-height:60px}
 body.profile-feature-focused .profile-feature-button[aria-pressed]:not([aria-pressed="true"]){display:flex}
 body.profile-feature-focused .profile-feature-directory>.muted{display:block}
 .profile-focus-toolbar{background:#102a39}
 .profile-feature-group>summary{min-height:68px}
 .profile-feature-group[open]>summary strong{color:#f7d79b}
 body.profile-feature-focused .profile-feature-group{opacity:1}
 @media(max-width:650px){
  .profile-feature-group>summary{padding:14px 48px 14px 15px;min-height:72px}
  .profile-feature-group>summary strong{font-size:16px}
  .profile-feature-group>summary:after{right:17px}
  .profile-feature-group>.profile-feature-list{padding:0 9px 10px}
  .profile-feature-button{min-height:57px;padding:10px}
  .profile-feature-copy strong{font-size:12px}
  body.profile-feature-focused .profile-feature-list{grid-template-columns:1fr}
 }
 @media(prefers-reduced-motion:reduce){.profile-feature-group{transition:none}}
 `;
 menu.addEventListener('toggle',event=>{
  const opened=event.target;
  if(!opened.matches?.('details.profile-feature-group')||!opened.open)return;
  for(const other of menu.querySelectorAll('details.profile-feature-group'))if(other!==opened)other.open=false;
 },true);
 css.textContent+=' .profile-rating-guide{margin:15px 0 0;padding:0;background:#112b3b;border:1px solid #456377;border-radius:12px}.profile-rating-guide>summary{padding:13px 16px;min-height:48px;line-height:1.5;color:#f0d398;font-weight:800;cursor:pointer}.profile-rating-guide>summary:focus-visible{outline:3px solid #f0d398;outline-offset:2px}.profile-rating-guide-content{padding:0 16px 14px}.profile-rating-guide-content p{line-height:1.65;font-size:13px;margin:9px 0;color:#d3e1e9}.profile-rating-guide-content strong{color:#fff}';
 document.head.append(css);
}
function populateManagerResearch(quick,manager){
 if(!quick||quick.querySelector('.profile-front-office-snapshot'))return;
 mountProfileFeatureDirectory(quick,manager);
 // Source-heavy material sits behind one disclosure. Feature buttons can
 // reveal the exact module without forcing every visitor through a long wall.
 const shelf=document.createElement('details');
 shelf.className='profile-research-shelf';
 shelf.dataset.profileResearchShelf='';
 const shelfTitle=document.createElement('summary');
 shelfTitle.textContent='Supporting research (optional)';
 const shelfIntro=document.createElement('p');
 shelfIntro.className='muted profile-research-shelf-intro';
 shelfIntro.textContent='Additional supporting records are saved here. For a quick answer, use the topic buttons above.';
 const shelfBody=document.createElement('div');
 shelfBody.className='profile-research-shelf-body';
 shelf.append(shelfTitle,shelfIntro,shelfBody);
 quick.append(shelf);
 const keeperManager=manager==='Tom'?'Thommy':manager;
 const keeperLink=document.createElement('p');
 keeperLink.className='muted';
 keeperLink.style.fontSize='13px';
 keeperLink.innerHTML='Keeper research: <a href="../../analytics/keeper-decision-research.html?manager='+encodeURIComponent(keeperManager)+'">2025</a> · <a href="../../analytics/keeper-decision-research.html?year=2026&manager='+encodeURIComponent(keeperManager)+'">2026 to date</a> <span>· Research only, not an official Keeper Decision grade</span>';
 shelfBody.append(keeperLink);
 // A simple manager-specific pickup view reuses the tested report-card page.
 // It avoids copying receipt/scoring logic into ten separate profile pages.
 const pickupLink=document.createElement('p');
 pickupLink.className='muted manager-pickup-link';
 pickupLink.style.fontSize='13px';
 pickupLink.innerHTML='<a href="../../analytics/manager-report-cards.html?manager='+
  encodeURIComponent(keeperManager)+'#cards"><strong>Explore pickup highlights</strong><span>Up to three examples · starts, points and cost status</span></a>';
 shelfBody.append(pickupLink);
 // Profile-first front-office evidence: share source files with the full
 // research pages instead of creating a disconnected manager scorecard.
 const snapshot=document.createElement('section');
 snapshot.className='profile-front-office-snapshot';
 snapshot.setAttribute('aria-label',keeperManager+' pickup and keeper totals');
 snapshot.innerHTML='<h3>Pickup & Keeper Totals</h3><p class="muted">How often recorded pickups made the starting lineup, plus points scored by retained keepers in 2026. These totals do not grade decision-making.</p><p class="muted" role="status">Loading verified research…</p>';
 shelfBody.append(snapshot);
 void mountDraftTradeCareer(shelfBody,keeperManager);
 void mountManagerSeasonEvidence(shelfBody,keeperManager);
 void Promise.all([
  fetch('../../data/manager_acquisition_distinct_v1.json').then(res=>{if(!res.ok)throw Error('Pickup source unavailable');return res.json()}),
  fetch('../../data/keeper_2026_website_research_v1.json').then(res=>{if(!res.ok)throw Error('Keeper source unavailable');return res.json()})
 ]).then(([pickups,keepers])=>{
  if(pickups.status!=='observational_only_not_skill_grade'||!Array.isArray(pickups.byManager)||
     keepers.season!==2026||!Number.isInteger(keepers.throughWeek)||keepers.throughWeek<8||
     !Array.isArray(keepers.rows))throw Error('Research coverage has changed');
  if(keepers.throughWeek>=9&&Date.now()<Date.parse('2026-11-10T06:00:00Z'))
   throw Error('Incomplete Week 9 keeper coverage');
  const a=pickups.byManager.find(x=>x.manager===keeperManager);
  const k=keepers.rows.find(x=>x.manager===keeperManager);
  if(!a||!k||!Number.isInteger(a.distinctSeasonPlayerAcquisitions)||
     !Number.isInteger(a.withRecordedLaterStart)||a.withRecordedLaterStart<0||
     a.withRecordedLaterStart>a.distinctSeasonPlayerAcquisitions||
     !Number.isInteger(k.verifiedOriginalManagerStarts)||!Number.isFinite(k.regularStartedPoints)||
     k.officialKeeperDecisionGrade!==null)throw Error('Manager research row is invalid');
  snapshot.replaceChildren();
  const title=document.createElement('h3');
  title.textContent='Pickup & Keeper Totals';snapshot.append(title);
  const grid=document.createElement('div');
  grid.className='profile-front-office-grid';
  const tile=(value,label)=>{
   const item=document.createElement('div');item.className='profile-front-office-tile';
   const strong=document.createElement('strong');strong.textContent=value;
   const small=document.createElement('span');small.textContent=label;
   item.append(strong,small);return item;
  };
  grid.append(
   tile(a.withRecordedLaterStart+' / '+a.distinctSeasonPlayerAcquisitions,'Pickups used in a starting lineup · 2020–26'),
   tile(String(k.verifiedOriginalManagerStarts),'Times an original keeper started · 2026 Weeks 1–'+keepers.throughWeek),
   tile(k.regularStartedPoints.toFixed(1),'Points from those keeper starts · 2026')
  );
  snapshot.append(grid);
  const explainer=document.createElement('details');
  explainer.className='profile-stat-explainer';
  explainer.innerHTML='<summary>What do these numbers mean?</summary><p><strong>Pickups started:</strong> recorded acquired players who appeared in a later starting lineup, out of recorded unique season-player acquisitions. A free pickup counts too.</p><p><strong>Keeper starts:</strong> games in which a retained keeper was actually started by the original manager.</p><p><strong>Keeper points:</strong> fantasy points earned in those starts, not all points scored while rostered.</p><p>These are usage totals, not an overall manager rating or a measure of how good the decisions were.</p>';
  snapshot.append(explainer);
  const caution=document.createElement('p');
  caution.className='muted profile-front-office-caveat';
  caution.textContent='2026 is incomplete. Usage is not pickup value; keeper production is not a decision grade. Starts count only for the original keeper manager.';
  snapshot.append(caution);
  const actions=document.createElement('p');actions.className='profile-front-office-actions';
  const link=(title,url)=>{const a=document.createElement('a');a.href=url;a.textContent=title;return a};
  actions.append(
   link('Pickup evidence','../../analytics/manager-report-cards.html?manager='+encodeURIComponent(keeperManager)+'#cards'),
   link('Start/Sit accuracy','../../analytics/manager-lineup-research.html?season=2026&manager='+encodeURIComponent(keeperManager)),
   link('Keeper research','../../analytics/keeper-decision-research.html?year=2026&manager='+encodeURIComponent(keeperManager))
  );
  snapshot.append(actions);
 }).catch(()=>{
  snapshot.innerHTML='<h3>Pickup & Keeper Totals</h3><p class="muted" role="status">Source evidence is temporarily unavailable. No substitute figures are shown.</p>';
 });
 const css=document.createElement('style');
 css.textContent+='.profile-research-shelf{margin:18px 0 0;background:#0b2331;border:1px solid #557587;border-radius:12px;padding:0}.profile-research-shelf>summary{min-height:50px;padding:14px 17px;color:var(--gold);font-size:15px;font-weight:850;cursor:pointer}.profile-research-shelf>summary:focus-visible{outline:3px solid white;outline-offset:-3px}.profile-research-shelf-intro{font-size:12px;line-height:1.55;margin:0;padding:0 17px 12px}.profile-research-shelf-body{padding:0 16px 15px}.profile-research-shelf-body .profile-front-office-snapshot{margin:14px 0}.profile-research-shelf-body>.muted{margin:10px 0}@media(max-width:650px){.profile-research-shelf-body{padding:0 10px 12px}}';
 css.textContent+='.profile-tabs{background:#0d1923f5;border:1px solid var(--line);border-radius:14px;padding:15px 17px;margin:12px 0 24px}.profile-tab-row{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.profile-tab-row button{cursor:pointer;border:1px solid #607483;border-radius:9px;background:#182c3b;color:#d9e3e9;font:inherit;font-size:13px;font-weight:800;padding:11px 16px;min-height:44px}.profile-tab-row button[aria-selected="true"]{background:var(--gold);border-color:var(--gold);color:#10212d}.profile-tab-row button:focus-visible{outline:3px solid white;outline-offset:3px}.section[hidden]{display:none!important}.profile-quick-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:14px 0}.profile-quick-grid button{display:flex;cursor:pointer;text-align:left;color:#fff;font:inherit;flex-direction:column;gap:6px;background:#172b3a;border:1px solid #486174;border-radius:12px;padding:17px;min-height:94px}.profile-quick-grid button[aria-pressed="true"]{border-color:var(--gold);box-shadow:inset 4px 0 0 var(--gold)}.profile-quick-grid span{font-size:13px;color:#d0dce4}@media(max-width:600px){.profile-tab-row{display:grid;grid-template-columns:1fr 1fr}.profile-quick-grid{grid-template-columns:1fr}}';
 css.textContent+='.manager-pickup-link a{display:flex;flex-direction:column;gap:5px;max-width:550px;background:#183744;border:1px solid #7b998e;border-radius:12px;padding:14px 16px;color:#f5f2e8;text-decoration:none;min-height:62px}.manager-pickup-link a strong{color:var(--gold);font-size:15px}.manager-pickup-link a span{font-size:12px;line-height:1.5;color:#d0dce4}.manager-pickup-link a:focus-visible{outline:3px solid #fff;outline-offset:2px}.manager-pickup-link a:hover{border-color:var(--gold)}';
 css.textContent+='.profile-front-office-snapshot{margin:20px 0 8px;padding:17px;border:1px solid #577483;border-radius:13px;background:#102936}.profile-front-office-snapshot h3{margin:0 0 9px;color:var(--gold);font-size:18px}.profile-front-office-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.profile-front-office-tile{padding:14px;background:#182f3e;border:1px solid #466173;border-radius:10px}.profile-front-office-tile strong{display:block;font-size:24px;font-variant-numeric:tabular-nums;color:#f7eed9}.profile-front-office-tile span{display:block;font-size:12px;line-height:1.4;color:#c5d3dc}.profile-front-office-caveat{font-size:12px;line-height:1.5;margin:11px 0}.profile-front-office-actions{display:flex;gap:12px;flex-wrap:wrap;font-size:13px;font-weight:800;margin:12px 0 0}.profile-front-office-actions a{color:var(--gold);text-decoration:underline;text-underline-offset:3px}.profile-front-office-actions a:focus-visible{outline:3px solid white;outline-offset:2px}@media(max-width:650px){.profile-front-office-grid{grid-template-columns:1fr}.profile-front-office-tile{padding:12px}.profile-front-office-tile strong{font-size:22px}}';
 css.textContent+='.profile-season-draft-trade{margin:9px 0;color:#d5e4ed;font-size:12px;line-height:1.55}.profile-season-draft-trade p{margin:4px 0}.profile-season-draft-trade .muted{font-size:11px}';
 css.textContent+='.profile-season-trade-link{display:inline-block;margin-top:10px;color:var(--gold);font-size:12px;font-weight:800;text-decoration:underline;text-underline-offset:3px}.profile-season-trade-link:focus-visible{outline:3px solid #fff;outline-offset:2px}';
 css.textContent+='.profile-season-evidence{margin:19px 0;border:1px solid #607d8b;border-radius:12px;background:#102734;padding:0;overflow:hidden}.profile-season-evidence>summary{padding:15px 17px;min-height:48px;color:var(--gold);font-weight:850;cursor:pointer}.profile-season-evidence>summary:focus-visible{outline:3px solid #fff;outline-offset:-3px}.profile-season-evidence-intro,.profile-season-evidence-caveat{padding:0 16px;font-size:12px;line-height:1.5}.profile-season-evidence-list{display:grid;gap:8px;padding:9px 15px 15px}.profile-season-evidence-row{background:#1a3443;border:1px solid #466274;border-radius:10px;padding:12px 14px}.profile-season-evidence-header{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.profile-season-evidence-header strong{font-size:17px;color:#fff}.profile-season-evidence-header span{font-size:12px;color:#ebd09b;font-weight:800}.profile-season-evidence-facts{display:flex;flex-wrap:wrap;gap:5px 13px;margin:8px 0 0;font-size:12px;color:#d9e4eb}.profile-season-evidence-facts span{display:inline-block}.profile-season-evidence-facts span+span:before{content:"·";margin-right:13px;color:#8bb1c1}.profile-season-evidence-flag{color:#ffe0a8}@media(max-width:650px){.profile-season-evidence-header{align-items:flex-start;flex-direction:column;gap:3px}.profile-season-evidence-facts{flex-direction:column;gap:6px}.profile-season-evidence-facts span+span:before{content:none}}';
 css.textContent+='.profile-career-resume{margin:16px 0;border:1px solid #768593;border-radius:13px;padding:0;background:#132d3b;overflow:hidden}.profile-career-resume>summary{padding:16px 17px;color:var(--gold);font-size:17px;font-weight:850;min-height:52px;cursor:pointer}.profile-career-resume>summary:focus-visible{outline:3px solid white;outline-offset:-3px}.career-resume-intro,.career-resume-coverage,.career-resume-caveat{padding:0 15px;font-size:12px;line-height:1.5}.career-resume-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:8px 15px}.career-resume-metric{padding:12px 9px;background:#1b3847;border:1px solid #486879;border-radius:10px;min-width:0}.career-resume-metric strong{font-size:22px;display:block;color:#fff;font-variant-numeric:tabular-nums}.career-resume-metric span{font-size:11px;line-height:1.35;color:#c5d6df;display:block}.career-resume-section{padding:10px 16px 0}.career-resume-section h4{font-size:14px;color:var(--gold);margin:6px 0 12px}.career-resume-example{font-size:13px;color:#e0e9ee;margin:8px 0}.career-resume-trade{padding:12px;background:#1c3847;border:1px solid #426477;border-radius:9px;margin:8px 0}.career-resume-trade strong{font-size:12px}.career-resume-trade p{font-size:12px;margin:5px 0}.career-resume-link{font-size:12px;color:var(--gold);font-weight:850;text-decoration:underline;text-underline-offset:3px}.career-resume-link:focus-visible{outline:3px solid white;outline-offset:2px}@media(max-width:650px){.career-resume-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.career-resume-metric strong{font-size:20px}}';
 css.textContent+='.profile-stat-explainer{margin:12px 0;padding:0;border:1px solid #476879;border-radius:10px;background:#102b3a}.profile-stat-explainer>summary{min-height:44px;padding:12px 14px;font-weight:800;color:#f0cf88;cursor:pointer}.profile-stat-explainer>p{padding:0 14px;margin:9px 0 12px;font-size:13px;line-height:1.55;color:#d5e1e9}.profile-stat-explainer strong{color:#fff}';
 css.textContent+='.profile-tabs{padding:8px 12px!important;margin:8px 0 14px!important;background:#0e2230f2!important}.profile-section-switcher>summary{min-height:44px;display:flex;align-items:center;padding:6px 8px;color:var(--gold);font-weight:850;font-size:13px;cursor:pointer}.profile-section-switcher>summary:focus-visible{outline:3px solid white;outline-offset:2px}.profile-section-switcher[open]{max-height:48vh;overflow-y:auto}.profile-section-switcher:not([open]) .profile-tab-row,.profile-section-switcher:not([open]) [data-profile-tab-description]{display:none!important}.profile-tab-guide[hidden]{display:none!important}.profile-location-label{padding:3px 7px!important}.profile-feature-directory{scroll-margin-top:95px}';
 document.head.append(css);
}
const existingProfile=document.querySelector('nav[data-manager-profile-tabs]');
if(existingProfile&&!legacyNav){
 // Prebuilt profile shells should share the same two clear entry actions.
 const existingHeroActions=document.querySelector('main .hero .buttons');
 if(existingHeroActions)existingHeroActions.innerHTML='<a class="btn" href="#profile-features">Browse profile topics ↓</a><a class="btn secondary" href="../">All managers</a>';
 const quick=document.querySelector('.profile-quickstart');
 const manager=document.querySelector('main .hero h1')?.textContent?.trim()||'';
 populateManagerResearch(quick,manager);
 if(quick)quick.after(existingProfile);
}
// Profile navigation v1. Presentation only: the existing canonical data loaders remain the source of truth.
// The old overview tiles and archive teaser repeat destinations available in the tabs.
// Remove only these two identified promotional sections; preserve all data-backed sections.
// Preserve the old encyclopedia URL for archival links, but one profile is the
// public entrypoint: remove its competing cross-profile teaser.
document.getElementById('full-franchise-dossier')?.remove();
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
 // Profiles open as a short landing page. Historical chapters remain in the
 // DOM and become visible when a visitor chooses a feature or archive tab.
 const focusStyle=document.createElement('style');
 focusStyle.textContent=`
 body.profile-landing main>section.section{display:none!important}
 body.profile-feature-focused main>section.section:not(.profile-selected-section){display:none!important}
 body.profile-feature-focused main>.profile-madden:not(.profile-selected-madden){display:none!important}
 body.profile-feature-focused .profile-research-shelf-body>.profile-focus-excluded{display:none!important}
 .profile-focus-toolbar{display:none;align-items:center;flex-wrap:wrap;gap:12px;margin:12px 0 16px;padding:12px 14px;background:#102736;border:1px solid #678595;border-radius:11px}
 body.profile-feature-focused .profile-focus-toolbar{display:flex}
 .profile-focus-toolbar strong{font-size:14px;flex:1;min-width:180px}
 .profile-focus-toolbar button{min-height:44px;cursor:pointer;background:#e3bd71;color:#10202b;border:0;border-radius:8px;padding:10px 14px;font:inherit;font-size:13px;font-weight:850}
 body.profile-feature-focused .profile-feature-button[aria-pressed="true"]{border-color:#e3bd71;background:#25475b;box-shadow:inset 4px 0 #e3bd71}
 body.profile-feature-focused .profile-feature-copy small{display:block}
 body.profile-feature-focused .profile-feature-button{min-height:58px;padding:10px 12px}
 body.profile-feature-focused .profile-feature-icon{font-size:18px}
 body.profile-feature-focused .profile-feature-list{gap:6px}
 @media(max-width:650px){body.profile-feature-focused .profile-feature-list{grid-template-columns:minmax(0,1fr);gap:9px}body.profile-feature-focused .profile-feature-copy strong{font-size:13px;line-height:1.4}body.profile-feature-focused .profile-feature-copy small{font-size:12px;line-height:1.5}body.profile-feature-focused .profile-feature-button{min-height:68px;padding:12px}body.profile-feature-focused .profile-feature-arrow{display:none}}
 `;
 document.head.append(focusStyle);
 const featureDirectory=document.getElementById('profile-features');
 const featureToolbar=document.createElement('div');
 featureToolbar.className='profile-focus-toolbar';
 featureToolbar.setAttribute('role','status');
 const focusName=document.createElement('strong');
 const focusBack=document.createElement('button');
 focusBack.type='button';focusBack.textContent='← Back to all features';
 featureToolbar.append(focusName,focusBack);
 featureDirectory?.querySelector('.profile-feature-groups')?.before(featureToolbar);
 function clearFeatureFocus(){
  document.body.classList.remove('profile-feature-focused');
  for(const section of sections)section.classList.remove('profile-selected-section');
  document.querySelector('.profile-madden')?.classList.remove('profile-selected-madden');
  for(const el of main.querySelectorAll('.profile-focus-excluded'))el.classList.remove('profile-focus-excluded');
  for(const button of main.querySelectorAll('button[data-profile-feature]'))button.setAttribute('aria-pressed','false');
 }
 function returnToFeatureDirectory(){
  clearFeatureFocus();
  document.body.classList.add('profile-landing');
  // Remove the legacy archive hash so a refresh keeps the short profile landing.
  history.replaceState(null,'',location.pathname+location.search);
  // Keep the last open topic, avoiding a toggle race when switching features.
  featureDirectory?.scrollIntoView({block:'start',behavior:'instant'});
 }
 focusBack.addEventListener('click',returnToFeatureDirectory);
 // Escape provides a predictable exit from a focused evidence view.
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&document.body.classList.contains('profile-feature-focused')&&
     !event.altKey&&!event.ctrlKey&&!event.metaKey){
   event.preventDefault();
   returnToFeatureDirectory();
   focusBack.blur();
   featureDirectory?.querySelector('details.profile-feature-group[open] > summary')?.focus();
  }
 });
 function focusFeature(button,destination){
  clearFeatureFocus();
  document.body.classList.remove('profile-landing');
  document.body.classList.add('profile-feature-focused');
  button.setAttribute('aria-pressed','true');
  const section=sections.find(item=>item===destination||item.contains(destination));
  // A feature may live in a different legacy category from the active one.
  // Reveal its parent category before focusing the individual feature.
  if(section){
   const category=sectionTab.get(section);
   if(category)activate(category);
   section.hidden=false;
   section.classList.add('profile-selected-section');
  }
  if(document.querySelector('.profile-madden')?.contains(destination))
   document.querySelector('.profile-madden').classList.add('profile-selected-madden');
  const shelfBody=destination.closest('.profile-research-shelf-body');
  if(shelfBody){
   const selected=[...shelfBody.children].find(item=>item===destination||item.contains(destination));
   for(const child of shelfBody.children)if(child!==selected)child.classList.add('profile-focus-excluded');
  }
  focusName.textContent=button.querySelector('strong')?.textContent||'Selected feature';
 }
 // Keep the four historical section controllers for old deep links, but
 // make the eleven feature buttons the only primary navigation.
 // The section controller is an optional disclosure rather than a competing menu.
 const switcher=document.createElement('details');
 switcher.className='profile-section-switcher';
 const switchSummary=document.createElement('summary');
 switchSummary.textContent='More archive sections';
 switcher.append(switchSummary);
 for(const child of [...tabs.children])switcher.append(child);
 tabs.append(switcher);
 const heroExplore=document.querySelector('main .hero .buttons a[href="#profile-navigation"]');
 if(heroExplore){heroExplore.href='#profile-features';heroExplore.textContent='Explore features ↓'}
 const buttons=[...tabs.querySelectorAll('button[data-profile-tab]')];
 const headingLabel=tabs.querySelector('.eyebrow');
 if(headingLabel)headingLabel.textContent='Explore this manager';
 // Give tabs an immediate, visible destination. The old implementation
 // changed hidden sections below a large always-visible evidence block,
 // which made the controls look inert to visitors.
 const firstSection={overview:'franchise-story',seasons:'season-history',
  rivalries:'head-to-head',advanced:'franchise-encyclopedia'};
 const guide=document.createElement('p');
 guide.className='profile-tab-guide';
 guide.setAttribute('role','status');
 guide.setAttribute('aria-live','polite');
 guide.hidden=true;
 tabs.after(guide);
 switcher.addEventListener('toggle',()=>{guide.hidden=!switcher.open});
 const revealSection=key=>{
  const destination=document.getElementById(firstSection[key]);
  if(!destination||destination.hidden)return;
  requestAnimationFrame(()=>destination.scrollIntoView({block:'start',behavior:'instant'}));
 };
 const locationLabel=document.createElement('div');
 locationLabel.className='profile-location-label';
 locationLabel.setAttribute('aria-live','polite');
 locationLabel.textContent=(profileName||'Manager')+' · Career';
 tabs.prepend(locationLabel);

 function activate(key,{focus=false,reveal=false}={}){
  if(!categories[key])key='overview';
  for(const [section,group] of sectionTab)section.hidden=group!==key;
  for(const button of buttons){const selected=button.dataset.profileTab===key;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;}
  const heading=tabs.querySelector('[data-profile-tab-description]');
  const descriptions={overview:'Career story, verified accomplishments, and the all-time résumé.',seasons:'Season results, postseason finishes, and weekly matchup archive.',rivalries:'Head-to-head results and the matchups that define this franchise.',advanced:'Player history, transactions, research coverage, and the preserved detailed dossier.'};
  if(heading)heading.textContent=descriptions[key];
  guide.textContent=({overview:'Career overview · championships, record and accomplishments',
   seasons:'Each Year · season results, finishes and matchup history',
   rivalries:'Head-to-Head · opponents and verified rivalries',
   advanced:'Deep Stats · archived transactions and player research'})[key]+
   ' · Select a tab to jump straight to that section.';
  if(reveal)revealSection(key);
  locationLabel.textContent=(profileName||'Manager')+' · '+({overview:'Career',seasons:'Each Year',rivalries:'Head-to-Head',advanced:'Deep Stats'}[key]);
  if(focus)buttons.find(b=>b.dataset.profileTab===key)?.focus();
  history.replaceState(null,'','#'+key);
 }
 // Quick actions switch the panel in place. Never jump visitors down the long archive.
 main.addEventListener('click',event=>{
  const jump=event.target.closest('button[data-profile-jump],a[data-profile-jump]');
  if(!jump)return;
  event.preventDefault();
  const key=jump.dataset.profileJump;
  activate(key,{reveal:true});
  for(const item of main.querySelectorAll('[data-profile-jump]'))
   item.setAttribute('aria-pressed',String(item===jump));
 });
 // The feature list routes to the exact named module, not a broad tab.
 // Open collapsible evidence first, then reveal and scroll into view.
 main.addEventListener('click',event=>{
  const button=event.target.closest('button[data-profile-feature]');
  if(!button)return;
  const target=button.dataset.featureTarget,category=button.dataset.featureTab;
  const destination=target&&document.querySelector(target);
  if(!destination){
   // Never leave a feature button looking inert when optional archive data
   // has not been mounted for this particular manager.
   button.setAttribute('aria-disabled','true');
   button.title='This section is not available for this manager yet';
   return;
  }
  if(category)activate(category);
  focusFeature(button,destination);
  const shelf=destination.closest('details.profile-research-shelf');
  if(shelf)shelf.open=true;
  if(destination.tagName==='DETAILS')destination.open=true;
  requestAnimationFrame(()=>requestAnimationFrame(()=>
   destination.scrollIntoView({block:'start',behavior:'instant'})));
 });
 tabs.addEventListener('click',event=>{const button=event.target.closest('button[data-profile-tab]');if(button){clearFeatureFocus();document.body.classList.remove('profile-landing');activate(button.dataset.profileTab,{reveal:true})}});
 tabs.addEventListener('keydown',event=>{const index=buttons.indexOf(document.activeElement);if(index<0)return;const direction=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;if(direction){event.preventDefault();clearFeatureFocus();document.body.classList.remove('profile-landing');activate(buttons[(index+direction+buttons.length)%buttons.length].dataset.profileTab,{focus:true,reveal:true})}});
 // A persistent escape hatch for long historical sections; only appears after scrolling.
 const back=document.createElement('button');
 back.type='button';back.className='profile-back-to-sections';
 back.textContent='↑ Explore features';
 back.setAttribute('aria-label','Return to the manager feature directory');
 back.hidden=true;
 document.body.append(back);
 back.addEventListener('click',()=>document.getElementById('profile-features')?.scrollIntoView({behavior:'smooth',block:'start'}));
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
 const guideStyle=document.createElement('style');
 guideStyle.textContent='.profile-tab-guide{margin:0 0 14px;padding:10px 13px;background:#123144;border-left:3px solid var(--gold);border-radius:7px;color:#e9eef3;font-size:13px;font-weight:650}.profile-tabs+.profile-tab-guide+section{scroll-margin-top:85px}main section.section{scroll-margin-top:85px}@media(min-width:651px){main section.section{scroll-margin-top:20px}}';
 document.head.append(guideStyle);
 backStyle.textContent='.profile-back-to-sections{position:fixed;bottom:max(18px,env(safe-area-inset-bottom));right:16px;z-index:100;padding:13px 17px;border-radius:999px;border:2px solid #f3d69d;background:#142736;color:#fff;font:inherit;font-weight:850;font-size:13px;box-shadow:0 6px 24px #000b;cursor:pointer}.profile-back-to-sections[hidden]{display:none!important}.profile-back-to-sections:focus-visible{outline:3px solid white;outline-offset:3px}.profile-tabs{scroll-margin-top:16px}@media(prefers-reduced-motion:reduce){html:focus-within{scroll-behavior:auto}}';
 document.head.append(backStyle);
 // Keep the opponent explorer first; detailed rivalry research expands only on request.
 const rivalry=document.querySelector('#rivalry-analytics');
 const rivalryResume=document.querySelector('#rivalry-resume');
 for(const [section,label] of [[rivalry,'Scoring trends and toughest opponents'],[rivalryResume,'Signature matchups and rivalry history']]){
  if(!section||section.dataset.inlineDisclosure)continue;
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
 const advancedSections=[...main.querySelectorAll('#franchise-legends .profile-deep-disclosure,#front-office-archive .profile-deep-disclosure,#full-franchise-dossier .profile-deep-disclosure')];
 if(advancedSections.length){
  const controls=document.createElement('div');
  controls.className='profile-deep-controls';
  controls.innerHTML='<span>More research</span><button type="button" data-expand-all>Expand all</button><button type="button" data-collapse-all>Collapse all</button>';
  document.getElementById('franchise-legends')?.prepend(controls);
  controls.addEventListener('click',event=>{
   const button=event.target.closest('button');
   if(!button)return;
   const open=button.hasAttribute('data-expand-all');
   for(const details of advancedSections)details.open=open;
  });
 }
 const inlineCss=document.createElement('style');
 inlineCss.textContent='.profile-inline-disclosure{border:1px solid #537186;border-radius:12px;background:#152b3a;margin:14px 0;overflow:hidden}.profile-inline-disclosure>summary{cursor:pointer;list-style:none;display:flex;align-items:center;min-height:56px;padding:14px 16px;font-size:15px;font-weight:850}.profile-inline-disclosure>summary:after{content:"+";margin-left:auto;font-size:22px}.profile-inline-disclosure[open]>summary:after{content:"−"}.profile-inline-detail{padding:3px 15px 18px;border-top:1px solid #456174}.profile-inline-disclosure>summary:focus-visible{outline:3px solid #fff;outline-offset:-3px}';
 inlineCss.textContent+='.profile-deep-controls{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:16px 0}.profile-deep-controls span{font-weight:800;margin-right:auto}.profile-deep-controls button{background:#213d4e;color:white;border:1px solid #71899a;border-radius:8px;padding:10px 12px;min-height:44px;font:inherit;font-size:12px;cursor:pointer}';
 document.head.append(inlineCss);
 // Mobile tabs stay within thumb reach without covering page content.
 const stickyStyle=document.createElement('style');
 stickyStyle.textContent='.profile-location-label{display:none}@media(max-width:650px){.profile-location-label{display:block;font-size:11px;font-weight:850;color:#f2d18f;letter-spacing:.04em;margin:0 0 6px;padding-left:3px}.profile-tabs{position:sticky;top:0;z-index:70;margin:8px 0 12px;padding:8px;background:#0d1923f5;box-shadow:0 5px 14px #0007;backdrop-filter:blur(10px)}.profile-tabs>.eyebrow,.profile-tabs>[data-profile-tab-description]{display:none}.profile-tab-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin:0}.profile-tab-row button{padding:9px 3px;min-height:45px;font-size:clamp(10px,2.7vw,12px);white-space:normal}.profile-back-to-sections{display:none!important}}';
 document.head.append(stickyStyle);
 // Browser back/forward restores the selected panel without jumping into a hidden section.
 window.addEventListener('popstate',()=>{
  const key=location.hash.slice(1);
  if(categories[key])activate(key);
 });
 // Restore scroll after a visitor opens another report and returns.
 // Keep it per-tab so each manager section remembers its own reading position.
 // The profile manages its own tab-specific return position. Avoid a competing native
 // history scroll restoration that can override our saved position after a BFCache return.
 if('scrollRestoration' in history)history.scrollRestoration='manual';
 const scrollKey='fellas-profile-position:'+location.pathname;
 // Reapply after both the BFCache restore and late-loading historical panels settle.
 // A single animation frame can be overwritten by Chromium's own history restoration.
 const restoreReadingPosition=saved=>{
  const reapply=()=>{
   if(document.visibilityState==='hidden')return;
   window.scrollTo({top:saved.y,behavior:'instant'});
   updateBack();
  };
  requestAnimationFrame(()=>requestAnimationFrame(reapply));
  setTimeout(reapply,80);
  setTimeout(reapply,160);
  setTimeout(reapply,260);
  setTimeout(reapply,450);
  setTimeout(reapply,850);
 };
 const savePosition=()=>{
  try{sessionStorage.setItem(scrollKey,JSON.stringify({tab:buttons.find(b=>b.getAttribute('aria-selected')==='true')?.dataset.profileTab||'overview',y:window.scrollY,at:Date.now()}))}catch{}
 };
 window.addEventListener('pagehide',savePosition);
 window.addEventListener('pageshow',event=>{
  if(!event.persisted)return;
  requestAnimationFrame(updateBack);
  // BFCache can restore scroll before dynamic tab visibility has settled.
  // Reapply the last saved tab and position after the restored layout paints.
  try{
   const saved=JSON.parse(sessionStorage.getItem(scrollKey)||'null');
   if(saved&&Date.now()-saved.at<30*60*1000&&categories[saved.tab]){
    activate(saved.tab);
    restoreReadingPosition(saved);
   }
  }catch{}
 });
 const initial=location.hash.slice(1).toLowerCase();
 const target=document.getElementById(location.hash.slice(1));
 const chosen=categories[initial]?initial:target&&sectionTab.has(target)?sectionTab.get(target):'overview';
 activate(chosen);
 let restoredPosition=false;
 if(!target||categories[initial]){try{const saved=JSON.parse(sessionStorage.getItem(scrollKey)||'null');if(saved&&Date.now()-saved.at<30*60*1000&&categories[saved.tab]&&(!target||initial===saved.tab)){activate(saved.tab);restoreReadingPosition(saved);restoredPosition=true}}catch{}}
 if(target&&!categories[initial])requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
 // Homepage directory shortcuts use category hashes, not physical element IDs.
 // On a fresh deep link, bring the selected profile section navigation into view.
 // A restored reading position wins when returning to a previously visited profile.
 if(!initial&&!restoredPosition)document.body.classList.add('profile-landing');
 if(categories[initial]&&!restoredPosition){
  switcher.open=true;
  requestAnimationFrame(()=>requestAnimationFrame(()=>tabs.scrollIntoView({block:'start'})));
 }
}
