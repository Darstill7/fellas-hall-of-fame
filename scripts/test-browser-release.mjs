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
const routes=['','seasons/','seasons/weekly-matchup-archive.html','managers/record-books.html','analytics/records.html','analytics/records-archive.html','analytics/legacy.html','analytics/power-ratings.html','analytics/manager-report-cards.html','analytics/manager-madden-cards.html','analytics/rivalries.html','analytics/awards-show.html','seasons/all-time-schedule-swap.html','seasons/espn-records.html','seasons/espn-origins.html','seasons/historical-awards.html','seasons/unified-record-book.html',...slugs.flatMap(s=>['managers/'+s+'/','managers/'+s+'.html'])];
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
   if(route==='analytics/manager-report-cards.html'){
    const count=await page.locator('[data-report-manager]').count();
    if(count!==10)errors.push(width+' report card preview rendered '+count+' of 10 managers');
   }
   if(route===''){
    const seasonLinks=page.locator('a[href="analytics/manager-madden-cards.html#records-heading"]');
    if(await seasonLinks.count()<2)errors.push(width+' homepage missing prominent Season OVR record book links');
    if(await page.locator('#home-manager-cards a').count()!==10)errors.push(width+' homepage must retain ten clickable Legacy OVR manager cards');
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
     const historical= madden.locator('details.profile-madden-history');
     if(await historical.count()!==1)errors.push(width+' '+route+' missing historical OVR journey');
     else if(await historical.locator('.profile-historical-table tbody tr').count()<1)errors.push(width+' '+route+' historical OVR journey is empty');
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
      if((await wlt.innerText()).trim()!==expected||(await games.innerText()).trim()!==String(career.games))
       errors.push(width+' '+route+' biography values disagree with canonical career record');
     }
    }
    if(slug==='stover'){
     const quickLinks=page.locator('.profile-quick-grid a[data-profile-jump]');
     if(await quickLinks.count()!==4)errors.push(width+' stover quick-start shortcuts missing');
     else{
      await quickLinks.nth(2).click();
      if(await page.locator('[data-profile-tab="rivalries"]').getAttribute('aria-selected')!=='true'||!await page.locator('#head-to-head').isVisible())errors.push(width+' stover head-to-head shortcut failed');
     }
     const tabs=page.locator('[data-manager-profile-tabs] button[data-profile-tab]');
     if(await tabs.count()!==4)errors.push(width+' stover missing redesigned profile tabs');
     else{
      for(const category of ['overview','seasons','rivalries','advanced']){
       const button=page.locator('[data-manager-profile-tabs] button[data-profile-tab="'+category+'"]');
       await button.click();
       if(await button.getAttribute('aria-selected')!=='true')errors.push(width+' stover '+category+' tab selection broken');
       const sectionId={overview:'franchise-story',seasons:'season-history',rivalries:'head-to-head',advanced:'franchise-encyclopedia'}[category];
       if(!await page.locator('#'+sectionId).isVisible())errors.push(width+' stover '+category+' tab content hidden');
      }
     }
    }else{
     const chapters=page.locator('nav.profile-chapters a[href^="#"]');
     if(await chapters.count()!==7)errors.push(width+' '+slug+' missing chapter navigation');
     else for(const href of await chapters.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')))){
      if(await page.locator(href).count()!==1)errors.push(width+' '+slug+' chapter target absent: '+href);
     }
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
       if(await card.locator('h3').innerText()!=='Source-backed highlight'||
          !(await card.locator('p').innerText()).includes('Source-backed historical evidence loads'))
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
     await slow.locator('#franchise-encyclopedia[data-encyclopedia-updated="loading"]').waitFor({timeout:5000});
     const loadingCards=await slow.locator('[data-encyclopedia-waiver], [data-encyclopedia-trade]').allInnerTexts();
     if(loadingCards.length!==2||loadingCards.some(t=>!t.includes('Loading source-backed highlights')))
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
    if(status!=='unavailable'||!waiver.includes('Waiver evidence unavailable')||!trade.includes('Trade evidence unavailable'))
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
    if(corruptStatus!=='unavailable'||!corruptText.includes('Waiver evidence unavailable')||!corruptText.includes('Trade evidence unavailable'))
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
    if(missingTypeStatus!=='unavailable'||!missingTypeText.includes('Waiver evidence unavailable'))
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
    if(badTradeStatus!=='unavailable'||!badTradeText.includes('Trade evidence unavailable')||!badTradeText.includes('Waiver evidence unavailable'))
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
