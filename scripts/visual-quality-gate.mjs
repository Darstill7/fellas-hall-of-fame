// Focused visual QA: fast screenshots and layout checks independent of deep canonical tests.
import {chromium,webkit} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),base='/fellas-hall-of-fame/';
const slugs=['stilly','stew','tom','stover','birch','tony','mitch','kuhl','jmid','scott'];
const routes=['','managers/','analytics/manager-report-cards.html','analytics/records.html',
 'analytics/power-ratings.html','analytics/rivalries.html','hall/','seasons/',
 'analytics/manager-madden-cards.html','managers/record-books.html','analytics/record-holders.html',
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
const findings=[],screens=[];
try{
 for(const [engine,widths] of [['chromium',[390,768,1280]],['webkit',[390]]]){
  const browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='webkit'?{}:{args:['--no-sandbox']})});
  try{
   for(const width of widths){
    const context=await browser.newContext({viewport:{width,height:width===390?844:width===768?960:900},
     isMobile:width===390,hasTouch:width===390,reducedMotion:'reduce'});
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
         snapshotTiles:[...document.querySelectorAll('.profile-career-snapshot .stat')].filter(visible).length,
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
       if(route.startsWith('managers/')&&route.endsWith('/')&&route!=='managers/'&&audit.snapshotTiles<3)
        findings.push(engine+' '+width+' '+key+' career stat tiles not visible above the rating card');
       const dir=path.join(output,'screens',engine,String(width));
       await fs.mkdir(dir,{recursive:true});
       await page.screenshot({path:path.join(dir,name+'.png'),animations:'disabled',fullPage:false});
       if(engine==='chromium'&&width===390&&['index.html','managers/stilly/','analytics/manager-report-cards.html','analytics/rivalries.html'].includes(key))
        await page.screenshot({path:path.join(dir,name+'_full.png'),animations:'disabled',fullPage:true});
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
const planned=routes.length*4;
const report={generated:new Date().toISOString(),routes:routes.length,planned,observed:screens.length,passed:findings.length===0&&screens.length===planned,findings,screens};
await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log('VISUAL GATE '+(report.passed?'PASS':'NEEDS REVIEW')+' '+screens.length+'/'+planned+' screens, '+findings.length+' findings');
for(const finding of findings)console.error('VISUAL FINDING '+finding);
if(!report.passed)process.exitCode=1;
