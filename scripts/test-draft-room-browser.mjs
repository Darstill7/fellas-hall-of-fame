import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve('data-integrity'),file=path.join(root,'historical-trade-draft-audits/draft-room-research.json');
const data=JSON.parse(await fs.readFile(file,'utf8'));
assert.equal(data.coverage.picks,900);assert.equal(data.coverage.peer_eligible,880);
const url=pathToFileURL(path.join(root,'draft-room-preview.html')).href;
await fs.mkdir(path.join(root,'draft-room-captures'),{recursive:true});
for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await launcher.launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 try{for(const width of [390,1280]){
 const page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1});
 const errors=[],network=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
 await page.goto(url);assert.equal(await page.locator('#content').isVisible(),false);
 await page.locator('#file').setInputFiles(file);await page.locator('#content').waitFor({state:'visible'});
 assert.equal(await page.locator('#season').inputValue(),'2025');assert.match(await page.locator('#count').innerText(),/of 150 selections/);
 assert.equal(await page.locator('#rankings .line').count(),10);
 await page.locator('#season').selectOption('2022');await page.locator('#manager').selectOption('Stew');await page.locator('#round').selectOption('7');await page.locator('#position').selectOption('QB');
 const entries=page.locator('#results .entry');assert.equal(await entries.count(),1);assert.match(await entries.first().innerText(),/Jalen Hurts/);
 await entries.first().locator('summary').click();assert.match(await entries.first().innerText(),/328\.88/);assert.match(await entries.first().innerText(),/Peer median/);
 assert.equal(await entries.first().locator('a').getAttribute('href'),'player-encyclopedia-preview.html?player=6904');
 for(const id of ['season','manager','round','position'])await page.locator('#'+id).selectOption('');
 assert.match(await page.locator('#count').innerText(),/of 900 selections/);
 await page.locator('#metric').selectOption('surplus');assert.match(await page.locator('#count').innerText(),/of 880 selections/);
 const leader=data.records.greatest_observed_steals[0];assert((await entries.first().innerText()).includes(leader.name));
 await page.locator('#metric').selectOption('lowest');assert((await entries.first().innerText()).includes(data.records.lowest_observed_returns[0].name));
 await page.locator('#metric').selectOption('pick');await page.locator('#query').fill('no-such-player-zz');assert.equal(await entries.count(),0);
 await page.locator('#query').fill('');assert.equal(await page.locator('#rankings .line').count(),12);
 const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,selectHeight:document.querySelector('#season').getBoundingClientRect().height}));assert(layout.overflow<=3,JSON.stringify(layout));assert(layout.selectHeight>=44);
 await page.screenshot({path:path.join(root,'draft-room-captures',engine+'-'+width+'.png'),fullPage:true});
 await page.locator('#file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"status":"OFFICIAL"}')});await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Cannot load'));assert.equal(await page.locator('#content').isVisible(),false);
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);await page.close();console.log('DRAFT ROOM BROWSER PASS '+engine+' '+width+'px');
 }}finally{await browser.close()}
}
