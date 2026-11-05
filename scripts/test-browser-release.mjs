// Headless Chromium release checks: real JS, routed HTTP, responsive overflow and controls.
// CI installs playwright and Chromium before running this script.
import { chromium, webkit } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),base='/fellas-hall-of-fame/';
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(!url.pathname.startsWith(base)){res.writeHead(404);res.end();return}
 let rel;
 try{rel=decodeURIComponent(url.pathname.slice(base.length))}catch{res.writeHead(400);res.end();return}
 if(!rel||rel.endsWith('/'))rel+='index.html';
 const file=path.resolve(root,rel);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{let content=await fs.readFile(file);res.writeHead(200,{'Content-Type':file.endsWith('.json')?'application/json':/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});res.end(content)}
 catch{res.writeHead(404);res.end()}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const port=server.address().port,baseUrl='http://127.0.0.1:'+port+base;
const useWebkit=process.env.FELLAS_BROWSER==='webkit';
const engine=useWebkit?'WebKit':'Chromium';
let browser;
let startupError=null;
try{browser=await (useWebkit?webkit:chromium).launch({headless:true,...(useWebkit?{}:{args:['--no-sandbox']})})}
catch(e){startupError=e}
const slugs=['stilly','stew','tom','stover','birch','tony','mitch','kuhl','jmid','scott'];
const routes=['','seasons/','hall/','seasons/weekly-matchup-archive.html','managers/index.html','managers/record-books.html','analytics/record-holders.html','analytics/records.html','analytics/records-archive.html','analytics/goat-debate.html','analytics/franchise-timeline.html','analytics/legacy.html','analytics/power-ratings.html','analytics/trades.html','analytics/drafts/index.html','analytics/trades/index.html','analytics/metrics.html','analytics/manager-trade-intelligence.html','analytics/manager-decision-audit.html','analytics/this-week-history.html','analytics/trade-museum.html','hall/players.html','hall/shame.html','labs/faab/index.html','labs/lineups/index.html','analytics/manager-performance-timeline.html','analytics/manager-league-benchmarks.html','analytics/franchise-encyclopedia.html','analytics/manager-report-cards.html','analytics/manager-lineup-research.html','analytics/keeper-decision-research.html','analytics/manager-madden-cards.html','analytics/historical-spreads.html','analytics/rivalries.html','analytics/awards-show.html','seasons/all-time-schedule-swap.html','seasons/espn-records.html','seasons/espn-origins.html','seasons/historical-awards.html','seasons/unified-record-book.html',...slugs.flatMap(s=>['managers/'+s+'/','managers/'+s+'.html'])];
const rivals=['stilly','jmid','tom','stew','scott','mitch','tony','stover','kuhl','birch'];
for(let i=0;i<rivals.length;i++)for(let j=i+1;j<rivals.length;j++)routes.push('rivalries/'+rivals[i]+'-vs-'+rivals[j]+'.html');
const errors=[];
const pageAudits=[];
const captureVisuals=process.env.FELLAS_VISUAL_AUDIT==='1';
let attemptedPages=0,completedPages=0;
try{
 if(startupError)throw startupError;
 for(const width of (useWebkit?[390]:[390,1280])){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:width===390,hasTouch:width===390});
  for(const route of routes){
   attemptedPages++;
   const page=await context.newPage();
   const unexpected=[];
   const failedRequests=[];
   page.on('requestfailed',req=>failedRequests.push(req.url()+' '+req.failure()?.errorText));
   page.on('response',res=>{if(res.status()>=400)failedRequests.push(res.status()+' '+res.url())});
   page.on('pageerror',e=>unexpected.push(e.message));
   try{
   const response=await page.goto(baseUrl+route,{waitUntil:'networkidle',timeout:30000});
   if(!response?.ok())errors.push(width+' '+route+' HTTP '+response?.status());
   await page.waitForTimeout(150);
   const state=await page.evaluate(()=>({body:document.body?.innerText?.length||0,scroll:document.documentElement.scrollWidth,viewport:window.innerWidth}));
   // Site-wide visual and interaction inventory. Every public route is
   // inspected at the same viewports as the functional release checks.
   const audit=await page.evaluate(()=>{
    const visible=el=>{
     const style=getComputedStyle(el),rect=el.getBoundingClientRect();
     return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;
    };
    const heading=[...document.querySelectorAll('main h1,h1')].find(visible);
    const style=heading?getComputedStyle(heading):null;
    const fontPx=style?parseFloat(style.fontSize):0;
    const linePx=style&&style.lineHeight!=='normal'?parseFloat(style.lineHeight):null;
    const links=[...document.querySelectorAll('header a,nav a,main .actions a,main .buttons a')]
     .filter(visible).map(a=>({text:a.textContent.trim().slice(0,80),href:a.href}))
     .filter(a=>a.href).slice(0,40);
    const buttons=[...document.querySelectorAll('button,select,input,summary')].filter(visible);
    return {
     title:document.title,
     heading:heading?.textContent?.trim().replace(/\s+/g,' ').slice(0,120)||null,
     headingFontPx:fontPx,headingLinePx:linePx,
     cards:[...document.querySelectorAll('.card,.tile,.manager,.entry')].filter(visible).length,
     visibleControls:buttons.length,
     navLinks:links,
     horizontalOverflowPx:Math.max(0,document.documentElement.scrollWidth-innerWidth)
    };
   });
   const checkedLinks=[];
   for(const link of audit.navLinks){
    let url;
    try{url=new URL(link.href)}catch{continue}
    if(url.origin!==new URL(baseUrl).origin||!url.pathname.startsWith(base))continue;
    let rel=decodeURIComponent(url.pathname.slice(base.length));
    if(!rel||rel.endsWith('/'))rel+='index.html';
    // Local path resolution prevents false positives from external destinations.
    const targetPath=path.resolve(root,rel);
    let exists=false;
    if(targetPath.startsWith(root+path.sep)){
     try{exists=(await fs.stat(targetPath)).isFile()}catch{}
    }
    checkedLinks.push({label:link.text,path:rel,exists});
   }
   const auditFindings=[
    ...checkedLinks.filter(link=>!link.exists).map(link=>'Broken navigation target: '+link.path),
    ...(!audit.heading?['No visible primary page heading']:[]),
    ...(audit.headingLinePx!==null&&audit.headingLinePx<audit.headingFontPx?['Heading line-height smaller than font size']:[])
   ];
   pageAudits.push({route:route||'index.html',width,...audit,checkedLinks,findings:auditFindings});
   if(audit.heading&&audit.headingLinePx!==null&&audit.headingLinePx<audit.headingFontPx)
    errors.push(width+' '+route+' main title line-height clips text');
   if(captureVisuals&&(
    route===''||route==='analytics/records.html'||route==='analytics/power-ratings.html'||
    route==='analytics/manager-report-cards.html'||route==='analytics/rivalries.html'||
    route==='managers/record-books.html'||route==='rivalries/stilly-vs-jmid.html'||
    (route.startsWith('managers/')&&route.endsWith('/')&&
     ['stilly','stew','tom','stover','birch','tony','mitch','kuhl','jmid','scott'].includes(route.split('/')[1])))){
    const slug=(route||'index.html').replace(/[^a-z0-9-]+/gi,'_');
    const file=path.join(root,'data-integrity','visual-audit',engine.toLowerCase(),String(width),slug+'.png');
    await fs.mkdir(path.dirname(file),{recursive:true});
    await page.screenshot({path:file,animations:'disabled',fullPage:false});
   }
   // Shared first-visit design and keyboard navigation on core public routes.
   const isCurrentProfile=route.startsWith('managers/')&&route.endsWith('/')&&
    ['stilly','stew','tom','stover','birch','tony','mitch','kuhl','jmid','scott'].includes(route.split('/')[1]);
   const designed=route===''||isCurrentProfile||route.startsWith('rivalries/')||
    ['analytics/records.html','analytics/manager-report-cards.html','analytics/power-ratings.html',
     'analytics/rivalries.html','managers/record-books.html'].includes(route);
   if(designed){
    const design=await page.evaluate(()=>{
     const skip=document.querySelector('a.fellas-skip');
     const heading=document.querySelector('main h1,.top h1,h1');
     const destination=document.getElementById('main-content');
     const styles=[...document.querySelectorAll('link[rel="stylesheet"]')].map(x=>x.getAttribute('href')||'');
     const focus=skip?(()=>{skip.focus();return document.activeElement===skip})():false;
     return {hasScope:document.body.classList.contains('fellas-polished'),
      hasCss:styles.some(x=>x.includes('assets/fellas-ui-system.css')),
      skip:!!skip&&skip.getAttribute('href')==='#main-content'&&focus&&!!destination,
      heading:heading?.textContent?.trim()||'',
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
    });
    if(!design.hasScope||!design.hasCss||!design.skip)
     errors.push(width+' '+route+' shared design or keyboard skip navigation not mounted');
    if(!design.heading)
     errors.push(width+' '+route+' missing clear first-screen page title');
    if(width===390&&design.overflow>5)
     errors.push(width+' '+route+' shared layout horizontal overflow '+design.overflow);
    if(isCurrentProfile){
     const destinations=await page.locator('header nav.navlinks[aria-label="Main"] a').evaluateAll(nodes=>
      nodes.map(a=>a.getAttribute('href')));
     const expected=['../../index.html','../../managers/','../../analytics/manager-report-cards.html',
      '../../analytics/records.html','../../analytics/rivalries.html'];
     if(JSON.stringify(destinations)!==JSON.stringify(expected))
      errors.push(width+' '+route+' manager primary navigation must match five key sections');
     const mobileMenu=page.locator('header.nav details.fellas-mobile-site-menu');
     if(await mobileMenu.count()!==1)
      errors.push(width+' '+route+' manager missing site navigation disclosure');
     else if(width===390){
      if(!await mobileMenu.isVisible()||
         await page.locator('header.nav nav.navlinks[aria-label="Main"]').isVisible())
       errors.push(width+' '+route+' mobile manager navigation is too crowded');
      await mobileMenu.locator(':scope > summary').click();
      const mobileHrefs=await mobileMenu.locator('nav a').evaluateAll(nodes=>nodes.map(a=>a.getAttribute('href')));
      if(JSON.stringify(mobileHrefs)!==JSON.stringify(expected)||
         !await mobileMenu.locator('nav a').first().isVisible())
       errors.push(width+' '+route+' mobile manager menu has missing destinations');
      await mobileMenu.locator(':scope > summary').press('Escape');
      if(await mobileMenu.evaluate(el=>el.open))
       errors.push(width+' '+route+' mobile manager menu does not close with Escape');
     }else if(await mobileMenu.isVisible())
      errors.push(width+' '+route+' mobile-only manager menu exposed on desktop');
    }
   }
   if(state.body<80)errors.push(width+' '+route+' blank or very little content');
   const exposedNames=await page.evaluate(()=>{
    const text=document.body?.innerText||'';
    return ['Darren Stillson','Drew Sylvester','Zach Prescott','Landon Stover','Tom Schermerhorn','Devon Halderman','Trent Koble','Brandon Evans','Alex Birch','Tony Steglich','Mitch Huppert','Cory Kuhl'].filter(name=>text.includes(name));
   });
   if(exposedNames.length)errors.push(width+' '+route+' rendered page exposes full manager names: '+exposedNames.join(', '));

   if(state.scroll>state.viewport+5)errors.push(width+' '+route+' horizontal page overflow '+state.scroll+'px at '+state.viewport+'px viewport; offenders: '+(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+6).sort((a,b)=>b.getBoundingClientRect().right-a.getBoundingClientRect().right).slice(0,5).map(e=>e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.trim().replaceAll(' ','.'):'')+' right='+Math.round(e.getBoundingClientRect().right)).join(', ')+'; outside-panel offenders='+[...document.querySelectorAll('body *')].filter(e=>!e.closest('#historical-record-profile')&&e.getBoundingClientRect().right>innerWidth+3).sort((a,b)=>b.getBoundingClientRect().right-a.getBoundingClientRect().right).slice(0,12).map(e=>e.tagName.toLowerCase()+'.'+(typeof e.className==='string'?e.className.trim().replaceAll(' ','.'):'')+' right='+Math.round(e.getBoundingClientRect().right)).join(', ')+'; panel ancestry='+(()=>{let e=document.querySelector('#historical-record-profile');let xs=[];for(let i=0;e&&i<6;i++,e=e.parentElement){let b=e.getBoundingClientRect(),v=getComputedStyle(e);xs.push(e.tagName.toLowerCase()+'.'+e.className+' left='+Math.round(b.left)+' right='+Math.round(b.right)+' width='+Math.round(b.width)+' overflow='+v.overflowX)}return xs.join(' | ')})())));
   for(const error of unexpected)errors.push(width+' '+route+' JS error: '+error);
   for(const failed of failedRequests)errors.push(width+' '+route+' request error: '+failed);
   if(['analytics/manager-report-cards.html','analytics/keeper-decision-research.html','analytics/manager-trade-intelligence.html','analytics/drafts/index.html','analytics/trades/index.html','labs/faab/index.html'].includes(route)){
    const shared=page.locator('link[href$="research-readability.css"]');
    if(await shared.count()!==1||
       !await page.locator('body').evaluate(el=>el.classList.contains('research-readable')))
     errors.push(width+' '+route+' research readability stylesheet missing');
    else{
     const textSpacing=await page.evaluate(()=>{
      const p=document.querySelector('p');
      if(!p)return 0;
      return parseFloat(getComputedStyle(p).lineHeight);
     });
     if(textSpacing<22)errors.push(width+' '+route+' prose line height remains cramped');
    }
   }
   if(route==='analytics/keeper-decision-research.html'){
    const rows=page.locator('#keeper-results .entry');
    if(await rows.count()!==10)errors.push(width+' keeper research expected 10 expandable managers');
    const first=rows.first();
    await first.locator('summary').click();
    if(!await first.locator('.detail').isVisible())errors.push(width+' keeper details not expandable');
    const note=await page.locator('.notice').innerText();
    if(!note.includes('not an official grade')||!note.includes('not applied'))errors.push(width+' keeper research caveats missing');
    await page.locator('#keeper-manager').selectOption('Kuhl');
    if(await rows.count()!==1||!((await rows.first().innerText()).includes('Jared Goff')))
     errors.push(width+' keeper filter or verified release evidence failed');
    if(await rows.first().evaluate(el=>el.open)||
       !await page.locator('#keeper-profile-context').isVisible()||
       await page.locator('#keeper-overall-metrics').isVisible()||
       await page.locator('#keeper-sort').isVisible()||
       !await page.locator('#keeper-profile-context a[href="../managers/kuhl/"]').isVisible()||
       !await page.locator('#keeper-profile-context a[href="keeper-decision-research.html?year=2025"]').isVisible())
     errors.push(width+' keeper manager-focused view fails to prioritize personal evidence and return navigation');
    await page.locator('#keeper-manager').selectOption('');
    await page.locator('#keeper-sort').selectOption('playoff');
    if(!((await rows.first().innerText()).includes('Thommy')))errors.push(width+' keeper championship sort failed');
    const sourceGrade=await page.evaluate(async()=>{const r=await fetch(new URL('../data/keeper_2025_website_research_v1.json',location.href));const j=await r.json();return j.rows.every(x=>x.officialKeeperDecisionGrade===null)});
    if(!sourceGrade)errors.push(width+' research page leaked official keeper grades');
    const keeperLatestWeek=await page.evaluate(async()=>{const r=await fetch(new URL('../data/keeper_2026_website_research_v1.json',location.href));return (await r.json()).throughWeek});
    if(!Number.isInteger(keeperLatestWeek)||keeperLatestWeek<8||keeperLatestWeek>14)errors.push(width+' 2026 latest keeper week invalid');
    await page.locator('#keeper-year').selectOption('2026');
    if(await rows.count()!==10)errors.push(width+' 2026 keeper research expected 10 managers');
    if(!((await page.locator('#keeper-notice').innerText()).includes('2026 is in progress')))
     errors.push(width+' 2026 in-progress warning missing');
    if(!((await rows.first().innerText()).includes('starter pts · '+keeperLatestWeek+' weeks')))
     errors.push(width+' 2026 points incorrectly presented as a scored season');
    if(!await page.locator('#keeper-sort option[value="score"]').evaluate(el=>el.disabled))
     errors.push(width+' 2026 should disable completed-season research score sorting');
    await page.locator('#keeper-manager').selectOption('Mitch');
    if(await rows.count()!==1||!((await rows.first().innerText()).includes('Jaxon Smith-Njigba')))
     errors.push(width+' 2026 manager filter did not render Mitch keeper evidence');
    const currentYear=await page.evaluate(()=>new URL(location.href).searchParams.get('year'));
    if(currentYear!=='2026')errors.push(width+' 2026 keeper year was not preserved in page URL');
    await page.goto(baseUrl+'analytics/keeper-decision-research.html?year=2026&manager=Stilly',{waitUntil:'networkidle'});
    if(await page.locator('#keeper-year').inputValue()!=='2026'||await page.locator('#keeper-manager').inputValue()!=='Stilly'||await rows.count()!==1)
     errors.push(width+' 2026 keeper season and manager deep link failed');
    if(!await page.locator('#keeper-profile-context').isVisible()||
       await rows.first().evaluate(el=>el.open)||
       !await page.locator('#keeper-profile-context a[href="../managers/stilly/"]').isVisible()||
       !await page.locator('#keeper-profile-context a[href="keeper-decision-research.html?year=2026"]').isVisible()||
       !((await page.locator('#keeper-profile-context').innerText()).includes('No completed-season score')))
     errors.push(width+' deep-linked keeper manager summary missing return path or provisional status');
    const noPartialGrade=await page.evaluate(async()=>{
     const r=await fetch(new URL('../data/keeper_2026_website_research_v1.json',location.href));
     const j=await r.json();
     return j.rows.length===10&&j.rows.every(m=>m.researchScore===null&&m.officialKeeperDecisionGrade===null);
    });
    if(!noPartialGrade)errors.push(width+' 2026 partial keeper season leaked completed season grade');
   }
   if(route.startsWith('managers/')&&slugs.includes(route.split('/')[1])&&route.endsWith('/')){
    const hierarchy=await page.evaluate(()=>{
     const hero=document.querySelector('main .hero'),action=hero?.querySelector(':scope > .buttons'),
      snapshot=hero?.querySelector(':scope > .profile-career-snapshot'),
      topics=document.querySelector('main .profile-quickstart'),
      playoff=document.getElementById('profile-playoff-resume');
     return !!hero&&!!action&&!!snapshot&&!!topics&&!!playoff&&
      !!(action.compareDocumentPosition(snapshot)&Node.DOCUMENT_POSITION_FOLLOWING)&&
      !hero.contains(playoff)&&
      !!(topics.compareDocumentPosition(playoff)&Node.DOCUMENT_POSITION_FOLLOWING)&&
      !!(topics.compareDocumentPosition(document.querySelector('main .profile-madden'))&Node.DOCUMENT_POSITION_FOLLOWING);
    });
    if(!hierarchy)errors.push(width+' '+route+' first-screen navigation and résumé hierarchy broken');
    const panel=page.locator('#profile-playoff-resume');
    await panel.waitFor({state:'visible',timeout:10000});
    const metrics=panel.locator('.profile-playoff-metric');
    if(await metrics.count()!==3)
     errors.push(width+' '+route+' missing three verified playoff résumé metrics');
    const details=panel.locator('details.profile-playoff-history');
    if(await details.count()!==1)
     errors.push(width+' '+route+' playoff history disclosure absent');
    else{
     await details.locator('summary').click();
     if(await details.locator('.profile-playoff-summary').count()!==1)
      errors.push(width+' '+route+' missing documented finishing-position summary');
     if(await details.locator('.profile-playoff-allera').count()!==1)
      errors.push(width+' '+route+' all-era final finishing summary missing');
     const years=await details.locator('.profile-playoff-timeline li').count();
     if(years!==10)
      errors.push(width+' '+route+' postseason timeline should show ten completed seasons, received '+years);
     if((await details.innerText()).includes('2026'))
      errors.push(width+' '+route+' postseason timeline incorrectly includes incomplete 2026');
    }
    const link=page.locator('.profile-feature-button[href="#profile-playoff-resume"]');
    if(await link.count()!==1)
     errors.push(width+' '+route+' playoff résumé feature link missing');
   }
   if(route.startsWith('managers/')&&route.endsWith('/')){
    const heroMadden=page.locator('.profile-madden');
    if(await heroMadden.count()!==1)
     errors.push(width+' '+route+' canonical Madden summary missing');
    else{
     const panel=await heroMadden.innerText();
     if(!panel.includes('LEGACY OVR')||!panel.includes('Championships')||
        !panel.includes('Best individual season:')||!panel.includes('65–99 career score'))
      errors.push(width+' '+route+' primary career rating or peak season missing');
     const heroStats=page.locator('main .hero .stats');
     const designatedSnapshot=page.locator('main .hero [data-profile-career-snapshot]');
     if(await heroStats.count()!==1||
        await designatedSnapshot.count()!==1||
        await designatedSnapshot.locator('details.profile-snapshot-receipts .stats').count()!==1||
        await page.locator('main .hero > .stats').count()!==0)
      errors.push(width+' '+route+' career statistics duplicated or missing from the intended snapshot');
     const evidence=designatedSnapshot.locator('details.profile-snapshot-receipts');
     if(await evidence.count()!==1||await evidence.evaluate(el=>el.open))
      errors.push(width+' '+route+' verified source disclosure must begin collapsed');
     else{
      await evidence.locator(':scope > summary').click();
      if(!await evidence.evaluate(el=>el.open)||
         await evidence.locator('.stat').count()!==3||
         !await evidence.locator('.stats').isVisible())
       errors.push(width+' '+route+' archived career stats fail to expand');
      await evidence.locator(':scope > summary').click();
     }
     // Career record and championships lead; navigation follows the résumé.
     const heroOrder=await page.locator('main .hero').evaluate(hero=>{
      const snapshot=hero.querySelector('[data-profile-career-snapshot]');
      const actions=hero.querySelector(':scope > .buttons');
      const title=hero.querySelector('h1');
      return !!snapshot&&!!actions&&!!title&&
       !!(title.compareDocumentPosition(snapshot)&Node.DOCUMENT_POSITION_FOLLOWING)&&
       !!(snapshot.compareDocumentPosition(actions)&Node.DOCUMENT_POSITION_FOLLOWING);
     });
     if(!heroOrder)errors.push(width+' '+route+' hierarchy must be title, verified career snapshot, then navigation');
     const honors=page.locator('main .hero .profile-honors-line');
     if(await honors.count()!==1||!await honors.isVisible()||
        !/Championship season|Still chasing a first championship/.test(await honors.innerText()))
      errors.push(width+' '+route+' visible title-season context missing from career hero');
     const bioEntry=page.locator('#profile-features button.profile-biography-entry[data-feature-target="#legacy-resume"][data-feature-tab="overview"]');
     if(await bioEntry.count()!==1||!(await bioEntry.innerText()).includes('career story'))
      errors.push(width+' '+route+' direct career biography entry missing');
     else{
      await bioEntry.click();
      await page.waitForFunction(()=>document.querySelectorAll('#legacy-resume .career-bio-prose p').length===3,null,{timeout:8000}).catch(()=>{});
      if(await page.locator('#legacy-resume .career-bio-prose p').count()!==3||
         !await page.locator('#legacy-resume').isVisible()||
         !await page.locator('.profile-focus-toolbar').isVisible())
       errors.push(width+' '+route+' career story failed to open as three readable paragraphs');
      if(!await page.locator('#legacy-resume').evaluate(el=>el.classList.contains('profile-biography-focus'))||
         await page.locator('#legacy-resume > .stats').isVisible())
       errors.push(width+' '+route+' biography focus still exposes the unrelated résumé stat tiles');
      await page.locator('.profile-focus-toolbar button').click();
      if(!await page.locator('#profile-features').isVisible()||
         !await page.locator('body').evaluate(el=>el.classList.contains('profile-landing'))||
         await page.locator('#legacy-resume').evaluate(el=>el.classList.contains('profile-biography-focus')))
       errors.push(width+' '+route+' biography return control did not restore landing page');
     }
     const direct=page.locator('#profile-features .profile-featured-link');
     if(await direct.count()!==2)
      errors.push(width+' '+route+' Records and Report Card entry points missing');
     const weighted=heroMadden.locator('details.profile-rating-components');
     if(await weighted.count()!==1||await weighted.evaluate(el=>el.open))
      errors.push(width+' '+route+' canonical weight breakdown unavailable or expanded on load');
     else{
      await weighted.locator(':scope > summary').click();
      if(await weighted.locator('.profile-rating-factor').count()!==8)
       errors.push(width+' '+route+' expected eight source-backed rating factors');
      await weighted.locator(':scope > summary').click();
     }
     const facts=heroMadden.locator(':scope > .profile-madden-facts > span');
     if(await facts.count()!==5)
      errors.push(width+' '+route+' primary career card should show five readable metrics');
     const trend=heroMadden.locator('details.profile-rating-trend');
     if(await trend.count()!==1||await trend.evaluate(el=>el.open))
      errors.push(width+' '+route+' rating trend must start collapsed');
     else{
      await trend.locator('summary').click();
      if(!await trend.locator('svg.profile-madden-trend').isVisible())
       errors.push(width+' '+route+' rating trend failed to expand');
     }
     const more=heroMadden.locator('details.profile-rating-more');
     if(await more.count()!==1||await more.evaluate(el=>el.open))
      errors.push(width+' '+route+' extra rating comparisons should begin collapsed');
     const explainer=heroMadden.locator('details.profile-rating-explainer');
     if(await explainer.count()!==1)errors.push(width+' '+route+' rating definitions missing');
     else{
      await explainer.locator('summary').click();
      const definitions=await explainer.innerText();
      if(!definitions.includes('Career W–L')||!definitions.includes('Playoff berths')||
         !definitions.includes('Best individual season')||!definitions.includes('separate Season OVR model'))
       errors.push(width+' '+route+' rating metric explanations incomplete');
     }
     const annual=heroMadden.locator('details.profile-season-ovr');
     if(await annual.count()!==1||await annual.evaluate(el=>el.open))
      errors.push(width+' '+route+' season OVR history not collapsed by default');
     else{
      await annual.locator('summary').click();
      if(!await annual.locator('.profile-historical-table').isVisible())
       errors.push(width+' '+route+' season OVR details failed to expand');
     }
    }
   }
   if(route.startsWith('managers/')&&route.endsWith('/')){
    const slug=route.split('/')[1];
    const profileNames={stilly:'Stilly',stew:'Stew',tom:'Thommy',stover:'Stover',
     birch:'Birch',tony:'Tony',mitch:'Mitch',kuhl:'Kuhl',jmid:'JMid',scott:'Scott'};
    const name=profileNames[slug];
    if(name){
     // The sole featured Records shortcut must use the canonical manager name;
     // never restore the obsolete duplicate under expandable topics.
     const recordsEntries=await page.locator('#profile-features a[href*="record-books.html"]').evaluateAll(nodes=>nodes.map(a=>a.getAttribute('href')));
     const expectedRecords='../record-books.html?manager='+encodeURIComponent(name)+'#owned-records';
     if(recordsEntries.length!==1||recordsEntries[0]!==expectedRecords)
      errors.push(width+' '+route+' featured Records shortcut is duplicated or uses stale manager identity');
     // Canonical pages must also remain compact when visitors follow a
     // direct Explore link with the feature-directory hash.
     if(['stilly','tom','stover'].includes(slug)){
      const deepLinkPage=await context.newPage();
      try{
       await deepLinkPage.goto(baseUrl+route+'#profile-features',{waitUntil:'networkidle',timeout:30000});
       await deepLinkPage.locator('#profile-features').waitFor({state:'visible',timeout:10000});
       if(!await deepLinkPage.locator('body').evaluate(el=>el.classList.contains('profile-landing'))||
          await deepLinkPage.locator('main > section.section:visible').count()!==0||
          new URL(deepLinkPage.url()).hash!=='#profile-features')
        errors.push(width+' '+route+' Explore deep link expands archive instead of compact directory');
      }finally{await deepLinkPage.close()}
     }
     if((await page.locator('main .hero h1').innerText()).trim()!==name)
      errors.push(width+' '+route+' manager hero must show the canonical public nickname');
     const heroActions=page.locator('main .hero > .buttons > a');
     if(await heroActions.count()!==2||
        !((await heroActions.first().getAttribute('href'))==='#profile-features'))
      errors.push(width+' '+route+' hero still shows legacy multi-link navigation');
     if(['stilly','tom','stover','birch'].includes(slug)){
      await page.waitForFunction(()=>document.querySelector('#season-history .season-accordion')!==null,null,{timeout:8000}).catch(()=>{});
      const history=await page.locator('#season-history').textContent()||'';
      const required={stilly:['2018','10th place (last)','2019','5th place'],tom:['2019','8th place'],stover:['2019','9th place'],birch:['2017','10th place (last)']}[slug];
      if(required.some(x=>!history.includes(x)))
       errors.push(width+' '+slug+' recovered ESPN finishing places missing from visible season archive');
      if(slug==='stilly'){
       const seasons=await page.locator('#season-history details.season-entry').evaluateAll(nodes=>nodes.map(node=>({text:node.textContent,year:node.querySelector('summary strong')?.textContent,award:node.querySelector('.season-award-label')?.textContent})));
       const awards=seasons.filter(x=>x.award==='Shitter of the Year').map(x=>Number(x.year)).sort((a,b)=>a-b);
       if(JSON.stringify(awards)!==JSON.stringify([2016,2018]))
        errors.push(width+' Stilly season archive must distinguish 2016 and 2018 Shitter awards from official finishing places');
      }
     }
     const shelf=page.locator('details.profile-research-shelf');
     if(await shelf.count()!==1)errors.push(width+' '+route+' research shelf missing');
     else{
      if(await shelf.evaluate(el=>el.open))
       errors.push(width+' '+route+' source-heavy evidence should start collapsed');
      await shelf.locator(':scope > summary').click();
      if(!await shelf.evaluate(el=>el.open))
       errors.push(width+' '+route+' research shelf does not expand');
     }
     // Validate a real navigable destination rather than comparing raw
     // href spellings: browsers and profile scripts can normalize attributes.
     const links=await page.locator('a[href*="manager-lineup-research.html"]').evaluateAll(nodes=>
      nodes.map(node=>{const u=new URL(node.href,location.href);return {
       path:u.pathname,season:u.searchParams.get('season'),
       manager:u.searchParams.get('manager')}}));
     const matches=links.filter(x=>x.path.endsWith('/analytics/manager-lineup-research.html')&&
      x.season==='career'&&x.manager===name);
     if(matches.length<1||links.some(x=>x.path.endsWith('/analytics/manager-lineup-research.html')&&x.manager!==name))
      errors.push(width+' '+route+' invalid Start/Sit career link target: '+JSON.stringify(links));
     const pickupLinks=await page.locator('a[href*="manager-report-cards.html?manager="]').evaluateAll(nodes=>
      nodes.map(node=>{const url=new URL(node.href,location.href);
       return {path:url.pathname,manager:url.searchParams.get('manager')};}));
     if(pickupLinks.filter(x=>x.path.endsWith('/analytics/manager-report-cards.html')&&x.manager===name).length<1)
      errors.push(width+' '+route+' missing verified manager pickup history link: '+JSON.stringify(pickupLinks));
     // All ten manager profiles share one source-backed, partial-season snapshot.
     const career=page.locator('[data-manager-career-resume]');
     if(await career.count()!==1||await career.getAttribute('data-manager-career-resume')!==name)
      errors.push(width+' '+route+' career résumé missing or misattributed');
     else{
      await career.locator(':scope > summary').click();
      const metrics=career.locator('.career-resume-metric');
      if(await metrics.count()!==4)
       errors.push(width+' '+route+' career draft/trade résumé totals unavailable');
      else{
       const receipts=career.locator('details.career-resume-receipts');
       if(await receipts.count()!==1||await receipts.evaluate(el=>el.open))
        errors.push(width+' '+route+' draft/trade receipts must start collapsed');
       else{
        await receipts.locator(':scope > summary').click();
        if(!await career.locator('.career-resume-trades').isVisible()||
           !await career.locator('.career-resume-coverage').isVisible())
         errors.push(width+' '+route+' draft/trade receipts failed to reveal');
       }
       const text=await career.innerText();
       if(!text.includes('Recorded draft selections')||
          !text.includes('Recorded keeper slots')||
          !text.includes('qualifying trade events')||
          !text.includes('2026 trade sides are provisional')||
          !text.includes('not all-time trade totals'))
        errors.push(width+' '+route+' career résumé evidence/caveat incomplete');
       const links=await career.locator('.career-resume-link').evaluateAll(nodes=>
        nodes.map(node=>{const url=new URL(node.href);return {
         manager:url.searchParams.get('manager'),year:url.searchParams.get('year'),
         path:url.pathname};}));
       if(links.some(link=>link.manager!==name||
          !/^202[0-5]$/.test(link.year)||
          !link.path.endsWith('/analytics/manager-trade-intelligence.html')))
        errors.push(width+' '+route+' career trade evidence deep links invalid');
      }
     }
     const timeline=page.locator('[data-manager-season-evidence]');
     if(await timeline.count()!==1||await timeline.getAttribute('data-manager-season-evidence')!==name)
      errors.push(width+' '+route+' manager season-evidence module missing');
     else {
      await timeline.locator(':scope > summary').click();
      const entries=timeline.locator('.profile-season-evidence-row');
      if(await entries.count()<3)
       errors.push(width+' '+route+' insufficient documented manager seasons');
      else {
       const yearDetails=timeline.locator('details.profile-season-year-details');
       if(await yearDetails.count()!==await entries.count())
        errors.push(width+' '+route+' not every season has an expandable year row');
       const defaultOpen=await yearDetails.evaluateAll(nodes=>nodes.filter(node=>node.open).length);
       if(defaultOpen!==0)
        errors.push(width+' '+route+' year details should start collapsed');
       const heading=await yearDetails.first().locator(':scope > summary').innerText();
       if(!heading.includes('2026')||!heading.includes('in progress'))
        errors.push(width+' '+route+' current season lacks clear first-glance status');
       for(const yearRow of await yearDetails.all())
        await yearRow.locator(':scope > summary').click();
       if(!await yearDetails.first().locator('.profile-season-draft-trade').isVisible())
        errors.push(width+' '+route+' expanded year fails to reveal original evidence');
       const text=await timeline.innerText();
       if(!text.includes('pickups')||!text.includes('2026')||
          !text.includes('No invented skill grades')||
          !text.includes('not total trades or wins'))
        errors.push(width+' '+route+' season timeline provenance warning or data missing');
       const draftTrade=timeline.locator('.profile-season-draft-trade');
       const expectedDraftSeasons=(await entries.count())-(name==='JMid'?1:0);
       if(await draftTrade.count()!==expectedDraftSeasons)
        errors.push(width+' '+route+' missing or misattributed season-level draft or trade evidence');
       if(name==='JMid'&&!(await timeline.innerText()).includes('Original draft not attributable to this manager'))
        errors.push(width+' '+route+' 2023 original draft attribution caveat missing');
       const currentYear=entries.first();
       if(!((await currentYear.innerText()).includes('Draft ·'))||
          !((await currentYear.innerText()).includes('Trades ·'))||
          !((await currentYear.innerText()).includes('not trade wins or losses')))
        errors.push(width+' '+route+' draft or trade event incorrectly scored');
       if(!text.includes('Current W–L not shown; archived record stops before Week 8'))
        errors.push(width+' '+route+' 2026 timeline leaked outdated Week 7 W–L');
       const tradeLinks=await timeline.locator('.profile-season-trade-link').evaluateAll(nodes=>
        nodes.map(node=>{const url=new URL(node.href);return {
         manager:url.searchParams.get('manager'),year:url.searchParams.get('year'),
         path:url.pathname};}));
       if(!tradeLinks.length||tradeLinks.some(x=>x.manager!==name||
           !/^202[0-6]$/.test(x.year)||!x.path.endsWith('/analytics/manager-trade-intelligence.html')))
        errors.push(width+' '+route+' season-specific trade research links invalid');
      }
     }
     const office=page.locator('.profile-front-office-snapshot');
     if(await office.count()!==1||await office.locator('.profile-front-office-tile').count()!==3)
      errors.push(width+' '+route+' front-office research snapshot did not render');
     else {
      const text=await office.innerText();
      if(!text.includes('2026 Weeks 1–')||!text.includes('not a decision grade')||
         !text.includes('2020–26'))
       errors.push(width+' '+route+' front-office provenance or partial-season disclosure missing');
      const direct=await office.locator('a').evaluateAll(nodes=>nodes.map(a=>({
       path:new URL(a.href).pathname,manager:new URL(a.href).searchParams.get('manager')
      })));
      if(direct.length!==3||direct.some(x=>x.manager!==name))
       errors.push(width+' '+route+' front-office manager drill-down routing mismatch');
     }
    }
   }
   // Exercise both the curated Stover layout and a standard manager profile
   // from the actual homepage-style hash destination (not just an href check).
   if(width===390&&(route==='managers/stover/'||route==='managers/stilly/')){
    const direct=await context.newPage();
    await direct.setViewportSize({width:390,height:844});
    for(const section of ['seasons','rivalries']){
     await direct.goto(baseUrl+route+'#'+section,{waitUntil:'networkidle'});
     const result=await direct.evaluate(section=>{
      const selected=document.querySelector('[data-profile-tab="'+section+'"]');
      const nav=document.querySelector('[data-manager-profile-tabs]');
      const bounds=nav?.getBoundingClientRect();
      return {selected:selected?.getAttribute('aria-selected'),
       visible:!!bounds&&bounds.bottom>0&&bounds.top<window.innerHeight,
       hash:location.hash};
     },section);
     if(result.selected!=='true'||!result.visible||result.hash!=='#'+section)
      errors.push(width+' '+route+' homepage deep link did not reveal '+section+' tab: '+JSON.stringify(result));
    }
    await direct.close();
   }
   if(route==='analytics/manager-lineup-research.html'){
    // Run full DOM, fetch, event and responsive checks in both browser engines.
    const completedWeek=await page.evaluate(async()=>{
     const response=await fetch(new URL('../data/keeper_2026_website_research_v1.json',location.href));
     if(!response.ok)throw Error('Missing completed-week metadata');
     return (await response.json()).throughWeek;
    });
    if(!Number.isInteger(completedWeek)||completedWeek<8||completedWeek>14)
     errors.push(width+' Start/Sit completed-week metadata invalid');

    const managerRows=page.locator('#results tr');
    if(await managerRows.count()!==10)
     errors.push(width+' Start/Sit page did not render ten 2026 managers');
    if(await page.locator('#season').inputValue()!=='2026')
     errors.push(width+' Start/Sit page did not default to 2026');
    const firstManager=await managerRows.first().innerText();
    if(completedWeek===8&&(!firstManager.includes('Stilly')||!firstManager.includes('92.4%')))
     errors.push(width+' Start/Sit Week 8 ranking/benchmark mismatch');
    // The simplified Start/Sit page puts research details behind user-opened panels.
    await page.locator('details.detail-panel').first().locator('summary').click();
    await page.locator('#weekly-detail summary').click();
    const stillyDetail=await page.locator('#detail-summary').innerText();
    if(completedWeek===8&&!stillyDetail.includes('92.4%'))
     errors.push(width+' Start/Sit Week 8 Stilly weekly summary mismatch');
    if(await page.locator('#weekly-results tr').count()!==completedWeek)
     errors.push(width+' Start/Sit weekly detail does not match completed-week count');
    await page.locator('#detail-manager').selectOption('2026|Kuhl');
    if((completedWeek===8&&!((await page.locator('#detail-summary').innerText()).includes('83.1%')))||
       !((await page.locator('#career-summary').innerText()).includes('Kuhl')))
     errors.push(width+' Start/Sit manager change failed to update weekly and career views');
    await page.goto(baseUrl+'analytics/manager-lineup-research.html?season=career&manager=Stilly',
      {waitUntil:'networkidle',timeout:30000});
    await page.locator('details.detail-panel').first().locator('summary').click();
    if(await page.locator('#season').inputValue()!=='career'||
       await page.locator('#detail-manager').inputValue()!=='Stilly'||
       !((await page.locator('#career-summary').innerText()).includes('recency-weighted observed efficiency')))
     errors.push(width+' Start/Sit career manager deep link did not load');
    if(await page.locator('#career-results tr').count()!==7)
     errors.push(width+' Start/Sit career view did not render seven seasons');
    // Failure injection: a missing scored weekly source must never leave
    // made-up or stale lineup totals on the page.
    const failure=await context.newPage();
    await failure.route('**/data/sleeper_roster_snapshots_2026_week4.json',
     route=>route.fulfill({status:404,body:'Missing archived week'}));
    await failure.goto(baseUrl+'analytics/manager-lineup-research.html?season=2026&manager=Stilly',
     {waitUntil:'networkidle',timeout:30000});
    if(!((await failure.locator('#status').innerText()).includes('Source or model error'))||
       await failure.locator('#results tr').count()!==0||
       await failure.locator('#weekly-results tr').count()!==0||
       await failure.locator('#career-results tr').count()!==0)
     errors.push(width+' Start/Sit failed archive did not clear provisional display');
    await failure.close();
    const math=page.locator('details.lineup-method-details');
    if(await math.count()!==1||await math.evaluate(el=>el.open))
     errors.push(width+' lineup source explanation should start collapsed');
    await math.locator(':scope > summary').click();
    if(!await math.locator('p').isVisible())
     errors.push(width+' lineup method explanation did not expand');
    const grade=await page.locator('.notice').innerText();
    if(!grade.includes('rather than a certified manager-skill grade'))
     errors.push(width+' Start/Sit research caveat not visible');
   }
   if(['analytics/goat-debate.html','analytics/records-archive.html','analytics/franchise-timeline.html'].includes(route)){
    if(await page.locator('nav a[href="legacy.html"],.top-links a[href="legacy.html"]').count()>0)
     errors.push(width+' '+route+' points visitors to superseded ratings');
    if(await page.locator('a[href="power-ratings.html"]').count()===0)
     errors.push(width+' '+route+' missing current all-time ranking navigation');
   }
   if(route==='analytics/manager-performance-timeline.html'){
    const notes=page.locator('details.timeline-notes');
    if(await notes.count()!==1||await notes.evaluate(el=>el.open))
     errors.push(width+' career timeline methodology should begin collapsed');
    await notes.locator('summary').click();
    if(!await notes.locator('a[href="../data/season_guide.json"]').isVisible())
     errors.push(width+' career timeline archive sources not accessible');
    if((await page.locator('body').innerText()).includes('Loading canonical season records'))
     errors.push(width+' career timeline exposes developer-facing load message');
   }
   if(route==='analytics/manager-league-benchmarks.html'){
    const more=page.locator('details').filter({hasText:'How are these comparisons calculated?'});
    if(await more.count()!==1||await more.evaluate(el=>el.open))
     errors.push(width+' advanced comparison details not collapsed');
    if(!await page.locator('.notice').innerText().then(x=>x.includes('Neither measure is a certified decision-skill rating')))
     errors.push(width+' comparison grading caveat missing');
   }
   if(route==='analytics/manager-report-cards.html'){
    const picker=page.locator('#report-manager-picker');
    const research=page.locator('details.report-more-links');
    const coverage=page.locator('details.report-coverage-guide');
    if(await picker.count()!==1||await research.count()!==1||await coverage.count()!==1)
     errors.push(width+' report cards finder or optional research disclosures missing');
    else if(!await picker.evaluate(el=>Boolean(el.compareDocumentPosition(document.querySelector('details.report-more-links'))&Node.DOCUMENT_POSITION_FOLLOWING))||
            !await picker.evaluate(el=>Boolean(el.compareDocumentPosition(document.querySelector('details.report-coverage-guide'))&Node.DOCUMENT_POSITION_FOLLOWING)))
     errors.push(width+' report card research controls should follow manager finder');

    const firstCard=page.locator('[data-report-manager]').first();
    if(!((await firstCard.locator('.label').first().innerText()).toLowerCase().includes('report-card rank #')))
     errors.push(width+' report card rank label missing clear meaning');
    const highlights=page.locator('details.pickup-highlights');
    for(const panel of await highlights.all()){
     const shown=await panel.locator('li').count();
     const summary=await panel.locator(':scope > summary').innerText();
     if(!summary.includes(shown+' examples'))
      errors.push(width+' report card pickup count differs from displayed examples');
    }
    const coverageGuide=page.locator('details.report-coverage-guide');
    if(await coverageGuide.count()!==1||await coverageGuide.evaluate(el=>el.open))
     errors.push(width+' report-card evidence caveats should be concise and initially collapsed');
    else{
     await coverageGuide.locator('summary').click();
     if(!(await coverageGuide.innerText()).includes('N/A is not zero'))
      errors.push(width+' report-card missing-rating explanation unavailable');
    }
    const more=page.locator('details.report-more-links');
    if(await more.count()!==1||await more.evaluate(el=>el.open))
     errors.push(width+' report cards should tuck secondary research links away');
    if(await page.locator('.report-top-nav a').count()!==5)
     errors.push(width+' report cards primary navigation should retain five core destinations');
    const copy=await page.locator('body').innerText();
    if(copy.includes('Manager Development Lab · Preview')||copy.includes('archived matchup API data and supplied screenshots'))
     errors.push(width+' report card landing exposes internal development copy');
    await more.locator(':scope > summary').click();
    if(!await more.locator('a[href="manager-lineup-research.html"]').isVisible())
     errors.push(width+' report card linked statistics not reachable');
   }
   if(route==='analytics/manager-report-cards.html'){
    const count=await page.locator('[data-report-manager]').count();
    if(count!==10)errors.push(width+' report card preview rendered '+count+' of 10 managers');
    const reportSelect=page.locator('#report-manager-select');
    if(await reportSelect.count()!==1||await reportSelect.locator('option').count()!==11)
     errors.push(width+' report card selector must list all ten managers plus all');
    else{
     await reportSelect.selectOption('Birch');
     const selected=page.locator('#cards [data-report-manager]:visible');
     if(await selected.count()!==1||await selected.first().getAttribute('data-report-manager')!=='Birch'||
        !(await page.locator('#report-manager-count').innerText()).includes('Birch'))
      errors.push(width+' report manager selector did not isolate requested manager');
     await reportSelect.selectOption('');
     if(await selected.count()!==10||
        !(await page.locator('#report-manager-count').innerText()).includes('All 10'))
      errors.push(width+' report manager selector did not restore all report cards');
    }
    const scouting=page.locator('[data-report-manager] details.report-evidence-details details.report-scouting-more');
    if(await scouting.count()!==10||await scouting.evaluateAll(nodes=>nodes.some(node=>node.open)))
     errors.push(width+' detailed scouting dossier must be nested and initially collapsed');
    const factTiles=page.locator('[data-report-manager] .report-fact-grid');
    const factMethods=page.locator('[data-report-manager] details.report-fact-method');
    if(await factTiles.count()!==10||await factMethods.count()!==10)
     errors.push(width+' missing verified evidence tiles for all ten manager report cards');
    else{
     const accurate=await factTiles.evaluateAll(nodes=>nodes.every(n=>
       n.querySelectorAll('.report-fact').length===3&&
       n.textContent.includes('Career top-three finishes')&&
       n.textContent.includes('Recorded pickups later started')&&
       n.textContent.includes('2026 W8 start/sit accuracy')));
     if(!accurate)errors.push(width+' missing factual evidence or incorrect report card tile count');
     if(await factMethods.evaluateAll(nodes=>nodes.some(n=>n.open)))
      errors.push(width+' evidence methodology should remain collapsed by default');
     const firstMethod=factMethods.first();
     await firstMethod.locator(':scope > summary').click();
     if(!await firstMethod.locator('p.fine').first().isVisible()||
        !(await firstMethod.innerText()).includes('Not rated')||
        !(await firstMethod.innerText()).includes('successful waiver claims'))
      errors.push(width+' verified manager facts, FAAB totals, or honest unrated explanation not accessible');
     const faabHistory=firstMethod.locator('details.report-faab-history');
     if(await faabHistory.count()!==1)
      errors.push(width+' source-backed FAAB season history missing');
     else{
      await faabHistory.locator('summary').click();
      const count=await faabHistory.locator('li').count();
      const historyText=await faabHistory.innerText();
      if(count<2||!historyText.includes('2026 (through W7)')||
         !historyText.includes('winning spend')||!historyText.includes('$0 wins'))
       errors.push(width+' incomplete provider FAAB by-season history');
      await faabHistory.locator('summary').click();
     }
     const pickupHistory=firstMethod.locator('details.report-pickup-history');
     if(await pickupHistory.count()!==1)
      errors.push(width+' season-by-season pickup evidence missing');
     else{
      await pickupHistory.locator('summary').click();
      const rows=pickupHistory.locator('li');
      if(await rows.count()<2||
         !(await pickupHistory.innerText()).includes('later started')||
         !(await pickupHistory.innerText()).includes('repeat adds'))
       errors.push(width+' incomplete seasonal acquisition usage details');
      await pickupHistory.locator('summary').click();
     }
     const lineupHistory=firstMethod.locator('details.report-lineup-history');
     if(await lineupHistory.count()!==1)
      errors.push(width+' missing historical lineup coverage');
     else{
      await lineupHistory.locator(':scope > summary').click();
      if(await lineupHistory.locator('li').count()!==6||
         !(await lineupHistory.innerText()).includes('comparable')||
         !(await lineupHistory.innerText()).includes('Excluded weeks are not failures or zero scores'))
       errors.push(width+' historical lineup season coverage or evidence caveats missing');
      await lineupHistory.locator(':scope > summary').click();
     }
     const keeperHistory=firstMethod.locator('details.report-keeper-history');
     if(await keeperHistory.count()!==1)
      errors.push(width+' keeper source detail missing');
     else{
      await keeperHistory.locator('summary').click();
      const keepers=keeperHistory.locator('li');
      if(await keepers.count()!==2||
         !(await keeperHistory.innerText()).includes('started points')||
         !(await keeperHistory.innerText()).includes('2025 declarations'))
       errors.push(width+' keeper player evidence or decision caveat missing');
      await keeperHistory.locator('summary').click();
     }
     await firstMethod.locator(':scope > summary').click();
    }
    const thommyMethod=page.locator('[data-report-manager="Thommy"] details.report-fact-method');
    if(await thommyMethod.count()!==1)
     errors.push(width+' Thommy historical source evidence missing');
    else{
     await thommyMethod.locator(':scope > summary').click();
     const bySeason=thommyMethod.locator('details.report-lineup-history');
     await bySeason.locator(':scope > summary').click();
     const history=await bySeason.innerText();
     if(!history.includes('W3 Vacant starting slot')||
        !history.includes('W9 Vacant starting slot'))
      errors.push(width+' excluded historical lineup weeks missing factual explanations');
     await bySeason.locator(':scope > summary').click();
     await thommyMethod.locator(':scope > summary').click();
    }
    const categoryPanels=page.locator('[data-report-manager] details.report-category-details');
    const evidencePanels=page.locator('[data-report-manager] details.report-evidence-details');
    if(await categoryPanels.count()!==10||await evidencePanels.count()!==10)
     errors.push(width+' report cards missing progressive category or evidence panels');
    else{
     if(await categoryPanels.evaluateAll(nodes=>nodes.some(n=>n.open))||
        await evidencePanels.evaluateAll(nodes=>nodes.some(n=>n.open)))
      errors.push(width+' report card deep research must start collapsed');
     const first=categoryPanels.first();
     await first.locator(':scope > summary').click();
     if(!await first.locator('.grid').isVisible()||await first.locator('.grade').count()!==10)
      errors.push(width+' report card category drilldown failed to show ten ratings');
     await first.locator(':scope > summary').click();
     const evidence=evidencePanels.first();
     await evidence.locator(':scope > summary').click();
     if(!(await evidence.innerText()).includes('Scored dimensions:')||
        !await evidence.locator('a[href*="manager-lineup-research.html"]').isVisible())
      errors.push(width+' report card career evidence not available on demand');
     await evidence.locator(':scope > summary').click();
    }
    const comparisonPanel=page.locator('details.report-compare-panel');
    if(await comparisonPanel.count()!==1||await comparisonPanel.evaluate(el=>el.open))
     errors.push(width+' report card comparison should start collapsed after ranking cards');
    else{
     const ordered=await page.evaluate(()=>{
      const cards=document.getElementById('cards');
      const compare=document.querySelector('.report-compare-panel');
      return !!cards&&!!compare&&Boolean(cards.compareDocumentPosition(compare)&Node.DOCUMENT_POSITION_FOLLOWING);
     });
     if(!ordered)errors.push(width+' report card comparison appears before manager results');
     await comparisonPanel.locator(':scope > summary').click();
     if(!await page.locator('#compare-a').isVisible()||
        !await page.locator('#compare-b').isVisible())
      errors.push(width+' report card comparison controls do not open');
     await page.locator('#compare-a').selectOption('Stilly');
     await page.locator('#compare-b').selectOption('Stew');
     await page.locator('#compare-go').click();
     if(!(await page.locator('#comparison').innerText()).includes('Stilly')||
        !(await page.locator('#comparison').innerText()).includes('Stew'))
      errors.push(width+' report card comparison did not update selected managers');
     await comparisonPanel.locator(':scope > summary').click();
    }
    const scoreSummaries=page.locator('[data-report-manager] .report-score-summary');
    const scoreGuides=page.locator('[data-report-manager] details.report-score-guide');
    if(await scoreSummaries.count()!==10||await scoreGuides.count()!==10)
     errors.push(width+' report cards missing plain-language score explanations');
    else{
     const summaryText=await scoreSummaries.first().innerText();
     if(!summaryText.includes('weighted summary')||!summaryText.includes('not a win percentage')||
        !summaryText.includes('Legacy OVR'))
      errors.push(width+' report-card overall score explanation incomplete');
     const guide=scoreGuides.first();
     if(await guide.evaluate(el=>el.open))
      errors.push(width+' report-card category glossary should start collapsed');
     const category=guide.locator('xpath=ancestor::details[contains(concat(" ", normalize-space(@class), " "), " report-category-details ")]');
     if(await category.count()!==1)
      errors.push(width+' rating definitions not nested under category ratings');
     else await category.locator(':scope > summary').click();
     await guide.locator(':scope > summary').click();
     const explanation=await guide.innerText();
     if(!explanation.includes('not a percentage of correct decisions')||
        !explanation.includes('N/A means not rated')||
        !explanation.includes('Missing skill grades are excluded')||
        await guide.locator('dt').count()!==10)
      errors.push(width+' report-card category scoring glossary incomplete');
    }
    const highlights=page.locator('[data-report-manager] details.pickup-highlights');
    if(await highlights.count()!==10)
     errors.push(width+' report cards did not show ten source-backed pickup highlights');
    else{
     const entries=await highlights.locator('li').count();
     if(entries!==30)errors.push(width+' report cards expected three selected pickup examples per manager, got '+entries);
     const first=highlights.first();
     await first.locator('summary').click();
     const content=await first.innerText();
     if(!content.includes('starts')||!content.includes('lineup pts')||
        !content.includes('Not all pickups')||!content.includes('Not a FAAB skill grade'))
      errors.push(width+' pickup highlights missing actual starter-point evidence or research caveats');
     // Confirm an actually paid waiver and an unpriced ordinary add against
     // completed provider receipts, not the absence of a price field.
     for(const [manager,expected] of [['Stew','Cost: $12 FAAB · Waiver claim'],
      ['Tony','Cost: $0 · Free agent (after waivers)']]){
      const details=page.locator('[data-report-manager="'+manager+'"] details.pickup-highlights');
      await details.locator('summary').click();
      await page.waitForFunction(name=>{
       const el=document.querySelector('[data-report-manager="'+name+'"] .pickup-cost');
       return !!el&&el.textContent.startsWith('Cost: ')&&
        !el.textContent.includes('checking')&&!el.textContent.includes('open to verify');
      },manager,{timeout:10000});
      const actual=await details.locator('.pickup-cost').first().innerText();
      if(actual!==expected)
       errors.push(width+' '+manager+' pickup receipt amount mismatch: '+actual);
     }
     // A normal manager report card starts simple. Explicit #cards pickup
     // deep links retain the old expand-and-focus behavior for evidence.
     await page.goto(baseUrl+'analytics/manager-report-cards.html?manager=Stilly',{waitUntil:'networkidle'});
     const simpleCard=page.locator('[data-report-manager="Stilly"]');
     if(await simpleCard.count()!==1||
        await simpleCard.locator('details.pickup-highlights').evaluate(el=>el.open)||
        await simpleCard.locator('details.report-category-details').evaluate(el=>el.open)||
        !await page.locator('a[data-report-all-managers]').count()||
        !await page.locator('a[data-report-return-profile]').count())
      errors.push(width+' focused report card does not begin with a concise manager view');
     if(!await page.locator('a[data-report-all-managers][href="manager-report-cards.html"]').isVisible())
      errors.push(width+' focused report card cannot return to all manager rankings');
     if(await page.locator('#report-manager-picker').isVisible())
      errors.push(width+' focused report card should not show an unrelated manager filter');
     // The explicit pickup deep link shows sourced details immediately.
     await page.goto(baseUrl+'analytics/manager-report-cards.html?manager=Stilly#cards',{waitUntil:'networkidle'});
     const filtered=page.locator('[data-report-manager]');
     if(await filtered.count()!==1||await filtered.first().getAttribute('data-report-manager')!=='Stilly')
      errors.push(width+' filtered pickup deep link did not isolate Stilly');
     const opened=filtered.locator('details.pickup-highlights');
     if(await opened.count()!==1||!(await opened.evaluate(el=>el.open)))
      errors.push(width+' filtered pickup deep link did not auto-open the highlights');
     if(await opened.locator('li').count()!==3)
      errors.push(width+' filtered pickup view lacks its three sourced highlights');
     const returnToProfile=page.locator('a[data-report-return-profile]');
     if(await returnToProfile.count()!==1||await returnToProfile.getAttribute('href')!=='../managers/stilly/'||
        !await page.locator('main h1').innerText().then(x=>x.includes("Stilly's Report Card"))||
        await page.locator('section[aria-label="Compare managers"]').isVisible())
      errors.push(width+' filtered report card does not return to its manager or hide unrelated comparisons');
    }
   }
   if(route===''){
    const ratingGuide=page.locator('details.home-rating-guide');
    if(await ratingGuide.count()!==1||await ratingGuide.evaluate(el=>el.open))
     errors.push(width+' home Legacy OVR glossary should begin collapsed');
    else{
     await ratingGuide.locator('summary').click();
     const guideText=await ratingGuide.innerText();
     if(!guideText.includes('Season OVR')||!guideText.includes('Report-card scores'))
      errors.push(width+' home ratings glossary missing clear model distinction');
    }
    const desktopNav=page.locator('.main-nav');
    const mobileNav=page.locator('details.mobile-menu');
    if(width===390){
     if(await page.locator('main .hero .actions .button:visible').count())
      errors.push(width+' duplicate hero actions compete with the immediately available manager finder');
     if(!await mobileNav.isVisible()||await desktopNav.isVisible())errors.push(width+' homepage mobile navigation visibility wrong');
     await mobileNav.locator(':scope > summary').click();
     for(const href of ['managers/','analytics/manager-report-cards.html','analytics/records.html','analytics/rivalries.html'])
      if(!await mobileNav.locator('nav.menu-links > a[href="'+href+'"]').isVisible())errors.push(width+' mobile main navigation missing '+href);
     const extra=mobileNav.locator('details.home-mobile-explore');
     if(await extra.count()!==1||await extra.evaluate(el=>el.open))
      errors.push(width+' mobile advanced navigation must start collapsed');
     await extra.locator(':scope > summary').click();
     for(const href of ['hall/','analytics/power-ratings.html','analytics/sportscenter.html','seasons/','analytics/search.html'])
      if(!await extra.locator('a[href="'+href+'"]').isVisible())errors.push(width+' mobile Explore destination missing '+href);
     await mobileNav.locator(':scope > summary').click();
    }else{
     if(await desktopNav.locator(':scope > a').count()!==4)errors.push(width+' homepage must show four primary destinations plus Explore');
     const more=desktopNav.locator('details.home-nav-more');
     if(await more.count()!==1||await more.evaluate(el=>el.open))errors.push(width+' desktop extra navigation should begin collapsed');
     await more.locator(':scope > summary').click();
     for(const href of ['hall/','analytics/power-ratings.html','analytics/sportscenter.html','seasons/','analytics/search.html'])
      if(!await more.locator('a[href="'+href+'"]').isVisible())errors.push(width+' desktop extra navigation missing '+href);
     await more.locator(':scope > summary').click();
    }
   }
   if(route===''){
    // Real new-visitor journey: homepage -> manager profile -> back ->
    // manager directory -> manager profile. No internal/test-only shortcuts.
    const visitor=await context.newPage();
    try{
     await visitor.goto(baseUrl,{waitUntil:'networkidle',timeout:30000});
     if(width===390){
      const row=visitor.locator('#home-manager-mobile details[data-manager-name^="stilly"]');
      if(await row.count()!==1)errors.push(width+' first-visit Stilly manager row is missing');
      else{
       await row.locator(':scope > summary').click();
       await row.locator('a.mobile-manager-link').click();
      }
     }else{
      const card=visitor.locator('#home-manager-cards a[href="managers/stilly/"]');
      if(await card.count()!==1)errors.push(width+' first-visit Stilly manager card is missing');
      else await card.click();
     }
     await visitor.waitForURL('**/managers/stilly/',{timeout:10000});
     await visitor.locator('#profile-features').waitFor({state:'visible',timeout:10000});
     if(!(await visitor.locator('main .hero h1').innerText()).includes('Stilly')||
        !await visitor.locator('#profile-features').isVisible())
      errors.push(width+' first-visit homepage manager link failed to reach usable profile');
     await visitor.goBack({waitUntil:'networkidle'});
     if(!visitor.url().endsWith('/fellas-hall-of-fame/'))
      errors.push(width+' first-visit browser back did not restore homepage');
     if(width===390){
      const menu=visitor.locator('details.mobile-menu');
      await menu.locator(':scope > summary').click();
      await menu.locator('nav.menu-links > a[href="managers/"]').click();
     }else await visitor.locator('.main-nav > a[href="managers/"]').click();
     await visitor.waitForURL('**/managers/',{timeout:10000});
     if(!(await visitor.locator('main h1').innerText()).includes('Meet the Fellas'))
      errors.push(width+' first-visit navigation failed to reach manager directory');
     await visitor.locator('#manager-directory-cards a.manager[href="stilly/"]').click();
     await visitor.waitForURL('**/managers/stilly/',{timeout:10000});
     await visitor.locator('#profile-features').waitFor({state:'visible',timeout:10000});
     if(!await visitor.locator('#profile-features').isVisible())
      errors.push(width+' first-visit directory manager link failed to reveal feature navigation');
    }catch(error){
     errors.push(width+' first-visit end-to-end navigation journey failed: '+String(error));
    }finally{await visitor.close();}
   }
   if(route===''){
    const leagueSection=page.locator('section.section.shell').filter({has:page.getByRole('heading',{name:'Explore the league'})});
    const recordsSection=page.locator('section.section.shell[aria-labelledby="season-records-home"]');
    if(await leagueSection.count()!==1||await recordsSection.count()!==1||
       !await leagueSection.evaluate(el=>Boolean(el.compareDocumentPosition(document.querySelector('[aria-labelledby="season-records-home"]'))&Node.DOCUMENT_POSITION_FOLLOWING)))
     errors.push(width+' homepage should introduce league destinations before advanced Season OVR research');
   }
   if(route===''){
    const seasonLinks=page.locator('a[href="analytics/manager-madden-cards.html#records-heading"]');
    if(await seasonLinks.count()<2)errors.push(width+' homepage missing prominent Season OVR record book links');
    if(await page.locator('#home-manager-cards a').count()!==10)errors.push(width+' homepage must retain ten clickable Legacy OVR manager cards');
   }
   if(route===''){
    if(await page.locator('a[href="analytics/legacy.html"]').count()>0)
     errors.push(width+' homepage links to obsolete Legacy Score prototype');
   }
   if(['analytics/manager-trade-intelligence.html','analytics/manager-lineup-research.html'].includes(route)){
    const navLinks=page.locator('nav.research-top-nav a');
    if(await navLinks.count()!==3)errors.push(width+' '+route+' research return links missing');
    else{
     const paths=await navLinks.evaluateAll(nodes=>nodes.map(a=>a.getAttribute('href')));
     if(JSON.stringify(paths)!==JSON.stringify(['../managers/','manager-report-cards.html','../index.html']))
      errors.push(width+' '+route+' research return links point to wrong destinations');
    }
   }
   if(route==='analytics/manager-trade-intelligence.html'){
    const optional=page.locator('details.trade-advanced');
    if(await optional.count()!==2||await optional.evaluateAll(nodes=>nodes.some(node=>node.open)))
     errors.push(width+' trade history research panels should begin collapsed');
    const controls=page.locator('#manager,#season,#coverage');
    if(await controls.count()!==3)errors.push(width+' trade history filters missing');
    await optional.first().locator(':scope > summary').click();
    if(!await optional.first().locator('#impact-summary').isVisible())
     errors.push(width+' trade history record-coverage details did not expand');
    await optional.nth(1).locator(':scope > summary').click();
    if(!await optional.nth(1).locator('#asset-query').isVisible())
     errors.push(width+' trade history player search did not expand');
    const warning=await page.locator('.warning').innerText();
    if(!warning.includes('do not prove who won the deal'))
     errors.push(width+' trade history limitation missing');
   }
   if(route==='analytics/manager-decision-audit.html'){
    if(!await page.locator('h1').innerText().then(x=>x.includes('Drafts, Trades & Pickups')))
     errors.push(width+' decisions page lacks visitor-facing heading');
    if(await page.locator('#manager,#season,#type').count()!==3)
     errors.push(width+' manager decisions filters missing');
    const guide=page.locator('details').filter({hasText:'How are these results selected?'});
    if(await guide.count()!==1||await guide.evaluate(el=>el.open))
     errors.push(width+' manager decisions methods should begin collapsed');
    await guide.locator('summary').click();
    if(!await guide.locator('a[href="../data/v9_trade_engine.json"]').isVisible())
     errors.push(width+' manager decisions original source link unavailable');
    const warning=await page.locator('.notice').innerText();
    if(!warning.includes('not a complete ranking of manager skill'))
     errors.push(width+' manager decisions evidence limitation missing');
   }
   if(route==='managers/index.html'){
    const directoryStyle=page.locator('#manager-directory-readability');
    if(await directoryStyle.count()!==1)
     errors.push(width+' managers directory readability styles missing');
    const cardSpacing=await page.locator('#manager-directory-cards a.manager').first().evaluate(el=>{
      const card=getComputedStyle(el),title=getComputedStyle(el.querySelector('h2'));
      return {gap:parseFloat(card.gap),line:parseFloat(title.lineHeight),direction:card.flexDirection}
    });
    if(cardSpacing.gap<9||cardSpacing.line<25||cardSpacing.direction!=='column')
     errors.push(width+' manager directory cards still have cramped hierarchy');
    const cards=page.locator('#manager-directory-cards a.manager');
    if(await cards.count()!==10)errors.push(width+' managers directory needs exactly 10 profile links');
    if(await page.locator('details.manager-nav-more a[href="../analytics/records.html"]').count()!==0)
     errors.push(width+' manager directory repeats the primary Records link inside More');
    const extra=page.locator('details.manager-nav-more');
    if(await extra.count()!==1||await extra.evaluate(el=>el.open))
     errors.push(width+' managers navigation extras should start collapsed');
    await extra.locator(':scope > summary').click();
    if(!await extra.locator('a[href="../analytics/trade-museum.html"]').isVisible())
     errors.push(width+' managers extra destinations not reachable');
    const input=page.locator('#manager-name-search');
    await input.fill('stover');
    if(await page.locator('#manager-directory-cards a.manager:visible').count()!==1||!await page.locator('a.manager[href="stover/"]').isVisible())
     errors.push(width+' manager quick search should reveal only Stover');
    await input.fill('not-a-manager');
    if(!await page.locator('#manager-no-results').isVisible()||await page.locator('#manager-directory-cards a.manager:visible').count()!==0)
     errors.push(width+' manager search empty state incorrect');
    await input.fill('');
    if(await page.locator('#manager-directory-cards a.manager:visible').count()!==10||!await page.locator('#manager-no-results').isHidden())
     errors.push(width+' clearing manager search did not restore all ten');
   }
   if(route==='analytics/franchise-encyclopedia.html'){
    const managerLink=page.locator('header .nav a[href="../managers/"]');
    if(await managerLink.count()!==1)errors.push(width+' player history does not link to manager directory');
    const coverage=page.locator('details.history-coverage');
    if(await coverage.count()!==1||await coverage.evaluate(el=>el.open))
     errors.push(width+' player history evidence notes should begin collapsed');
    await coverage.locator(':scope > summary').click();
    if(!await coverage.locator('p').isVisible())errors.push(width+' player history coverage details did not expand');
    if(await page.locator('h1').innerText()!=='Manager Player Histories')
     errors.push(width+' player history title exposes old research label');
    if(await page.locator('#manager option').count()!==10)
     errors.push(width+' player history manager chooser missing managers');
    const linkedProfile=await page.locator('#profile').getAttribute('href');
    if(!linkedProfile||linkedProfile==='#')errors.push(width+' player history profile navigation not initialized');
   }
   if(route==='analytics/this-week-history.html'){
    const heading=await page.locator('h1').innerText();
    if(heading.trim().toLocaleLowerCase()!=='this week in fellas history')errors.push(width+' historical weekly page title missing');
    const method=page.locator('details.history-method');
    if(await method.count()!==1||await method.evaluate(el=>el.open))
     errors.push(width+' weekly archive methods should begin collapsed');
    await method.locator(':scope > summary').click();
    if(!await method.locator('a[href="trade-museum.html"]').isVisible())
     errors.push(width+' weekly archive source links inaccessible');
    if(await page.locator('.callout .metric').innerText()!=='Weeks 1–6')
     errors.push(width+' weekly archive coverage window unclear');
    if(await page.locator('a[href="power-ratings.html"]').count()!==1||await page.locator('nav a[href="legacy.html"]').count()>0)
     errors.push(width+' weekly archive navigation points to obsolete Legacy prototype');
    if(await page.locator('#week option').count()!==17||await page.locator('#kind option').count()!==3)
     errors.push(width+' weekly archive filters missing');
   }
   if(route==='analytics/trade-museum.html'){
    const links=page.locator('nav.tm-nav a[href="power-ratings.html"]');
    if(await links.count()!==1)errors.push(width+' trade museum repeats legacy navigation links');
    const explanation=page.locator('details.tm-notice');
    if(await explanation.count()!==1||await explanation.evaluate(el=>el.open))
     errors.push(width+' trade methodology should start collapsed');
    await explanation.locator(':scope > summary').click();
    if(!await explanation.locator('a[href="trades.html"]').isVisible())
     errors.push(width+' trade museum methodology link unavailable');
    const visible=await page.locator('body').innerText();
    if(visible.includes('Stage 66 verified-side evidence')||visible.includes('Fellas OS · Trade Museum'))
     errors.push(width+' trade museum leaked internal build footer');
   }
   if(['hall/players.html','hall/shame.html','labs/faab/index.html','labs/lineups/index.html','analytics/drafts/index.html','analytics/trades/index.html'].includes(route)){
    const visible=await page.locator('body').innerText();
    if(/REVIEW BUILD|Fellas OS v8|static-first pre-publish|pre-publish analytics pass/.test(visible))
     errors.push(width+' '+route+' still shows development labels');
    if(!visible.includes('The Fellas'))errors.push(width+' '+route+' lost site identity');
   }
   if(['analytics/drafts/index.html','analytics/trades/index.html','labs/faab/index.html'].includes(route)){
    const copy=await page.locator('body').innerText();
    if(/Fellas OS v9\.1 review|Fellas OS v5|Fellas OS v8|REVIEW BUILD|static-first pre-publish/.test(copy))
     errors.push(width+' '+route+' archive still exposes old developer-facing copy');
    if(!copy.includes('Historical')&&!copy.includes('historical'))
     errors.push(width+' '+route+' archive scope disclaimer missing');
   }
   if(route==='analytics/trades.html'){
    const copy=await page.locator('body').innerText();
    if(copy.includes('AUDIT EDITION')||copy.includes('Review build, not final historical certification')||copy.includes('Original v9 trade page'))
     errors.push(width+' public trade page leaked development build language');
    if(!copy.includes('2026 comparisons are provisional'))errors.push(width+' trade data coverage caveat lost');
   }
   if(route==='analytics/metrics.html'){
    const copy=await page.locator('body').innerText();
    if(copy.includes('REVIEW BUILD')||copy.includes('Fellas OS v8')||copy.includes('Fellas OS v9.1 review'))
     errors.push(width+' metrics page leaked development build language');
   }
   if(route==='analytics/historical-spreads.html'){
    const teamA=page.locator('#team-a'),teamB=page.locator('#team-b'),projected=page.locator('#line');
    if(await teamA.locator('option').count()<30||await teamB.locator('option').count()<30)
     errors.push(width+' historical spread selectors did not load enough manager-seasons');
    if(await teamA.inputValue()!=='2026|Kuhl'||await teamB.inputValue()!=='2019|Thommy')
     errors.push(width+' historical spread did not load the Kuhl 2026 / Thommy 2019 default');
    const initialSpread=(await projected.innerText()).trim();
    if(!/^Thommy 2019 −\d+\.\d$/.test(initialSpread))
     errors.push(width+' historical spread default favorite or line formatting differs from the current ledger');
    const originalDifference=await page.locator('#difference').innerText();
    if(!originalDifference.includes('Kuhl 2026')||!originalDifference.includes('Thommy 2019'))
     errors.push(width+' historical spread missing model differential and team labels');
    await page.locator('#swap').click();
    if(await teamA.inputValue()!=='2019|Thommy'||await teamB.inputValue()!=='2026|Kuhl')
     errors.push(width+' historical spread swap did not exchange both teams');
    if((await projected.innerText()).trim()!==initialSpread)
     errors.push(width+' historical spread changed the calculated favorite or line after swapping teams');
    await teamA.selectOption('2018|Kuhl');
    if(!(await page.locator('#difference').innerText()).includes('Kuhl 2018'))
     errors.push(width+' historical spread selector failed to recalculate comparison');
    await page.goto(baseUrl+'analytics/historical-spreads.html?a=2018%7CKuhl&b=2019%7CThommy',{waitUntil:'networkidle'});
    if(await page.locator('#team-a').inputValue()!=='2018|Kuhl'||await page.locator('#team-b').inputValue()!=='2019|Thommy')
     errors.push(width+' historical spread deep-link parameters not honored');
   }
   if(route==='analytics/records.html'){
    const managersLink=page.locator('header .navlinks a[href="../managers/"]');
    if(await managersLink.count()!==1||!await managersLink.isVisible())
     errors.push(width+' record book Managers navigation must point to current directory');
    const coverage=page.locator('main .hero details.records-coverage');
    if(await coverage.count()!==1||await coverage.evaluate(el=>el.open))
     errors.push(width+' all-time record book source coverage must start collapsed');
    else{
     await coverage.locator(':scope > summary').click();
     if(!((await coverage.innerText()).includes('ESPN 2016–2019'))||
        !((await coverage.innerText()).includes('Missing weekly player box scores')))
      errors.push(width+' all-time record book source limitations hidden or unavailable');
    }
    const dataTable=page.locator('.records-table');
    if(await dataTable.count()!==1||!await dataTable.isVisible())
     errors.push(width+' all-time record book main table unavailable');
    const spacing=await page.locator('.records-table th').first().evaluate(el=>({
     line:parseFloat(getComputedStyle(el).lineHeight),
     pad:parseFloat(getComputedStyle(el).paddingTop)
    }));
    if(spacing.line<17||spacing.pad<11)
     errors.push(width+' all-time record book table type remains cramped');
    // Closest margins must be selected from every verified regular-season
    // matchup, not from the top 100 blowouts. Regression: 2018 W7 was 0.16.
    await page.locator('#categories button[data-category="close"]').click();
    await page.waitForFunction(()=>document.querySelector('#scope')?.textContent.includes('Week 8')&&
     document.querySelector('#rows tr:first-child td:last-child')?.textContent==='0.16',null,{timeout:10000});
    const closestAudit=await page.locator('#rows tr').evaluateAll(trs=>trs.map(tr=>{
     const cells=[...tr.querySelectorAll('td')];
     return {year:cells[0]?.textContent,win:cells[1]?.textContent,loss:cells[2]?.textContent,
      margin:cells[3]?.textContent,at:cells[0]?.getBoundingClientRect().left,
      display:getComputedStyle(tr).display};
    }));
    if(closestAudit.length!==100||
       !closestAudit[0].year.includes('2018 · W7')||
       closestAudit[0].win!=='Stew'||closestAudit[0].loss!=='Thommy'||
       closestAudit[0].margin!=='0.16'||
       closestAudit[99].margin!=='6.42'||
       closestAudit.some((r,i)=>!/^[0-9]+\.[0-9]{2}$/.test(r.margin)||
        (i>0&&Number(r.margin)<Number(closestAudit[i-1].margin)))||
       (width===390&&closestAudit.some(r=>r.at< -2||r.display!=='grid')))
     errors.push(width+' closest-game ranking or mobile card layout incorrect: '+JSON.stringify(closestAudit.slice(0,3)));
    await page.locator('#categories button[data-category="big"]').click();
    const largest=await page.locator('#rows tr:first-child td:last-child').textContent();
    if(largest!=='101.38')
     errors.push(width+' biggest-win margin not calculated from canonical games: '+largest);

   }
   if(['managers/index.html','hall/','seasons/','analytics/manager-madden-cards.html'].includes(route)){
    if(!await page.locator('body.fellas-polished').count()||
       !await page.locator('link[href="../assets/fellas-ui-system.css"]').count()||
       !await page.locator('a.fellas-skip[href="#main-content"]').count()||
       !await page.locator('main#main-content').count())
     errors.push(width+' '+route+' missing shared design and keyboard skip navigation');
   }
   if(route==='hall/'){
    if(!await page.locator('header .navlinks a[href="../managers/"]').count()||
        await page.locator('header .navlinks a[href="../analytics/franchise-timeline.html"]').count())
     errors.push(width+' Hall of Fame Managers link must open current directory');
   }
   if(route==='seasons/espn-origins.html'){
    await page.waitForFunction(()=>document.querySelectorAll('#espn-shitter-awards tr').length===4,null,{timeout:8000}).catch(()=>{});
    const rows=await page.locator('#espn-shitter-awards tr').allTextContents();
    const expected=[['2016','Stilly','165.00','NFL Weeks 16–17 combined'],
     ['2017','Halderman','96.00','NFL Weeks 15–16 combined'],
     ['2018','Stilly','86.76','NFL Week 16'],
     ['2019','Evans','80.46','NFL Week 16']];
    if(rows.length!==4||expected.some((expectedRow,i)=>expectedRow.some(t=>!rows[i]?.includes(t)))||
       (await page.locator('main').innerText()).includes('2019 I Love Tubing belonged to Stew'))
     errors.push(width+' ESPN Origins punishment archive missing award winners, correct score scopes or Evans owner');
    const yearSelector=page.locator('#espn-activity-year');
    for(const [year,expectedTeams,firstManager,checkName] of [
      ['2016',8,'Thommy','Schermerhorn'],['2017',10,'Thommy','Schermerhorn'],
      ['2018',10,'Thommy','Stilly'],['2019',10,'Birch','Evans']]){
      await yearSelector.selectOption(year);
      await page.waitForFunction(expected=>document.querySelectorAll('#espn-activity tr').length===expected,expectedTeams,{timeout:8000}).catch(()=>{});
      const rows=await page.locator('#espn-activity tr').allTextContents();
      const context=await page.locator('#espn-activity-context').innerText();
      if(rows.length!==expectedTeams||!rows[0].includes(firstManager)||
         !rows.some(row=>row.includes(checkName))||
         !context.includes('no keepers')||
         (year==='2019'?!rows.some(row=>row.includes('Evans')&&row.includes('49')):
          !rows.every(row=>row.includes('Not used'))))
       errors.push(width+' ESPN '+year+' draft/waiver selector lost recovered owner mappings, no-keeper rules or pre-2019 FAAB status');
    }

   }
   if(route==='seasons/'){
    if(!await page.locator('header nav[aria-label="Season archive navigation"] a[href="../analytics/rivalries.html"]').count())
     errors.push(width+' Season Archive missing modern rivalry navigation');
   }
   if(route==='analytics/manager-madden-cards.html'){
    const links=page.locator('nav.madden-core-nav a');
    if(await links.count()!==5)
     errors.push(width+' manager rating cards missing simple five-link navigation');
   }
   if(route==='analytics/power-ratings.html'){
    const primary=page.locator('header nav[aria-label="Power Ratings navigation"]');
    if(await primary.count()!==1)
     errors.push(width+' Power Ratings primary navigation missing');
    else{
     for(const href of ['../index.html','../managers/','manager-report-cards.html','records.html','../hall/']){
      if(await primary.locator('a[href="'+href+'"]').count()!==1)
       errors.push(width+' Power Ratings missing primary destination '+href);
     }
     const tinyTargets=await primary.locator('a').evaluateAll(links=>links.filter(link=>getComputedStyle(link).display!=='none'&&link.getBoundingClientRect().height<40).map(link=>link.textContent.trim()));
     if(tinyTargets.length)errors.push(width+' Power Ratings links too small to tap: '+tinyTargets.join(', '));
    }
    const cards=await page.locator('[data-rating-manager]').count();
    if(cards!==14)errors.push(width+' power ratings failed to render 14 managers: '+cards);
    const breakdowns=page.locator('[data-rating-manager] details.rating-breakdown');
    if(await breakdowns.count()!==14)
     errors.push(width+' power ratings must preserve an expandable breakdown for all 14 managers');
    else{
     const initialOpen=await breakdowns.evaluateAll(nodes=>nodes.filter(n=>n.open).length);
     if(initialOpen!==0)errors.push(width+' power rating detail cards overwhelm first-time visitors');
     await breakdowns.first().locator(':scope > summary').click();
     if(await breakdowns.first().locator('.component').count()!==8||
        !await breakdowns.first().locator('.components').isVisible())
      errors.push(width+' power rating breakdown not accessible or incomplete');
     await breakdowns.first().locator(':scope > summary').click();
    }
   }
   if(route==='analytics/manager-madden-cards.html'){
    const introDisclosure=page.locator('details.madden-explain');
    if(await introDisclosure.count()!==1||await introDisclosure.evaluate(el=>el.open))
     errors.push(width+' Madden rating introduction should be concise with methodology collapsed');
    else{
     const intro=await page.locator('.madden-simple-intro').innerText();
     if(!intro.includes('Legacy OVR')||intro.length>240)
      errors.push(width+' Madden first-screen introduction is too long or unclear');
     await introDisclosure.locator(':scope > summary').click();
     const details=await introDisclosure.innerText();
     if(!details.includes('Two different measures:')||
        !details.includes('Card styles:')||!details.includes('underlying score'))
      errors.push(width+' Madden detailed rating caveats were lost');
     await introDisclosure.locator(':scope > summary').click();
    }
    const cards=page.locator('#cards article.card');
    const count=await cards.count();
    if(count!==10)errors.push(width+' Madden manager cards rendered '+count+' of 10 active managers');
    else{
     for(let i=0;i<count;i++){
      const card=cards.nth(i);
      const history=card.locator('details.historical-ovr');
      if(await history.count()!==1)errors.push(width+' Madden manager card '+i+' missing historical OVR details');
      else{
       const seasons=history.locator('.historical-ovr-grid > div');
       if(await seasons.count()<1)errors.push(width+' Madden manager card '+i+' historical OVR has no completed seasons');
      }
     }
    }
    const seasonRows=page.locator('#season-ovr-leaderboard tbody tr');
    if(await seasonRows.count()<1)errors.push(width+' single-season OVR leaderboard did not render');
    const allPlayHeader=await page.locator('#season-records thead').innerText();
    if(!allPlayHeader.includes('All-play'))errors.push(width+' Season OVR records lack all-play evidence column');
    const bestRows=page.locator('#season-records tbody tr');
    if(await bestRows.count()!==20)errors.push(width+' best-season record book did not render 20 rows');
    await page.locator('#season-extreme').selectOption('worst');
    if(await bestRows.count()!==20)errors.push(width+' worst-season record book did not render 20 rows');
    await page.locator('#season-extreme').selectOption('best');
    if(await page.locator('#season-record-manager option').count()!==15)errors.push(width+' all-season manager filter must include all 14 managers');
    await page.locator('#season-record-manager').selectOption('Thommy');
    const selectedNames=await page.locator('#season-records tbody th[scope="row"]').allTextContents();
    if(!selectedNames.length||selectedNames.some(n=>n!=='Thommy'))errors.push(width+' season records manager filter displayed wrong manager');
    await page.locator('#season-record-manager').selectOption('all');
    await page.goto(baseUrl+'analytics/manager-madden-cards.html?manager=Thommy#records-heading',{waitUntil:'networkidle'});
    const deepLinked=await page.locator('#season-record-manager').inputValue();
    if(deepLinked!=='Thommy')errors.push(width+' Madden season records did not honor manager deep link');
    const linkedRows=await page.locator('#season-records tbody th[scope="row"]').allTextContents();
    if(!linkedRows.length||linkedRows.some(n=>n!=='Thommy'))errors.push(width+' manager deep link included other managers');

    for(const category of ['champions','nonchampions','improvements','declines']){
     await page.locator('#season-extreme').selectOption(category);
     const count=await page.locator('#season-records tbody tr').count();
     if(count<1||count>20)errors.push(width+' '+category+' season record book returned '+count+' rows');
    }
    await page.locator('#season-extreme').selectOption('best');
    const historicalYears=page.locator('#history-year option');
    if(await historicalYears.count()!==10)errors.push(width+' historical leaderboard must offer ten completed seasons');
    const historicalRows=page.locator('#history-leaderboard tbody tr');
    if(await historicalRows.count()<1)errors.push(width+' historical leaderboard has no initial ranked managers');
    await page.locator('#history-year').selectOption('2016');
    if(await historicalRows.count()<1)errors.push(width+' 2016 historical leaderboard has no ranked managers');
    await page.locator('#history-year').selectOption('2025');
    if(await historicalRows.count()<1)errors.push(width+' 2025 historical leaderboard has no ranked managers');
    const duel=page.locator('#duel-results details.duel-history');
    if(await duel.count()!==1)errors.push(width+' Madden duel missing year-end comparison');
    else{
     const years=await duel.locator('tbody tr').count();
     if(years<1||years>10)errors.push(width+' Madden duel year-end comparison has invalid season count: '+years);
    }
    await page.locator('#filter').selectOption('all');
    const allCards=await page.locator('#cards article.card').count();
    if(allCards!==14)errors.push(width+' Madden all-manager filter rendered '+allCards+' instead of 14');
   }
   if(route==='analytics/rivalries.html'||route.startsWith('rivalries/')){
    if(await page.locator('main.rivalry-main[aria-label="Rivalry content"]').count()!==1)
     errors.push(width+' '+route+' missing semantic main content landmark');
    const primary=page.locator('nav.nav[aria-label="Rivalry navigation"]');
    const expectedLinks=['../index.html','../managers/','../analytics/manager-report-cards.html','../analytics/records.html','../analytics/rivalries.html'];
    if(await primary.count()!==1||await primary.locator('a').count()!==5||
       await page.locator('.mobile-dock').count())
     errors.push(width+' '+route+' rivalry navigation not simplified to five core destinations');
    else{
     const actual=await primary.locator('a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
     if(JSON.stringify(actual)!==JSON.stringify(expectedLinks))
      errors.push(width+' '+route+' rivalry navigation destinations inconsistent');
     if(width===390){
      const menu=page.locator('details.mobile-menu');
      await menu.locator(':scope > summary').click();
      const links=await menu.locator('.menu-grid a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
      if(JSON.stringify(links)!==JSON.stringify(expectedLinks))
       errors.push(width+' '+route+' mobile rivalry menu differs from desktop');
      await menu.locator(':scope > summary').click();
     }
    }
   }
   if(route==='analytics/rivalries.html'){
    const all=page.locator('details.rivalry-all-pairs');
    if(await all.count()!==1||await all.evaluate(el=>el.open))
     errors.push(width+' rivalries full matrix should start collapsed');
    const first=page.locator('#rivalry-first'),second=page.locator('#rivalry-second'),go=page.locator('#rivalry-go');
    if(await first.locator('option').count()!==10||await second.locator('option').count()!==10)
     errors.push(width+' rivalries picker missing current managers');
    else{
     await second.selectOption('Stilly');
     if(!await go.isDisabled()||!((await page.locator('#rivalry-picker-status').innerText()).includes('different managers')))
      errors.push(width+' rivalries picker allows same manager twice');
     await second.selectOption('JMid');
     if(await go.isDisabled())errors.push(width+' rivalries picker blocks a valid matchup');
     await all.locator(':scope > summary').click();
     const matches=page.locator('#verified-rivalry-matrix a[href^="../rivalries/"]');
     if(await matches.count()!==45||!await matches.first().isVisible())
      errors.push(width+' rivalries should expose all 45 current-manager pairings, including ones lacking archived games');
     await all.locator(':scope > summary').click();
     await go.click();
     await page.waitForURL('**/rivalries/stilly-vs-jmid.html');
     if(!await page.locator('body[data-rivalry-pair]').count())
      errors.push(width+' rivalries picker navigation did not open chosen pair');
    }
    const unavailable=await context.newPage();
    await unavailable.route('**/data/unified_record_book_2016_2026.json',
     intercepted=>intercepted.fulfill({status:503,body:'Unavailable matchup archive'}));
    await unavailable.goto(baseUrl+'analytics/rivalries.html',{waitUntil:'networkidle',timeout:30000});
    const blocked=await unavailable.locator('#rivalry-go').isDisabled();
    const notice=await unavailable.locator('#rivalry-picker-status').innerText();
    const matrixText=await unavailable.locator('#verified-rivalry-matrix').textContent();
    if(!blocked||!notice.includes('unavailable')||!matrixText.includes('unavailable'))
     errors.push(width+' rivalry finder fails to report missing archive and disable unverified navigation (disabled='+blocked+', notice='+JSON.stringify(notice)+', matrix='+JSON.stringify(matrixText.slice(0,160))+')');
    await unavailable.close();
   }
   if(route.startsWith('rivalries/')){
    const text=await page.locator('body').innerText();
    if(text.includes('Rivalry archive could not be loaded')||text.includes('Rivalry data unavailable'))errors.push(width+' '+route+' rivalry module did not load');
    const hero=page.locator('.rival-hero');
    if((await hero.innerText()).includes('Loading verified head-to-head')||
       (await hero.innerText()).includes('temporarily unavailable'))
     errors.push(width+' '+route+' verified rivalry scoreboard did not load');
    const history=page.locator('details.rivalry-game-history');
    if(await history.count()!==1||await history.evaluate(el=>el.open))
     errors.push(width+' '+route+' matchup game history should start collapsed');
    else{
     if(!await page.locator('a.rivalry-back[href="../analytics/rivalries.html"]').isVisible())
      errors.push(width+' '+route+' missing all-rivalries return navigation');
     await history.locator(':scope > summary').click();
     if(!await history.locator('table').isVisible()||!await history.locator('thead th').count())
      errors.push(width+' '+route+' matchup receipts do not expand');
    }
   }
   if(route==='rivalries/stilly-vs-jmid.html'){
    const missing=await context.newPage();
    await missing.route('**/data/unified_record_book_2016_2026.json',
     intercepted=>intercepted.fulfill({status:404,body:'Unavailable canonical ledger'}));
    await missing.goto(baseUrl+route,{waitUntil:'networkidle',timeout:30000});
    const fallback=await missing.locator('.rival-hero').innerText();
    if(!fallback.includes('Verified rivalry history is temporarily unavailable')||
       fallback.includes('2–1'))
     errors.push(width+' rivalry source failure leaves stale or invented head-to-head results visible');
    await missing.close();
    const empty=await context.newPage();
    await empty.route('**/data/unified_record_book_2016_2026.json',
     intercepted=>intercepted.fulfill({status:200,contentType:'application/json',body:JSON.stringify({games:[]})}));
    await empty.goto(baseUrl+route,{waitUntil:'networkidle',timeout:30000});
    const emptyText=await empty.locator('.rival-hero').innerText();
    const emptyFacts=await empty.locator('.rivalry-key-facts').innerText();
    if(!emptyText.includes('No verified regular-season meetings')||
       !emptyText.includes('not a 0–0 record')||
       !emptyFacts.includes('missing evidence'))
     errors.push(width+' missing rivalry receipts are being misrepresented as a tied series (hero='+JSON.stringify(emptyText.slice(0,180))+', facts='+JSON.stringify(emptyFacts.slice(0,180))+')');
    await empty.close();
   }
   if(route===''){
    const initialManagerStatus=await page.locator('#home-manager-status').innerText();
    if(initialManagerStatus.includes('Loading verified manager rankings')||
       !initialManagerStatus.includes('10 active manager profiles'))
     errors.push(width+' homepage initial manager search status remains stale');
    const snapshot=await page.locator('#home-season-snapshot').innerText();
    if(!/Canonical results through Week [1-9][0-9]*\b/.test(snapshot)||!snapshot.includes('reconstructed'))errors.push(width+' homepage canonical 2026 snapshot inaccurate');
    const archivedFeature=page.locator('.feature-panel').filter({has:page.locator('a[href="analytics/sportscenter.html"]')});
    const archiveLabel=await archivedFeature.locator('.kicker').textContent();
    const archiveStatus=await archivedFeature.locator('.status').textContent();
    const archiveDescription=await archivedFeature.locator('p').first().textContent();
    if(await archivedFeature.count()!==1||!archiveLabel?.includes('Historical feature · Week 7')||!archiveStatus?.includes('Both linked features are archived at Week 7')||!archiveDescription?.includes('current verified standings above'))errors.push(width+' homepage does not distinguish current standings from archived Week 7 features');
    const search=page.locator('#home-manager-search');
    if(width===390){
     if(!await search.isVisible())errors.push(width+' mobile manager finder missing');
     else{
      const order=page.locator('#home-manager-sort');
      if(await order.inputValue()!=='name')errors.push(width+' mobile directory default sort is not alphabetical');
      const names=await page.locator('#home-manager-mobile .mobile-manager-name').allTextContents();
      if(names.join('|')!==[...names].sort((a,b)=>a.localeCompare(b)).join('|'))errors.push(width+' mobile directory names not A–Z');
      await order.selectOption('ovr-desc');
      const ovrs=(await page.locator('#home-manager-mobile .mobile-manager-row').evaluateAll(els=>els.map(e=>Number(e.dataset.managerOvr))));
      if(ovrs.some((v,i)=>i>0&&v>ovrs[i-1]))errors.push(width+' highest OVR sorting incorrect');
      await order.selectOption('name');
      const identities=page.locator('#home-manager-mobile .mobile-manager-nickname');
      if(await identities.count()!==10)errors.push(width+' mobile manager personalities missing');
      if(await identities.filter({hasText:'The Yogurt King'}).count()!==1)errors.push(width+' Stover nickname missing from mobile list');
      await search.fill('Stov');
      const shown=page.locator('#home-manager-mobile .mobile-manager-row:visible');
      if(await shown.count()!==1||!await shown.first().locator('.mobile-manager-name').textContent().then(x=>x.trim()==='Stover'))
       errors.push(width+' manager finder failed to filter Stover');
      const stover=page.locator('#home-manager-mobile .mobile-manager-row:visible');
      await stover.locator('summary').click();
      if(!await stover.locator('.mobile-manager-expanded').isVisible())errors.push(width+' manager expandable details not visible');
      const href=await stover.locator('.mobile-manager-link').getAttribute('href');
      if(href!=='managers/stover/')errors.push(width+' manager detail link incorrect');
      const shortcuts=await stover.locator('.mobile-manager-shortcuts a').evaluateAll(links=>
       links.map(link=>({label:link.textContent.trim(),href:link.getAttribute('href')})));
      const expectedShortcuts=[
       {label:'Career',href:'managers/stover/#overview'},
       {label:'Each Year',href:'managers/stover/#seasons'},
       {label:'Rivalries',href:'managers/stover/#rivalries'}
      ];
      if(JSON.stringify(shortcuts)!==JSON.stringify(expectedShortcuts))
       errors.push(width+' homepage manager shortcuts missing or misrouted');
      if(await page.locator('#home-manager-mobile .mobile-manager-shortcuts').count()!==10)
       errors.push(width+' homepage shortcuts should cover ten managers');
      await search.fill('not-a-manager');
      if(!await page.locator('#home-manager-empty').isVisible())errors.push(width+' search empty result missing');
      if(!((await page.locator('#home-manager-status').innerText()).includes('Showing 0 of 10 managers')))
       errors.push(width+' homepage manager search status fails to reflect zero matches');
      await page.locator('#home-manager-clear').click();
      if(await page.locator('#home-manager-mobile .mobile-manager-row:visible').count()!==10)errors.push(width+' clearing manager finder did not restore ten names');
     }
     if(await page.locator('#home-manager-cards').isVisible())errors.push(width+' desktop cards should be hidden on mobile');
    }else{
     if(!await page.locator('#home-manager-cards').isVisible())errors.push(width+' desktop manager cards missing');
     if(!await search.isVisible())errors.push(width+' desktop manager search missing');
     await page.locator('#home-manager-sort').selectOption('rank');
     const ranks=await page.locator('#home-manager-cards .home-manager-card').evaluateAll(els=>els.map(e=>Number(e.dataset.managerRank)));
     if(ranks.some((v,i)=>i>0&&v<ranks[i-1]))errors.push(width+' desktop rank sorting incorrect');
     await search.fill('Stov');
     if(await page.locator('#home-manager-cards .home-manager-card:visible').count()!==1)errors.push(width+' desktop manager finder failed');
     if(!((await page.locator('#home-manager-status').innerText()).includes('Showing 1 of 10 managers')))
      errors.push(width+' desktop search status fails to reflect manager result count');
     await search.press('Escape');
     if(await search.inputValue()!==''||
        await page.locator('#home-manager-cards .home-manager-card:visible').count()!==10)
      errors.push(width+' desktop Escape did not reset manager search');
     await search.fill('Stov');
     await page.locator('#home-manager-clear').click();
     if(await page.locator('#home-manager-cards .home-manager-card:visible').count()!==10)errors.push(width+' desktop manager finder clear failed');
    }
   }
   if(route==='seasons/weekly-matchup-archive.html'){
    const years=await page.locator('#year option').count();
    if(years!==11)errors.push(width+' weekly archive year selector has '+years+' options, expected 11');
    const year=await page.locator('#year').inputValue();
    if(year!=='2026')errors.push(width+' weekly archive did not default to 2026');
    if(years===11){
     await page.locator('#year').selectOption('2016',{timeout:3000});
     if(!(await page.locator('#summary').innerText()).includes('2016'))errors.push(width+' season selector did not update');
    }else errors.push(width+' weekly archive initialization: '+(await page.locator('#summary').innerText()));
   }
   if(route==='seasons/all-time-schedule-swap.html'){
    const managers=await page.locator('#manager option').count();
    const scheduleOwners=await page.locator('#owner option').count();
    if(managers<10||scheduleOwners<10)errors.push(width+' Schedule Swap controls failed to load managers');
    else{
     const initial=await page.locator('#cards').innerText();
     if(!initial.includes('Weeks compared'))errors.push(width+' Schedule Swap output missing');
     await page.locator('#owner').selectOption('Stover');
     const updated=await page.locator('#cards').innerText();
     if(!updated.includes('Stover'))errors.push(width+' Schedule Swap owner change did not update results');
     await page.locator('#season').selectOption('2025');
     const filtered=await page.locator('#rows tr').count();
     if(filtered>1)errors.push(width+' Schedule Swap season filter failed to narrow result rows');
    }
   }
   if(route.startsWith('managers/')&&route.endsWith('/')&&route!=='managers/'){
    const errorText=await page.locator('body').innerText();
    if(errorText.includes('Historical records are temporarily unavailable.'))errors.push(width+' '+route+' historical profile module unavailable');
    if(errorText.includes('Canonical manager missing'))errors.push(width+' '+route+' canonical identity missing');
   }
   if(route.startsWith('managers/')&&route.endsWith('/')&&slugs.includes(route.split('/')[1])){
    const madden=page.locator('.profile-madden');
    if(await madden.count()!==1)errors.push(width+' '+route+' missing Madden scouting report');
    else{
     const seasonal=madden.locator('.profile-season-ovr');
     if(await seasonal.count()!==1)errors.push(width+' '+route+' missing single-season OVR progression');
     else{
      if(await seasonal.locator('.profile-historical-table tbody tr').count()<1)errors.push(width+' '+route+' missing verified season performance rows');
      const summary=await seasonal.innerText();
      if(!summary.includes('Peak:')||!summary.includes('Lowest:')||!summary.includes('Average:'))errors.push(width+' '+route+' missing seasonal peak/low/average');
     }
     const historical= madden.locator('details.profile-madden-history:not(.profile-season-ovr)');
     if(await historical.count()!==1)errors.push(width+' '+route+' missing historical OVR journey');
     else{
      if(await historical.locator('.profile-historical-table tbody tr').count()<1)
       errors.push(width+' '+route+' historical OVR journey is empty');
      const headers=await historical.locator('thead th').allTextContents();
      if(!headers.includes('Legacy OVR')||!headers.includes('Change')||!headers.includes('Titles earned'))
       errors.push(width+' '+route+' historical OVR milestone columns missing');
      const milestone=await historical.locator('.profile-career-milestones').textContent();
      if(!milestone.includes('Career peak:')||!milestone.includes('Title seasons:'))
       errors.push(width+' '+route+' career peak or verified title milestones missing');
      if(route==='managers/stover/'&&!milestone.includes('2022'))
       errors.push(width+' Stover 2022 title missing from career history');
      const firstChange=await historical.locator('tbody tr:first-child td:nth-child(3)').textContent();
      if(firstChange.trim()!=='First year')
       errors.push(width+' '+route+' first career OVR row invented an annual change');
     }
    }
   }
   if(route.startsWith('managers/')&&route.endsWith('/')&&slugs.includes(route.split('/')[1])){
    const slug=route.split('/')[1];
    // Older profiles duplicated WLT/game counts inside their story sections.
    // The clean hierarchy now has one canonical record in the hero, with
    // a short editorial overview and no competing career-stat cards.
    const story=page.locator('#franchise-story');
    const summary=story.locator('p.lead');
    if(await summary.count()!==1||
       (await summary.innerText()).trim().length<120||
       (await summary.innerText()).trim().length>550)
     errors.push(width+' '+route+' franchise overview is missing or too long');
    if(await story.locator('[data-canonical-manager-record], [data-canonical-manager-games], .story-facts, details.story-detail').count()!==0)
     errors.push(width+' '+route+' franchise overview repeats source stats or an obsolete story disclosure');
    const verifiedHeroRecord=page.locator('main .hero [data-canonical-manager-record]');
    await page.waitForFunction(()=>document.querySelector('main .hero [data-canonical-manager-record]')?.dataset.canonicalUpdated==='yes',null,{timeout:8000}).catch(()=>{});
    const canonicalId=slug==='tom'?'Thommy':slug==='jmid'?'JMid':slug[0].toUpperCase()+slug.slice(1);
    const careerResponse=await page.request.get(baseUrl+'data/career_core_generated.json');
    const career=(await careerResponse.json()).managers[canonicalId];
    const expected=career.w+'–'+career.l+(career.t?'–'+career.t:'');
    if(await verifiedHeroRecord.count()!==1||
       await verifiedHeroRecord.getAttribute('data-canonical-updated')!=='yes'||
       (await verifiedHeroRecord.textContent()).trim()!==expected||
       !(await verifiedHeroRecord.getAttribute('title')||'').includes(career.games+' archived games'))
     errors.push(width+' '+route+' canonical career record or game coverage missing from main hero');
    const nickname=page.locator('main .hero .manager-nickname-origin');
    if(await nickname.count()!==1)errors.push(width+' '+slug+' nickname origin panel missing');
    else{
     await nickname.locator('summary').click();
     if(!await nickname.locator('p').first().isVisible())errors.push(width+' '+slug+' nickname explanation failed to expand');
    }
    const tabs=page.locator('[data-manager-profile-tabs] button[data-profile-tab]');
    if(width===390&&await page.locator('.profile-location-label').count()!==1)errors.push(width+' '+slug+' missing sticky manager location label');
    if(await tabs.count()!==4)errors.push(width+' '+slug+' missing legacy deep-link section controls');
    else{
     const switcher=page.locator('details.profile-section-switcher');
     if(await switcher.count()!==1||await switcher.evaluate(el=>el.open))
      errors.push(width+' '+slug+' old four-tab controls must start collapsed under feature navigation');
     if(await page.locator('#profile-features[data-profile-feature-menu]').count()!==1)
      errors.push(width+' '+slug+' primary feature directory missing stable deep-link anchor');
     if(!await page.locator('details.profile-feature-group').first().evaluate(el=>el.open))
      errors.push(width+' '+slug+' career results should expand on first visit');
     if(await page.locator('#full-franchise-dossier').count())
      errors.push(width+' '+slug+' competing older franchise-profile promo still visible');
     const heroActions=page.locator('main .hero .buttons a');
     if(await heroActions.count()!==2||
        await heroActions.first().getAttribute('href')!=='#profile-features'||
        await heroActions.nth(1).getAttribute('href')!=='../')
      errors.push(width+' '+slug+' hero has duplicate or misleading navigation links');
     // The shared readability stylesheet must be loaded on each manager route.
     const readability=page.locator('link[href="../../assets/manager-profile-readability.css"]');
     if(await readability.count()!==1)
      errors.push(width+' '+slug+' missing shared manager readability stylesheet');
     else{
      const spacing=await page.evaluate(()=>{
       const card=document.querySelector('.profile-madden .profile-madden-facts span');
       const metric=document.querySelector('.profile-madden .profile-madden-facts strong');
       if(!card||!metric)return null;
       const cs=getComputedStyle(card);
       return {gap:parseFloat(cs.columnGap),line:parseFloat(cs.lineHeight),wrap:cs.flexWrap};
      });
      if(!spacing||spacing.gap<6||spacing.line<18||spacing.wrap!=='wrap')
       errors.push(width+' '+slug+' career facts still have cramped labels');
     }
     const snapshot=page.locator('main .hero [data-profile-career-snapshot]');
     if(await snapshot.count()!==1)errors.push(width+' '+slug+' missing unified career snapshot');
     else{
      const snapshotStats=snapshot.locator('.profile-snapshot-stats > .stat');
      if(await snapshotStats.count()<3)
       errors.push(width+' '+slug+' career snapshot lost existing verified stat cards');
      const archived=snapshot.locator('details.profile-snapshot-receipts');
      if(await archived.count()!==1||await archived.evaluate(el=>el.open))
       errors.push(width+' '+slug+' archived stat disclosure must start collapsed');
      else{
       await archived.locator(':scope > summary').click();
       if(!await snapshotStats.first().isVisible())
        errors.push(width+' '+slug+' career stats unavailable after opening receipts');
       await archived.locator(':scope > summary').click();
       if(await archived.evaluate(el=>el.open))
        errors.push(width+' '+slug+' archived stat disclosure did not close');
      }
      const titles=await snapshotStats.locator('small').allTextContents();
      if(!titles.includes('Championships')||
         !titles.includes('Regular-season record')||
         !titles.some(t=>/^Championship seasons?$/.test(t)))
       errors.push(width+' '+slug+' championship and record labels remain confusing');
      if(slug==='tom'&&!titles.includes('Championship seasons'))
       errors.push(width+' '+slug+' multiple championship years labeled as a count');
      const originalRecord=snapshot.locator('[data-canonical-manager-record]');
      if(await originalRecord.count()!==1||
         await originalRecord.getAttribute('data-canonical-updated')!=='yes')
       errors.push(width+' '+slug+' snapshot regular-season record lost canonical live binding');
      const sourceNote=await snapshot.locator('.profile-snapshot-source').allTextContents();
      if(sourceNote.length!==1||
         !(slug==='scott'
           ? /verified game.*tenure.*2026 Week 8/i.test(sourceNote[0])
           : /ESPN.*Sleeper.*Week 8/i.test(sourceNote[0])))
       errors.push(width+' '+slug+' snapshot lost source coverage for the manager actual tenure');
      if(width===390){
       const geometry=await snapshotStats.evaluateAll(items=>items.map(el=>({
        right:el.getBoundingClientRect().right,
        viewport:document.documentElement.clientWidth
       })));
       if(geometry.some(x=>x.right>x.viewport+2))
        errors.push(width+' '+slug+' career snapshot overflows mobile viewport');
      }
     }
     const ratingGuide=page.locator('#profile-features > details.profile-rating-guide');
     if(await ratingGuide.count()!==1||await ratingGuide.evaluate(el=>el.open))
      errors.push(width+' '+slug+' ratings glossary missing or expanded by default');
     else{
      await ratingGuide.locator(':scope > summary').click();
      const copy=await ratingGuide.innerText();
      if(!copy.includes('Legacy OVR')||!copy.includes('Season OVR')||!copy.includes('Report Card'))
       errors.push(width+' '+slug+' ratings glossary definitions incomplete');
      await ratingGuide.locator(':scope > summary').click();
     }
     const topicGroups=page.locator('#profile-features > .profile-feature-groups > details.profile-feature-group');
     if(await topicGroups.count()!==5)errors.push(width+' '+slug+' profile must have five clear topics');
     else{
      const topicNames=await topicGroups.locator(':scope > summary strong').allTextContents();
      if(JSON.stringify(topicNames)!==JSON.stringify(['Career & Results','Ratings & Legacy','Drafts, Trades & Pickups','Rivals & Matchups','Lineups & Keepers']))
       errors.push(width+' '+slug+' profile topic labels or order incorrect');
     }
     const features=page.locator('[data-profile-feature-menu] .profile-feature-button');
     if(await features.count()!==11)
      errors.push(width+' '+slug+' expected eleven unique, nonduplicated deeper feature destinations');
     else{
      const labels=await features.locator('strong').allTextContents();
      if(labels.includes('Records you own')||labels.includes('Manager report card')||
         new Set(labels).size!==labels.length)
       errors.push(width+' '+slug+' duplicate Records/Report Card destinations clutter deeper topics');
      for(const label of ['Championships & career record','Season-by-season results',
       'Head-to-head & rivalries','Legacy OVR progression','Drafting & trading résumé',
       'Start/Sit accuracy','Keeper research']){
       if(!labels.includes(label))errors.push(width+' '+slug+' feature button missing '+label);
      }
      const destinations=await features.evaluateAll(nodes=>nodes.map(x=>x.tagName==='A'?
       {href:x.getAttribute('href'),label:x.querySelector('strong')?.textContent}:
       {target:x.dataset.featureTarget,tab:x.dataset.featureTab||null}));
      if(destinations.some(d=>d.href&&!d.href.startsWith('#')&&!d.href.includes('manager=')||
        d.target&&!d.target.startsWith('.')&&!d.target.startsWith('#')))
       errors.push(width+' '+slug+' feature button destination invalid');
      if(!await page.locator('body').evaluate(el=>el.classList.contains('profile-landing')))
       errors.push(width+' '+slug+' profile should open in focused landing mode');
      if(await page.locator('main > section.section:visible').count()!==0)
       errors.push(width+' '+slug+' profile landing exposes archive wall before feature selection');
      const rivalryGroup=page.locator('details.profile-feature-group').filter({has:page.locator('[data-profile-feature][data-feature-target="#head-to-head"]')});
      if(!await rivalryGroup.evaluate(el=>el.open))await rivalryGroup.locator(':scope > summary').click();
      const rivalry=page.locator('[data-profile-feature][data-feature-target="#head-to-head"]');
      await rivalry.click();
      await page.waitForFunction(()=>{
       const section=document.querySelector('#head-to-head');
       return section&&section.getBoundingClientRect().top<window.innerHeight&&
        section.getBoundingClientRect().bottom>0;
      },null,{timeout:2500}).catch(()=>{});
      if(!await page.locator('body').evaluate(el=>el.classList.contains('profile-feature-focused'))||
         await page.locator('#season-history').isVisible()||
         !await page.locator('.profile-focus-toolbar').isVisible())
       errors.push(width+' '+slug+' rivalry view did not isolate the chosen feature');
      if(await page.locator('#profile-features').isVisible()||
         !await page.locator('#head-to-head').evaluate(el=>el.previousElementSibling?.classList.contains('profile-focus-toolbar')))
       errors.push(width+' '+slug+' focused feature retains oversized menu or loses contextual back button');
      if(await page.locator('[data-profile-tab="rivalries"]').getAttribute('aria-selected')!=='true'||
         !await page.locator('#head-to-head').isVisible())
       errors.push(width+' '+slug+' rivalry feature did not activate the visible research');
      const researchShelf=page.locator('details.profile-research-shelf');
      await researchShelf.evaluate(el=>el.open=false);
      const career=page.locator('[data-profile-feature][data-feature-target=".profile-career-resume"]');
      await page.locator('.profile-focus-toolbar button').click();
      if(!await page.locator('#profile-features').isVisible()||
         !await page.locator('#profile-features .profile-focus-toolbar').count())
       errors.push(width+' '+slug+' Back action failed to restore feature directory');
      await page.waitForFunction(()=>document.activeElement?.matches('details.profile-feature-group[open] > summary'),null,{timeout:2000}).catch(()=>{});
      if(!await page.evaluate(()=>document.activeElement?.matches('details.profile-feature-group[open] > summary')))
       errors.push(width+' '+slug+' Back navigation lost keyboard focus on hidden toolbar');
      const careerGroup=page.locator('details.profile-feature-group').filter({has:career});
      if(!await careerGroup.evaluate(el=>el.open))await careerGroup.locator(':scope > summary').click();
      await career.click();
      if(!await researchShelf.evaluate(el=>el.open)||
         !await page.locator('.profile-career-resume').evaluate(el=>el.open))
       errors.push(width+' '+slug+' career résumé feature failed to reveal hidden evidence');
      await researchShelf.evaluate(el=>el.open=false);
      if(!await page.locator('.profile-focus-toolbar').isVisible())
       errors.push(width+' '+slug+' closing research drawer hid the return navigation');
      await page.locator('.profile-focus-toolbar button').click();
      const front=page.locator('[data-profile-feature][data-feature-target=".profile-front-office-snapshot"]');
      const frontGroup=page.locator('details.profile-feature-group').filter({has:front});
      if(!await frontGroup.evaluate(el=>el.open))await frontGroup.locator(':scope > summary').click();
      await front.click();
      if(!await researchShelf.evaluate(el=>el.open)||
         !await page.locator('.profile-front-office-snapshot').isVisible())
       errors.push(width+' '+slug+' front-office button failed to reveal evidence');
      if(width===390){
       const mobileButton=await front.evaluate(el=>{
        const parent=el.parentElement,css=getComputedStyle(parent);
        return {columns:css.gridTemplateColumns,width:el.getBoundingClientRect().width,
         available:parent.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)};
       });
       if(mobileButton.width<mobileButton.available-3)
        errors.push(width+' '+slug+' focused feature buttons are still cramped into columns');
      }
      await page.keyboard.press('Escape');
      if(!await page.locator('body').evaluate(el=>el.classList.contains('profile-landing'))||
         await page.locator('.profile-focus-toolbar').isVisible()||
         await page.evaluate(()=>location.hash!=='') )
       errors.push(width+' '+slug+' Escape did not return to clean feature directory');
     }
     await switcher.locator(':scope > summary').click();
     if(!await switcher.evaluate(el=>el.open))
      errors.push(width+' '+slug+' optional archive sections failed to expand');
     if(width===390){
      await page.locator('[data-profile-tab="seasons"]').click();
      const seasons=page.locator('#season-history .season-accordion .season-entry');
      if(await seasons.count()<1)errors.push(width+' '+slug+' mobile season accordion missing');
      else{
       await seasons.first().locator('summary').click();
       if(!await seasons.first().locator('.season-entry-detail').isVisible())errors.push(width+' '+slug+' season details did not expand in place');
      }
     }
     await page.locator('[data-profile-tab="rivalries"]').click();
     const rivalryDisclosure=page.locator('#rivalry-analytics .profile-inline-disclosure');
     if(await rivalryDisclosure.count()!==1)errors.push(width+' '+slug+' expandable rivalry analysis missing');
     else{
      await rivalryDisclosure.locator('summary').click();
      if(!await rivalryDisclosure.locator('.profile-inline-detail').isVisible())errors.push(width+' '+slug+' rivalry details did not expand');
     }
     await page.locator('[data-profile-tab="advanced"]').click();
     const deepControls=page.locator('#franchise-legends .profile-deep-controls');
     if(await deepControls.count()!==1)errors.push(width+' '+slug+' Deep Stats expansion controls missing');
     else{
      await deepControls.locator('[data-expand-all]').click();
      if(!await page.locator('#front-office-archive .profile-deep-disclosure').evaluate(el=>el.open))errors.push(width+' '+slug+' Expand all did not open research');
      await deepControls.locator('[data-collapse-all]').click();
      if(await page.locator('#front-office-archive .profile-deep-disclosure').evaluate(el=>el.open))errors.push(width+' '+slug+' Collapse all did not close research');
     }
     const deepDisclosure=page.locator('#franchise-legends .profile-deep-disclosure');
     if(await deepDisclosure.count()!==1)errors.push(width+' '+slug+' deep research accordion missing');
     else{
      await deepDisclosure.locator(':scope > summary').click();
      if(!await deepDisclosure.locator('.profile-inline-detail').isVisible())errors.push(width+' '+slug+' player history not expanded in place');
     }
     if(width===390&&slug==='stover'){
      await page.locator('[data-profile-tab="seasons"]').click();
      await page.locator('#season-history').scrollIntoViewIfNeeded();
      const originalY=await page.evaluate(()=>window.scrollY);
      await page.goto(baseUrl+'analytics/manager-report-cards.html?manager=Stover',{waitUntil:'domcontentloaded'});
      await page.goBack({waitUntil:'networkidle'});
      // Restoration can follow browser history, BFCache, and late profile layout.
      // Require the same selected tab and actual scroll position, allowing up to 1.8s.
      await page.waitForFunction(expected=>{
       const selected=document.querySelector('[data-profile-tab="seasons"]')?.getAttribute('aria-selected')==='true';
       return selected&&Math.abs(window.scrollY-expected)<=250;
      },originalY,{timeout:1800}).catch(()=>{});
      const restored=await page.evaluate(()=>({y:window.scrollY,tab:document.querySelector('[data-profile-tab="seasons"]')?.getAttribute('aria-selected')}));
      if(restored.tab!=='true')errors.push(width+' '+slug+' returning from report lost selected season tab');
      if(Math.abs(restored.y-originalY)>250)errors.push(width+' '+slug+' returning from report lost reading position');
     }
     // Returning through BFCache may restore the selected category while
     // leaving the optional archive disclosure closed. Open it before
     // exercising its secondary controls.
     const postReturnSwitcher=page.locator('details.profile-section-switcher');
     if(!await postReturnSwitcher.evaluate(el=>el.open))
      await postReturnSwitcher.locator(':scope > summary').click();
     for(const category of ['overview','seasons','rivalries','advanced']){
      const button=page.locator('[data-manager-profile-tabs] button[data-profile-tab="'+category+'"]');
      await button.click();
      if(await button.getAttribute('aria-selected')!=='true')errors.push(width+' '+slug+' '+category+' tab did not activate');
      const activeGuide=await page.locator('.profile-tab-guide').innerText();
      if(!activeGuide.includes(({overview:'Career overview',seasons:'Each Year',rivalries:'Head-to-Head',advanced:'Deep Stats'})[category]))
       errors.push(width+' '+slug+' category navigation has no visible active-section explanation');
      const sectionId={overview:'franchise-story',seasons:'season-history',rivalries:'head-to-head',advanced:'franchise-encyclopedia'}[category];
      if(!await page.locator('#'+sectionId).isVisible())errors.push(width+' '+slug+' '+category+' content hidden');
     }
    }
    if(width===390){
     await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
     await page.waitForTimeout(120);
     const nav=page.locator('#profile-navigation');
     if(!await nav.isVisible())errors.push(width+' '+slug+' sticky profile navigation missing while reading');
     const positioning=await nav.evaluate(el=>getComputedStyle(el).position);
     if(positioning!=='sticky')errors.push(width+' '+slug+' profile navigation not sticky on mobile');
     const locationLabel=nav.locator('.profile-location-label');
     if(!await locationLabel.isVisible())errors.push(width+' '+slug+' manager and section context not visible');
     if(await page.locator('.profile-back-to-sections').isVisible())errors.push(width+' '+slug+' obsolete floating navigation overlaps sticky tabs');
    }
    const managerId=slug==='tom'?'Tom':slug==='jmid'?'JMid':slug[0].toUpperCase()+slug.slice(1);
    const awardData=(await (await page.request.get(baseUrl+'data/waiver_award_candidates.json')).json()).managers[managerId]?.[0];
    const tradeSides=(await (await page.request.get(baseUrl+'data/v9_trade_engine.json')).json()).sides;
    const tradeData=tradeSides.filter(x=>x.manager===managerId&&x.direct_edge>0).sort((a,b)=>b.direct_edge-a.direct_edge)[0];
    if(await page.locator('#franchise-encyclopedia').getAttribute('data-encyclopedia-updated')!=='yes')errors.push(width+' '+slug+' shared encyclopedia renderer did not update');
    const waiverCard=page.locator('#franchise-encyclopedia [data-encyclopedia-waiver]');
    const tradeCard=page.locator('#franchise-encyclopedia [data-encyclopedia-trade]');
    if(await waiverCard.count()!==1||!awardData)errors.push(width+' '+slug+' waiver card or source missing');
    else{
     const heading=await waiverCard.locator('h3').innerText();
     const detail=await waiverCard.locator('p').innerText();
     if(heading.trim()!==awardData.player||!detail.includes(awardData.points.toFixed(2))||
        !detail.includes('+'+awardData.par.toFixed(2))||!detail.includes(String(awardData.acquisitionType)))
      errors.push(width+' '+slug+' waiver card does not match its source');
    }
    if(await tradeCard.count()!==1||!tradeData)errors.push(width+' '+slug+' trade card or source missing');
    else{
     const heading=await tradeCard.locator('h3').innerText();
     const detail=await tradeCard.locator('p').innerText();
     if(heading.trim()!==tradeData.assets.join(' + ')||
        !detail.includes('+'+tradeData.direct_edge.toFixed(1))||
        !detail.includes(Number(tradeData.starter_points).toFixed(2)))
      errors.push(width+' '+slug+' trade card does not match its source');
    }
    // JavaScript-disabled visitors must see neutral archive navigation, never stale model claims.
    {
     const noScript=await browser.newContext({viewport:{width,height:844},javaScriptEnabled:false});
     try{
      const staticPage=await noScript.newPage();
      await staticPage.goto(baseUrl+route,{waitUntil:'load',timeout:30000});
      for(const type of ['waiver','trade']){
       const card=staticPage.locator('#franchise-encyclopedia [data-encyclopedia-'+type+']');
       if(await card.locator('h3').innerText()!==(type==='waiver'?'Player history':'Trade history')||
          !(await card.locator('p').innerText()).includes(type==='waiver'?'Explore recorded players and pickups in the full profile.':'Explore recorded trades and outcomes in the full profile.'))
        errors.push(width+' '+route+' no-JS source card exposes outdated '+type+' content');
       if(await card.locator('a[href*="../'+slug+'.html#"]').count()!==1)
        errors.push(width+' '+route+' no-JS archival '+type+' link missing');
      }
     }finally{await noScript.close()}
    }
    const encyclopedia=page.locator('#franchise-encyclopedia');
    if(await encyclopedia.count()!==1)errors.push(width+' '+slug+' missing franchise encyclopedia');
    else{
     const chapterLinks=encyclopedia.locator('a[href*="../'+slug+'.html#"]');
     if(await chapterLinks.count()!==3)errors.push(width+' '+slug+' encyclopedia missing three archive chapter links');
     const archiveResponse=await page.request.get(new URL('../'+slug+'.html',baseUrl+route).toString());
     const archiveBody=await archiveResponse.text();
     for(const fragment of ['franchise-dossier','franchise-history-v915','v9-front-office']){
      if(!archiveBody.includes('id="'+fragment+'"'))errors.push(width+' '+slug+' archive chapter target missing: '+fragment);
     }
    }
    const historyLink=page.locator('a[href="../'+slug+'.html#franchise-history-v915"]');
    if(await historyLink.count()<1)errors.push(width+' '+route+' missing deep link to historical player/waiver/trade dossier');
    else{
     const target=await page.request.get(new URL('../'+slug+'.html',baseUrl+route).toString());
     if(!target.ok()||!(await target.text()).includes('id="franchise-history-v915"'))errors.push(width+' '+route+' historical dossier target unavailable');
     await historyLink.first().click();
     await page.waitForURL('**/managers/'+slug+'.html#franchise-history-v915',{timeout:5000});
     if(!(await page.locator('#franchise-history-v915').isVisible()))errors.push(width+' '+route+' historical dossier fragment failed after click');
     await page.goBack({waitUntil:'networkidle'});
    }
    // The modern profile is the single main experience. Keep the historic
    // encyclopedia URL and deep chapter links, without a duplicate teaser.
    const dossierLink=page.locator('a[href="../'+slug+'.html"]');
    if(await dossierLink.count())errors.push(width+' '+route+' competing full-dossier teaser still visible');
    const dossierResponse=await page.request.get(new URL('../'+slug+'.html',baseUrl+route).toString());
    if(dossierResponse.status()!==200)errors.push(width+' '+route+' historical franchise dossier URL unavailable');
   }
   if(route==='analytics/awards-show.html'){
    const buttons=page.locator('#years button');
    if(await buttons.count()<2)errors.push(width+' Awards Show year buttons failed to render');
    else{
     await buttons.last().click();
     const chosen=await buttons.last().getAttribute('data-year');
     if(!(await page.locator('#heading').innerText()).includes(chosen))errors.push(width+' Awards Show year selection not reflected');
     for(const [year,manager,score] of [['2016','Stilly','165.00'],['2017','Halderman','96.00'],['2018','Stilly','86.76'],['2019','Evans','80.46']]){
      await page.locator('#years button[data-year="'+year+'"]').click();
      const award=page.locator('#awards [data-shitter-award="'+year+'"]');
      if(await award.count()!==1||!(await award.innerText()).includes(manager)||
         !(await award.innerText()).includes(score))
       errors.push(width+' Awards Show '+year+' Shitter punishment missing or conflated with regular season');
     }
     await page.locator('#years button[data-year="2025"]').click();
     if(await page.locator('#awards [data-shitter-award]').count()!==0)
      errors.push(width+' Awards Show invented an unverified Sleeper-era Shitter punishment');
    }
   }
   if(route==='seasons/historical-awards.html'){
    const select=page.locator('#year');
    await select.waitFor({state:'visible',timeout:8000}).catch(()=>{});
    if(await select.count()===1){
     for(const [year,manager,score] of [['2016','Stilly','165.00'],['2017','Halderman','96.00'],['2018','Stilly','86.76'],['2019','Evans','80.46']]){
      await select.selectOption(year);
      const awards=await page.locator('#awards').innerText();
      if(!awards.includes('Shitter of the Year')||!awards.includes(manager)||!awards.includes(score)||
         !awards.includes('The Basement'))
       errors.push(width+' '+year+' historical award list lacks separate punishment and regular-season Basement');
     }
     await select.selectOption('2025');
     if((await page.locator('#awards').innerText()).includes('Shitter of the Year'))
      errors.push(width+' historical award archive inferred unverified Sleeper-era Shitter winner');
    }
   }
   if(route.startsWith('managers/')&&slugs.includes(route.slice('managers/'.length,-'.html'.length))&&route.endsWith('.html')){
    const slug=route.slice('managers/'.length,-'.html'.length);
    const body=await page.locator('body').innerText();
    if(!body.includes('Franchise'))errors.push(width+' '+route+' missing legacy dossier content');
    if(!await page.locator('[data-canonical-manager-record]').count())errors.push(width+' '+route+' missing canonical career binding');
   }
   if(route==='analytics/record-holders.html'){
    await page.locator('#record-leaders .leader-card').first().waitFor({timeout:10000});
    const cards=await page.locator('#record-leaders .leader-card').count();
    const remaining=await page.locator('#record-other .leader-card').count();
    const kinds=await page.locator('#record-categories .category-card').count();
    if(cards<1||cards+remaining!==14||kinds!==16)
     errors.push(width+' record holders mismatch: '+cards+' leaders, '+remaining+' remaining, '+kinds+' categories');
    const first=await page.locator('#record-leaders .leader-card').first().innerText();
    if(!first.includes('record'))
     errors.push(width+' record holder leaderboard count missing');
    const disclosures=page.locator('#record-categories .record-context');
    if(await disclosures.count()!==16)
     errors.push(width+' missing next-manager comparisons on record categories');
    else{
     await disclosures.first().locator('summary').click();
     const detail=await disclosures.first().innerText();
     if(!detail.includes('Next-best different manager:')||!detail.includes('Gap to the record:'))
      errors.push(width+' record comparison disclosure does not show its evidence');
    }
    const espnLast=page.locator('#espn-last-place-history');
    if(await espnLast.locator('a.placement-shame-row').count()!==4)
     errors.push(width+' missing four verified ESPN-era last-place finishes');
    const placement=page.locator('#placement-statistics');
    if(await placement.count()!==1)
     errors.push(width+' finishing-statistics comparison missing');
    else{
     await placement.locator('summary').click();
     const tableRows=await placement.locator('tbody tr').count();
     if(tableRows!==26)
      errors.push(width+' expected fourteen all-era and twelve Sleeper-era manager summaries, got '+tableRows);
    }
    const links=await page.locator('#record-leaders .leader-card').evaluateAll(nodes=>nodes.every(n=>n.getAttribute('href')?.includes('record-books.html?manager=')));
    if(!links)errors.push(width+' record holder links broken');
   }
   if(route==='managers/record-books.html'){
    const primary=page.locator('header nav.records-primary-nav');
    if(await primary.count()!==1)
     errors.push(width+' Manager Record Books primary navigation missing');
    else{
     for(const href of ['../index.html','../managers/','../analytics/records.html','../analytics/manager-report-cards.html']){
      if(await primary.locator('a[href="'+href+'"]').count()!==1)
       errors.push(width+' Manager Record Books missing destination '+href);
     }
     const tinyTargets=await primary.locator('a').evaluateAll(links=>links.filter(link=>getComputedStyle(link).display!=='none'&&link.getBoundingClientRect().height<40).map(link=>link.textContent.trim()));
     if(tinyTargets.length)errors.push(width+' Manager Record Books links too small to tap: '+tinyTargets.join(', '));
    }
    await page.locator('#manager').selectOption('Stilly');
    const career=(await (await page.request.get(baseUrl+'data/career_core_generated.json')).json()).managers.Stilly;
    const expected=career.w+'–'+career.l+(career.t?'–'+career.t:'');
    if(!(await page.locator('#profile').innerText()).includes(expected))errors.push(width+' historical archive did not render canonical Stilly WLT '+expected);
    const typography=await page.locator('#profile .card').first().evaluate(card=>{
     const label=card.querySelector('small'),value=card.querySelector('strong');
     if(!label||!value)return null;
     const labelBox=label.getBoundingClientRect(),valueBox=value.getBoundingClientRect();
     const computed=getComputedStyle(value);
     return {display:computed.display,lineHeight:parseFloat(computed.lineHeight),
      labelBottom:labelBox.bottom,valueTop:valueBox.top,cardRight:card.getBoundingClientRect().right,
      viewport:document.documentElement.clientWidth};
    });
    if(!typography||typography.display!=='block'||typography.lineHeight<28||
       typography.valueTop-typography.labelBottom<6||typography.cardRight>typography.viewport+2)
     errors.push(width+' career record book labels and figures remain cramped or overflow');
    const rowSpacing=await page.locator('#profile table').first().locator('tbody tr').first().locator('td').first().evaluate(cell=>{
     const cs=getComputedStyle(cell);return {lineHeight:parseFloat(cs.lineHeight),padding:parseFloat(cs.paddingTop)};
    });
    if(rowSpacing.lineHeight<20||rowSpacing.padding<11)
     errors.push(width+' career record book table typography too tight');
    if(width===390){
     const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+2);
     if(overflow)errors.push(width+' career record book causes full-page horizontal overflow');
    }
    // The recovered manager record archive uses Thommy, not the legacy Tom alias.
    const managerOptions=await page.locator('#manager option').evaluateAll(opts=>opts.map(x=>x.value));
    if(!managerOptions.includes('Thommy')||!managerOptions.includes('Schermerhorn')||managerOptions.includes('Tom'))
     errors.push(width+' historical record book must distinguish Thommy and Schermerhorn without ambiguous Tom');
    else{
     await page.locator('#manager').selectOption('Thommy');
     const thommyProfile=await page.locator('#profile').innerText();
     if(!thommyProfile.includes('Recorded postseason matchups')||!thommyProfile.includes('67–75–1')||
        !thommyProfile.includes('241.00')||!thommyProfile.includes('NFL Weeks 15–16 combined')||
        !((await page.locator('#manager-destination a').getAttribute('href'))||'').endsWith('tom/'))
      errors.push(width+' Thommy historical record must retain his own career and current profile');
     await page.locator('#manager').selectOption('Schermerhorn');
     const historicalProfile=await page.locator('#profile').innerText();
     if(!historicalProfile.includes('12–13')||!historicalProfile.includes('25 games')||
        await page.locator('#manager-destination a').count()!==0||
        !(await page.locator('#manager-destination').innerText()).includes('Historical manager'))
      errors.push(width+' Schermerhorn historical record is merged or has invalid current-profile link');
    }
   }
   if(route==='managers/stilly/'){
    // Keep a source request unresolved and ensure static archive numbers are hidden while loading.
    const slow=await context.newPage();
    let releaseSource;
    const held=new Promise(resolve=>{releaseSource=resolve});
    await slow.route('**/data/waiver_award_candidates.json',async intercepted=>{
     await held;
     try{await intercepted.continue()}catch{}
    });
    try{
     await slow.goto(baseUrl+route,{waitUntil:'domcontentloaded',timeout:30000});
     await slow.locator('#franchise-encyclopedia[data-encyclopedia-updated="loading"]').waitFor({state:'attached',timeout:5000});
     const loadingCards=await slow.locator('[data-encyclopedia-waiver], [data-encyclopedia-trade]').allInnerTexts();
     if(loadingCards.length!==2||loadingCards.some(t=>!t.includes('Loading player and trade history')))
      errors.push(width+' '+route+' source loading exposes stale highlight text');
    }finally{
     releaseSource();
     await slow.close();
    }
    // Fault injection: source failure must not leak stale hardcoded award numbers.
    const failure=await context.newPage();
    await failure.route('**/data/waiver_award_candidates.json',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"injected"}'}));
    await failure.goto(baseUrl+route,{waitUntil:'networkidle',timeout:30000});
    const status=await failure.locator('#franchise-encyclopedia').getAttribute('data-encyclopedia-updated');
    const waiver=await failure.locator('[data-encyclopedia-waiver]').innerText();
    const trade=await failure.locator('[data-encyclopedia-trade]').innerText();
    if(status!=='unavailable'||!waiver.includes('Pickup history unavailable')||!trade.includes('Trade history unavailable'))
     errors.push(width+' '+route+' failed-source encyclopedia did not fail closed');
    if(waiver.includes('125.20')||trade.includes('453.4')||trade.includes('198.0'))
     errors.push(width+' '+route+' failed-source encyclopedia leaked hardcoded historic evidence');
    await failure.close();
    // A 200 response with corrupt evidence is just as dangerous as an HTTP outage.
    const corrupt=await context.newPage();
    await corrupt.route('**/data/waiver_award_candidates.json',async intercepted=>{
     const original=await intercepted.fetch();
     const json=await original.json();
     json.managers.Stilly[0].points=null;
     await intercepted.fulfill({response:original,json});
    });
    await corrupt.goto(baseUrl+route,{waitUntil:'networkidle',timeout:30000});
    const corruptStatus=await corrupt.locator('#franchise-encyclopedia').getAttribute('data-encyclopedia-updated');
    const corruptText=await corrupt.locator('#franchise-encyclopedia').innerText();
    if(corruptStatus!=='unavailable'||!corruptText.includes('Pickup history unavailable')||!corruptText.includes('Trade history unavailable'))
     errors.push(width+' '+route+' malformed encyclopedia evidence did not fail closed');
    if(corruptText.includes('NaN')||corruptText.includes('125.20'))
     errors.push(width+' '+route+' malformed encyclopedia source exposed invalid or stale numbers');
    await corrupt.close();
    // Metadata can be malformed even when the measured points are valid.
    const missingType=await context.newPage();
    await missingType.route('**/data/waiver_award_candidates.json',async intercepted=>{
     const original=await intercepted.fetch();
     const json=await original.json();
     json.managers.Stilly[0].acquisitionType=null;
     await intercepted.fulfill({response:original,json});
    });
    await missingType.goto(baseUrl+route,{waitUntil:'networkidle',timeout:30000});
    const missingTypeStatus=await missingType.locator('#franchise-encyclopedia').getAttribute('data-encyclopedia-updated');
    const missingTypeText=await missingType.locator('#franchise-encyclopedia').innerText();
    if(missingTypeStatus!=='unavailable'||!missingTypeText.includes('Pickup history unavailable'))
     errors.push(width+' '+route+' waiver with missing acquisition evidence did not fail closed');
    await missingType.close();
    // Verify that malformed trade-side evidence also fails closed, not just waiver data.
    const corruptTrade=await context.newPage();
    await corruptTrade.route('**/data/v9_trade_engine.json',async intercepted=>{
     const original=await intercepted.fetch();
     const json=await original.json();
     const side=json.sides.filter(x=>x.manager==='Stilly'&&x.direct_edge>0)
      .sort((a,b)=>b.direct_edge-a.direct_edge)[0];
     if(!side)throw Error('No qualifying Stilly trade-side evidence for fault injection');
     side.starter_points=null;
     await intercepted.fulfill({response:original,json});
    });
    await corruptTrade.goto(baseUrl+route,{waitUntil:'networkidle',timeout:30000});
    const badTradeStatus=await corruptTrade.locator('#franchise-encyclopedia').getAttribute('data-encyclopedia-updated');
    const badTradeText=await corruptTrade.locator('#franchise-encyclopedia').innerText();
    if(badTradeStatus!=='unavailable'||!badTradeText.includes('Trade history unavailable')||!badTradeText.includes('Pickup history unavailable'))
     errors.push(width+' '+route+' malformed trade evidence did not fail closed');
    if(badTradeText.includes('NaN')||badTradeText.includes('453.4'))
     errors.push(width+' '+route+' malformed trade source exposed invalid or stale numbers');
    await corruptTrade.close();
   }
   }catch(e){
    const routeName=route||'index.html';
    const message='Route audit interrupted: '+(e?.message||String(e));
    errors.push(width+' '+routeName+' route audit exception: '+(e?.stack||String(e)));
    // Preserve one audit row per attempted page, even for early navigation failures.
    if(!pageAudits.some(a=>a.route===routeName&&a.width===width))
     pageAudits.push({route:routeName,width,failed:true,findings:[message]});
   }finally{
    try{await page.close()}catch(e){errors.push(width+' '+route+' page cleanup error: '+String(e))}
    completedPages++;
   }
  }
  await context.close();
 }
}catch(e){errors.push('Fatal browser suite error: '+(e?.stack||String(e)))}finally{if(browser)try{await browser.close()}catch(e){errors.push('Browser cleanup error: '+String(e))}server.close()}
if(completedPages!==routes.length*(useWebkit?1:2))errors.push('Incomplete browser coverage: completed '+completedPages+' of '+routes.length*(useWebkit?1:2)+' planned page visits');
// Preserve machine-readable browser outcomes for failed and successful CI attempts.
await fs.mkdir(path.join(root,'data-integrity'),{recursive:true});
await fs.writeFile(path.join(root,'data-integrity','browser-release-'+engine.toLowerCase()+'.json'),
 JSON.stringify({engine,viewports:useWebkit?[390]:[390,1280],plannedRoutes:routes.length,plannedPageVisits:routes.length*(useWebkit?1:2),attemptedPages,completedPages,passed:errors.length===0&&completedPages===routes.length*(useWebkit?1:2),pageAudits,errors},null,2)+'\n');
if(errors.length){console.error(engine+' browser release test FAILED:\n'+errors.map(x=>' - '+x).join('\n'));process.exitCode=1}
else console.log(engine+' browser release test PASS with JS and interactive archive checks');
