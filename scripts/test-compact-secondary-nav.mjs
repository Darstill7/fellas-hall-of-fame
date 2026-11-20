// 320/390px phone header usability without deleting desktop navigation.
import {chromium,webkit} from 'playwright';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
const root=process.cwd(),prefix='/fellas-hall-of-fame/';
const targets=[
 ['managers/','Mobile manager directory navigation','../analytics/records.html'],
 ['analytics/records.html','Mobile Record Book navigation','record-holders.html'],
 ['managers/record-books.html','Mobile personal record navigation','../analytics/records.html']
];
const errs=[];
const server=http.createServer(async(req,res)=>{
 let p;try{p=new URL(req.url,'http://localhost').pathname;if(!p.startsWith(prefix))throw Error('outside');p=decodeURIComponent(p.slice(prefix.length))}catch{res.writeHead(404);res.end();return}
 if(!p||p.endsWith('/'))p+='index.html';const name=path.resolve(root,p);
 if(!name.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{let v=await fs.readFile(name);res.writeHead(200,{'Content-Type':name.endsWith('.json')?'application/json':/\.m?js$/.test(name)?'text/javascript':name.endsWith('.css')?'text/css':'text/html'});res.end(v)}catch{res.writeHead(404);res.end()}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+prefix;
try{
 for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(name==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,390,768]){
    const page=await browser.newPage({viewport:{width,height:844},isMobile:width<650,hasTouch:width<650});
    try{
     for(const [route,label,dest] of targets){
      await page.goto(base+route,{waitUntil:'domcontentloaded'});
      const compact=page.locator('header details.compact-secondary-nav');
      const visible=await compact.isVisible();
      if(visible!==(width<650))errs.push(name+' '+width+' '+route+' unexpected disclosure visibility '+visible);
      if(width<650){
       const summary=compact.locator('summary');
       const height=await summary.evaluate(e=>e.getBoundingClientRect().height);
       if(height<44)errs.push(name+' '+width+' '+route+' compact menu <44px');
       await summary.click();
       if(!(await compact.evaluate(e=>e.open)))errs.push(name+' '+width+' '+route+' menu did not open');
       const links=compact.locator('nav a');
       const count=await links.count();
       if(count<5)errs.push(name+' '+width+' '+route+' menu lost destinations');
       const exact=compact.locator('nav a[href="'+dest+'"]');
       if(!(await exact.count()))errs.push(name+' '+width+' '+route+' expected destination missing '+dest);
       else if((await exact.first().boundingBox())?.height<44)errs.push(name+' '+width+' '+route+' nav link too small');
       await summary.click();
       if(await compact.evaluate(e=>e.open))errs.push(name+' '+width+' '+route+' disclosure failed to close');
      }
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
      if(overflow>6)errs.push(name+' '+width+' '+route+' horizontal overflow '+overflow+'px');
     }
    }finally{await page.close()}
   }
  }finally{await browser.close()}
 }
}finally{await new Promise(resolve=>server.close(resolve))}
if(errs.length){console.error(errs.join('\n'));process.exitCode=1}else console.log('PASS: compact secondary nav on 320/390 phones, desktop preservation, tap targets, routes and no overflow');
