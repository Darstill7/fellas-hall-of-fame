import {mountDraftTradeCareer} from './manager-draft-trade-career-page.mjs';
import {mountManagerSeasonEvidence} from './manager-season-evidence.mjs';
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
  // Preserve the source-backed Start/Sit research link when condensing
  // the legacy hero navigation; otherwise it disappears after page load.
  const startSitLink=actions.querySelector('a[href*="manager-lineup-research.html"]')?.cloneNode(true);
  actions.innerHTML='<a class="btn" href="#profile-navigation">Explore '+manager+'’s career ↓</a><a class="btn secondary" href="../../index.html#home-manager-title">All manager cards</a>';
  if(startSitLink)actions.append(startSitLink);
 }
 const quick=document.createElement('section');
 quick.className='profile-quickstart';quick.setAttribute('aria-label',manager+' career at a glance');
 quick.innerHTML='<h2>'+manager+' at a glance</h2><p class="muted">Tap a shortcut to jump to the section below.</p><div class="profile-quick-grid">'+
 [['overview','#verified-history-panel','Championships','Titles and finishes'],['seasons','#season-history','Every Season','Annual results'],['rivalries','#head-to-head','Head-to-Head','Who owns whom?'],['advanced','#franchise-encyclopedia','Trades & Pickups','The deeper research']].map(([tab,target,label,description])=>'<button type="button" data-profile-jump="'+tab+'"><strong>'+label+'</strong><span>'+description+' ↓</span></button>').join('')+'</div>';
 nav.after(quick);
 // Keeper research remains a separate preview; it must not be confused with OVR.
 populateManagerResearch(quick,manager);
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
  {label:'Season evidence',detail:'Pickups, keepers and draft/trade history by year',target:'.profile-season-evidence',icon:'📋'},
  {label:'Front Office Snapshot',detail:'Recorded pickup usage and 2026 keeper contributions',target:'.profile-front-office-snapshot',icon:'📊'},
  {label:'Pickup highlights & FAAB',detail:'Selected acquisitions, starts, points and verified costs',href:'../../analytics/manager-report-cards.html?manager='+encodeURIComponent(name)+'#cards',icon:'💰'},
  {label:'Start/Sit accuracy',detail:'Weekly lineup efficiency and coverage',href:'../../analytics/manager-lineup-research.html?season=career&manager='+encodeURIComponent(name),icon:'🎯'},
  {label:'Keeper research',detail:'2025 and in-progress 2026 keeper evidence',href:'../../analytics/keeper-decision-research.html?year=2026&manager='+encodeURIComponent(name),icon:'🔒'}
 ];
 const shell=document.createElement('section');
 shell.className='profile-feature-directory';
 shell.setAttribute('aria-label','Manager features');
 shell.dataset.profileFeatureMenu='';
 shell.innerHTML='<h2>Explore '+name+'\'s profile</h2><p class="muted">Choose a feature below. Each button opens that section or its full research page.</p>';
 const list=document.createElement('div');list.className='profile-feature-list';
 for(const feature of features){
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
  item.append(symbol,body,arrow);list.append(item);
 }
 shell.append(list);
 quick.prepend(shell);
 // Retire the redundant four-item quick grid; these destinations now have
 // individually labeled buttons instead of nested and competing menus.
 quick.querySelector('.profile-quick-grid')?.remove();
 quick.querySelector(':scope > h2')?.remove();
 quick.querySelector(':scope > p.muted')?.remove();
 const css=document.createElement('style');
 css.textContent='.profile-feature-directory{margin:0 0 18px}.profile-feature-directory h2{margin:0 0 4px;font-size:clamp(22px,3vw,29px)}.profile-feature-directory>.muted{margin:4px 0 15px;font-size:13px}.profile-feature-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.profile-feature-button{display:flex;align-items:center;gap:12px;min-width:0;min-height:74px;text-align:left;background:#142d3d;color:#f7f2e8;border:1px solid #557587;border-radius:11px;padding:12px 14px;font:inherit;text-decoration:none;cursor:pointer}.profile-feature-button:hover{background:#1d4053;border-color:#e3bd71;color:#fff}.profile-feature-button:focus-visible{outline:3px solid #ffe3a0;outline-offset:2px}.profile-feature-icon{font-size:23px;flex:none}.profile-feature-copy{display:flex;flex-direction:column;gap:3px;min-width:0}.profile-feature-copy strong{font-size:14px;line-height:1.3;color:#fff}.profile-feature-copy small{font-size:12px;line-height:1.4;color:#c7d7e2}.profile-feature-arrow{margin-left:auto;color:#e3bd71;font-weight:900;font-size:20px;flex:none}@media(max-width:650px){.profile-feature-list{grid-template-columns:1fr}.profile-feature-button{min-height:69px;padding:12px}}';
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
 shelfTitle.textContent='Research evidence & detailed records';
 const shelfIntro=document.createElement('p');
 shelfIntro.className='muted profile-research-shelf-intro';
 shelfIntro.textContent='Drafts, trades, acquisitions and keeper usage are descriptive archives. Open a feature above to jump straight to its evidence.';
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
  encodeURIComponent(keeperManager)+'#cards"><strong>Explore pickup highlights</strong><span>Starts, lineup points and verified $0 / FAAB costs · 3 selected examples</span></a>';
 shelfBody.append(pickupLink);
 // Profile-first front-office evidence: share source files with the full
 // research pages instead of creating a disconnected manager scorecard.
 const snapshot=document.createElement('section');
 snapshot.className='profile-front-office-snapshot';
 snapshot.setAttribute('aria-label',keeperManager+' front office snapshot');
 snapshot.innerHTML='<h3>Front Office Snapshot</h3><p class="muted">Recorded acquisitions and 2026 keeper starts. Descriptive evidence, not management-skill grades.</p><p class="muted" role="status">Loading verified research…</p>';
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
  title.textContent='Front Office Snapshot';snapshot.append(title);
  const grid=document.createElement('div');
  grid.className='profile-front-office-grid';
  const tile=(value,label)=>{
   const item=document.createElement('div');item.className='profile-front-office-tile';
   const strong=document.createElement('strong');strong.textContent=value;
   const small=document.createElement('span');small.textContent=label;
   item.append(strong,small);return item;
  };
  grid.append(
   tile(a.withRecordedLaterStart+' / '+a.distinctSeasonPlayerAcquisitions,'Recorded pickups later started · Sleeper 2020–26'),
   tile(String(k.verifiedOriginalManagerStarts),'Keeper starts · 2026 Weeks 1–'+keepers.throughWeek),
   tile(k.regularStartedPoints.toFixed(1),'Keeper lineup points · 2026 to date')
  );
  snapshot.append(grid);
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
  snapshot.innerHTML='<h3>Front Office Snapshot</h3><p class="muted" role="status">Source evidence is temporarily unavailable. No substitute figures are shown.</p>';
 });
 const css=document.createElement('style');
 css.textContent+='.profile-research-shelf{margin:18px 0 0;background:#0b2331;border:1px solid #557587;border-radius:12px;padding:0}.profile-research-shelf>summary{min-height:50px;padding:14px 17px;color:var(--gold);font-size:15px;font-weight:850;cursor:pointer}.profile-research-shelf>summary:focus-visible{outline:3px solid white;outline-offset:-3px}.profile-research-shelf-intro{font-size:12px;line-height:1.55;margin:0;padding:0 17px 12px}.profile-research-shelf-body{padding:0 16px 15px}.profile-research-shelf-body .profile-front-office-snapshot{margin:14px 0}.profile-research-shelf-body>.muted{margin:10px 0}@media(max-width:650px){.profile-research-shelf-body{padding:0 10px 12px}}';
 css.textContent='.profile-tabs{background:#0d1923f5;border:1px solid var(--line);border-radius:14px;padding:15px 17px;margin:12px 0 24px}.profile-tab-row{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.profile-tab-row button{cursor:pointer;border:1px solid #607483;border-radius:9px;background:#182c3b;color:#d9e3e9;font:inherit;font-size:13px;font-weight:800;padding:11px 16px;min-height:44px}.profile-tab-row button[aria-selected="true"]{background:var(--gold);border-color:var(--gold);color:#10212d}.profile-tab-row button:focus-visible{outline:3px solid white;outline-offset:3px}.section[hidden]{display:none!important}.profile-quick-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:14px 0}.profile-quick-grid button{display:flex;cursor:pointer;text-align:left;color:#fff;font:inherit;flex-direction:column;gap:6px;background:#172b3a;border:1px solid #486174;border-radius:12px;padding:17px;min-height:94px}.profile-quick-grid button[aria-pressed="true"]{border-color:var(--gold);box-shadow:inset 4px 0 0 var(--gold)}.profile-quick-grid span{font-size:13px;color:#d0dce4}@media(max-width:600px){.profile-tab-row{display:grid;grid-template-columns:1fr 1fr}.profile-quick-grid{grid-template-columns:1fr}}';
 css.textContent+='.manager-pickup-link a{display:flex;flex-direction:column;gap:5px;max-width:550px;background:#183744;border:1px solid #7b998e;border-radius:12px;padding:14px 16px;color:#f5f2e8;text-decoration:none;min-height:62px}.manager-pickup-link a strong{color:var(--gold);font-size:15px}.manager-pickup-link a span{font-size:12px;line-height:1.5;color:#d0dce4}.manager-pickup-link a:focus-visible{outline:3px solid #fff;outline-offset:2px}.manager-pickup-link a:hover{border-color:var(--gold)}';
 css.textContent+='.profile-front-office-snapshot{margin:20px 0 8px;padding:17px;border:1px solid #577483;border-radius:13px;background:#102936}.profile-front-office-snapshot h3{margin:0 0 9px;color:var(--gold);font-size:18px}.profile-front-office-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.profile-front-office-tile{padding:14px;background:#182f3e;border:1px solid #466173;border-radius:10px}.profile-front-office-tile strong{display:block;font-size:24px;font-variant-numeric:tabular-nums;color:#f7eed9}.profile-front-office-tile span{display:block;font-size:12px;line-height:1.4;color:#c5d3dc}.profile-front-office-caveat{font-size:12px;line-height:1.5;margin:11px 0}.profile-front-office-actions{display:flex;gap:12px;flex-wrap:wrap;font-size:13px;font-weight:800;margin:12px 0 0}.profile-front-office-actions a{color:var(--gold);text-decoration:underline;text-underline-offset:3px}.profile-front-office-actions a:focus-visible{outline:3px solid white;outline-offset:2px}@media(max-width:650px){.profile-front-office-grid{grid-template-columns:1fr}.profile-front-office-tile{padding:12px}.profile-front-office-tile strong{font-size:22px}}';
 css.textContent+='.profile-season-draft-trade{margin:9px 0;color:#d5e4ed;font-size:12px;line-height:1.55}.profile-season-draft-trade p{margin:4px 0}.profile-season-draft-trade .muted{font-size:11px}';
 css.textContent+='.profile-season-trade-link{display:inline-block;margin-top:10px;color:var(--gold);font-size:12px;font-weight:800;text-decoration:underline;text-underline-offset:3px}.profile-season-trade-link:focus-visible{outline:3px solid #fff;outline-offset:2px}';
 css.textContent+='.profile-season-evidence{margin:19px 0;border:1px solid #607d8b;border-radius:12px;background:#102734;padding:0;overflow:hidden}.profile-season-evidence>summary{padding:15px 17px;min-height:48px;color:var(--gold);font-weight:850;cursor:pointer}.profile-season-evidence>summary:focus-visible{outline:3px solid #fff;outline-offset:-3px}.profile-season-evidence-intro,.profile-season-evidence-caveat{padding:0 16px;font-size:12px;line-height:1.5}.profile-season-evidence-list{display:grid;gap:8px;padding:9px 15px 15px}.profile-season-evidence-row{background:#1a3443;border:1px solid #466274;border-radius:10px;padding:12px 14px}.profile-season-evidence-header{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.profile-season-evidence-header strong{font-size:17px;color:#fff}.profile-season-evidence-header span{font-size:12px;color:#ebd09b;font-weight:800}.profile-season-evidence-facts{display:flex;flex-wrap:wrap;gap:5px 13px;margin:8px 0 0;font-size:12px;color:#d9e4eb}.profile-season-evidence-facts span{display:inline-block}.profile-season-evidence-facts span+span:before{content:"·";margin-right:13px;color:#8bb1c1}.profile-season-evidence-flag{color:#ffe0a8}@media(max-width:650px){.profile-season-evidence-header{align-items:flex-start;flex-direction:column;gap:3px}.profile-season-evidence-facts{flex-direction:column;gap:6px}.profile-season-evidence-facts span+span:before{content:none}}';
 css.textContent+='.profile-career-resume{margin:16px 0;border:1px solid #768593;border-radius:13px;padding:0;background:#132d3b;overflow:hidden}.profile-career-resume>summary{padding:16px 17px;color:var(--gold);font-size:17px;font-weight:850;min-height:52px;cursor:pointer}.profile-career-resume>summary:focus-visible{outline:3px solid white;outline-offset:-3px}.career-resume-intro,.career-resume-coverage,.career-resume-caveat{padding:0 15px;font-size:12px;line-height:1.5}.career-resume-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:8px 15px}.career-resume-metric{padding:12px 9px;background:#1b3847;border:1px solid #486879;border-radius:10px;min-width:0}.career-resume-metric strong{font-size:22px;display:block;color:#fff;font-variant-numeric:tabular-nums}.career-resume-metric span{font-size:11px;line-height:1.35;color:#c5d6df;display:block}.career-resume-section{padding:10px 16px 0}.career-resume-section h4{font-size:14px;color:var(--gold);margin:6px 0 12px}.career-resume-example{font-size:13px;color:#e0e9ee;margin:8px 0}.career-resume-trade{padding:12px;background:#1c3847;border:1px solid #426477;border-radius:9px;margin:8px 0}.career-resume-trade strong{font-size:12px}.career-resume-trade p{font-size:12px;margin:5px 0}.career-resume-link{font-size:12px;color:var(--gold);font-weight:850;text-decoration:underline;text-underline-offset:3px}.career-resume-link:focus-visible{outline:3px solid white;outline-offset:2px}@media(max-width:650px){.career-resume-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.career-resume-metric strong{font-size:20px}}';
 document.head.append(css);
}
const existingProfile=document.querySelector('nav[data-manager-profile-tabs]');
if(existingProfile&&!legacyNav){
 const quick=document.querySelector('.profile-quickstart');
 const manager=document.querySelector('main .hero h1')?.textContent?.trim()||'';
 populateManagerResearch(quick,manager);
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
 tabs.after(guide);
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
  if(category)activate(category);
  const destination=target&&document.querySelector(target);
  if(!destination)return;
  const shelf=destination.closest('details.profile-research-shelf');
  if(shelf)shelf.open=true;
  if(destination.tagName==='DETAILS')destination.open=true;
  requestAnimationFrame(()=>requestAnimationFrame(()=>
   destination.scrollIntoView({block:'start',behavior:'instant'})));
 });
 tabs.addEventListener('click',event=>{const button=event.target.closest('button[data-profile-tab]');if(button)activate(button.dataset.profileTab,{reveal:true})});
 tabs.addEventListener('keydown',event=>{const index=buttons.indexOf(document.activeElement);if(index<0)return;const direction=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;if(direction){event.preventDefault();activate(buttons[(index+direction+buttons.length)%buttons.length].dataset.profileTab,{focus:true,reveal:true})}});
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
 if(categories[initial]&&!restoredPosition)
  requestAnimationFrame(()=>requestAnimationFrame(()=>tabs.scrollIntoView({block:'start'})));
}
