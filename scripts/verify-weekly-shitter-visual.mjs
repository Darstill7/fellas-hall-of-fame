import {chromium, webkit} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd(),base='/fellas-hall-of-fame/';
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(!url.pathname.startsWith(base)){res.writeHead(404);res.end();return;}
  const rel=decodeURIComponent(url.pathname.slice(base.length));
  const file=path.resolve(root,rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  try{
    const bytes=await fs.readFile(file);
    const mime=file.endsWith('.svg')?'image/svg+xml':file.endsWith('.jpg')?'image/jpeg':file.endsWith('.html')?'text/html':'text/plain';
    res.writeHead(200,{'Content-Type':mime});res.end(bytes);
  }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const url='http://127.0.0.1:'+server.address().port+base+'weekly-shitter/issue-02.html';
const out=path.join(root,'data-integrity/visual-gate');
await fs.mkdir(out,{recursive:true});
let errors=[];
try{
  for(const [name,engine,width] of [['iphone-chromium',chromium,390],['iphone-webkit',webkit,390],['desktop-chromium',chromium,1280]]){
    const browser=await engine.launch({headless:true,...(name.includes('chromium')?{args:['--no-sandbox']}:{})});
    try{
      const context=await browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500,reducedMotion:'reduce'});
      const page=await context.newPage();
      page.on('pageerror',e=>errors.push(name+' script '+e.message));
      await page.goto(url,{waitUntil:'networkidle'});
      const report=await page.evaluate(()=>{
        const heading=document.querySelector('h1');
        const img=document.querySelector('.hero-figure img');
        const box=heading?.getBoundingClientRect();
        return {title:heading?.innerText||'',h1Count:document.querySelectorAll('h1').length,
          heroLoaded:img?.complete&&img?.naturalWidth>0,heroWidth:img?.naturalWidth,
          bodyWidth:document.documentElement.scrollWidth,viewport:innerWidth,
          headlineBounds:box?{left:box.left,right:box.right,width:box.width}:null,
          matchCards:document.querySelectorAll('.match-card').length,
          finalFlush:document.querySelector('#closing')?.innerText,
          masthead:document.querySelector('.mast-title')?.innerText,
          sponsor:document.querySelector('.sponsor')?.innerText};
      });
      const checks=[
        [report.h1Count===1,'exactly one headline'],
        [report.title.includes("Everybody's a Genius"),'approved article headline'],
        [report.heroLoaded,'hero illustration loaded'],
        [report.bodyWidth<=width+3,'no horizontal overflow'],
        [report.matchCards===5,'five separate game cards'],
        [report.finalFlush==='The Final Flush','Final Flush is the closing section'],
        [report.masthead?.includes('SHITTER'),'publication masthead visible'],
        [report.sponsor?.includes('Fictional parody'),'sponsorship disclosed']
      ];
      for(const [ok,label] of checks)if(!ok)errors.push(name+': '+label+' '+JSON.stringify(report));
      await page.screenshot({path:path.join(out,'weekly-shitter-'+name+'.png'),fullPage:true});
      await context.close();
      console.log(name,JSON.stringify(report));
    }finally{await browser.close();}
  }
}finally{server.close();}
if(errors.length){for(const e of errors)console.error(e);process.exitCode=1}
else console.log('PASS: Weekly Shitter mobile Chromium, mobile WebKit and desktop editorial layout');
