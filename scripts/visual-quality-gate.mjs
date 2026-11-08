// Focused visual QA: fast screenshots and layout checks independent of deep canonical tests.
import {chromium,webkit} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),base='/fellas-hall-of-fame/';
const slugs=['stilly','stew','tom','stover','birch','tony','mitch','kuhl','jmid','scott'];
const routes=['','managers/','analytics/manager-report-cards.html','analytics/manager-lineup-research.html','analytics/records.html',
 'analytics/power-ratings.html','analytics/rivalries.html','analytics/playoff-history.html','analytics/legendary-records.html','analytics/manager-madden-cards.html','analytics/franchise-timeline.html','hall/','seasons/',
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
       if(route==='analytics/legendary-records.html'){
        const legend=await page.evaluate(()=>({
         count:document.querySelectorAll('main .exhibit').length,
         summaries:[...document.querySelectorAll('main .exhibit .record-evidence>summary')].map(e=>e.getBoundingClientRect().height),
         links:[...document.querySelectorAll('.records-entry-paths a')].map(a=>a.getAttribute('href')),
         first:document.querySelector('main .exhibit h2')?.textContent?.trim()
        }));
        if(legend.count!==14||legend.summaries.some(h=>h<44)||legend.first!=='The Impossible Comeback')
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
