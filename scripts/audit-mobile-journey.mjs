// End-to-end, source-backed mobile release audit. Reusable for 320/390/430px
// Chromium + WebKit, using the same /fellas-hall-of-fame/ route as GitHub Pages.
// Run: node scripts/audit-mobile-journey.mjs
import {chromium,webkit} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=process.cwd(),prefix='/fellas-hall-of-fame/',dir=path.join(root,'data-integrity/mobile-journey');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
 let rel;try{const u=new URL(req.url,'http://localhost');if(!u.pathname.startsWith(prefix))throw Error('outside');rel=decodeURIComponent(u.pathname.slice(prefix.length))}catch{res.writeHead(404);res.end();return}
 if(!rel||rel.endsWith('/'))rel+='index.html';
 const local=path.resolve(root,rel);
 if(!local.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{const bytes=await fs.readFile(local);res.writeHead(200,{'Content-Type':types[path.extname(local)]||'application/octet-stream'});res.end(bytes)}catch{res.writeHead(404);res.end()}
});
await fs.mkdir(dir,{recursive:true});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port+prefix;
const hard=[],soft=[],screens=[],steps=[];
const fail=(msg,meta)=>hard.push({message:msg,...meta});
const warn=(msg,meta)=>soft.push({message:msg,...meta});
function expect(cond,msg,meta={}){if(!cond)fail(msg,meta)}
const routes=['','managers/','managers/stilly/','managers/tom/','managers/record-books.html?manager=Stilly#career-first','analytics/records.html','analytics/record-holders.html'];
try{
 for(const [engine,runner] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await runner.launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,390,430]){
    const ctx=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
    const page=await ctx.newPage(),badResponses=[],jsErrors=[];
    page.on('pageerror',e=>jsErrors.push({route:page.url(),message:e.message}));
    page.on('response',res=>{if(res.status()>=400&&res.url().startsWith(base))badResponses.push(res.status()+' '+res.url())});
    async function visit(route){
     const res=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:25000});
     await page.waitForLoadState('networkidle',{timeout:25000});
     if(/^managers\/(?!$)[^/]+\/$/.test(route)){
      await page.locator('.profile-madden-header').waitFor({timeout:25000}).catch(()=>fail('Manager career rating did not render',{engine,width,route}));
     }
     expect(res?.status()===200,'Page failed to load',{engine,width,route,status:res?.status()});
     const status=await page.evaluate(()=>{
      const d=document.documentElement;
      const isVisible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};
      const headings=[...document.querySelectorAll('h1')].filter(isVisible).map(e=>e.textContent.trim().slice(0,85));
      const unlabelled=[...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(isVisible).filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')).map(e=>e.outerHTML.slice(0,130));
      const overflow=[...document.querySelectorAll('body *')].filter(isVisible).filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>window.innerWidth+8&&getComputedStyle(e).position!=='fixed'}).slice(0,8).map(e=>({tag:e.tagName,cls:typeof e.className==='string'?e.className.slice(0,80):'',right:Math.round(e.getBoundingClientRect().right)}));
      return {title:document.title,headings,viewport:innerWidth,scroll:d.scrollWidth,unlabelled,overflow,main:!!document.querySelector('main'),skip:[...document.querySelectorAll('a[href="#main-content"],a[href="#main"]')].some(a=>!!document.querySelector('main'+a.getAttribute('href'))) || (!!document.querySelector('a[href="#main-content"]')&&!!document.getElementById('main-content'))};
     });
     expect(status.headings.length===1,'Expected one visible page title',{engine,width,route,headings:status.headings});
     expect(status.main,'Missing primary main landmark',{engine,width,route});
     expect(status.scroll<=status.viewport+6,'Horizontal page overflow',{engine,width,route,overflow:status.overflow,extra:status.scroll-status.viewport});
     if(status.unlabelled.length)warn('Visible form controls missing accessible labels',{engine,width,route,controls:status.unlabelled});
     if(!status.skip)warn('No skip-to-content navigation',{engine,width,route});
     if(/^managers\/(?!$)[^/]+\/$/.test(route)){
      const contrast=await page.evaluate(()=>{
       const hero=document.querySelector('main>.hero');
       if(!hero)return null;
       const fg=getComputedStyle(hero,'::before').color;
       const bg=getComputedStyle(hero).backgroundColor;
       const rgb=c=>(c.match(/\d+(?:\.\d+)?/g)||[]).slice(0,3).map(Number);
       const lum=arr=>{if(arr.length<3)return 0;const a=arr.map(v=>{v/=255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4});return a[0]*.2126+a[1]*.7152+a[2]*.0722};
       const a=lum(rgb(fg)),b=lum(rgb(bg));
       return {ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),fg,bg};
      });
      if(contrast)expect(contrast.ratio>=4.5,'Franchise Archives ribbon fails readable text contrast',{engine,width,route,contrast});
      expect(!(await page.locator('main>.hero>.eyebrow').isVisible()),'Redundant franchise label collides with archive eyebrow',{engine,width,route});
     }
     const name=(route||'home').replace(/[^a-z0-9]+/gi,'-').replace(/-$/,'');
     if(['','managers/','managers/stilly/','managers/record-books.html?manager=Stilly#career-first','analytics/records.html','analytics/record-holders.html'].includes(route)){
      const file=engine+'-'+width+'-'+name+'.png';
      await page.screenshot({path:path.join(dir,file),fullPage:false,animations:'disabled'});
      screens.push(file);
     }
     steps.push({engine,width,route,title:status.title,scroll:status.scroll,viewport:status.viewport});
    }
    for(const route of routes)await visit(route);
    // Audit every active franchise, not just two representative managers.
    if(width===390){
     for(const slug of ['stew','stover','birch','tony','mitch','kuhl','jmid','scott'])
      await visit('managers/'+slug+'/');
    }
    // Visual-review regression: fixed Top control must not cover first-screen CTA.
    for(const route of ['analytics/records.html','analytics/record-holders.html']){
     await visit(route);
     const top=page.locator('a.record-recovery');
     expect(!(await top.isVisible()),'Back-to-top control obscures first screen',{engine,width,route});
     await page.evaluate(()=>window.scrollTo(0,1100));
     await page.waitForFunction(()=>document.querySelector('a.record-recovery')?.classList.contains('is-visible'),null,{timeout:5000})
      .catch(()=>fail('Back-to-top never appears after scrolling',{engine,width,route}));
     if(await top.isVisible()){
      await top.click();
      await page.waitForFunction(()=>window.scrollY<400,null,{timeout:5000})
       .catch(()=>fail('Back-to-top does not return to page beginning',{engine,width,route}));
     }
    }
    // Real tap: homepage mobile menu should expose canonical league records.
    await visit('');
    const appHome=await page.locator('#my-manager').count()>0;
    if(appHome){
     const records=page.locator('.fellas-app-nav [data-app-tab="records"]');
     expect(await records.count()===1,'Production homepage lacks league Records route',{engine,width});
     await records.click();await page.waitForLoadState('networkidle',{timeout:25000});
     expect(new URL(page.url()).pathname.endsWith('/analytics/records.html'),'Production Records tap failed',{engine,width});
     await visit('home-classic.html');
    }
    const menu=page.locator('details.mobile-menu>summary');
    expect(await menu.isVisible(),'Mobile menu unavailable',{engine,width});
    if(await menu.isVisible()){
     await menu.click();
     const records=page.locator('details.mobile-menu nav.menu-links a').filter({hasText:/^Records$/});
     expect(await records.count()===1,'Mobile menu lacks Records link',{engine,width});
     if(await records.count()===1){
      expect(await records.getAttribute('href')==='analytics/records.html','Mobile Records link skips the league-wide entrance',{engine,width});
      await records.click();
      await page.waitForLoadState('networkidle',{timeout:25000});
      expect(new URL(page.url()).pathname.endsWith('/analytics/records.html'),'Mobile Records tap did not navigate to league-wide record book',{engine,width});
     }
    }
    // Real tap from homepage to manager and personal record book.
    await visit('');
    if(appHome){
     await page.locator('#my-manager').selectOption('Stilly');
     await page.locator('.personal-card').waitFor({timeout:25000});
     await page.locator('.fellas-app-nav a[data-app-tab="team"]').click();
     await page.waitForURL(u=>u.hash==='#my-team-section');
     await page.locator('body:not(.home-overview)').waitFor();
     await page.waitForFunction(()=>document.querySelector('#my-manager')?.value==='Stilly'&&document.querySelector('.personal-top')?.textContent.includes('Stilly'),null,{timeout:25000});
     const profile=page.locator('#my-team a[href="managers/stilly/"]:visible, #my-team a[href="managers/stilly/?app=1"]:visible').first();
     await profile.waitFor({state:'visible',timeout:25000}).catch(()=>{});
     expect(await profile.isVisible(),'Production personalized team lacks visible franchise route',{engine,width});
     if(await profile.isVisible()){await profile.click();await page.waitForLoadState('networkidle',{timeout:25000});expect(new URL(page.url()).pathname.endsWith('/managers/stilly/'),'Production personalized franchise tap failed',{engine,width})}
     await visit('home-classic.html');
    }
    const manager=page.locator('.home-franchise-links a[href="managers/stilly/"]');
    expect(await manager.count()===1,'Home lacks direct Stilly franchise route',{engine,width});
    if(await manager.count()===1){
     await manager.click();
     await page.waitForLoadState('networkidle',{timeout:25000});
     await page.locator('.profile-madden-header').waitFor({timeout:25000});
     expect(new URL(page.url()).pathname.endsWith('/managers/stilly/'),'Manager profile tap failed',{engine,width});
     const career=page.locator('main a[href*="record-books.html?manager=Stilly#career-first"]').first();
     expect(await career.count()>=1,'Manager profile does not reach personal records',{engine,width});
     if(await career.count()){await career.click();await page.waitForLoadState('networkidle',{timeout:25000});await page.waitForFunction(()=>document.querySelector('#manager')?.options.length>=10,null,{timeout:25000});expect(new URL(page.url()).pathname.endsWith('/managers/record-books.html'),'Personal record tap failed',{engine,width})}
    }
    await page.goto(base+'managers/record-books.html?manager=Stilly#career-first',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>document.querySelector('#manager')?.options.length>=10,null,{timeout:25000}).catch(()=>fail('Personal record manager picker never loaded',{engine,width}));
    const personal=await page.locator('#manager').inputValue().catch(()=>'');
    expect(personal==='Stilly','Deep-linked personal records select wrong manager',{engine,width,selected:personal});
    expect(await page.locator('#owned-records').count()===1,'Personal league records section absent',{engine,width});
    // Record Holders manager finder, family search and two-manager comparison.
    await visit('analytics/record-holders.html');
    expect((await page.locator('#records-cover-title').innerText()).includes('Record Holders'),'Record Holders title not distinguishable from league Record Book',{engine,width});
    await page.waitForFunction(()=>document.querySelector('#record-category-results-count')?.textContent?.includes('Showing 44 of 44'),null,{timeout:30000}).catch(()=>fail('44 verified record categories did not load',{engine,width}));
    const left=page.locator('#record-compare-left'),right=page.locator('#record-compare-right');
    if(await left.locator('option').count()>1){
     await left.selectOption('Mitch');await right.selectOption('Stew');
     const value=await page.locator('.record-compare-scoreboard .record-compare-stat strong').allTextContents();
     expect(value.length===3&&value.every(x=>/^\d+$/.test(x)),'Manager comparison values invalid',{engine,width,value});
    }else fail('Comparison selectors never loaded',{engine,width});
    const disclosure=page.locator('#complete-record-index .records-archive-disclosure>summary');
    await disclosure.click();
    await page.locator('#record-category-query').fill('Mitch');
    const matches=await page.locator('#expanded-record-categories>.category-card').count();
    expect(matches>0&&matches<44,'Record search failed to filter categories',{engine,width,matches});
    const links=await page.locator('#expanded-record-categories .category-card a[href*="expanded-records.html"]').count();
    expect(links===matches,'Filtered category evidence links missing',{engine,width,links,matches});
    // Findings: actionable tap targets, but do not fail global navigation for dense archival metadata.
    const tap=await page.evaluate(()=>[...document.querySelectorAll('#record-family-nav button,.record-compare-controls select,.record-category-search input,.records-cover-actions a')].filter(e=>{const r=e.getBoundingClientRect();return r.height>0}).map(e=>({label:e.textContent?.trim().slice(0,30)||e.getAttribute('placeholder'),height:Math.round(e.getBoundingClientRect().height),width:Math.round(e.getBoundingClientRect().width)})).filter(x=>x.height<44||x.width<44));
    if(tap.length)warn('Small high-priority touch targets',{engine,width,targets:tap});
    if(jsErrors.length)fail('Unhandled JavaScript error',{engine,width,messages:[...new Map(jsErrors.map(x=>[x.route+' '+x.message,x])).values()].slice(0,8)});
    if(badResponses.length)warn('HTTP errors for local assets',{engine,width,assets:[...new Set(badResponses)].slice(0,10)});
    await ctx.close();
   }
  }finally{await browser.close()}
 }
}finally{await new Promise(done=>server.close(done))}
const report={audit:'Fellas full mobile visitor journey',source:'GitHub checkout served at Pages-compatible local path',viewportWidths:[320,390,430],engines:['Chromium','WebKit'],routes,steps:steps.length,screenCaptures:screens,hardFailures:hard,advisories:soft,physicalIPhoneVerified:false,productionByteParityVerified:false};
await fs.writeFile(path.join(dir,'report.json'),JSON.stringify(report,null,2)+'\n');
await fs.writeFile(path.join(dir,'summary.md'),['# Fellas mobile visitor journey audit','','Automated local-source audit, not a physical-device or deployed-byte confirmation.','','- '+steps.length+' page/viewport observations','- '+screens.length+' first-screen captures','- '+hard.length+' functional or layout failures','- '+soft.length+' accessibility and HTTP advisories','',...hard.map(x=>'- FAIL: '+JSON.stringify(x)),...soft.map(x=>'- REVIEW: '+JSON.stringify(x))].join('\n')+'\n');
console.log('Mobile audit: '+steps.length+' route observations, '+screens.length+' screenshots, '+hard.length+' failures, '+soft.length+' advisories');
for(const finding of [...hard,...soft])console.log(JSON.stringify(finding));
if(hard.length)process.exitCode=1;
