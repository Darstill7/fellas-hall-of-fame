import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const file=path.resolve('data-integrity/historical-trade-draft-audits/player-career-encyclopedia-research.json');
const data=JSON.parse(await fs.readFile(file,'utf8'));
const chase=data.players.find(p=>p.player_id==='7564');assert(chase&&chase.career.starts>0);
const url=pathToFileURL(path.resolve('data-integrity/player-encyclopedia-preview.html')).href;
await fs.mkdir('data-integrity/player-encyclopedia-captures',{recursive:true});
for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await launcher.launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 try{for(const width of [390,1280]){
 const page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1});
 const errors=[],network=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
 await page.goto(url);assert.equal(await page.locator('#content').isVisible(),false);
 await page.locator('#file').setInputFiles(file);await page.locator('#content').waitFor({state:'visible'});
 assert.equal(await page.locator('#results .result').count(),25);
 await page.locator('#more').click();assert.equal(await page.locator('#results .result').count(),50);
 await page.locator('#query').fill('7564');assert.equal(await page.locator('#results .result').count(),1);
 await page.locator('#results .result').click();assert.match(await page.locator('#profile h2').innerText(),/Chase/);
 assert((await page.locator('#profile').innerText()).includes(chase.career.pf.toFixed(2)));
 assert.equal(await page.locator('#profile .stat').count(),4);
 assert.equal(await page.locator('#profile details.receipt').count(),chase.acquisitions.length);
 await page.locator('#position').selectOption('WR');assert.equal(await page.locator('#results .result').count(),1);
 await page.locator('#position').selectOption('QB');assert.equal(await page.locator('#results .result').count(),0);
 await page.locator('#position').selectOption('');await page.locator('#query').fill('no-such-player-zz');assert.match(await page.locator('#results').innerText(),/No matching/);
 await page.goto(url+'?player=7564');await page.locator('#file').setInputFiles(file);await page.locator('#profile').waitFor({state:'visible'});
 assert.match(await page.locator('#profile h2').innerText(),/Chase/);
 const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,inputHeight:document.querySelector('#query').getBoundingClientRect().height}));assert(layout.overflow<=3);assert(layout.inputHeight>=44);
 await page.screenshot({path:'data-integrity/player-encyclopedia-captures/'+engine+'-'+width+'.png',fullPage:true});
 await page.locator('#file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"status":"OFFICIAL"}')});await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Cannot load'));assert.equal(await page.locator('#content').isVisible(),false);
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);await page.close();console.log('PLAYER ENCYCLOPEDIA BROWSER PASS '+engine+' '+width+'px '+JSON.stringify(layout));
 }}finally{await browser.close()}
}
