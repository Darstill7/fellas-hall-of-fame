import {chromium,webkit} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),prefix='/fellas-hall-of-fame/',out='data-integrity/manager-timeline-v43';
await fs.mkdir(out,{recursive:true});
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer(async(req,res)=>{try{let p=new URL(req.url,'http://localhost').pathname;if(!p.startsWith(prefix))throw Error();p=decodeURIComponent(p.slice(prefix.length));if(!p||p.endsWith('/'))p+='index.html';const file=path.resolve(root,p);if(!file.startsWith(root+path.sep))throw Error();const b=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(b)}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+prefix;
const names=['Birch','JMid','Kuhl','Mitch','Scott','Stew','Stilly','Stover','Thommy','Tony'];
const core=JSON.parse(await fs.readFile('data/career_core_generated.json','utf8'));
const results=[],failures=[];
try{
 for(const [engine,runner] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await runner.launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 try{for(const width of [320,390,430,1280]){const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await ctx.newPage();
 for(const name of names){const meta={engine,width,name};try{
 const slug=name==='Thommy'?'tom':name.toLowerCase();
 await page.goto(base+'managers/'+slug+'/',{waitUntil:'domcontentloaded'});
 const p=page.locator('#gm43-timeline');
 // The chapter may be hidden until the profile's season tab is activated.
 await page.locator('.manager-home-hub-tile').filter({hasText:'Every season'}).click();
 await p.locator('.gm43-filters').waitFor({timeout:15000});
 const count=Object.keys(core.managers[name].annual).length;
 assert.equal(await p.locator('.gm43-list details').count(),count);
 const season=p.locator('.gm43-list details').first();
 await season.locator('summary').click();assert(await season.evaluate(e=>e.open));
 assert(await season.getByText('Points for',{exact:true}).isVisible());
 for(const label of ['ESPN','Sleeper','Finals','Shitter years','All seasons']){
 const b=p.getByRole('button',{name:label,exact:true});await b.click();assert.equal(await b.getAttribute('aria-pressed'),'true');
 if(label==='ESPN')assert.equal(await p.locator('.gm43-list details').count(),Object.keys(core.managers[name].annual).filter(y=>Number(y)<2020).length);
 if(label==='Sleeper')assert.equal(await p.locator('.gm43-list details').count(),Object.keys(core.managers[name].annual).filter(y=>Number(y)>=2020).length);
 }
 assert.equal(await p.locator('.gm43-list details').count(),count);
 await p.getByText('Compare two seasons',{exact:true}).click();
 const selects=p.locator('select');assert.equal(await selects.count(),2);
 const v=await selects.first().inputValue();await selects.last().selectOption(v);assert(await p.getByText('Select two different seasons.',{exact:true}).isVisible());
 const other=await selects.last().locator('option').evaluateAll((opts,v)=>opts.find(o=>o.value!==v).value,v);await selects.last().selectOption(other);
 assert.equal(await p.locator('.gm43-comparison-row').count(),5);
 await p.getByText('Career evolution · annual win percentage',{exact:true}).click();assert.equal(await p.locator('.gm43-bar meter').count(),count);
 assert(await p.evaluate(e=>e.scrollWidth<=e.clientWidth+2),'Timeline overflow');
 if(width===390||width===1280)await p.screenshot({path:out+'/'+engine+'-'+width+'-'+slug+'.png'});
 results.push(meta);
 }catch(e){failures.push({...meta,error:String(e)})}}
 await ctx.close()}}finally{await browser.close()}
 }
}finally{server.close();await fs.writeFile(out+'/report.json',JSON.stringify({actualArchive:true,results,failures},null,2))}
assert.equal(failures.length,0,JSON.stringify(failures));assert.equal(results.length,80);console.log('GM43 ACTUAL ARCHIVE BROWSER PASS '+results.length);
