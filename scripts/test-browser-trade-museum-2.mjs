// Focused, source-preserving Trade Museum browser journey tests.
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, webkit } from 'playwright';

const root=process.cwd();
const prefix='/fellas-hall-of-fame/';
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(!url.pathname.startsWith(prefix)){res.writeHead(404).end();return}
  const relative=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html';
  const file=path.resolve(root,relative);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  const bytes=await fs.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(bytes);
 }catch{res.writeHead(404).end()}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+prefix+'analytics/trade-museum.html';
const testCases=[{engine:'Chromium',browserType:chromium,width:320},{engine:'Chromium',browserType:chromium,width:390},{engine:'Chromium',browserType:chromium,width:430},{engine:'WebKit',browserType:webkit,width:390}];
try{
 for(const testCase of testCases){
  const browser=await testCase.browserType.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:testCase.width,height:840}});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto(base,{waitUntil:'load'});
   await page.locator('#results button[data-id]').first().waitFor();
   assert.equal(await page.locator('.tm-entry a').count(),3,'Three distinct entry routes');
   assert.ok(await page.locator('#tm-gallery-items .tm-gallery-item').count()>0,'Source-backed gallery should show documented three-manager exchange');
   assert.equal(await page.locator('#results button[data-id]').count(),12,'Initial archive results should paginate at 12');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
   assert.equal(overflow,false,testCase.engine+' '+testCase.width+'px horizontal overflow');
   await page.locator('#format').selectOption('multi');
   assert.equal(await page.locator('#results button[data-id]').count(),1,'Multi-team format filter must work');
   await page.locator('#clearFilters').click();
   assert.equal(await page.locator('#format').inputValue(),'all','Clear filters restores full archive');
   await page.locator('#results button[data-id]').first().click();
   assert.ok(await page.locator('#detail').evaluate(element=>element.open),'Trade details open');
   const shareUrl=await page.locator('#tradeShareUrl').inputValue();
   assert.ok(shareUrl.includes('?trade='),'Receipt sharing must use stable trade ID');
   await page.locator('#close').click();
   await page.goto(base+'?manager=thommy',{waitUntil:'load'});
   await page.locator('#results button[data-id]').first().waitFor();
   assert.equal((await page.locator('#manager').inputValue()).toLowerCase(),'tom','Thommy deep link maps to Tom');
   await page.goto(base+'?trade=1294402688213057536',{waitUntil:'load'});
   assert.ok(await page.locator('#detail').evaluate(element=>element.open),'Historical three-team deep link opens exact receipt');
   assert.equal(errors.length,0,'Unexpected page JS errors: '+errors.join('; '));
   await page.close();
   console.log(testCase.engine+' '+testCase.width+'px: museum journey passed');
  }finally{await browser.close()}
 }
}finally{await new Promise(resolve=>server.close(resolve))}
