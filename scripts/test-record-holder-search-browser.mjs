// Short end-to-end Record Holders search test for Chromium and WebKit.
// Run after installing playwright browsers: node scripts/test-record-holder-search-browser.mjs
import {chromium,webkit} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),base='/fellas-hall-of-fame/';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
 let pathname;
 try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);res.end();return}
 if(!pathname.startsWith(base)){res.writeHead(404);res.end();return}
 let name=pathname.slice(base.length);
 if(!name||name.endsWith('/'))name+='index.html';
 const file=path.resolve(root,name);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{const bytes=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'text/plain'});res.end(bytes)}
 catch{res.writeHead(404);res.end()}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+base+'analytics/record-holders.html';
const engines=[['chromium',chromium],['webkit',webkit]];
const errors=[];
try{
 for(const [engine,launcher] of engines){
  const browser=await launcher.launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.locator('#complete-record-index .records-archive-disclosure>summary').click();
   const input=page.locator('#record-category-query');
   const count=page.locator('#record-category-results-count');
   await page.waitForFunction(()=>document.querySelector('#record-category-results-count')?.textContent?.includes('Showing 44 of 44'),null,{timeout:30000});
   if(await page.locator('#expanded-record-categories>.category-card').count()!==44)
    errors.push(engine+': baseline should render exactly 44 verified records');
   await input.fill('Mitch');
   await page.waitForFunction(()=>document.querySelector('#record-category-results-count')?.textContent?.includes('for “Mitch”'),null,{timeout:5000});
   const n=await page.locator('#expanded-record-categories>.category-card').count();
   if(n<1||n>=44)errors.push(engine+': manager keyword filter returned unexpected '+n);
   await input.fill('no-such-record-zzzz');
   if(!await page.locator('.record-category-empty').isVisible())
    errors.push(engine+': missing accessible no-match state');
   await page.locator('.record-category-clear').click();
   if(await input.inputValue()!==''||await page.locator('#expanded-record-categories>.category-card').count()!==44)
    errors.push(engine+': clearing search did not restore 44 records');
   await page.locator('#record-family-nav button').filter({hasText:'Single-game'}).click();
   const categoryCount=await page.locator('#expanded-record-categories>.category-card').count();
   if(!(categoryCount>0&&categoryCount<44))errors.push(engine+': family filter did not narrow 44 records');
   await input.fill('Stew');
   const filteredCount=await page.locator('#expanded-record-categories>.category-card').count();
   if(filteredCount>categoryCount)errors.push(engine+': keyword search escaped active family filter');
   const layout=await page.evaluate(()=>({
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    inputHeight:document.querySelector('#record-category-query')?.getBoundingClientRect().height||0
   }));
   if(layout.overflow>3||layout.inputHeight<44)errors.push(engine+': mobile overflow or small input '+JSON.stringify(layout));
   await page.close();
  }finally{await browser.close()}
 }
}finally{await new Promise(resolve=>server.close(resolve))}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}
else console.log('PASS: Chromium and WebKit 390px record search, family composition, reset and no overflow');
