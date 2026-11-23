import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve('data-integrity'),file=path.join(root,'historical-trade-draft-audits/manager-acquisition-resumes-research.json');
const data=JSON.parse(await fs.readFile(file,'utf8'));
const stilly=data.profiles.find(p=>p.manager==='Stilly');assert(stilly);assert.equal(data.profiles.length,12);
const url=pathToFileURL(path.join(root,'manager-acquisition-resume-preview.html')).href;
await fs.mkdir(path.join(root,'manager-resume-captures'),{recursive:true});
const fmt=n=>n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await launcher.launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
 try{for(const width of [390,1280]){
 const page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1});
 const errors=[],network=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
 await page.goto(url+'?manager=Stilly');assert.equal(await page.locator('#content').isVisible(),false);
 await page.locator('#file').setInputFiles(file);await page.locator('#content').waitFor({state:'visible'});
 assert.equal(await page.locator('#manager').inputValue(),'Stilly');assert.equal(await page.locator('#manager option').count(),12);
 const profile=page.locator('#profile');
 assert.match(await profile.locator('h2').innerText(),/Stilly · Career/);
 assert.equal(await profile.locator('.stat strong').first().innerText(),fmt(Object.values(stilly.career).reduce((n,c)=>n+c.pf,0)));
 assert.equal(await profile.locator('details').count(),5);
 assert.match(await profile.innerText(),/Career positional honors/);assert.match(await profile.innerText(),/Travis Kelce/);assert.match(await profile.innerText(),/David Njoku/);
 await profile.locator('details').nth(1).locator('summary').click();assert(await profile.locator('details').nth(1).locator('a').count()>0);
 for(const a of await profile.locator('a').evaluateAll(xs=>xs.map(x=>x.getAttribute('href'))))assert.match(a,/^player-encyclopedia-preview\.html\?player=/);
 await page.locator('#season').selectOption('2023');assert.match(await profile.locator('h2').innerText(),/2023/);
 assert.equal(await profile.locator('details').count(),0);
 assert.equal(await profile.locator('.stat strong').first().innerText(),fmt(Object.values(stilly.seasons.find(s=>s.year===2023).categories).reduce((n,c)=>n+c.pf,0)));
 await page.locator('#manager').selectOption('Scott');assert.equal(await page.locator('#season').inputValue(),'');assert.equal(await page.locator('#season option').count(),3);
 await page.locator('#manager').selectOption('Stilly');
 const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,selectHeight:document.querySelector('#manager').getBoundingClientRect().height}));assert(layout.overflow<=3,JSON.stringify(layout));assert(layout.selectHeight>=44);
 await page.screenshot({path:path.join(root,'manager-resume-captures',engine+'-'+width+'.png'),fullPage:true});
 await page.locator('#file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"status":"OFFICIAL"}')});await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Cannot load'));assert.equal(await page.locator('#content').isVisible(),false);
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);await page.close();console.log('MANAGER RESUME BROWSER PASS '+engine+' '+width+'px '+JSON.stringify(layout));
 }}finally{await browser.close()}
}
