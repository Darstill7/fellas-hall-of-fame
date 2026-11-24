import {chromium,webkit} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),prefix='/fellas-hall-of-fame/',out='data-integrity/manager-dashboard-v42';
await fs.mkdir(out,{recursive:true});
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer(async(req,res)=>{try{let p=new URL(req.url,'http://localhost').pathname;if(!p.startsWith(prefix))throw Error();p=decodeURIComponent(p.slice(prefix.length));if(!p||p.endsWith('/'))p+='index.html';const file=path.resolve(root,p);if(!file.startsWith(root+path.sep))throw Error();const b=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(b)}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+prefix;
const names=['Stilly','Thommy','Mitch','Stew','Scott','Tony','Birch','Kuhl','JMid','Stover'];
const games=Array.from({length:5},(_,i)=>({year:2026,week:1,stage:'regular',home:names[2*i],away:names[2*i+1],homeScore:120,awayScore:100}));
const rows=names.map((name,i)=>({name,w:i%2?0:1,l:i%2?1:0,t:0,pf:i%2?100:120,pa:i%2?120:100}));
const core={completedThrough:{year:2026,week:1},managers:Object.fromEntries(rows.map(r=>[r.name,{w:r.w,l:r.l,t:0,games:1,annual:{2026:{w:r.w,l:r.l,t:0}},h2h:{}}]))};
const guide={'2026':{summary:'Through Week 1',standings:rows}};
const race={verified_through_week:1,teams:Object.fromEntries(rows.map(r=>[r.name,r])),scenarios:{6:Object.fromEntries(names.map(n=>[n,{playoff_pct:70,top2_pct:30}]))},fixtures:{2:games.map(g=>[g.home,g.away])}};
const results=[],failures=[];
try{
 for(const [engine,runner] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await runner.launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
  try{for(const width of [320,390,430,1280]){const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await ctx.newPage();
   for(const name of names){const meta={engine,width,name};try{
    // Mount the actual module in an isolated browser fixture to avoid changing existing archive consumers.
    await page.route('**/dashboard-test.html',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="assets/manager-dashboard-v42.css"><style>body{background:#122732;color:#fff;font:16px Arial;margin:12px}</style></head><body><main id="test"></main><script type="module">import {mountManagerDashboard} from "./assets/manager-dashboard-v42.mjs";mountManagerDashboard({name:'+JSON.stringify(name)+',host:document.querySelector("main"),root:"./"});</script></body></html>'}));
    for(const [file,data] of Object.entries({'career_core_generated.json':core,'season_guide.json':guide,'playoff_race_v1.json':race,'unified_record_book_2016_2026.json':{games}}))await page.route('**/data/'+file,r=>r.fulfill({json:data}));
    await page.goto(base+'dashboard-test.html');const p=page.locator('.gm42-dashboard');await p.getByText('Season trajectory',{exact:true}).waitFor();
    assert.match(await p.innerText(),/Synchronized through Week 1/);assert.match(await p.innerText(),/Playoff probability · 70%/);assert.match(await p.innerText(),/Remaining schedule/);assert.equal(await p.locator('.gm42-trend-item').count(),1);
    await p.locator('summary').click();assert(await p.locator('details').evaluate(e=>e.open));
    assert(await p.evaluate(e=>e.scrollWidth<=e.clientWidth+2));
    if(width===390||width===1280)await p.screenshot({path:out+'/'+engine+'-'+width+'-'+name+'.png'});
    await page.unroute('**/data/playoff_race_v1.json');await page.route('**/data/playoff_race_v1.json',r=>r.fulfill({json:{...race,verified_through_week:0}}));await page.reload();await p.getByText(/No outdated odds displayed/).waitFor();assert.equal(await p.locator('.gm42-probability').count(),0);results.push(meta);
   }catch(e){failures.push({...meta,error:String(e)})}finally{await page.unrouteAll()}}await ctx.close()}}finally{await browser.close()}
 }
}finally{server.close();await fs.writeFile(out+'/report.json',JSON.stringify({fixtureOnly:true,results,failures},null,2))}
assert.equal(failures.length,0,JSON.stringify(failures));assert.equal(results.length,80);console.log('GM42 BROWSER FIXTURE PASS '+results.length);
