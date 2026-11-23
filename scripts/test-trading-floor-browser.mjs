// Exercise actual historical research artifacts in Chromium and WebKit.
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const dir='data-integrity/historical-trade-draft-audits';
const files=['manager-trade-matrix-research.json','trade-rivalry-timelines-research.json','trading-records-research.json'];
const inputs=['matrix-file','timeline-file','records-file'];
const matrix=JSON.parse(await fs.readFile(path.join(dir,files[0]),'utf8'));
const url=pathToFileURL(path.resolve('data-integrity/trading-floor-preview.html')).href;
await fs.mkdir('data-integrity/trading-floor-captures',{recursive:true});
for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await launcher.launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 try{
 for(const width of [390,1280]){
 const page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1});
 const errors=[],network=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
 await page.goto(url);
 assert.equal(await page.locator('#content').isVisible(),false);
 for(let i=0;i<3;i++)await page.locator('#'+inputs[i]).setInputFiles(path.resolve(dir,files[i]));
 await page.locator('#content').waitFor({state:'visible'});
 assert.equal(await page.locator('#table tbody tr').count(),12);
 assert.equal(await page.locator('#table tbody button').count(),46);
 const i=matrix.managers.indexOf('Stilly'),j=matrix.managers.indexOf('Tom');
 const cell=()=>page.locator('#table tbody tr').nth(i).locator('td').nth(j).locator('button');
 assert.equal(await cell().innerText(),'+132.39');
 await cell().click();
 assert.match(await page.locator('#detail').innerText(),/Stilly vs. Tom/);
 assert.equal(await page.locator('#detail .event').count(),4);
 assert.match(await page.locator('#detail').innerText(),/Chase Brown/);
 await page.locator('#metric').selectOption('raw_delta');
 assert.equal(await cell().innerText(),'+155.74');
 await page.locator('#metric').selectOption('median_delta');
 assert.equal(await cell().innerText(),'+68.75');
 await page.locator('#metric').selectOption('p25_delta');
 await page.locator('#mode').selectOption('average');
 assert.equal(await cell().innerText(),'+33.10');
 await page.locator('#mode').selectOption('count');
 assert.equal(await cell().innerText(),'4');
 await page.locator('#season').selectOption('2024');
 assert.equal(await cell().innerText(),'2');
 assert.equal(await page.locator('#detail .event').count(),2);
 await page.locator('#season').selectOption('2025');
 assert.match(await page.locator('#detail').innerText(),/No comparable trades/);
 await page.locator('#season').selectOption('all');
 await page.locator('#mode').selectOption('total');
 const opposite=page.locator('#table tbody tr').nth(j).locator('td').nth(i).locator('button');
 assert.equal(await opposite.innerText(),'-132.39');
 await cell().focus();await page.keyboard.press('Enter');
 assert.match(await page.locator('#detail').innerText(),/Stilly vs. Tom/);
 const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,cellHeight:document.querySelector('#table button').getBoundingClientRect().height,scrollWidth:document.querySelector('.matrix').scrollWidth,clientWidth:document.querySelector('.matrix').clientWidth}));
 assert(layout.overflow<=3,JSON.stringify(layout));assert(layout.cellHeight>=44);
 if(width===390)assert(layout.scrollWidth>layout.clientWidth);
 assert.equal(await page.locator('#records .record').count(),5);
 await page.screenshot({path:'data-integrity/trading-floor-captures/'+engine+'-'+width+'.png',fullPage:true});
 await page.locator('#matrix-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"status":"OFFICIAL"}')});
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Cannot load'));
 assert.equal(await page.locator('#content').isVisible(),false);
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
 await page.close();
 console.log('TRADING FLOOR PASS '+engine+' '+width+'px '+JSON.stringify(layout));
 }
 }finally{await browser.close()}
}
