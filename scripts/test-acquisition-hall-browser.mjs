import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const file=path.resolve('data-integrity/historical-trade-draft-audits/acquisition-hall-of-fame-research.json');
const url=pathToFileURL(path.resolve('data-integrity/acquisition-hall-preview.html')).href;
const data=JSON.parse(await fs.readFile(file,'utf8'));
assert.equal(data.ledger.length,2542);
await fs.mkdir('data-integrity/acquisition-hall-captures',{recursive:true});
for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await launcher.launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 try{for(const width of [390,1280]){
 const page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1});
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
 await page.goto(url);assert.equal(await page.locator('#content').isVisible(),false);
 await page.locator('#file').setInputFiles(file);await page.locator('#content').waitFor({state:'visible'});
 const entries=page.locator('#results .entry'),first=()=>entries.first();
 assert.equal(await entries.count(),25);
 assert.match(await first().innerText(),/Jalen Hurts/);assert.match(await first().innerText(),/328\.88/);
 await page.locator('#more').click();assert.equal(await entries.count(),50);
 for(const [cat,name,score] of [['TRADE','Jonathan Taylor','277.80'],['WAIVER','Justin Herbert','191.06'],['FREE_AGENT','James Robinson','191.30'],['ARCHIVED_KEEPER','Jaxon Smith-Njigba','248.90']]){
 await page.locator('#category').selectOption(cat);assert.match(await first().innerText(),new RegExp(name));assert((await first().innerText()).includes(score));
 }
 await page.locator('#category').selectOption('WAIVER');await page.locator('#metric').selectOption('points_per_faab');
 assert.match(await first().innerText(),/Dak Prescott/);assert.match(await first().innerText(),/176\.70/);
 await page.locator('#metric').selectOption('strict_pf');await page.locator('#manager').selectOption('Stilly');await page.locator('#season').selectOption('2022');await page.locator('#query').fill('Geno Smith');
 assert.equal(await entries.count(),1);assert.match(await first().innerText(),/146\.72/);
 await first().locator('summary').click();assert.equal(await first().locator('.receipt').count(),8);assert.match(await first().innerText(),/\$0 FAAB/);
 await page.locator('#position').selectOption('QB');assert.equal(await entries.count(),1);
 await page.locator('#query').fill('no-such-player-zz');assert.equal(await entries.count(),0);assert.match(await page.locator('#results').innerText(),/No qualifying/);
 await page.locator('#query').fill('');await page.locator('#manager').selectOption('');await page.locator('#season').selectOption('');await page.locator('#position').selectOption('');await page.locator('#category').selectOption('ALL');
 await page.locator('#metric').selectOption('points_per_start');
 assert(await entries.count()>0);
 const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,selectHeight:document.querySelector('#category').getBoundingClientRect().height}));
 assert(layout.overflow<=3,JSON.stringify(layout));assert(layout.selectHeight>=44);
 await page.screenshot({path:'data-integrity/acquisition-hall-captures/'+engine+'-'+width+'.png',fullPage:true});
 await page.locator('#file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"status":"OFFICIAL"}')});await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Cannot load'));assert.equal(await page.locator('#content').isVisible(),false);
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);await page.close();console.log('ACQUISITION HALL BROWSER PASS '+engine+' '+width+'px '+JSON.stringify(layout));
 }}finally{await browser.close()}
}
