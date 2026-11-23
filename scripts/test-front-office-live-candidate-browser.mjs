// Real HTTP browser test for automatic Front Office data loading and release integrity.
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
const root=path.resolve('data-integrity'),dir=path.join(root,'historical-trade-draft-audits/front-office-site-candidate');
const manifest=JSON.parse(await fs.readFile(path.join(dir,'manifest.json'),'utf8'));
const captures=path.join(root,'front-office-live-captures');await fs.mkdir(captures,{recursive:true});
let fault='';
const server=http.createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
 if(!file.startsWith(root+path.sep))throw Error('Outside test root');
 let bytes=await fs.readFile(file);
 if(fault==='checksum'&&file.endsWith('/draft.json'))bytes=Buffer.from('{}');
 if(fault==='cutoff'&&file.endsWith('/draft.json')){const d=JSON.parse(bytes);d.completedThrough.week--;bytes=Buffer.from(JSON.stringify(d));}
 if(fault==='cutoff'&&file.endsWith('/manifest.json')){const m=JSON.parse(bytes),d=JSON.parse(await fs.readFile(path.join(dir,'draft.json'),'utf8'));d.completedThrough.week--;m.files.find(x=>x.name==='draft.json').sha256=createHash('sha256').update(JSON.stringify(d)).digest('hex');bytes=Buffer.from(JSON.stringify(m));}
 res.writeHead(200,{'Content-Type':file.endsWith('.json')?'application/json':'text/html','Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port+'/front-office-live-candidate.html';
let checks=0;const eq=(a,b)=>{checks++;assert.deepEqual(a,b)};
try{for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await launcher.launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 try{for(const width of [320,390,430,1280]){
 const page=await browser.newPage({viewport:{width,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.waitForFunction(()=>document.querySelectorAll('#nav button').length===7);
 assert((await page.locator('#coverage').innerText()).includes('through Week '+manifest.completedThrough.week));
 eq(await page.locator('#stats .stat').count(),4);
 eq(await page.locator('input[type=file]').count(),0);
 for(const key of ['trading','draft','acquisitions','players','managers','keepers','overview']){
 await page.locator('button[data-key="'+key+'"]').click();
 await page.waitForFunction(()=>!document.querySelector('#filter').disabled);
 assert(await page.locator('#results .entry').count()>0,key+' empty');
 eq(await page.locator('button[data-key="'+key+'"]').getAttribute('aria-pressed'),'true');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),key+' overflow '+width);
 await page.locator('#filter').fill('zzzz-no-player-or-manager');eq(await page.locator('#results').innerText(),'No matching results.');
 await page.locator('#filter').fill('');assert(await page.locator('#results .entry').count()>0);
 if(width===390||width===1280)await page.screenshot({path:path.join(captures,engine+'-'+width+'-'+key+'.png'),fullPage:false});
 checks+=4;
 }
 if(width===390){
 for(const mode of ['checksum','cutoff']){
 fault=mode;await page.reload();await page.waitForFunction(()=>document.querySelectorAll('#nav button').length===7);
 await page.locator('button[data-key="draft"]').click();
 await page.waitForFunction(()=>document.querySelector('#results').textContent.includes('Cannot load department'));
 assert((await page.locator('#results').innerText()).includes(mode==='checksum'?'checksum mismatch':'Mixed release cutoff'));
 eq(await page.locator('#results .entry').count(),0);fault='';
 }
 }
 eq(errors,[]);await page.close();console.log('LIVE FRONT OFFICE BROWSER PASS '+engine+' '+width+'px');
 }}finally{await browser.close()}
}}finally{await new Promise(r=>server.close(r));}
console.log('LIVE FRONT OFFICE INTEGRATION PASS '+JSON.stringify({checks,configurations:8,departments:7,completedThrough:manifest.completedThrough}));
