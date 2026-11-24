import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve('data-integrity'),file=path.join(root,'historical-trade-draft-audits/acquisition-hall-of-fame-research.json'),url=pathToFileURL(path.join(root,'front-office-preview.html')).href;
await fs.mkdir(path.join(root,'front-office-captures'),{recursive:true});
for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await launcher.launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 try{for(const width of [390,1280]){
 const page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1});
 const errors=[],network=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
 await page.goto(url);assert.equal(await page.locator('#acqs').innerText(),'—');assert.equal(await page.locator('a.card').count(),4);
 await page.locator('#ledger').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('#acqs').textContent==='2,542');
 for(const [id,value] of [['starts','6,672'],['waivers','663'],['seasons','6']])assert.equal(await page.locator('#'+id).innerText(),value);
 const links=await page.locator('a.card').evaluateAll(nodes=>nodes.map(a=>({href:a.href,height:a.getBoundingClientRect().height})));
 for(const l of links){assert(l.height>=44);const response=await page.goto(l.href);assert(response===null||response.ok());assert(await page.locator('h1').isVisible());}
 await page.goto(url);await page.locator('#ledger').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('#acqs').textContent==='2,542');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);assert(overflow<=3);
 await page.screenshot({path:path.join(root,'front-office-captures',engine+'-'+width+'.png'),fullPage:true});
 await page.locator('#ledger').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"status":"OFFICIAL"}')});await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Cannot load'));assert.equal(await page.locator('#acqs').innerText(),'—');
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);await page.close();console.log('FRONT OFFICE HUB BROWSER PASS '+engine+' '+width+'px');
 }}finally{await browser.close()}
}
