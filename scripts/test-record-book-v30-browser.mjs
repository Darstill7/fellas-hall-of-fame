import {chromium,webkit} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {managerArchivePortfolio,archivedRanking} from '../assets/record-book-v30.mjs';
import {fellasLeague} from '../assets/league-config.mjs';
const root=process.cwd(),prefix='/fellas-hall-of-fame/',out='data-integrity/record-book-v30';
await fs.mkdir(out,{recursive:true});
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer(async(req,res)=>{try{let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(!p.startsWith(prefix))throw Error('outside');p=p.slice(prefix.length);if(!p||p.endsWith('/'))p+='index.html';const f=path.resolve(root,p);if(!f.startsWith(root+path.sep))throw Error('outside');const data=await fs.readFile(f);res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port+prefix+'analytics/records.html';
const archive=JSON.parse(await fs.readFile('data/expanded_records_verified_v1.json','utf8'));
const results=[],failures=[];
try{
 for(const [engine,runner] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await runner.launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,390,430,1280]){
    const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await ctx.newPage();
    const meta={engine,width};
    try{
     await page.goto(url+'?manager=Stilly',{waitUntil:'domcontentloaded'});
     const host=page.locator('#record-book-v30-discovery'),picker=page.locator('#rb30-manager'),search=page.locator('#rb30-search'),family=page.locator('#rb30-family'),cards=host.locator('.rb30-result'),preview=page.locator('#rb30-ranking'),metrics=page.locator('.rb30-metrics strong');
     await cards.first().waitFor({timeout:20000});
     assert.equal(await picker.inputValue(),'Stilly');
     assert.equal(await cards.count(),8);
     assert(await preview.isHidden());
     if(width===390||width===1280)await page.locator('#personal-record-entry').screenshot({path:out+'/'+engine+'-'+width+'-ownership.png'});
     for(const name of fellasLeague.managers){
      await picker.selectOption(name);
      const p=managerArchivePortfolio(archive,name);
      assert.deepEqual((await metrics.allTextContents()).map(Number),[p.owned.length,p.podium.length]);
      assert.equal(new URL(page.url()).searchParams.get('manager'),name);
      assert.equal(new URL(await page.locator('#personal-record-entry-link').getAttribute('href'),page.url()).searchParams.get('manager'),name);
     }
     await picker.selectOption('Stilly');
     while(await host.getByRole('button',{name:/Show \d+ more categories/}).isVisible())await host.getByRole('button',{name:/Show \d+ more categories/}).click();
     assert.equal(await cards.count(),44);
     assert.equal(new Set(await cards.evaluateAll(els=>els.map(e=>e.dataset.category))).size,44);
     await family.selectOption('Career');assert.equal(await cards.count(),8);
     await search.fill('winning streak');await cards.filter({hasText:'winning streak'}).first().waitFor();assert((await cards.count())>0);
     await family.selectOption('');await search.fill('zzzznotarecord');assert.equal(await cards.count(),0);
     await search.fill('');assert.equal(await cards.count(),8);
     const high=cards.locator('xpath=self::*[@data-category="highest-score"]');
     await high.focus();await page.keyboard.press('Enter');assert(await preview.isVisible());
     assert.equal(await preview.locator('h3').innerText(),archive.categories.find(c=>c.key==='highest-score').label);
     assert.equal(await preview.locator('.rb30-ranking-personal>strong').innerText(),'#'+archivedRanking(archive,'highest-score','Stilly').personalRank);
     assert.match(await preview.locator('.rb30-story').innerText(),/180\.86/);
     await preview.locator('details>summary').click();assert.equal(await preview.locator('li').count(),20);
     assert(await preview.locator('.rb30-ranking-selected').count()>0);
     assert(await preview.evaluate(e=>e.scrollWidth<=e.clientWidth+2),'Preview overflow');
     if(width===390||width===1280)await preview.screenshot({path:out+'/'+engine+'-'+width+'-ranking.png'});
     await preview.getByRole('button',{name:'Close preview'}).click();assert(await preview.isHidden());assert(await high.evaluate(e=>document.activeElement===e));
     await search.fill('most recorded regular-season games');await cards.locator('xpath=self::*[@data-category="most-games"]').click();
     assert.match(await preview.locator('.rb30-ranking-leader').innerText(),/SHARED FIRST PLACE/);
     await preview.getByRole('button',{name:'Close preview'}).click();
     await search.fill('');await picker.selectOption('Thommy');await page.reload({waitUntil:'domcontentloaded'});await cards.first().waitFor();assert.equal(await picker.inputValue(),'Thommy');
     await picker.selectOption('');await page.reload({waitUntil:'domcontentloaded'});await cards.first().waitFor();assert.equal(await picker.inputValue(),'');
     assert(await host.evaluate(e=>e.scrollWidth<=e.clientWidth+2),'Discovery overflow');
     assert(await page.locator('#personal-record-entry').evaluate(e=>e.scrollWidth<=e.clientWidth+2),'Ownership overflow');
     if(width===390||width===1280)await host.screenshot({path:out+'/'+engine+'-'+width+'-discovery.png'});
     results.push({...meta,mode:'normal'});
    }catch(e){failures.push({...meta,mode:'normal',error:String(e)})}
    try{
     await page.route('**/data/expanded_records_verified_v1.json',route=>route.fulfill({status:503,body:'Unavailable'}));
     await page.goto(url+'?manager=Stilly',{waitUntil:'domcontentloaded'});
     await page.getByText('Category index unavailable.',{exact:false}).waitFor({timeout:15000});
     assert(await page.locator('#rb30-search').isDisabled());assert.equal(await page.locator('.rb30-metrics').count(),0);
     assert(await page.locator('#personal-record-entry-link').isVisible());
     assert(await page.locator('#highest-scoring-matchups').isVisible());
     results.push({...meta,mode:'unavailable'});
    }catch(e){failures.push({...meta,mode:'unavailable',error:String(e)})}
    await ctx.close();
   }
  }finally{await browser.close()}
 }
}finally{server.close();await fs.writeFile(out+'/report.json',JSON.stringify({results,failures},null,2))}
assert.equal(failures.length,0,JSON.stringify(failures));assert.equal(results.length,16);
console.log('PASS: 16 browser scenarios, 80 manager selections, two engines and four widths');
