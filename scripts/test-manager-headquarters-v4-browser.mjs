import {chromium,webkit} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),prefix='/fellas-hall-of-fame/',out='data-integrity/manager-headquarters-v4';
const engines=[['chromium',chromium],['webkit',webkit]];
const selectedEngine=process.env.FELLAS_HQ_ENGINE;
const selectedWidth=process.env.FELLAS_HQ_WIDTH;
assert(!selectedEngine||engines.some(([name])=>name===selectedEngine),'Invalid engine shard');
assert(!selectedWidth||[320,390,430,1280].includes(Number(selectedWidth)),'Invalid viewport shard');
const engineCases=engines.filter(([name])=>!selectedEngine||name===selectedEngine);
const widths=[320,390,430,1280].filter(width=>!selectedWidth||width===Number(selectedWidth));
await fs.mkdir(out,{recursive:true});
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer(async(req,res)=>{try{let p=new URL(req.url,'http://localhost').pathname;if(!p.startsWith(prefix))throw Error();p=decodeURIComponent(p.slice(prefix.length));if(!p||p.endsWith('/'))p+='index.html';const file=path.resolve(root,p);if(!file.startsWith(root+path.sep))throw Error();const b=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(b)}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+prefix;
const managers=['Birch','JMid','Kuhl','Mitch','Scott','Stew','Stilly','Stover','Thommy','Tony'],results=[],failures=[];
try{
 for(const [engine,runner] of engineCases){
  const browser=await runner.launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
  try{for(const width of widths){const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await ctx.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(20000);
   for(const name of managers){const meta={engine,width,name};console.log('HQ START',engine,width,name);try{
    const cutoff={year:2026,week:10},total={supported_starts:12,supported_pf_cents:123456,strict_pf_cents:120000};
    const fixture={status:'VERIFIED_RELEASE',completedThrough:cutoff,supportedEvidence:{careerScorecards:[{manager:name,total,categories:{DRAFT:{...total,acquisitions:3}},draftSeasons:[],tradeRivalries:[],keeperSlots:[],tradeSurplusCents:null}]}};
    await page.route('**/data/front-office/managers.json',r=>r.fulfill({json:fixture}));
    await page.route('**/data/career_core_generated.json',async r=>{const response=await r.fetch();const data=await response.json();await r.fulfill({json:{...data,completedThrough:cutoff}})});
    const slug=name==='Thommy'?'tom':name.toLowerCase();
    await page.goto(base+'managers/'+slug+'/',{waitUntil:'domcontentloaded'});
    const topic=page.locator('#gm47-front-office');await topic.locator(':scope > summary').waitFor({timeout:15000});assert.equal(await topic.evaluate(e=>e.open),false,'Front office should be deferred');await topic.locator(':scope > summary').click();const panel=page.locator('#gm4-headquarters');await panel.locator('.gm4-metrics').waitFor({timeout:15000});
    assert.match(await panel.innerText(),/1,234\.56 PF/);
    const frontOffice=page.getByRole('button',{name:/Drafts & trades The roster-building résumé/});
    assert.equal(await frontOffice.count(),1,'Primary roster-building shortcut missing');
    await topic.locator(':scope > summary').click();
    assert.equal(await topic.evaluate(e=>e.open),false,'Front office should close before shortcut test');
    await frontOffice.click();
    assert.equal(await topic.evaluate(e=>e.open),true,'Primary shortcut must reopen verified front office');
    assert.equal(await page.evaluate(()=>document.activeElement?.closest('details')?.id),'gm47-front-office');
    for(const summary of await panel.locator('summary').all()){await summary.click();assert(await summary.evaluate(e=>e.parentElement.open))}
    assert(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth+2),'Panel overflows');
    if(width===390||width===1280)await panel.screenshot({path:out+'/'+engine+'-'+width+'-'+slug+'.png'});
    await page.unrouteAll();
    await page.route('**/data/front-office/managers.json',r=>r.fulfill({json:{...fixture,status:'RESEARCH_ONLY_NOT_DEPLOYABLE'}}));
    await page.reload({waitUntil:'domcontentloaded'});await topic.locator(':scope > summary').click();await panel.getByText(/Verified front office release not available/).waitFor({timeout:15000});
    assert.equal(await panel.locator('.gm4-metrics').count(),0);
    results.push(meta);console.log('HQ PASS',engine,width,name);
   }catch(e){failures.push({...meta,error:String(e)});console.error('HQ FAIL',engine,width,name,String(e))}finally{await page.unrouteAll();await fs.writeFile(out+'/report.json',JSON.stringify({fixtureOnly:true,results,failures},null,2))}}
   await ctx.close();
  }}finally{await browser.close()}
 }
}finally{server.close();await fs.writeFile(out+'/report.json',JSON.stringify({fixtureOnly:true,results,failures},null,2))}
assert.equal(failures.length,0,JSON.stringify(failures));assert.equal(results.length,engineCases.length*widths.length*managers.length);console.log('GM4 BROWSER FIXTURE PASS '+results.length);
