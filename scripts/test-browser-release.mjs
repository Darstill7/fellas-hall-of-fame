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
const routes=['','seasons/','seasons/weekly-matchup-archive.html','managers/index.html','managers/record-books.html','analytics/records.html','analytics/records-archive.html','analytics/goat-debate.html','analytics/franchise-timeline.html','analytics/legacy.html','analytics/power-ratings.html','analytics/trades.html','analytics/metrics.html','analytics/manager-trade-intelligence.html','analytics/manager-decision-audit.html','analytics/this-week-history.html','analytics/trade-museum.html','hall/players.html','hall/shame.html','labs/faab/index.html','labs/lineups/index.html','analytics/manager-performance-timeline.html','analytics/manager-league-benchmarks.html','analytics/franchise-encyclopedia.html','analytics/manager-report-cards.html','analytics/manager-lineup-research.html','analytics/keeper-decision-research.html','analytics/manager-madden-cards.html','analytics/historical-spreads.html','analytics/rivalries.html','analytics/awards-show.html','seasons/all-time-schedule-swap.html','seasons/espn-records.html','seasons/espn-origins.html','seasons/historical-awards.html','seasons/unified-record-book.html',...slugs.flatMap(s=>['managers/'+s+'/','managers/'+s+'.html'])];
const rivals=['stilly','jmid','tom','stew','scott','mitch','tony','stover','kuhl','birch'];
for(let i=0;i<rivals.length;i++)for(let j=i+1;j<rivals.length;j++)routes.push('rivalries/'+rivals[i]+'-vs-'+rivals[j]+'.html');
const errors=[];
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
   const response=await page.goto(baseUrl+route,{waitUntil:'networkidle',timeout:30000});
   if(!response?.ok())errors.push(width+' '+route+' HTTP '+response?.status());
   await page.waitForTimeout(150);
   const state=await page.evaluate(()=>({body:document.body?.innerText?.length||0,scroll:document.documentElement.scrollWidth,viewport:window.innerWidth}));
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
    const noPartialGrade=await page.evaluate(async()=>{
     const r=await fetch(new URL('../data/keeper_2026_website_research_v1.json',location.href));
     const j=await r.json();
     return j.rows.length===10&&j.rows.every(m=>m.researchScore===null&&m.officialKeeperDecisionGrade===null);
    });
    if(!noPartialGrade)errors.push(width+' 2026 partial keeper season leaked completed season grade');
   }
   if(route.startsWith('managers/')&&route.endsWith('/')){
    const heroMadden=page.locator('.profile-madden');
    if(await heroMadden.count()!==1)
     errors.push(width+' '+route+' canonical Madden summary missing');
    else{
     const panel=await heroMadden.innerText();
     if(!panel.includes('OVR')||!panel.includes('Championships')||
        !panel.includes('Best individual season:')||!panel.includes('What this rating means:'))
      errors.push(width+' '+route+' primary career rating or peak season missing');
     const heroStats=page.locator('main .hero .stats');
     if(await heroStats.count()&&await heroStats.isVisible())
      errors.push(width+' '+route+' duplicate hero statistics still crowd landing card');
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
      await career.locator('summary').click();
      const metrics=career.locator('.career-resume-metric');
      if(await metrics.count()!==4)
       errors.push(width+' '+route+' career draft/trade résumé totals unavailable');
      else{
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
      await timeline.locator('summary').click();
      const entries=timeline.locator('.profile-season-evidence-row');
      if(await entries.count()<3)
       errors.push(width+' '+route+' insufficient documented manager seasons');
      else {
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
    const more=page.locator('details.report-more-links');
    if(await more.count()!==1||await more.evaluate(el=>el.open))
     errors.push(width+' report cards should tuck secondary research links away');
    if(await page.locator('.report-top-nav a').count()!==3)
     errors.push(width+' report cards primary navigation should have three clear destinations');
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
     await guide.locator('summary').click();
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
     // The manager-profile deep link should show only that manager and open
     // the compact pickup details, not leave visitors at the comparison form.
     await page.goto(baseUrl+'analytics/manager-report-cards.html?manager=Stilly#cards',{waitUntil:'networkidle'});
     const filtered=page.locator('[data-report-manager]');
     if(await filtered.count()!==1||await filtered.first().getAttribute('data-report-manager')!=='Stilly')
      errors.push(width+' filtered pickup deep link did not isolate Stilly');
     const opened=filtered.locator('details.pickup-highlights');
     if(await opened.count()!==1||!(await opened.evaluate(el=>el.open)))
      errors.push(width+' filtered pickup deep link did not auto-open the highlights');
     if(await opened.locator('li').count()!==3)
      errors.push(width+' filtered pickup view lacks its three sourced highlights');
    }
   }
   if(route===''){
    const desktopNav=page.locator('.main-nav');
    const mobileNav=page.locator('details.mobile-menu');
    if(width===390){
     if(!await mobileNav.isVisible()||await desktopNav.isVisible())errors.push(width+' homepage mobile navigation visibility wrong');
     await mobileNav.locator(':scope > summary').click();
     for(const href of ['managers/','analytics/manager-report-cards.html','hall/','analytics/records.html','analytics/sportscenter.html','analytics/power-ratings.html','analytics/rivalry-war-room.html','seasons/','analytics/search.html'])
      if(!await mobileNav.locator('a[href="'+href+'"]').isVisible())errors.push(width+' mobile navigation missing '+href);
     await mobileNav.locator(':scope > summary').click();
    }else{
     if(await desktopNav.locator(':scope > a').count()!==5)errors.push(width+' homepage must show five primary desktop destinations');
     const more=desktopNav.locator('details.home-nav-more');
     if(await more.count()!==1||await more.evaluate(el=>el.open))errors.push(width+' desktop extra navigation should begin collapsed');
     await more.locator(':scope > summary').click();
     for(const href of ['analytics/power-ratings.html','analytics/rivalry-war-room.html','seasons/','analytics/search.html'])
      if(!await more.locator('a[href="'+href+'"]').isVisible())errors.push(width+' desktop extra navigation missing '+href);
     await more.locator(':scope > summary').click();
    }
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
    const cards=page.locator('#manager-directory-cards a.manager');
    if(await cards.count()!==10)errors.push(width+' managers directory needs exactly 10 profile links');
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
   if(['hall/players.html','hall/shame.html','labs/faab/index.html','labs/lineups/index.html'].includes(route)){
    const visible=await page.locator('body').innerText();
    if(/REVIEW BUILD|Fellas OS v8|static-first pre-publish|pre-publish analytics pass/.test(visible))
     errors.push(width+' '+route+' still shows development labels');
    if(!visible.includes('The Fellas'))errors.push(width+' '+route+' lost site identity');
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
    if((await projected.innerText()).trim()!=='Thommy 2019 −1.0')
     errors.push(width+' historical spread default line differs from verified Thommy 2019 -1.0');
    const originalDifference=await page.locator('#difference').innerText();
    if(!originalDifference.includes('Kuhl 2026')||!originalDifference.includes('Thommy 2019'))
     errors.push(width+' historical spread missing model differential and team labels');
    await page.locator('#swap').click();
    if(await teamA.inputValue()!=='2019|Thommy'||await teamB.inputValue()!=='2026|Kuhl')
     errors.push(width+' historical spread swap did not exchange both teams');
    if((await projected.innerText()).trim()!=='Thommy 2019 −1.0')
     errors.push(width+' historical spread changed favorite after swapping teams');
    await teamA.selectOption('2018|Kuhl');
    if(!(await page.locator('#difference').innerText()).includes('Kuhl 2018'))
     errors.push(width+' historical spread selector failed to recalculate comparison');
    await page.goto(baseUrl+'analytics/historical-spreads.html?a=2018%7CKuhl&b=2019%7CThommy',{waitUntil:'networkidle'});
    if(await page.locator('#team-a').inputValue()!=='2018|Kuhl'||await page.locator('#team-b').inputValue()!=='2019|Thommy')
     errors.push(width+' historical spread deep-link parameters not honored');
   }
   if(route==='analytics/power-ratings.html'){
    const cards=await page.locator('[data-rating-manager]').count();
    if(cards!==14)errors.push(width+' power ratings failed to render 14 managers: '+cards);
   }
   if(route==='analytics/manager-madden-cards.html'){
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
   if(route.startsWith('rivalries/')){
    const text=await page.locator('body').innerText();
    if(text.includes('Rivalry archive could not be loaded')||text.includes('Rivalry data unavailable'))errors.push(width+' '+route+' rivalry module did not load');
   }
   if(route===''){
    const snapshot=await page.locator('#home-season-snapshot').innerText();
    if(!/Canonical results through Week [1-9][0-9]*\b/.test(snapshot)||!snapshot.includes('reconstructed'))errors.push(width+' homepage canonical 2026 snapshot inaccurate');
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
    if(['stilly','stew','tom','stover','birch'].includes(slug)){
     const story=page.locator('#franchise-story');
     const wlt=story.locator('[data-canonical-manager-record]');
     const games=story.locator('[data-canonical-manager-games]');
     if(await wlt.count()!==1||await games.count()!==1)errors.push(width+' '+route+' biography career bindings absent');
     else {
      if(await wlt.getAttribute('data-canonical-updated')!=='yes'||await games.getAttribute('data-canonical-updated')!=='yes')errors.push(width+' '+route+' biography career bindings failed to load canonical data');
      const canonicalId=slug==='tom'?'Thommy':slug[0].toUpperCase()+slug.slice(1);
      const careerResponse=await page.request.get(baseUrl+'data/career_core_generated.json');
      const career=(await careerResponse.json()).managers[canonicalId];
      const expected=career.w+'–'+career.l+(career.t?'–'+career.t:'');
      if((await wlt.textContent()).trim()!==expected||(await games.textContent()).trim()!==String(career.games))
       errors.push(width+' '+route+' biography values disagree with canonical career record');
     }
    }
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
     const features=page.locator('[data-profile-feature-menu] .profile-feature-button');
     if(await features.count()!==11)
      errors.push(width+' '+slug+' missing eleven individually labeled feature buttons');
     else{
      const labels=await features.locator('strong').allTextContents();
      for(const label of ['Championships & career record','Season-by-season results',
       'Head-to-head & rivalries','Legacy OVR progression','Drafting & trading résumé',
       'Pickup highlights & FAAB','Start/Sit accuracy','Keeper research']){
       if(!labels.includes(label))errors.push(width+' '+slug+' feature button missing '+label);
      }
      const destinations=await features.evaluateAll(nodes=>nodes.map(x=>x.tagName==='A'?
       {href:x.getAttribute('href'),label:x.querySelector('strong')?.textContent}:
       {target:x.dataset.featureTarget,tab:x.dataset.featureTab||null}));
      if(destinations.some(d=>d.href&&!d.href.includes('manager=')||
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
      if(await page.locator('[data-profile-tab="rivalries"]').getAttribute('aria-selected')!=='true'||
         !await page.locator('#head-to-head').isVisible())
       errors.push(width+' '+slug+' rivalry feature did not activate the visible research');
      const researchShelf=page.locator('details.profile-research-shelf');
      await researchShelf.evaluate(el=>el.open=false);
      const career=page.locator('[data-profile-feature][data-feature-target=".profile-career-resume"]');
      await page.locator('.profile-focus-toolbar button').click();
      const careerGroup=page.locator('details.profile-feature-group').filter({has:career});
      if(!await careerGroup.evaluate(el=>el.open))await careerGroup.locator(':scope > summary').click();
      await career.click();
      if(!await researchShelf.evaluate(el=>el.open)||
         !await page.locator('.profile-career-resume').evaluate(el=>el.open))
       errors.push(width+' '+slug+' career résumé feature failed to reveal hidden evidence');
      await researchShelf.evaluate(el=>el.open=false);
      await page.locator('.profile-focus-toolbar button').click();
      const front=page.locator('[data-profile-feature][data-feature-target=".profile-front-office-snapshot"]');
      const frontGroup=page.locator('details.profile-feature-group').filter({has:front});
      if(!await frontGroup.evaluate(el=>el.open))await frontGroup.locator(':scope > summary').click();
      await front.click();
      if(!await researchShelf.evaluate(el=>el.open)||
         !await page.locator('.profile-front-office-snapshot').isVisible())
       errors.push(width+' '+slug+' front-office button failed to reveal evidence');
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
    const dossierLink=page.locator('a[href="../'+slug+'.html"]').first();
    if(await dossierLink.count()!==1)errors.push(width+' '+route+' full franchise dossier link missing');
    else{
     const destination=new URL(await dossierLink.getAttribute('href'),baseUrl+route);
     const result=await page.request.get(destination.toString());
     if(result.status()!==200)errors.push(width+' '+route+' full franchise dossier link HTTP '+result.status());
    }
   }
   if(route==='analytics/awards-show.html'){
    const buttons=page.locator('#years button');
    if(await buttons.count()<2)errors.push(width+' Awards Show year buttons failed to render');
    else{
     await buttons.last().click();
     const chosen=await buttons.last().getAttribute('data-year');
     if(!(await page.locator('#heading').innerText()).includes(chosen))errors.push(width+' Awards Show year selection not reflected');
    }
   }
   if(route.startsWith('managers/')&&slugs.includes(route.slice('managers/'.length,-'.html'.length))&&route.endsWith('.html')){
    const slug=route.slice('managers/'.length,-'.html'.length);
    const body=await page.locator('body').innerText();
    if(!body.includes('Franchise'))errors.push(width+' '+route+' missing legacy dossier content');
    if(!await page.locator('[data-canonical-manager-record]').count())errors.push(width+' '+route+' missing canonical career binding');
   }
   if(route==='managers/record-books.html'){
    await page.locator('#manager').selectOption('Stilly');
    const career=(await (await page.request.get(baseUrl+'data/career_core_generated.json')).json()).managers.Stilly;
    const expected=career.w+'–'+career.l+(career.t?'–'+career.t:'');
    if(!(await page.locator('#profile').innerText()).includes(expected))errors.push(width+' historical archive did not render canonical Stilly WLT '+expected);
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
   await page.close();
   completedPages++;
  }
  await context.close();
 }
}catch(e){errors.push('Fatal browser suite error: '+(e?.stack||String(e)))}finally{if(browser)try{await browser.close()}catch(e){errors.push('Browser cleanup error: '+String(e))}server.close()}
if(completedPages!==routes.length*(useWebkit?1:2))errors.push('Incomplete browser coverage: completed '+completedPages+' of '+routes.length*(useWebkit?1:2)+' planned page visits');
// Preserve machine-readable browser outcomes for failed and successful CI attempts.
await fs.mkdir(path.join(root,'data-integrity'),{recursive:true});
await fs.writeFile(path.join(root,'data-integrity','browser-release-'+engine.toLowerCase()+'.json'),
 JSON.stringify({engine,viewports:useWebkit?[390]:[390,1280],plannedRoutes:routes.length,plannedPageVisits:routes.length*(useWebkit?1:2),attemptedPages,completedPages,passed:errors.length===0&&completedPages===routes.length*(useWebkit?1:2),errors},null,2)+'\n');
if(errors.length){console.error(engine+' browser release test FAILED:\n'+errors.map(x=>' - '+x).join('\n'));process.exitCode=1}
else console.log(engine+' browser release test PASS with JS and interactive archive checks');
