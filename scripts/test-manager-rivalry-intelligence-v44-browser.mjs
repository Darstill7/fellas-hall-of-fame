import {chromium,webkit} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {buildRivalryIntelligence} from '../assets/manager-rivalry-intelligence-v44.mjs';
const root=process.cwd(),prefix='/fellas-hall-of-fame/',out='data-integrity/manager-rivalry-v44';
await fs.mkdir(out,{recursive:true});
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer(async(req,res)=>{try{let p=new URL(req.url,'http://localhost').pathname;if(!p.startsWith(prefix))throw Error();p=decodeURIComponent(p.slice(prefix.length));if(!p||p.endsWith('/'))p+='index.html';const file=path.resolve(root,p);if(!file.startsWith(root+path.sep))throw Error();const b=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(b)}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+prefix;
const names=['Birch','JMid','Kuhl','Mitch','Scott','Stew','Stilly','Stover','Thommy','Tony'];
const core=JSON.parse(await fs.readFile('data/career_core_generated.json','utf8')),ledger=JSON.parse(await fs.readFile('data/unified_record_book_2016_2026.json','utf8'));
const results=[],failures=[];
try{
 for(const [engine,runner] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await runner.launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 try{for(const width of [320,390,430,1280]){const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await ctx.newPage();
 for(const name of names){const meta={engine,width,name};try{
 const slug=name==='Thommy'?'tom':name.toLowerCase(),model=buildRivalryIntelligence(core,ledger,name);
 await page.goto(base+'managers/'+slug+'/',{waitUntil:'domcontentloaded'});
 await page.locator('.manager-home-hub-tile').filter({hasText:'Rivalries'}).click();
 const outer=page.locator('#rivalry-analytics > .profile-inline-disclosure');
 await outer.waitFor({state:'visible',timeout:15000});
 if(!await outer.evaluate(e=>e.open))await outer.locator(':scope > summary').click();
 const p=page.locator('#gm44-rivalries');await p.locator('select').waitFor({timeout:15000});
 const select=p.locator('select');assert.equal(await select.locator('option').count(),model.series.length);
 for(const r of model.series){
 await select.selectOption(r.opponent);
 assert.equal(await p.locator('h3').innerText(),name+' vs '+r.opponent);
 const record=r.regular.w+'–'+r.regular.l+(r.regular.t?'–'+r.regular.t:'');
 assert.equal(await p.locator('.gm44-card').filter({has:page.getByText('Regular record',{exact:true})}).locator('strong').innerText(),record);
 }
 await p.locator('button.gm44-card').first().click();assert.equal(await page.evaluate(()=>document.activeElement?.tagName),'SELECT');
 for(const label of ['Rivalry evolution by season','Heartbreak and dominance','Trade battles','Championship showdowns']){
 const summary=p.locator('summary').filter({hasText:label});await summary.click();assert(await summary.evaluate(e=>e.parentElement.open));
 }
 const log=p.locator('summary').filter({hasText:'Regular-season game log'});await log.click();assert(await log.evaluate(e=>e.parentElement.open));
 assert(await p.evaluate(e=>e.scrollWidth<=e.clientWidth+2),'Rivalry panel overflow');
 if(width===390||width===1280)await p.screenshot({path:out+'/'+engine+'-'+width+'-'+slug+'.png'});
 results.push({...meta,opponents:model.series.length});
 }catch(e){failures.push({...meta,error:String(e)})}}
 await ctx.close()}}finally{await browser.close()}
 }
}finally{server.close();await fs.writeFile(out+'/report.json',JSON.stringify({actualArchive:true,results,failures},null,2))}
assert.equal(failures.length,0,JSON.stringify(failures));assert.equal(results.length,80);console.log('GM44 ACTUAL ARCHIVE BROWSER PASS '+JSON.stringify({configurations:results.length,opponentSelections:results.reduce((n,r)=>n+r.opponents,0)}));
