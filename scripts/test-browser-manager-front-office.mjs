// Chromium/WebKit smoke test for Front Office 3.0, under GitHub Pages prefix.
// Read-only local server; no external API calls and no canonical writes.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),prefix='/fellas-hall-of-fame/';
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(!pathname.startsWith(prefix)){res.writeHead(404);res.end();return}
  const route=decodeURIComponent(pathname.slice(prefix.length));
  const file=resolve(root,route.endsWith('/')?route+'index.html':route);
  if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return}
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end()}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port+prefix;
try{
 for(const [engine,runner] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await runner.launch({headless:true,...(engine==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const [slug,width] of [['stilly',320],['stilly',390],['tom',390],['jmid',390]]){
    const ctx=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    try{
     const page=await ctx.newPage(),errors=[];
     page.on('pageerror',e=>errors.push(e.message));
     const response=await page.goto(base+'managers/'+slug+'/',{waitUntil:'domcontentloaded',timeout:30000});
     assert.equal(response.status(),200,slug+' route should load');
     const panel=page.locator('[data-front-office-pulse] .manager-front-office');
     await panel.waitFor({state:'attached',timeout:30000});
     assert.ok(await panel.locator('summary').first().count(),'Panel needs an accessible disclosure');
     await panel.locator(':scope > summary').click();
     assert.equal(await panel.getAttribute('open'),'','Front Office should open after a click');
     assert.match(await panel.innerText(),/Draft room/);
     assert.match(await panel.innerText(),/Trade desk/);
     assert.match(await panel.innerText(),/Waiver wire/);
     assert.match(await panel.innerText(),/2026 partial/);
     const defining=panel.locator('.fo-decisions');
     await defining.waitFor({state:'attached',timeout:30000});
     await defining.locator(':scope > summary').click();
     assert.equal(await defining.getAttribute('open'),'','Defining Moves should open on phone tap');
     assert.match(await defining.innerText(),/Recorded waiver\/add/);
     assert.match(await defining.innerText(),/not proof this was the manager/i);
     assert.ok(await defining.locator('.fo-move').count()>=2,'Missing researched decisions');
     if(slug==='stilly'){
      assert.match(await defining.innerText(),/three-team trade/i);
      assert.ok(await defining.locator('.fo-move-story a').count()>=2,'Commissioner story must link to source receipts');
     }
     const yearbook=panel.locator('.manager-front-office-timeline');
     await yearbook.locator('summary').click();
     assert.equal(await yearbook.getAttribute('open'),'','Yearbook should open');
     assert.ok(await yearbook.locator('ol li').count()>=2,'There must be multiple annual source-coverage rows');
     const extent=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
     assert.ok(extent.scroll<=extent.viewport+6,engine+' '+slug+' '+width+'px page overflow: '+JSON.stringify(extent));
     assert.equal(errors.filter(e=>/manager-front-office|frontOfficeEvidence|renderFrontOffice/i.test(e)).length,0,'Unexpected Front Office runtime errors: '+errors.join('; '));
     console.log(engine+' '+slug+' '+width+'px PASS');
    }finally{await ctx.close()}
   }
  }finally{await browser.close()}
 }
}finally{await new Promise(ok=>server.close(ok))}
