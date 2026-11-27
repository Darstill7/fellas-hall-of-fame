import {chromium,webkit} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),prefix='/fellas-hall-of-fame/',out='data-integrity/manager-records-v45';
await fs.mkdir(out,{recursive:true});
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer(async(req,res)=>{try{let p=new URL(req.url,'http://localhost').pathname;if(!p.startsWith(prefix))throw Error();p=decodeURIComponent(p.slice(prefix.length));if(!p||p.endsWith('/'))p+='index.html';const file=path.resolve(root,p);if(!file.startsWith(root+path.sep))throw Error();const b=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(b)}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+prefix;
const names=['Birch','JMid','Kuhl','Mitch','Scott','Stew','Stilly','Stover','Thommy','Tony'],results=[],failures=[];
try{
 for(const [engine,runner] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await runner.launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 try{for(const width of [320,390,430,1280]){const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await ctx.newPage();
 for(const name of names){const meta={engine,width,name};try{
 const slug=name==='Thommy'?'tom':name.toLowerCase();await page.goto(base+'managers/'+slug+'/',{waitUntil:'domcontentloaded'});
 const recordsTopic=page.locator('#gm47-records'),achievementsTopic=page.locator('#gm47-achievements');await recordsTopic.locator(':scope > summary').waitFor({timeout:15000});assert.equal(await recordsTopic.evaluate(e=>e.open),false,'Records should be deferred');await recordsTopic.locator(':scope > summary').click();await achievementsTopic.locator(':scope > summary').click();const records=page.locator('#gm45-records'),cabinet=page.locator('#gm452-achievements');await records.getByText('Personal bests and worsts',{exact:true}).waitFor({timeout:15000});
 await cabinet.getByText('Explore achievements',{exact:true}).waitFor({timeout:15000});
 for(const label of ['Personal bests and worsts','Career streak records','Career milestone tracker','Annual personal bests','Personal record progression','Milestone history','League record holdings','Record chase and league rankings']){
 const summary=records.getByText(label,{exact:true});await summary.click();assert(await summary.evaluate(e=>e.parentElement.open));await summary.click();
 }
 await cabinet.getByText('Explore achievements',{exact:true}).click();assert.equal(await cabinet.locator('[data-achievement]').count(),33);
 const shortcuts=page.locator('.portfolio54-shortcuts');assert.equal(await shortcuts.locator('a').count(),3);
 assert.equal(await page.locator('.portfolio54-avatar').count(),1);
 assert(await shortcuts.evaluate(e=>e.scrollWidth<=e.clientWidth+2),'Shortcut overflow');
 const progress=records.locator('.gm54-milestone-grid progress');assert.equal(await progress.count(),3);
 for(const bar of await progress.all()){assert(await bar.evaluate(e=>Number.isFinite(e.value)&&e.value>=0&&e.value<e.max&&e.max>0&&e.getAttribute('aria-label')),'Invalid milestone progress');}
 await records.getByRole('button',{name:'View milestone history'}).click();
 assert(await records.getByText('Milestone history',{exact:true}).evaluate(e=>e.parentElement.open),'Milestone shortcut did not open history');
 await records.getByText('Milestone history',{exact:true}).click();
 for(const key of ['earned','locked','unavailable','all']){
  const button=cabinet.locator('[data-filter="'+key+'"]');await button.click();
  assert.equal(await button.getAttribute('aria-pressed'),'true');
  const expected=key==='all'?33:await cabinet.locator('[data-achievement="'+key+'"]').count();
  assert.equal(await cabinet.locator('[data-achievement]:visible').count(),expected,'Achievement filter mismatch: '+key);
 }
 assert(await cabinet.locator('.gm54-trophy-summary progress').evaluate(e=>e.value<=e.max&&e.value>=0),'Invalid trophy completion');
 const ownedButton=records.getByRole('button',{name:'Explore all owned records'});
 if(await ownedButton.count()){await ownedButton.click();assert(await records.getByText('League record holdings',{exact:true}).evaluate(e=>e.parentElement.open),'Ownership shortcut did not open holdings');await records.getByText('League record holdings',{exact:true}).click();}
 await recordsTopic.locator(':scope > summary').click();
 await shortcuts.locator('a[href="#gm47-records"]').click();
 assert(await recordsTopic.evaluate(e=>e.open),'Hero record shortcut did not reopen deferred chapter');
 assert.equal(await records.count(),1,'Duplicate portfolio mount');
 if(width===390||width===1280){await records.screenshot({path:out+'/'+engine+'-'+width+'-'+slug+'-portfolio.png'});await page.locator('main>.hero').screenshot({path:out+'/'+engine+'-'+width+'-'+slug+'-hero.png'});}

 assert(await cabinet.evaluate(e=>e.scrollWidth<=e.clientWidth+2),'Achievement overflow');assert(await records.evaluate(e=>e.scrollWidth<=e.clientWidth+2),'Records overflow');
 if(width===390||width===1280)await cabinet.screenshot({path:out+'/'+engine+'-'+width+'-'+slug+'.png'});
 results.push(meta);
 }catch(e){failures.push({...meta,error:String(e)})}}
 try{await page.goto(base,{waitUntil:'domcontentloaded'});if(await page.locator('#my-manager').count()){await page.locator('[data-app-tab=more]').click();await page.locator('#more .archive summary').click();const link=page.locator('#more a[href="home-classic.html#home-record-watch"]');assert.equal(await link.count(),1,'Production homepage must retain direct Record Watch access');await link.click();await page.waitForURL('**/home-classic.html#home-record-watch');}const watch=page.locator('#gm452-watch');await watch.waitFor({state:'attached',timeout:15000});await page.waitForLoadState('networkidle');assert(await watch.isHidden(),'Empty certified watch must be hidden');assert.equal(await watch.locator('.record-watch-row').count(),0,'Uncertified alerts cannot appear');await page.screenshot({path:out+'/'+engine+'-'+width+'-homepage.png'});results.push({engine,width,name:'homepage'})}catch(e){failures.push({engine,width,name:'homepage',error:String(e)})}
 await ctx.close()}}finally{await browser.close()}
 }
}finally{server.close();await fs.writeFile(out+'/report.json',JSON.stringify({results,failures},null,2))}
assert.equal(failures.length,0,JSON.stringify(failures));assert.equal(results.length,88);console.log('GM45 BROWSER PASS '+results.length);
