// Headless Chromium release checks: real JS, routed HTTP, responsive overflow and controls.
// CI installs playwright and Chromium before running this script.
import { chromium } from 'playwright';
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
 try{let content=await fs.readFile(file);res.writeHead(200,{'Content-Type':file.endsWith('.json')?'application/json':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});res.end(content)}
 catch{res.writeHead(404);res.end()}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const port=server.address().port,baseUrl='http://127.0.0.1:'+port+base;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const slugs=['stilly','stew','tom','stover','birch','tony','mitch','kuhl','jmid','scott'];
const routes=['','seasons/','seasons/weekly-matchup-archive.html','managers/record-books.html','analytics/records.html','analytics/records-archive.html','analytics/legacy.html','analytics/rivalries.html','analytics/awards-show.html','seasons/all-time-schedule-swap.html','seasons/espn-records.html','seasons/historical-awards.html','seasons/unified-record-book.html',...slugs.flatMap(s=>['managers/'+s+'/','managers/'+s+'.html'])];
const errors=[];
try{
 for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:width===390,hasTouch:width===390});
  for(const route of routes){
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
   if(state.scroll>state.viewport+5)errors.push(width+' '+route+' horizontal page overflow '+state.scroll+'px at '+state.viewport+'px viewport; offenders: '+(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+6).sort((a,b)=>b.getBoundingClientRect().right-a.getBoundingClientRect().right).slice(0,5).map(e=>e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.trim().replaceAll(' ','.'):'')+' right='+Math.round(e.getBoundingClientRect().right)).join(', ')+'; panel ancestry='+(()=>{let e=document.querySelector('#historical-record-profile');let xs=[];for(let i=0;e&&i<6;i++,e=e.parentElement){let b=e.getBoundingClientRect(),v=getComputedStyle(e);xs.push(e.tagName.toLowerCase()+'.'+e.className+' left='+Math.round(b.left)+' right='+Math.round(b.right)+' width='+Math.round(b.width)+' overflow='+v.overflowX)}return xs.join(' | ')})())));
   for(const error of unexpected)errors.push(width+' '+route+' JS error: '+error);
   for(const failed of failedRequests)errors.push(width+' '+route+' request error: '+failed);
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
    if(!(await page.locator('#profile').innerText()).includes('65–77'))errors.push(width+' historical archive did not render canonical Stilly WLT');
   }
   await page.close();
  }
  await context.close();
 }
}finally{await browser.close();server.close()}
if(errors.length){console.error('Chromium browser release test FAILED:\n'+errors.map(x=>' - '+x).join('\n'));process.exitCode=1}
else console.log('Chromium browser release test PASS: '+routes.length+' routes x 2 viewport sizes with JS and interactive archive checks');
