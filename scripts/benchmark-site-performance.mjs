// Compare cold-page loading against a pinned pre-optimization checkout.
// Usage: node scripts/benchmark-site-performance.mjs <baseline directory>
import {chromium,webkit} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const roots={baseline:path.resolve(process.argv[2]||'baseline'),candidate:process.cwd()};
const prefix='/fellas-hall-of-fame/';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.webmanifest':'application/manifest+json'};
const servers={};
for(const [label,root] of Object.entries(roots)){
 const server=http.createServer(async(req,res)=>{try{
  const u=new URL(req.url,'http://localhost');if(!u.pathname.startsWith(prefix))throw Error('outside');
  let rel=decodeURIComponent(u.pathname.slice(prefix.length));if(!rel||rel.endsWith('/'))rel+='index.html';
  const file=path.resolve(root,rel);if(!file.startsWith(root+path.sep))throw Error('outside');
  const bytes=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end()}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));servers[label]=server;
}
const results=[],failures=[];
const routes=[['home','home-app-preview.html','.standing:not(.head)'],['profile','managers/stilly/','.profile-madden-header']];
try{
 for(const [engine,runner] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await runner.launch({headless:true});
  try{for(const width of [320,390])for(let trial=0;trial<3;trial++)for(const [pageType,route,ready] of routes)for(const label of (trial%2?['candidate','baseline']:['baseline','candidate'])){
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
   try{
    const page=await context.newPage(),errors=[],requests=[];
    const base='http://127.0.0.1:'+servers[label].address().port+prefix;
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(r.url().startsWith(base))requests.push(new URL(r.url()).pathname)});
    const t=performance.now();await page.goto(base+route,{waitUntil:'domcontentloaded'});
    await page.locator(ready).first().waitFor({timeout:25000});
    const readyMs=performance.now()-t;
    await page.waitForLoadState('networkidle',{timeout:25000});
    const metrics=await page.evaluate(()=>{const entries=performance.getEntriesByType('resource');return {resources:entries.length,decodedBytes:entries.reduce((n,e)=>n+e.decodedBodySize,0),transferBytes:entries.reduce((n,e)=>n+e.transferSize,0),jsonBytes:entries.filter(e=>new URL(e.name).pathname.endsWith('.json')).reduce((n,e)=>n+e.decodedBodySize,0),jsBytes:entries.filter(e=>/\.(?:m?js)$/.test(new URL(e.name).pathname)).reduce((n,e)=>n+e.decodedBodySize,0)}});
    const json=requests.filter(x=>x.endsWith('.json'));
    const duplicateJson=json.length-new Set(json).size;
    const signature=pageType==='home'?await page.locator('.standing:not(.head)').allTextContents():await page.locator('.profile-madden-header').first().innerText();
    const result={engine,width,trial,pageType,label,readyMs:Math.round(readyMs),...metrics,jsonRequests:json.length,duplicateJson,errors,signature};
    results.push(result);
    if(errors.length)failures.push({engine,width,trial,pageType,label,errors});
   }catch(e){failures.push({engine,width,trial,pageType,label,error:String(e)})}
   finally{await context.close()}
  }}finally{await browser.close()}
 }
}finally{await Promise.all(Object.values(servers).map(s=>new Promise(resolve=>s.close(resolve))))}
const comparisons=[];
for(const engine of ['chromium','webkit'])for(const width of [320,390])for(const [pageType] of routes){
 const a=results.filter(r=>r.engine===engine&&r.width===width&&r.pageType===pageType&&r.label==='baseline');
 const b=results.filter(r=>r.engine===engine&&r.width===width&&r.pageType===pageType&&r.label==='candidate');
 if(a.length!==3||b.length!==3){failures.push({engine,width,pageType,error:'Incomplete trials'});continue}
 for(let i=0;i<3;i++)if(JSON.stringify(a[i].signature)!==JSON.stringify(b[i].signature))failures.push({engine,width,pageType,trial:i,error:'Visible canonical output differs'});
 const median=(xs,key)=>xs.map(x=>x[key]).sort((x,y)=>x-y)[1];
 comparisons.push({engine,width,pageType,baseline:Object.fromEntries(['readyMs','decodedBytes','transferBytes','jsonBytes','jsBytes','jsonRequests','duplicateJson'].map(k=>[k,median(a,k)])),candidate:Object.fromEntries(['readyMs','decodedBytes','transferBytes','jsonBytes','jsBytes','jsonRequests','duplicateJson'].map(k=>[k,median(b,k)]))});
}
await fs.mkdir('data-integrity/performance-lab',{recursive:true});
await fs.writeFile('data-integrity/performance-lab/report.json',JSON.stringify({method:'Cold local Pages-compatible HTTP; three interleaved trials; median; no network throttling; not physical-device or production timings',comparisons,failures,results},null,2)+'\n');
console.log(JSON.stringify({comparisons,failures},null,2));
assert.equal(results.length,48,'Incomplete benchmark observations');
assert.equal(failures.length,0,'Benchmark correctness failure');
