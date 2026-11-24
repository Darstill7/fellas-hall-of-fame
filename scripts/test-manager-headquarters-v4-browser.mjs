import {chromium,webkit} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),prefix='/fellas-hall-of-fame/',out='data-integrity/manager-headquarters-v4';
await fs.mkdir(out,{recursive:true});
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer(async(req,res)=>{try{let p=new URL(req.url,'http://localhost').pathname;if(!p.startsWith(prefix))throw Error();p=decodeURIComponent(p.slice(prefix.length));if(!p||p.endsWith('/'))p+='index.html';const file=path.resolve(root,p);if(!file.startsWith(root+path.sep))throw Error();const b=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(b)}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+prefix;
const managers=['Birch','JMid','Kuhl','Mitch','Scott','Stew','Stilly','Stover','Thommy','Tony'],results=[],failures=[];
try{
 for(const [engine,runner] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await runner.launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
  try{for(const width of [320,390,430,1280]){const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await ctx.newPage();
   for(const name of managers){const meta={engine,width,name};try{
    const cutoff={year:2026,week:10},total={supported_starts:12,supported_pf_cents:123456,strict_pf_cents:120000};
    const fixture={status:'VERIFIED_RELEASE',completedThrough:cutoff,supportedEvidence:{careerScorecards:[{manager:name,total,categories:{DRAFT:{...total,acquisitions:3}},draftSeasons:[],tradeRivalries:[],keeperSlots:[],tradeSurplusCents:null}]}};
    await page.route('**/data/front-office/managers.json',r=>r.fulfill({json:fixture}));
    await page.route('**/data/career_core_generated.json',async r=>{const response=await r.fetch();const data=await response.json();await r.fulfill({json:{...data,completedThrough:cutoff}})});
    const slug=name==='Thommy'?'tom':name.toLowerCase();
    await page.goto(base+'managers/'+slug+'/',{waitUntil:'domcontentloaded'});
    const panel=page.locator('#gm4-headquarters');await panel.locator('.gm4-metrics').waitFor({timeout:15000});
    assert.match(await panel.innerText(),/1,234\.56 PF/);
    await page.getByRole('button',{name:/Front office Roster construction/}).click();
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'gm4-heading');
    for(const summary of await panel.locator('summary').all()){await summary.click();assert(await summary.evaluate(e=>e.parentElement.open))}
    assert(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth+2),'Panel overflows');
    if(width===390||width===1280)await panel.screenshot({path:out+'/'+engine+'-'+width+'-'+slug+'.png'});
    await page.unrouteAll();
    await page.route('**/data/front-office/managers.json',r=>r.fulfill({json:{...fixture,status:'RESEARCH_ONLY_NOT_DEPLOYABLE'}}));
    await page.reload({waitUntil:'domcontentloaded'});await panel.getByText(/Verified front office release not available/).waitFor({timeout:15000});
    assert.equal(await panel.locator('.gm4-metrics').count(),0);
    results.push(meta);
   }catch(e){failures.push({...meta,error:String(e)})}finally{await page.unrouteAll()}}
   await ctx.close();
  }}finally{await browser.close()}
 }
}finally{server.close();await fs.writeFile(out+'/report.json',JSON.stringify({fixtureOnly:true,results,failures},null,2))}
assert.equal(failures.length,0,JSON.stringify(failures));assert.equal(results.length,80);console.log('GM4 BROWSER FIXTURE PASS '+results.length);
