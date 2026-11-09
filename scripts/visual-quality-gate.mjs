// Focused visual QA: fast screenshots and layout checks independent of deep canonical tests.
import {chromium,webkit} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),base='/fellas-hall-of-fame/';
const slugs=['stilly','stew','tom','stover','birch','tony','mitch','kuhl','jmid','scott'];
const routes=['','managers/','analytics/manager-report-cards.html','analytics/manager-lineup-research.html','analytics/records.html','analytics/scoring-consistency.html',
 'analytics/power-ratings.html','analytics/rivalries.html','analytics/playoff-history.html','hall/championship-stories.html','hall/playoff-heroes.html','analytics/draft-value-lab.html','analytics/draft-keeper-value.html','analytics/draft-intelligence.html','analytics/manager-draft-report-cards.html','analytics/draft-legends.html','analytics/keeper-tracker.html','analytics/legendary-records.html','analytics/manager-madden-cards.html','analytics/franchise-timeline.html','hall/','seasons/',
 'managers/record-books.html','analytics/record-holders.html',
 'seasons/2020.html','seasons/2021.html','seasons/2022.html','seasons/2023.html','seasons/2024.html','seasons/2025.html',
 ...slugs.map(s=>'managers/'+s+'/'),'rivalries/stilly-vs-jmid.html'];
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(!url.pathname.startsWith(base)){res.writeHead(404);res.end();return;}
 let rel;
 try{rel=decodeURIComponent(url.pathname.slice(base.length));}catch{res.writeHead(400);res.end();return;}
 if(!rel||rel.endsWith('/'))rel+='index.html';
 const file=path.resolve(root,rel);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{
  const content=await fs.readFile(file);
  res.writeHead(200,{'Content-Type':file.endsWith('.json')?'application/json':/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});
  res.end(content);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const baseUrl='http://127.0.0.1:'+server.address().port+base;
const output=path.join(root,'data-integrity','visual-gate');
const findings=[],screens=[],mobileJourneys=[];
const placementReceipts=JSON.parse(await fs.readFile(path.join(root,'data','sleeper_postseason_placement_receipts_2020_2025.json'),'utf8'));
try{
 for(const [engine,widths] of [['chromium',[320,390,768,1280]],['webkit',[390]]]){
  const browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='webkit'?{}:{args:['--no-sandbox']})});
  try{
   for(const width of widths){
    const context=await browser.newContext({viewport:{width,height:width<=390?844:width===768?960:900},
     isMobile:width<=390,hasTouch:width<=390,reducedMotion:'reduce'});
    try{
     for(const route of routes){
      const key=route||'index.html',name=key.replace(/[^a-z0-9-]+/gi,'_');
      const page=await context.newPage();
      const runtime=[];
      page.on('pageerror',error=>runtime.push(error.message));
      page.on('response',response=>{if(response.status()>=400)runtime.push(response.status()+' '+response.url());});
      try{
       const response=await page.goto(baseUrl+route,{waitUntil:'domcontentloaded',timeout:12000});
       if(!response?.ok())throw Error('HTTP '+response?.status());
       await page.waitForLoadState('networkidle',{timeout:4500}).catch(()=>{});
       await page.waitForTimeout(450);
       const audit=await page.evaluate(()=>{
        const visible=node=>{
         if(!node)return false;
         const c=getComputedStyle(node),r=node.getBoundingClientRect();
         return c.display!=='none'&&c.visibility!=='hidden'&&r.width>0&&r.height>0;
        };
        const main=document.querySelector('main,[role="main"]'),heading=[...document.querySelectorAll('main h1,.top h1,h1')].find(visible);
        const hr=heading?.getBoundingClientRect(),hs=heading?getComputedStyle(heading):null;
        const nav=[...document.querySelectorAll('header nav a,nav.nav a,header a')].filter(visible);
        const tiny=nav.filter(x=>x.getBoundingClientRect().height<38).map(x=>x.textContent.trim()).slice(0,8);
        const buttons=[...document.querySelectorAll('button,select,summary')].filter(visible);
        const clipped=hr&&hs&&hs.lineHeight!=='normal'&&parseFloat(hs.lineHeight)+1<parseFloat(hs.fontSize);
        return {title:document.title,heading:heading?.textContent?.replace(/\s+/g,' ').trim().slice(0,120)||null,
         headingTop:hr?Math.round(hr.top):null,headingBottom:hr?Math.round(hr.bottom):null,
         headingClipped:!!clipped,firstScreenHeading:!!hr&&hr.top<innerHeight*.82,
         bodyWidth:document.documentElement.scrollWidth,viewport:innerWidth,
         horizontalOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),
         tinyNavTargets:tiny,visibleNavLinks:nav.length,visibleControls:buttons.length,
         cards:[...document.querySelectorAll('.card,.tile,.manager,.stat')].filter(visible).length,
         skipLink:!!document.querySelector('a.fellas-skip[href="#main-content"]'),
         mainLandmark:!!main,
         primaryStyle:!!document.querySelector('link[href*="assets/fellas-ui-system.css"]'),
         loading:/(loading verified manager rankings)/i.test(document.getElementById('home-manager-status')?.innerText||''),
         snapshotTiles:document.querySelectorAll('.profile-career-snapshot .stat').length,
         bodyTextLength:(document.body.innerText||'').length};
       });
       const record={engine,width,route:key,...audit,runtimeErrors:runtime};
       screens.push(record);
       if(!audit.heading||!audit.mainLandmark||audit.bodyTextLength<80)
        findings.push(engine+' '+width+' '+key+' missing usable first screen');
       if(audit.horizontalOverflow>5)
        findings.push(engine+' '+width+' '+key+' horizontal overflow '+audit.horizontalOverflow+'px');
       if(audit.headingClipped)
        findings.push(engine+' '+width+' '+key+' title line height clips heading');
       if(audit.tinyNavTargets.length)
        findings.push(engine+' '+width+' '+key+' small navigation targets '+audit.tinyNavTargets.join(', '));
       if(runtime.length)
        findings.push(engine+' '+width+' '+key+' resource or JS error '+runtime.slice(0,3).join(' | '));
       if(audit.loading)
        findings.push(engine+' '+width+' '+key+' first-screen content remains in a loading state');
       if(route===''){
        const featured=await page.locator('main .section .cards .home-featured-card').evaluateAll(nodes=>nodes.map(n=>({
         link:n.getAttribute('href'),height:n.getBoundingClientRect().height,
         contrast:getComputedStyle(n).borderColor
        })));
        if(featured.length!==2||featured[0].link!=='hall/'||featured[1].link!=='analytics/records.html'||
           featured.some(card=>card.height<120))
         findings.push(engine+' '+width+' homepage champions and records feature hierarchy missing');
       }
       if(route===''){
        const discovery=await page.evaluate(()=>{
         const sections=[...document.querySelectorAll('main .section.shell')];
         const explore=sections.find(section=>section.querySelector('h2')?.textContent?.trim()==='Explore the league');
         const core=[...explore?.querySelectorAll(':scope > .cards > a.card')||[]].map(a=>a.getAttribute('href'));
         const advanced=explore?.querySelector('details.home-explore-more');
         return {core,advancedCount:advanced?.querySelectorAll('a.card').length||0,
          advancedCollapsed:advanced&&!advanced.open};
        });
        if(JSON.stringify(discovery.core)!==JSON.stringify(['hall/','analytics/records.html','managers/','seasons/'])||
           discovery.advancedCount!==5||!discovery.advancedCollapsed)
         findings.push(engine+' '+width+' '+key+' homepage discovery hierarchy '+JSON.stringify(discovery));
       }
       if(route==='hall/'||route==='analytics/records.html'){
        const hierarchy=await page.evaluate(()=>{
         const hero=document.querySelector('main .hero');
         const sections=[...document.querySelectorAll('main .section')];
         const title=hero?.querySelector('h1');
         const firstSection=sections[0];
         return {titleSize:parseFloat(getComputedStyle(title).fontSize),
          sectionTitleSize:parseFloat(getComputedStyle(firstSection?.querySelector('h2')).fontSize),
          sectionCards:[...firstSection?.querySelectorAll('.tile')||[]].map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})),
          archiveTable:document.querySelector('main .records-table')?.getBoundingClientRect().width||0};
        });
        if(hierarchy.titleSize<32||hierarchy.sectionTitleSize<22||
           (route==='hall/'&&(hierarchy.sectionCards.length!==6||hierarchy.sectionCards.some(c=>c.width<160||c.height<90)))||
           (route==='analytics/records.html'&&hierarchy.archiveTable<200))
         findings.push(engine+' '+width+' '+key+' hall/record editorial visual hierarchy '+JSON.stringify(hierarchy));
       }
       if(route==='analytics/manager-madden-cards.html'){
        const score=page.locator('.card .ovr-value').first();
        if(!await score.count())throw Error('Manager OVR value missing');
        const metrics=await score.evaluate(node=>{
         const container=node.closest('.ovr'),rect=node.getBoundingClientRect(),range=document.createRange();
         range.selectNodeContents(node);
         const lines=[...range.getClientRects()].filter(x=>x.width>0);
         return {value:node.textContent?.trim(),lines:lines.length,scroller:document.documentElement.scrollWidth,viewport:innerWidth,
           fit:rect.right<=innerWidth+3&&rect.left>=-3,cardFit:!!container&&container.getBoundingClientRect().width>=rect.width-1};
        });
        if(metrics.lines!==1||!/^\d{2}\.\d$/.test(metrics.value)||!metrics.fit||!metrics.cardFit)
         findings.push(engine+' '+width+' manager OVR wraps or clips '+JSON.stringify(metrics));
        if(await page.locator('.card .scouting-details').count()!==await page.locator('.card').count())
         findings.push(engine+' '+width+' manager research details not grouped under disclosure');
       }
       if(route==='analytics/franchise-timeline.html'){
        const card=page.locator('#seasons article.season').filter({hasText:'2025'}).first();
        const trade=card.locator('details.timeline-event-group').first();
        if(!await trade.count())throw Error('2025 archived transaction list missing');
        await trade.locator('summary').click({timeout:5000});
        const events=await trade.locator('ol.timeline-trades li').count();
        if(events!==3)findings.push(engine+' '+width+' timeline lost one or more 2025 Stilly trade events: '+events);
        if(!await page.locator('a[href="../seasons/2026.html"]').count())
         findings.push(engine+' '+width+' timeline archival freshness notice missing');
       }
       if(route==='analytics/playoff-history.html'){
        await page.locator('#playoff-year').selectOption('2024',{timeout:5000});
        const receipt=await page.evaluate(()=>({
         title:document.querySelector('.summary h2')?.textContent,
         games:document.querySelectorAll('article.match').length,
         finals:document.querySelectorAll('article.match.final').length,
         widths:document.documentElement.scrollWidth,
         year:new URLSearchParams(location.search).get('year'),
         score:document.querySelector('.match.final')?.textContent
        }));
        if(!receipt.title?.includes('Thommy')||receipt.games!==5||receipt.finals!==1||receipt.widths>width+4||receipt.year!=='2024'||!receipt.score?.includes('205.30'))
         findings.push(engine+' '+width+' playoff explorer 2024 verification failure '+JSON.stringify(receipt));
        await page.locator('#playoff-year').selectOption('2020',{timeout:5000});
        const partial=await page.evaluate(()=>({warning:document.querySelector('.score-warning')?.textContent,year:new URLSearchParams(location.search).get('year')}));
        if(!partial.warning?.includes('without a verified score')||partial.year!=='2020')
         findings.push(engine+' '+width+' early Sleeper missing-score warning absent '+JSON.stringify(partial));
        await page.locator('#playoff-year').selectOption('2016',{timeout:5000});
        if(!await page.locator('#playoff-view').textContent().then(x=>x.includes('Two-NFL-week aggregate')))
         findings.push(engine+' '+width+' ESPN two-week scoring qualifier absent');
       }
       if(route==='analytics/draft-value-lab.html'){
        const select=page.locator('#manager-choice');
        if(!await select.count())throw Error('Draft Value Lab manager filter missing');
        await select.selectOption('Stilly');
        const normal=page.locator('#value-results tbody tr');
        const draftRows=await normal.count();
        const woody=await page.locator('#value-results tbody tr').filter({hasText:'Woody Marks'}).count();
        if(draftRows!==13||woody!==1) findings.push(engine+' '+width+' Draft Value Lab did not show 13 nonkeeper selections and Woody Marks');
        await page.locator('[data-kind="keeper"]').click({timeout:5000});
        const keptRows=await page.locator('#value-results tbody tr').count();
        const daniels=await page.locator('#value-results tbody tr').filter({hasText:'Jayden Daniels'}).count();
        if(keptRows!==2||daniels!==1) findings.push(engine+' '+width+' Draft Value Lab keeper slot selection unavailable');
        const overflow=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth}));
        if(overflow.width>overflow.viewport+5)findings.push(engine+' '+width+' Draft Value Lab has horizontal page overflow '+JSON.stringify(overflow));
       }
       if(route==='analytics/draft-keeper-value.html'){
        await page.waitForFunction(()=>document.querySelector('#draft-rows')?.textContent?.includes('Matthew Golden'),{timeout:6000});
        const pick=await page.evaluate(()=>({
         count:document.querySelectorAll('#draft-rows tr').length,
         keeperCount:document.querySelectorAll('#keeper-rows article.keeper-card').length,
         first:document.querySelector('#draft-rows tr')?.textContent,
         note:document.querySelector('#draft-coverage')?.textContent
        }));
        if(pick.count<5||pick.keeperCount!==20||!pick.note?.includes('Week 8'))
         findings.push(engine+' '+width+' draft/keeper research loading or coverage failure '+JSON.stringify(pick));
        const managerRanking=await page.locator('#manager-value-ranking .manager-value-row').evaluateAll(rows=>rows.map(x=>({name:x.querySelector('.manager-name')?.textContent,height:x.getBoundingClientRect().height})));
        if(managerRanking.length!==10||managerRanking[0]?.name!=='Mitch'||managerRanking.some(x=>x.height<44))
         findings.push(engine+' '+width+' manager Value Points per Pick ranking incomplete or touch targets too small '+JSON.stringify(managerRanking));
        await page.locator('#manager-value-ranking [data-value-manager="Mitch"]').click();
        if(await page.locator('#draft-manager').inputValue()!=='Mitch')
         findings.push(engine+' '+width+' draft manager ranking does not drill down to original selections');
        await page.locator('#draft-manager').selectOption('Stilly');
        await page.locator('#draft-position').selectOption('RB');
        const woody=await page.locator('#draft-rows').textContent();
        if(!woody.includes('Woody Marks')||!woody.includes('25.90')||!woody.includes('Round 13'))
         findings.push(engine+' '+width+' Woody Marks 2026 verified pick value missing');
        await page.locator('#keeper-manager').selectOption('Stilly');
        const keeper=await page.locator('#keeper-rows').textContent();
        if(!keeper.includes('Amon-Ra St. Brown')||!keeper.includes('Keeper decision grade: not yet verified'))
         findings.push(engine+' '+width+' keeper observational return/decision distinction missing');
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
        if(overflow>4)findings.push(engine+' '+width+' draft value research page horizontal overflow '+overflow);
       }
       if(route==='analytics/legendary-records.html'){
        const legend=await page.evaluate(()=>({
         count:document.querySelectorAll('main .exhibit').length,
         summaries:[...document.querySelectorAll('main .exhibit .record-evidence>summary')].map(e=>e.getBoundingClientRect().height),
         links:[...document.querySelectorAll('.records-entry-paths a')].map(a=>a.getAttribute('href')),
         first:document.querySelector('main .exhibit h2')?.textContent?.trim()
        }));
        if(legend.count!==19||legend.summaries.some(h=>h<44)||legend.first!=='The Impossible Comeback')
         findings.push(engine+' '+width+' legendary records exhibit cards or evidence access incomplete '+JSON.stringify(legend));
        const witness=page.locator('#worst-championship-start details.record-evidence');
        await witness.locator('summary').click({timeout:5000});
        if(!await witness.evaluate(node=>node.open))findings.push(engine+' '+width+' legendary source disclosure failed');
       }
       if(route==='managers/'){
        const directory=await page.locator('#manager-directory-cards a.manager').evaluateAll(nodes=>nodes.map(n=>{
         const rect=n.getBoundingClientRect();
         const heading=n.querySelector('h2');
         return {width:rect.width,height:rect.height,
          headingSize:heading?parseFloat(getComputedStyle(heading).fontSize):0,
          label:heading?.textContent?.trim()||'',link:n.getAttribute('href')};
        }));
        if(directory.length!==10||directory.some(c=>c.width<200||c.height<85||c.headingSize<21||!c.label||!c.link))
         findings.push(engine+' '+width+' manager directory cards unreadable '+JSON.stringify(directory));
        if(width===390&&directory.some(c=>c.height>175))
         findings.push(engine+' '+width+' mobile directory card too tall for quick scanning');
       }
       if(route===''&&width===390){
        const headline=await page.locator('.hero h1').textContent();
        if(!/The history\.\s+The legends\.\s+The Fellas\./.test(headline||''))
         findings.push(engine+' '+width+' mobile homepage headline words run together');
       }
       if(route===''&&width===390){
        const firstManager=await page.locator('#home-manager-mobile .mobile-manager-row').first().evaluate(el=>el.getBoundingClientRect().top);
        if(firstManager>844*.82)findings.push(engine+' '+width+' manager choices start too far below first screen: '+Math.round(firstManager)+'px');
        if(await page.locator('main .hero .actions .button:visible').count())
         findings.push(engine+' '+width+' duplicate homepage hero buttons crowd out manager discovery');
       }
       if(width===390&&route.startsWith('managers/')&&slugs.includes(route.split('/')[1])&&route.endsWith('/')){
        const slug=route.split('/')[1];
        const expected=slug==='tom'?'thommy':slug;
        const hubCard=page.locator('.manager-home-hub-grid a[href*="manager-report-cards.html"]');
        if(await hubCard.count()===1){
         const href=await hubCard.getAttribute('href');
         if(href.includes('#cards'))throw Error('Primary manager Report Card link must open at top: '+slug);
        }

        // Some profiles progressively replace the static overview with an interactive home hub.
        // Check the canonical link in the original HTML, then verify destination behavior
        // separately rather than assuming an archived link stays mounted after hydration.
        const source=await page.evaluate(async()=>{const r=await fetch(location.pathname);return r.text()});
        const expectedLink='manager-draft-report-cards.html?manager='+expected;
        const links=[...source.matchAll(/href="[^"]*manager-draft-report-cards\.html[^"]*"/g)].map(m=>m[0]);
        if(links.length!==1||!links[0].includes(expectedLink))
         throw Error('Manager profile source lost clean draft report destination: '+slug+' '+JSON.stringify(links));
       }
       if(route.startsWith('managers/')&&route.endsWith('/')&&route!=='managers/'){
        const moment=page.locator('main .hero [data-defining-moment]');
        if(await moment.count()!==1){findings.push(engine+' '+width+' '+key+' missing unique defining franchise moment');}
        else{
         const info=await moment.evaluate(el=>({name:el.dataset.definingMoment,header:el.querySelector('h2')?.textContent?.trim(),
           linkHeight:el.querySelector('a')?.getBoundingClientRect().height||0,metric:el.querySelector('.profile-moment-stat')?.textContent?.trim(),
           champion:el.classList.contains('profile-moment-champion'),right:el.getBoundingClientRect().right}));
         if(!info.name||!info.header||!info.metric||info.linkHeight<42||info.right>width+5)
          findings.push(engine+' '+width+' '+key+' defining moment unclear or clipped '+JSON.stringify(info));
         if(info.champion!==['Stilly','Thommy','Stover','Birch','Tony','Scott'].includes(info.name))
          findings.push(engine+' '+width+' '+key+' championship gold assigned to wrong manager '+JSON.stringify(info));
        }
       }
       if(route.startsWith('managers/')&&route.endsWith('/')&&route!=='managers/'){
        const switcherMetrics=await page.locator('nav.hof-manager-switcher').evaluate(el=>{
         const rect=el.getBoundingClientRect(),links=[...el.querySelectorAll('a,select')];
         return {right:rect.right,width:rect.width,controlCount:links.length,
          controlHeights:links.map(node=>node.getBoundingClientRect().height),
          controlRights:links.map(node=>node.getBoundingClientRect().right),
          selected:el.querySelector('select')?.selectedOptions[0]?.textContent?.trim()};
        }).catch(()=>null);
        if(!switcherMetrics||switcherMetrics.controlCount!==3||
           switcherMetrics.controlHeights.some(height=>height<44)||
           (width===390&&(switcherMetrics.right>width+2||switcherMetrics.controlRights.some(right=>right>width+2))))
         findings.push(engine+' '+width+' '+key+' Hall of Fame manager switcher lacks readable, reachable controls '+JSON.stringify(switcherMetrics));
        if(await page.locator('body.profile-landing .profile-tabs:visible').count())
         findings.push(engine+' '+width+' '+key+' redundant archive tabs still clutter first-visit Hall of Fame profile');
        const hubMetrics=await page.locator('.manager-home-hub').evaluate(el=>{
         const bounds=el.getBoundingClientRect();
         const tiles=[...el.querySelectorAll('.manager-home-hub-tile')].map(t=>{const r=t.getBoundingClientRect();return {width:r.width,height:r.height,right:r.right}});
         return {right:bounds.right,tiles};
        }).catch(()=>null);
        if(!hubMetrics||hubMetrics.tiles.length!==6||hubMetrics.tiles.some(t=>t.height<60||t.width<100)||
           (width===390&&(hubMetrics.right>width+2||hubMetrics.tiles.some(t=>t.right>width+2))))
         findings.push(engine+' '+width+' '+key+' personal manager hub is not six readable tap targets '+JSON.stringify(hubMetrics));
        if(audit.snapshotTiles<3)findings.push(engine+' '+width+' '+key+' career stats missing');
        const hierarchy=await page.evaluate(()=>{
         const hero=document.querySelector('main .hero'),action=hero?.querySelector(':scope > .buttons'),
          snapshot=hero?.querySelector(':scope > .profile-career-snapshot'),
          topics=document.querySelector('main .profile-quickstart'),
          playoff=document.getElementById('profile-playoff-resume');
         const top=node=>node?.getBoundingClientRect().top+window.scrollY;
         return {snapshotBeforeAction:!!action&&!!snapshot&&top(snapshot)<top(action),
          playoffOutsideHero:!!playoff&&!hero?.contains(playoff),
          topicsBeforePlayoff:!!topics&&!!playoff&&top(topics)<top(playoff),
          topicsBeforeRatings:!!topics&&!!document.querySelector('main .profile-madden')&&top(topics)<top(document.querySelector('main .profile-madden')),
          recordPreview:!!snapshot?.querySelector('.profile-owned-records'),
          actionHeight:action?.querySelector('a')?.getBoundingClientRect().height||0};
        });
        if(!hierarchy.snapshotBeforeAction||!hierarchy.playoffOutsideHero||!hierarchy.topicsBeforePlayoff||!hierarchy.topicsBeforeRatings||!hierarchy.recordPreview)
         findings.push(engine+' '+width+' '+key+' incorrect profile landing hierarchy '+JSON.stringify(hierarchy));
        if(hierarchy.actionHeight<44)
         findings.push(engine+' '+width+' '+key+' primary profile action too small');
        // First screen: prioritize championships/record, then two usable
        // destinations, without repeated Records controls or tiny tap targets.
        const entryGeometry=await page.evaluate(()=>{
         const root=document.querySelector('#profile-features');
         const links=[...(root?.querySelectorAll('.profile-featured-links > a')||[])];
         const cards=[...document.querySelectorAll('main .hero .profile-career-highlight')];
         const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
         return {
          labels:links.map(a=>a.querySelector('strong')?.textContent?.trim()),
          links:links.map(rect),
          stats:cards.map(rect),
          duplicateTopLevelRecords:document.querySelectorAll('main .hero > .profile-owned-records,main .hero .profile-career-snapshot > .profile-owned-records').length,
          fullWidth:document.documentElement.scrollWidth>document.documentElement.clientWidth+3
         };
        });
        if(JSON.stringify(entryGeometry.labels)!==JSON.stringify(['Records','Report Card'])||
           entryGeometry.links.length!==2||
           entryGeometry.links.some(r=>r.width<120||r.height<44||r.left< -3||r.right>width+3)||
           entryGeometry.stats.length!==2||
           entryGeometry.stats.some(r=>r.width<90||r.height<50||r.left< -3||r.right>width+3)||
           entryGeometry.duplicateTopLevelRecords!==0||entryGeometry.fullWidth)
         findings.push(engine+' '+width+' '+key+' first-screen entry layout '+JSON.stringify(entryGeometry));
        const headlineFacts=await page.locator('main .hero .profile-career-highlights > .profile-career-highlight').evaluateAll(cards=>cards.map(card=>{
         const r=card.getBoundingClientRect();
         return {label:card.querySelector('span')?.textContent?.trim(),value:card.querySelector('strong')?.textContent?.trim(),
          left:r.left,right:r.right,width:r.width,height:r.height}
        }));
        const editorialMetrics=await page.locator('main .hero .profile-snapshot-condensed').evaluate(box=>{
         const highlights=[...box.querySelectorAll('.profile-career-highlight')];
         const honors=box.querySelector('.profile-honors-line');
         return {panelBorder:getComputedStyle(box).borderStyle,
          panelPadding:parseFloat(getComputedStyle(box).paddingLeft),
          figureSizes:highlights.map(el=>parseFloat(getComputedStyle(el.querySelector('strong')).fontSize)),
          labelSizes:highlights.map(el=>parseFloat(getComputedStyle(el.querySelector('span')).fontSize)),
          honorsContrast:honors?getComputedStyle(honors).color:'',
          title:box.querySelector('.profile-snapshot-heading')?.textContent?.trim()}
        });
        if(editorialMetrics.panelBorder==='none'||editorialMetrics.panelPadding<10||
           editorialMetrics.figureSizes.length!==2||editorialMetrics.figureSizes.some(size=>size<22)||
           editorialMetrics.labelSizes.some(size=>size<11)||
           editorialMetrics.title!=='Career highlights')
         findings.push(engine+' '+width+' '+key+' profile editorial card hierarchy incorrect '+JSON.stringify(editorialMetrics));
        if(headlineFacts.length!==2||headlineFacts.some(f=>!f.label||!f.value||f.width<90||f.height<50||
           f.left< -3||f.right>width+3)||!headlineFacts.some(f=>f.label==='Championships')||
           !headlineFacts.some(f=>f.label==='Regular-season record'))
         findings.push(engine+' '+width+' '+key+' first-screen career headlines unreadable '+JSON.stringify(headlineFacts));
        // The detailed archive starts hidden by design. Open it through the
        // same manager feature control a visitor uses before measuring.
        const researchDisclosure=page.locator('details.manager-home-more');
        if(await researchDisclosure.count()!==1)throw Error('Manager research disclosure missing');
        // Follow the real visitor path: first open the optional research shelf.
        // Clicking a hidden feature directly caused 30-second timeouts on every
        // manager page and masked actual layout regressions in the visual gate.
        if(!await researchDisclosure.evaluate(node=>node.open)){
         await researchDisclosure.locator(':scope > summary').click({timeout:5000});
        }
        if(!await researchDisclosure.evaluate(node=>node.open))
         throw Error('Manager research disclosure did not open');
        const careerFeature=page.locator('#profile-features button[data-feature-target="#verified-history-panel"]');
        if(await careerFeature.count()!==1)throw Error('Career records feature button missing');
        if(!await careerFeature.isVisible())throw Error('Career records feature inaccessible after opening research');
        await careerFeature.click({timeout:5000});
        if(!await page.locator('#historical-record-profile').isVisible())
         throw Error('Career feature did not reveal the record book');
        // Regression for the missing .fr-historical class: without this
        // container hook, record labels, scores and dates merge into one line.
        const recordLayout=await page.evaluate(()=>{
         const root=document.querySelector('#historical-record-profile');
         if(!root)return {missing:'historical record root'};
         const grid=root.querySelector('.fr-grid');
         const cards=[...root.querySelectorAll('.fr-grid > .fr-stat')];
         if(!grid||cards.length!==6)return {missing:'six canonical record cards'};
         const area=grid.getBoundingClientRect();
         const first=cards[0].getBoundingClientRect(),second=cards[1].getBoundingClientRect();
         const labels=cards.map(card=>card.querySelector('small')?.textContent?.trim());
         const values=cards.map(card=>card.querySelector('strong')?.textContent?.trim());
         return {
          scoped:root.classList.contains('fr-historical'),
          grid:getComputedStyle(grid).display,
          cardDisplay:getComputedStyle(cards[0]).display,
          columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,
          sideBySide:Math.abs(first.top-second.top)<3&&first.right<=second.left+3,
          clipped:[root,grid,...cards].some(el=>{
           const r=el.getBoundingClientRect();
           return r.right>document.documentElement.clientWidth+3||r.left< -3;
          }),
          noLabelsMissing:labels.every(Boolean),noValuesMissing:values.every(Boolean),
          context:cards.every(card=>!!card.querySelector('span')?.textContent?.trim()),
          cardHeight:first.height,gridWidth:area.width
         };
        });
        if(recordLayout.missing||!recordLayout.scoped||recordLayout.grid!=='grid'||
           recordLayout.cardDisplay!=='flex'||!recordLayout.noLabelsMissing||
           !recordLayout.noValuesMissing||!recordLayout.context||recordLayout.clipped||
           (width===390&&(!recordLayout.sideBySide||recordLayout.columns!==2))||
           (width===1280&&recordLayout.columns!==3))
         findings.push(engine+' '+width+' '+key+' unreadable record-book layout '+JSON.stringify(recordLayout));
        const backToTopics=page.locator('.profile-focus-toolbar button').first();
        if(await backToTopics.count()!==1)throw Error('Career records return control missing');
        await backToTopics.click();
        if(await page.locator('body').evaluate(el=>el.classList.contains('profile-feature-focused')))
         throw Error('Career records return did not restore topic navigation');
       }
       if(/^seasons\/202[0-5]\.html$/.test(route)){
        const proof=page.locator('#verified-placements');
        if(await proof.count()!==1||await proof.locator('.placement-card').count()!==2)
         findings.push(engine+' '+width+' '+key+' verified postseason result cards missing');
        else{
         const year=Number(route.match(/202[0-5]/)[0]);
         const text=await proof.innerText();
         if(text.includes('Loading postseason placements')||
            !text.includes('Shitter of the Year'))
          findings.push(engine+' '+width+' '+key+' postseason evidence did not load correctly');
         {
          const ranked=proof.locator('details.placement-final-ranks');
          if(await ranked.count()!==1)
           findings.push(engine+' '+width+' '+key+' final finishing positions missing');
          else{
           await ranked.locator('summary').click();
           const expectedPlaces=10;
           if(await ranked.locator('li').count()!==expectedPlaces)
            findings.push(engine+' '+width+' '+key+' expected '+expectedPlaces+' verified final positions');
          }
          const detail=proof.locator('details.placement-more:not(.placement-final-ranks)');
          if(await detail.count()!==1)findings.push(engine+' '+width+' '+key+' placement detail missing');
          else{
           await detail.locator('summary').click();
           const seasonReceipt=placementReceipts.seasons.find(s=>s.year===year);
            const expected=seasonReceipt?.placementGames?.filter(g=>g.label!=='Championship'&&g.label!=='King (Last Place)').length;
            if(!Number.isInteger(expected))throw Error('Missing source receipt for '+year);
           if(await detail.locator('li').count()!==expected)
            findings.push(engine+' '+width+' '+key+' expected '+expected+' source-matched non-final placements');
          }
         }
        }
       }
       if(route==='analytics/manager-lineup-research.html'){
        const proof=page.locator('#historical-coverage details');
        if(await proof.count()!==1)
         findings.push(engine+' '+width+' lineup research missing evidence coverage');
        else{
         const label=await proof.locator('summary').innerText();
         if(!label.includes('822 / 830')||!label.includes('8 excluded'))
          findings.push(engine+' '+width+' lineup source coverage totals missing');
         await proof.locator('summary').click();
         if(await proof.locator('tbody tr').count()!==6)
          findings.push(engine+' '+width+' six-season coverage detail incomplete');
        }
       }
       if(route==='analytics/manager-report-cards.html'){
        const history=page.locator('[data-report-manager] details.report-lineup-history');
        if(await history.count()!==10)
         findings.push(engine+' '+width+' incomplete historical lineup coverage for ten managers');
        const tiles=page.locator('[data-report-manager] .report-fact-grid');
        if(await tiles.count()!==10)
         findings.push(engine+' '+width+' report cards missing source-backed summary tiles');
        else if(width===390){
         const widthIssue=await tiles.evaluateAll(nodes=>nodes.some(n=>
           n.getBoundingClientRect().width>document.documentElement.clientWidth+1));
         if(widthIssue)findings.push(engine+' '+width+' report card evidence tiles overflow mobile');
        }
       }
       if(route==='analytics/record-holders.html'){
        const finishing=page.locator('#placement-statistics');
        if(await finishing.count()!==1)
         findings.push(engine+' '+width+' missing final finishing stats');
        else{
         await finishing.locator('summary').click();
         if(await finishing.locator('tbody tr').count()!==26)
          findings.push(engine+' '+width+' incomplete final-finishing stats');
        }
        const shame=page.locator('#shitter-year-history');
        if(await shame.locator('a.placement-shame-row').count()!==6)
         findings.push(engine+' '+width+' all-time Toilet Bowl history missing or incomplete');
       }
       const dir=path.join(output,'screens',engine,String(width));
       await fs.mkdir(dir,{recursive:true});
       await page.screenshot({path:path.join(dir,name+'.png'),animations:'disabled',fullPage:false});
       if(engine==='chromium'&&width===390&&['index.html','managers/stilly/','analytics/manager-report-cards.html','analytics/rivalries.html'].includes(key))
        await page.screenshot({path:path.join(dir,name+'_full.png'),animations:'disabled',fullPage:true});
       // Mobile tap-through: actual controls, navigation and verified destination,
       // not just screenshot or static link existence. Both Chromium and Safari.
       if(width===390&&route.startsWith('managers/')&&slugs.includes(route.split('/')[1])&&route.endsWith('/')){
        const slug=route.split('/')[1];
        const canonical=slug==='tom'?'Thommy':slug==='jmid'?'JMid':slug[0].toUpperCase()+slug.slice(1);
        const topics=page.locator('a[href="#profile-features"]').first();
        if(!await topics.isVisible())throw Error('Browse profile topics action missing');
        await topics.click();
        const menu=page.locator('#profile-features');
        if(!await menu.isVisible())throw Error('Profile topic directory not reachable');
        if(await menu.locator('details.profile-feature-group').count()!==5)
         throw Error('Expected five grouped, expandable profile topics');
        const link=menu.locator('a[href="#profile-playoff-resume"]');
        if(!await link.count())throw Error('Playoff résumé topic link missing');
        await link.click();
        const resume=page.locator('#profile-playoff-resume');
        if(!await resume.isVisible())throw Error('Playoff résumé not reachable by its topic link');
        const disclosure=resume.locator('details.profile-playoff-history');
        await disclosure.locator('summary').click();
        const displayedYears=await disclosure.locator('.profile-playoff-timeline .profile-finish-year').allInnerTexts();
        const roster=route.split('/')[1]==='tom'?'Thommy':route.split('/')[1]==='jmid'?'JMid':
          route.split('/')[1].charAt(0).toUpperCase()+route.split('/')[1].slice(1);
        const source=await page.evaluate(async()=>{
          const res=await fetch('../../data/fellas_final_placements_2016_2025_verified.json');
          if(!res.ok)throw Error('Verified placement source unavailable');
          return res.json();
        });
        const expected=source.seasons.filter(y=>y.finishes.some(x=>x.manager===roster)).map(y=>String(y.year));
        if(JSON.stringify(displayedYears)!==JSON.stringify(expected))
         throw Error('Season timeline must list only '+roster+' participation years ('+JSON.stringify(expected)+'), rendered '+JSON.stringify(displayedYears));
        const original=page.locator('main .hero details.profile-snapshot-receipts');
        if(await original.count()!==1||await original.evaluate(el=>el.open))
         throw Error('Original verified career statistics must begin collapsed');
        await original.locator(':scope > summary').click();
        if(!await original.evaluate(el=>el.open)||await original.locator('.stat').count()!==3)
         throw Error('Career record source disclosure failed to reveal three verified statistics');
        await original.locator(':scope > summary').click();
        if(await original.evaluate(el=>el.open))
         throw Error('Career source disclosure failed to close');
        const featured=page.locator('#profile-features nav.profile-featured-routes');
        const entryOrder=await featured.locator(':scope > .profile-featured-links, :scope > .profile-biography-entry').evaluateAll(nodes=>nodes.map(n=>n.classList.contains('profile-featured-links')?'Primary record links':'Career biography'));
        if(JSON.stringify(entryOrder)!==JSON.stringify(['Primary record links','Career biography']))
         throw Error('Records and Report Card must appear before optional biography '+JSON.stringify(entryOrder));
        if(await featured.locator('a.profile-featured-link').count()!==2)
         throw Error('Records and Report Card must be the two primary destinations');
        const canonicalLinks=await featured.locator('a').evaluateAll(nodes=>nodes.map(a=>({
         label:a.querySelector('strong')?.textContent?.trim(),
         path:new URL(a.href).pathname,manager:new URL(a.href).searchParams.get('manager')
        })));
        if(canonicalLinks[0]?.label!=='Records'||canonicalLinks[1]?.label!=='Report Card'||
           canonicalLinks.some(link=>link.manager!==canonical)||
           !canonicalLinks[0]?.path.endsWith('/managers/record-books.html')||
           !canonicalLinks[1]?.path.endsWith('/analytics/manager-report-cards.html'))
         throw Error('Primary manager links are not Records and Report Card '+JSON.stringify(canonicalLinks));
        // Verify Career & Results still opens from the deeper feature directory,
        // without adding a third competing shortcut to the first screen.
        const careerFeature=menu.locator('button[data-feature-target="#verified-history-panel"]');
        if(await careerFeature.count()!==1)throw Error('Career archive feature missing');
        await careerFeature.click();
        if(!await page.locator('#verified-history-panel').isVisible()||
           !await page.locator('#historical-record-profile').isVisible())
         throw Error('Career archive feature did not reveal its records');
        const shortcutReturn=page.locator('.profile-focus-toolbar button').first();
        if(!await shortcutReturn.isVisible())throw Error('Career archive has no return navigation');
        await shortcutReturn.click();
        if(await page.locator('body').evaluate(el=>el.classList.contains('profile-feature-focused')))
         throw Error('Career archive failed to restore topic directory');
        const factors=page.locator('details.profile-rating-components');
        if(await factors.count()!==1||await factors.evaluate(el=>el.open))
         throw Error('Career rating factor breakdown missing or not collapsed');
        await factors.locator(':scope > summary').click();
        if(await factors.locator('.profile-rating-factor').count()!==8)
         throw Error('All eight official career rating factors must be available');
        // Exercise an in-page feature button, not just a destination URL.
        const rivalryCategory=menu.locator('details.profile-feature-group').nth(3);
        await rivalryCategory.locator(':scope > summary').click();
        const rivalryButton=rivalryCategory.locator('button[data-feature-target="#head-to-head"]');
        if(await rivalryButton.count()!==1)throw Error('Head-to-head feature control missing');
        await rivalryButton.click();
        if(!await page.locator('#head-to-head').isVisible()||
           await rivalryButton.getAttribute('aria-pressed')!=='true')
         throw Error('Head-to-head feature did not reveal its actual panel');
        const returnButton=page.locator('.profile-focus-toolbar button').first();
        if(await returnButton.count()!==1)throw Error('Feature detail return action missing');
        await returnButton.click();
        if(await page.locator('body').evaluate(el=>el.classList.contains('profile-feature-focused')))
         throw Error('Returning to profile topics did not reset focused mode');
        const preview=page.locator('main .hero details.profile-snapshot-receipts a[data-profile-owned-records]');
        if(await preview.count()!==1)throw Error('Detailed record ownership source link missing');
        if(await preview.isVisible())throw Error('Duplicate record shortcut is visible above primary Records link');
        if(['stilly','tom','stover'].includes(slug)){
         await featured.locator('a[href*="record-books.html"]').click();
         await page.waitForURL(url=>url.pathname.endsWith('/managers/record-books.html'),{timeout:10000});
         await page.waitForFunction(()=>document.querySelector('#manager')?.options.length>0,{timeout:10000});
         await page.waitForFunction(name=>document.getElementById('manager')?.value===name,canonical,{timeout:10000});
         await page.locator('#manager').selectOption('Birch');
         if(new URL(page.url()).searchParams.get('manager')!=='Birch')
          throw Error('Manager record selector not shareable');
        }
        mobileJourneys.push({engine,manager:canonical,topics:5,postseasonSeasons:10,recordsDestination:['stilly','tom','stover'].includes(slug)});
       }
       if(width===390&&route==='analytics/record-holders.html'){
        const first=page.locator('#record-leaders a.leader-card').first();
        if(!await first.isVisible())throw Error('Record-holder cards not rendered');
        const aboveFold=await first.evaluate(el=>el.getBoundingClientRect().top<innerHeight);
        if(!aboveFold)throw Error('Record-holder list starts below first mobile viewport');
        const help=page.locator('details.scope-guide');
        await help.locator('summary').click();
        if(!await help.evaluate(el=>el.open))throw Error('Record coverage explanation did not open');
        mobileJourneys.push({engine,page:'record-holders',firstRecordAboveFold:true,scopeExpandable:true});
       }
       if(route==='hall/championship-stories.html'){
        const feature=page.locator('#championship-feature .feature');
        const story=page.locator('#championship-story');
        const road=page.locator('#road-to-ring');
        const nav=page.locator('nav.reading-nav');
        const yearArchive=page.locator('nav#chapters');
        if(!await feature.isVisible()||!await story.isVisible()||!await road.isVisible()||!await nav.isVisible())
         throw Error('Championship feature, story, road or reading navigation failed to render');
        const readingOrder=await page.evaluate(()=>{
         const article=document.querySelector('#championship-feature');
         const archive=document.querySelector('#chapters');
         return !!article&&!!archive&&!!(article.compareDocumentPosition(archive)&Node.DOCUMENT_POSITION_FOLLOWING);
        });
        if(!readingOrder)throw Error('Full championship article must precede the optional decade archive');
        if(await page.locator('.road-game').count()<1)
         throw Error('Verified regular-season game log is missing');
        const navHeight=await nav.locator('a').first().evaluate(el=>el.getBoundingClientRect().height);
        if(navHeight<44)throw Error('Championship reading navigation touch targets below 44px');
        const layout=await page.evaluate(()=>{
         const el=document.querySelector('#championship-story');
         const sty=getComputedStyle(el);
         return {grid:sty.display,columns:sty.gridTemplateColumns,overflow:document.documentElement.scrollWidth-innerWidth};
        });
        if(layout.overflow>3)throw Error('Championship layout overflows '+layout.overflow+'px');
        if(width<=390){
         if(await yearArchive.evaluate(el=>el.scrollWidth<=el.clientWidth))
          throw Error('Mobile championship archive should provide an accessible swipeable year list');
         if(await page.locator('#championship-story .story-section').count()!==4)
          throw Error('Four editorial chapters not visible on mobile');
         await page.locator('#season-picker').selectOption('2023');
         await page.waitForFunction(()=>document.querySelector('#championship-feature .feature')?.dataset.chapter==='2023');
         if(!await page.locator('#rivalry-rewind').isVisible())
          throw Error('2023 title rivalry history not visible');
         const finalScore=await page.locator('.championship-cover-score').innerText();
         if(!finalScore.includes('104.96')||!finalScore.includes('90.18')||
            !finalScore.includes('Stilly')||!finalScore.includes('Mitch'))
          throw Error('2023 championship cover missing verified finalist score');
         const share=page.locator('#championship-feature button[data-championship-share]');
         if(await share.count()!==1)throw Error('Every championship needs a clear Share story action');
         const shareHeight=await share.evaluate(el=>el.getBoundingClientRect().height);
         if(shareHeight<44)throw Error('Share story button has an undersized phone touch target');
         await page.evaluate(()=>{
          Object.defineProperty(navigator,'share',{configurable:true,value:async payload=>{window.__fellasSharedStory=payload}});
         });
         await share.click();
         const payload=await page.evaluate(()=>window.__fellasSharedStory);
         if(!payload?.url?.endsWith('/hall/share/2023.html')||
            !payload?.title?.includes('2023')||!payload?.title?.includes('Stilly'))
          throw Error('Sharing a championship did not include the selected year and champion');
         const preview=await context.newPage();
         try{
          const intro=await preview.goto(baseUrl+'hall/share/2023.html',{waitUntil:'domcontentloaded',timeout:15000});
          if(!intro?.ok())throw Error('Share preview page does not exist');
          await preview.waitForURL(url=>url.pathname.endsWith('/hall/championship-stories.html')&&url.searchParams.get('year')==='2023',{timeout:10000});
          await preview.locator('#championship-feature .feature[data-chapter="2023"]').waitFor({timeout:15000});
          if(!(await preview.locator('.feature h2').innerText()).includes('From 0–4'))
           throw Error('Shared 2023 preview did not reach correct championship');
         }finally{await preview.close();}
         const editorialProof=await page.evaluate(async()=>{
          const response=await fetch('../data/championship_season_stories_2016_2025_v1.json');
          const archive=await response.json();
          const source=archive.seasons.find(s=>s.year===2023);
          const paragraphs=[...document.querySelectorAll('#championship-story .story-section')].map(section=>[...section.querySelectorAll(':scope > p')].map(p=>p.textContent.trim()));
          const exact=paragraphs.every((parts,i)=>parts.join(' ').replace(/\s+/g,' ').trim()===source.sections[i].text.replace(/\s+/g,' ').trim());
          const sizes=[...document.querySelectorAll('#championship-story .story-section p')].map(p=>getComputedStyle(p).fontSize);
          return {chapters:paragraphs.length,parts:paragraphs.map(p=>p.length),exact,sizes};
         });
         if(editorialProof.chapters!==4||editorialProof.parts.some(n=>n!==2)||!editorialProof.exact)
          throw Error('Mobile championship chapters must preserve exact sourced prose in two readable paragraphs');
         if(editorialProof.sizes.some(size=>parseFloat(size)<16))
          throw Error('Championship chapter type below 16px on a phone');
         await page.locator('#season-picker').selectOption('2017');
         await page.waitForFunction(()=>document.querySelector('#championship-feature .feature')?.dataset.chapter==='2017');
         if(!await page.locator('.championship-cover-score-label').innerText().then(t=>t.includes('TWO-WEEK AGGREGATE')))
          throw Error('2017 final score must be explicitly labeled as aggregate');
         if(await page.locator('nav.reading-nav a[href="#player-profiles"]').count())
          throw Error('ESPN legacy years have unsupported player-profile navigation');
         if(width===390){
          const source=await page.evaluate(async()=>{const response=await fetch('../data-integrity/editorial_evidence_2016_2026_week8_v1.json');return(await response.json()).championships.map(x=>({year:x.year,champion:x.champion,points:x.championship.championPoints,runner:x.championship.runnerUpPoints}));});
          if(source.length!==10)throw Error('Ten verified title years required for anthology audit');
          for(const receipt of source){
           await page.locator('#season-picker').selectOption(String(receipt.year));
           await page.waitForFunction(y=>document.querySelector('#championship-feature .feature')?.dataset.chapter===String(y),receipt.year);
           if(await page.locator('#championship-story .story-section').count()!==4)
            throw Error('Missing complete championship narrative '+receipt.year);
           const cover=await page.locator('.championship-cover-score').innerText();
           const displayScore=n=>receipt.year<=2017?String(Math.round(Number(n))):Number(n).toFixed(2);
           const expected=displayScore(receipt.points),opponent=displayScore(receipt.runner);
           if(!cover.includes(expected)||!cover.includes(opponent))
            throw Error('Championship source mismatch '+receipt.year+' '+cover);
           if(await page.locator('nav#chapters a[aria-current="page"]').count()!==1)
            throw Error('Ambiguous selected season in decade archive '+receipt.year);
           const storyHref=new URL(page.url()).searchParams.get('year');
           if(storyHref!==String(receipt.year))throw Error('No shareable year-specific address '+receipt.year);
          }
         }
         mobileJourneys.push({engine,page:'championship-anthology',width,mobileReading:true,yearSelection:true,archiveSwipe:true});
        }
       }
       // A complete visitor journey supplements page-level screenshots with actual links.
       // Run once per browser engine on the representative 390px phone viewport.
       if(route===''&&width===390){
        const journey=await context.newPage();
        try{
         await journey.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:15000});
         await journey.locator('main .home-featured-card[href="hall/"]').click();
         await journey.waitForURL(url=>url.pathname.endsWith('/hall/'),{timeout:12000});
         if(!await journey.getByRole('heading',{name:/Hall of Fame/i}).count())
          throw Error('Homepage Hall of Fame card failed to reach the museum');
         await journey.locator('a[href="championship-stories.html"]').first().click();
         await journey.waitForURL(url=>url.pathname.endsWith('/hall/championship-stories.html'),{timeout:12000});
         await journey.locator('#championship-feature .feature').waitFor({timeout:15000});
         await journey.locator('#chapters a[href*="year=2023"]').click();
         await journey.waitForFunction(()=>document.querySelector('#championship-feature .feature')?.dataset.chapter==='2023',{timeout:10000});
         if(!await journey.locator('#championship-story .story-section').count())
          throw Error('Championship year link failed to open verified article');

         await journey.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:15000});
         await journey.locator('main .card[href="managers/"]').first().click();
         await journey.waitForURL(url=>url.pathname.endsWith('/managers/'),{timeout:12000});
         await journey.locator('#manager-directory-cards a.manager[href="stilly/"]').click();
         await journey.waitForURL(url=>url.pathname.endsWith('/managers/stilly/'),{timeout:12000});
         const arrivedAtTop=await journey.evaluate(()=>window.scrollY);
         if(arrivedAtTop>24)throw Error('Manager profile navigation must start at page top: '+arrivedAtTop);
         if(!await journey.locator('#franchise-story').count())
          throw Error('Manager card failed to open franchise story');
         const mobile=journey.locator('header.nav details.fellas-mobile-site-menu');
         await mobile.locator(':scope > summary').click();
         await mobile.locator('nav a[href="../../analytics/records.html"]').click();
         await journey.waitForURL(url=>url.pathname.endsWith('/analytics/records.html'),{timeout:12000});
         if(!await journey.locator('#expanded-records').count())
          throw Error('Manager-to-Records navigation did not open full record archive');
         mobileJourneys.push({engine,width,page:'cross-page-reading-journey',path:'Home → Hall → 2023 story; Home → Stilly → Records',verified:true});
        }finally{await journey.close();}
       }
       // New page visits should never inherit an old manager card reading position.
       // Browser Back/Forward is separate: its existing reading-position test remains valid.
       if(route===''&&width===390){
        const visitor=await context.newPage();
        try{
         const home=baseUrl,profile=baseUrl+'managers/stilly/';
         const openStilly=async()=>{
          await visitor.goto(home,{waitUntil:'domcontentloaded',timeout:15000});
          const row=visitor.locator('details.mobile-manager-row:has(a.mobile-manager-link[href="managers/stilly/"])');
          await row.waitFor({state:'visible',timeout:15000});
          await row.locator(':scope > summary').click();
          await row.locator('a.mobile-manager-link').click();
          await visitor.waitForURL(profile,{timeout:12000});
          await visitor.locator('h1').waitFor({state:'visible',timeout:15000});
         };
         await openStilly();
         await visitor.evaluate(()=>window.scrollTo(0,1400));
         if(await visitor.evaluate(()=>window.scrollY)<250)
          throw Error('Manager profile did not provide enough reading content to test scroll restoration');
         await visitor.locator('header.nav a.brand').click();
         await visitor.waitForURL(url=>url.pathname.endsWith('/index.html'),{timeout:12000});
         await openStilly();
         await visitor.waitForTimeout(1050); // Recheck after delayed profile data and scroll restoration.
         const top=await visitor.evaluate(()=>window.scrollY);
         if(top>95)throw Error('Fresh Madden manager card navigation reused old profile scroll position: '+top+'px');
         mobileJourneys.push({engine,width,page:'madden-card-fresh-navigation',freshVisitTop:true,previousScrollCleared:true});
        }finally{await visitor.close();}
       }
       // Regression: there must never be two stacked fixed navigation bars on mobile.
       // Run the check on a fresh profile page: other audit steps may have followed links.
       if(width===390&&route.startsWith('managers/')&&slugs.includes(route.split('/')[1])&&route.endsWith('/')){
        const checkPage=await context.newPage();
        try{
         await checkPage.goto(baseUrl+route,{waitUntil:'domcontentloaded',timeout:15000});
         await checkPage.locator('nav.profile-tabs').waitFor({state:'attached',timeout:15000});
         const state=await checkPage.evaluate(()=>{
          const header=document.querySelector('header.nav'),tabs=document.querySelector('nav.profile-tabs');
          return {header:header?getComputedStyle(header).position:null,tabs:tabs?getComputedStyle(tabs).position:null};
         });
         if(state.header!=='sticky'||state.tabs==='sticky'||state.tabs==='fixed')
          throw Error('Profile navigation should have exactly one sticky site header: '+JSON.stringify(state));
         // The old four-tab controller intentionally lives inside the collapsed
         // "Other sections" disclosure. Open it before inspecting touch targets.
         const switcher=checkPage.locator('nav.profile-tabs details.profile-section-switcher');
         // Fresh profiles open their lightweight home hub, hiding detailed
         // navigation until a visitor explicitly explores the full career.
         if(!await switcher.isVisible())
          await checkPage.locator('.manager-home-hub button[data-profile-jump="seasons"]').click();
         await switcher.locator(':scope > summary').waitFor({state:'visible',timeout:12000});
         if(!await switcher.evaluate(el=>el.open))
          await switcher.locator(':scope > summary').click();
         await checkPage.locator('nav.profile-tabs button[data-profile-tab]').first().waitFor({state:'visible',timeout:12000});
         const tabHeights=await checkPage.locator('nav.profile-tabs button[data-profile-tab]').evaluateAll(buttons=>buttons.map(el=>Math.round(el.getBoundingClientRect().height)));
         if(tabHeights.length!==4||tabHeights.some(h=>h<44))
          throw Error('Profile chapter controls must have four 44px+ touch targets: '+JSON.stringify(tabHeights));
        }finally{await checkPage.close();}
       }
       if(width===390&&route==='analytics/records.html'){
        const checkPage=await context.newPage();
        try{
         await checkPage.goto(baseUrl+route,{waitUntil:'domcontentloaded',timeout:15000});
         await checkPage.locator('.record-category-shortcuts').waitFor({state:'attached',timeout:15000});
         const positions=await checkPage.evaluate(()=>({
          header:getComputedStyle(document.querySelector('body.records-premium>header.nav')).position,
          filters:getComputedStyle(document.querySelector('.record-category-shortcuts')).position
         }));
         if(positions.header!=='sticky'||['sticky','fixed'].includes(positions.filters))
          throw Error('Record Book should keep only its main header sticky: '+JSON.stringify(positions));
        }finally{await checkPage.close();}
       }
       if(width===390&&route==='analytics/draft-intelligence.html'){
        const reader=await context.newPage();
        try{
         await reader.goto(baseUrl+route,{waitUntil:'domcontentloaded',timeout:15000});
         await reader.locator('#manager-rows tr').first().waitFor({timeout:15000});
         await reader.waitForFunction(()=>document.querySelectorAll('#manager-rows tr').length===10,{timeout:15000});
         const firstGrade=await reader.locator('#manager-rows tr').first().innerText();
         if(!firstGrade.includes('Birch')||!firstGrade.includes('A'))
          throw Error('Completed 2025 original-pick return leaderboard mismatch');
         const evidence=reader.locator('#manager-evidence-rows');
         if(await evidence.locator('details').count()!==10)
          throw Error('Ten source-backed manager draft evidence disclosures required');
         const stillyDisclosure=evidence.locator('details').filter({hasText:'Stilly'}).first();
         await stillyDisclosure.locator('summary').click();
         const stillyEvidence=await stillyDisclosure.innerText();
         if(!stillyEvidence.includes('Stilly')||!stillyEvidence.includes('D\'Andre Swift'))
          throw Error('Manager pick-level evidence missing the sourced 2025 Stilly examples');
         await reader.locator('button[data-year="2026"]').click();
         await reader.waitForFunction(()=>document.querySelector('#manager-rows tr')?.textContent?.includes('Mitch'),{timeout:10000});
         if(!await reader.locator('#manager-rows').innerText().then(t=>t.includes('Pending')))
          throw Error('Incomplete 2026 season must not show final manager draft grades');
         const woody=await reader.locator('#woody-feature').innerText();
         if(!woody.includes('Woody Marks')||!woody.includes('25.90')||!woody.includes('Round 13'))
          throw Error('Woody Marks verified late-round research missing');
         if(await reader.locator('#keeper-rows tr').count()!==10)
          throw Error('Keeper opportunity-cost research must cover ten managers');
         if(!await reader.locator('#keeper-rows').innerText().then(t=>t.includes('Not verified')))
          throw Error('Keeper decision grade must remain unavailable without eligible alternatives');
         const overflow=await reader.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-window.innerWidth));
         if(overflow>4)throw Error('Draft intelligence phone layout horizontal overflow '+overflow);
        }finally{await reader.close();}
       }
       if(route==='analytics/draft-legends.html'){
        await page.waitForFunction(()=>document.querySelectorAll('#legend-cards .feature').length>0,{timeout:12000});
        const year2025=await page.locator('#legends-heading').innerText();
        const text2025=await page.locator('#legend-cards').innerText();
        const keeper=await page.locator('#keeper-status').innerText();
        if(!year2025.includes('2025')||!text2025.includes('2025')&& !text2025.includes('peer pts'))
          throw Error('Draft Legends completed season failed to render');
        if(!keeper.includes('20 recorded 2026 keepers')||!keeper.includes('pending evidence'))
          throw Error('Keeper decision evidence labels missing');
        const archiveRows=await page.locator('#archive tbody tr').count();
        if(archiveRows!==5)throw Error('Archived 2020–2024 eras must remain separate: '+archiveRows);
        const steals2025=await page.locator('#steals-body tr').count();
        if(steals2025<3)throw Error('Verified 2025 late-round steals missing');
        await page.locator('button[data-year="2026"]').click();
        if(!await page.locator('#legends-heading').innerText().then(t=>t.includes('W8')))
          throw Error('2026 draft legends must be provisional');
        const stealRows2026=await page.locator('#steals-body tr').count();
        if(stealRows2026<3)throw Error('Verified provisional 2026 steals missing');
        if(!await page.locator('#steals-body').innerText().then(t=>t.includes('Woody Marks')))
          throw Error('Woody Marks source-backed Round 13 feature missing');
        if(!await page.locator('#miss-cards .feature').count())
          throw Error('Missing source-supported low returns gallery');
       }
       if(route==='analytics/manager-draft-report-cards.html'){
        await page.waitForFunction(()=>document.querySelectorAll('#cards article.report').length===10,{timeout:12000});
        const a=await page.locator('#cards article.report').count();
        if(a!==10)throw Error('All ten manager draft report cards required');
        if(width===390){
         for(const manager of ['stilly','thommy']){
          const focused=await context.newPage();
          try{
           await focused.goto(baseUrl+'analytics/manager-draft-report-cards.html?manager='+manager,{waitUntil:'domcontentloaded',timeout:15000});
           await focused.waitForFunction(()=>document.querySelectorAll('#cards article.report').length===10,null,{timeout:15000});
           const state=await focused.evaluate(()=>({
            top:scrollY,
            first:document.querySelector('#cards article.report')?.id,
            selected:document.querySelector('#jump')?.value,
            hash:location.hash
           }));
           if(state.top>24||state.first!==manager||state.selected!==manager||state.hash)
            throw Error('Focused draft profile must open at top with matching manager card first: '+JSON.stringify(state));
          }finally{await focused.close();}
         }
        }
        if(!await page.locator('#cards .section-label').allTextContents().then(a=>a.some(t=>/2026\s*[—–-]\s*provisional\s+through\s+Week\s*8/i.test(t))))
          throw Error('Incomplete 2026 draft season must remain provisional');
       }
       if(route==='hall/playoff-heroes.html'){
        await page.waitForFunction(()=>document.querySelectorAll('#hero-grid .hero-card').length===3,{timeout:12000});
        const first=await page.locator('#hero-grid .hero-card').first().innerText();
        if(!first.includes('Bijan Robinson')||!first.includes('65.70'))
         throw Error('2025 verified playoff leader not rendered');
        if(await page.locator('#rows tr').count()<9)
         throw Error('Full championship-run starter table missing');
        await page.locator('#season').selectOption('2024');
        const title=await page.locator('#season-heading').innerText();
        const leader=await page.locator('#hero-grid .hero-card').first().innerText();
        if(!title.includes('Thommy')||!leader.includes('Tee Higgins')||!leader.includes('50.40'))
         throw Error('2024 verified playoff leader missing after year selection');
        if(!await page.locator('#story-link').getAttribute('href').then(x=>x==='championship-stories.html?year=2024'))
         throw Error('Championship story link does not preserve year');
        const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-innerWidth));
        if(overflow>5)throw Error('Playoff Heroes horizontal overflow '+overflow);
       }
       if(route==='analytics/keeper-tracker.html'){
        await page.waitForFunction(()=>document.querySelectorAll('#cards .card').length===10,null,{timeout:12000});
        if(await page.locator('#cards .keeper').count()!==20)
         throw Error('All twenty 2026 keepers must be rendered');
        if(!(await page.locator('#cards').innerText()).includes('Jaxon Smith-Njigba'))
         throw Error('2026 keeper archive missing Jaxon Smith-Njigba');
        await page.locator('#manager').selectOption('Stilly');
        if(await page.locator('#cards .card').count()!==1||await page.locator('#cards .keeper').count()!==2)
         throw Error('Manager filter should display two keepers');
        const text=await page.locator('#cards').innerText();
        if(!text.includes('2026 round')||!text.includes('2027 if kept'))
         throw Error('Keeper Tracker must present only keeper cost columns');
        if(/starter points|observed value|peer surplus|decision grade/i.test(text))
         throw Error('Keeper Tracker must not expose keeper performance analysis');
        if(!text.includes('Amon-Ra St. Brown')||!text.includes('R1'))
         throw Error('Round 1 keeper and round-floor display missing');
        const amon=await page.locator('#cards .keeper').filter({hasText:'Amon-Ra St. Brown'}).innerText();
        if((amon.match(/R1/g)||[]).length!==2)
         throw Error('First-round keeper must cost Round 1 in both 2026 and projected 2027');
        const jayden=await page.locator('#cards .keeper').filter({hasText:'Jayden Daniels'}).innerText();
        if(!jayden.includes('R12')||!jayden.includes('R11'))
         throw Error('Round escalation must decrease the draft-round number by one');

        if(await page.locator('#year').count())
         throw Error('Keeper Tracker should remain a simple single-season reference');
        const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-innerWidth));
        if(overflow>5)throw Error('Keeper Tracker horizontal overflow '+overflow);
       }
       if(route==='analytics/scoring-consistency.html'){
        await page.waitForFunction(()=>document.querySelectorAll('#rows .record').length>=10,null,{timeout:12000});
        const first=await page.locator('#rows .record').first().innerText();
        if(!first.includes('JMid')||!first.includes('2024')||!first.includes('13'))
         throw Error('Historical longest over-100 streak not rendered');
        await page.locator('[data-kind="105"]').click();
        const next=await page.locator('#rows .record').first().innerText();
        if(!next.includes('Mitch')||!next.includes('2025')||!next.includes('12'))
         throw Error('Historical 105+ streak record not rendered');
        await page.locator('#manager').selectOption('Stew');
        const selected=await page.locator('#rows').innerText();
        if(!selected.includes('Stew')||!selected.includes('2026')||!selected.includes('8'))
         throw Error('Stew provisional Week 8 streak missing');
        const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-innerWidth));
        if(overflow>5)throw Error('Scoring Consistency phone overflow '+overflow);
       }
       console.log('VISUAL '+engine+' '+width+' '+key+' overflow='+audit.horizontalOverflow+' heading='+JSON.stringify(audit.heading));
      }catch(error){
       findings.push(engine+' '+width+' '+key+' audit error '+(error?.message||String(error)));
       screens.push({engine,width,route:key,failed:true,error:String(error)});
       console.error('VISUAL FAIL '+engine+' '+width+' '+key+' '+error);
      }finally{await page.close();}
     }
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }
}catch(error){findings.push('Fatal visual run error: '+(error?.stack||String(error)));}
finally{server.close();}
await fs.mkdir(output,{recursive:true});
const planned=routes.length*5;
const report={generated:new Date().toISOString(),routes:routes.length,planned,observed:screens.length,passed:findings.length===0&&screens.length===planned,findings,mobileJourneys,screens};
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log('VISUAL GATE '+(report.passed?'PASS':'NEEDS REVIEW')+' '+screens.length+'/'+planned+' screens, '+findings.length+' findings');
for(const finding of findings)console.error('VISUAL FINDING '+finding);
if(!report.passed)process.exitCode=1;
