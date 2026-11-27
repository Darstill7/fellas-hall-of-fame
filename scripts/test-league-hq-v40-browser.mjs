import {chromium,webkit} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fellasLeague} from '../assets/league-config.mjs';
const root=process.cwd(),prefix='/fellas-hall-of-fame/',out='data-integrity/league-hq-v40';
await fs.mkdir(out,{recursive:true});
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=http.createServer(async(req,res)=>{try{let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(!p.startsWith(prefix))throw Error('outside');p=p.slice(prefix.length);if(!p||p.endsWith('/'))p+='index.html';const f=path.resolve(root,p);if(!f.startsWith(root+path.sep))throw Error('outside');res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(await fs.readFile(f))}catch{if(!res.headersSent)res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+prefix;
const results=[],failures=[];
try{
 for(const [engine,runner] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await runner.launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 try{for(const width of [320,390,430,1280]){
 const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));const meta={engine,width};
 try{
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.locator('.hq40-briefing-item').first().waitFor({timeout:20000});
 assert.deepEqual(await page.locator('.fellas-app-nav a span').allTextContents(),['HQ','Franchise','League','Legacy','More']);
 const picker=page.locator('#my-manager');
 for(const name of fellasLeague.managers){await picker.selectOption(name);await page.locator('.hq40-legacy-glance').waitFor({timeout:15000});assert.match(await page.locator('.personal-top').innerText(),new RegExp(name));assert.equal(new URL(await page.locator('[data-app-tab=records]').getAttribute('href')).searchParams.get('manager'),name)}
 await picker.selectOption('Stilly');await page.locator('.hq40-legacy-glance').waitFor();
 await page.locator('#hq40-history').waitFor();assert(await page.locator('#hq40-history button').last().isEnabled());
 await page.locator('#hq40-history button').last().click();assert.match(await page.locator('.hq40-history-controls [role=status]').innerText(),/^2 of/);
 assert(await page.locator('#hq40-competition').isHidden());assert(await page.locator('.hq40-recent-form').isHidden());
 const checkOverflow=async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Horizontal document overflow');
 await checkOverflow();
 await page.screenshot({path:out+'/'+engine+'-'+width+'-hq.png',fullPage:true});
 await page.locator('[data-app-tab=team]').click();await page.locator('.hq40-recent-form').waitFor();assert(await page.locator('#hq40-history').isHidden());assert(await page.locator('#news').isHidden());assert.equal(await page.locator('[data-app-tab=team]').getAttribute('aria-current'),'page');await checkOverflow();await page.screenshot({path:out+'/'+engine+'-'+width+'-franchise.png',fullPage:true});
 await page.locator('[data-app-tab=league]').click();await page.locator('#hq40-competition').waitFor();assert.equal(await page.locator('.hq40-seed').count(),10);assert.equal(await page.locator('.hq40-competition-row').count(),10);assert(await page.locator('#my-team-section').isHidden());await page.locator('#hq40-compare-sort').selectOption('allplay');await page.locator('.hq40-competition-row summary').first().click();assert(await page.locator('.hq40-competition-row[open]').count());await checkOverflow();await page.screenshot({path:out+'/'+engine+'-'+width+'-league.png',fullPage:true});
 await page.locator('[data-app-tab=more]').click();assert(await page.locator('.more-groups').isVisible());assert(await page.locator('#hq40-competition').isHidden());await checkOverflow();
 await page.locator('[data-app-tab=records]').click();await page.locator('#rb30-manager').waitFor();assert.equal(await page.locator('#rb30-manager').inputValue(),'Stilly');assert.equal(await page.locator('[data-app-tab=records]').getAttribute('aria-current'),'page');
 await page.locator('[data-app-tab=home]').click();await page.locator('.hq40-briefing-item').first().waitFor();assert.equal(await page.locator('#my-manager').inputValue(),'Stilly');
 assert.deepEqual(errors,[]);results.push({...meta,mode:'normal',managerSelections:10});
 }catch(e){failures.push({...meta,mode:'normal',error:String(e)});await page.screenshot({path:out+'/'+engine+'-'+width+'-failure.png',fullPage:true}).catch(()=>{})}
 await ctx.close();
 }}finally{await browser.close()}
 }
}finally{await new Promise(r=>server.close(r))}
await fs.writeFile(out+'/results.json',JSON.stringify({results,failures},null,2));console.log(JSON.stringify({results,failures},null,2));assert.equal(failures.length,0);
