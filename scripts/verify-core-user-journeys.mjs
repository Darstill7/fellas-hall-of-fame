// Regression journey: one phone visitor should reach and use the primary Fellas archives.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const base='/fellas-hall-of-fame/',root=process.cwd();
const server=http.createServer(async (req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(!url.pathname.startsWith(base)){res.writeHead(404);res.end();return}
 let relative;
 try{relative=decodeURIComponent(url.pathname.slice(base.length))}catch{res.writeHead(400);res.end();return}
 if(!relative||relative.endsWith('/'))relative+='index.html';
 const filename=path.resolve(root,relative);
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{
  const bytes=await fs.readFile(filename);
  res.writeHead(200,{'Content-Type':filename.endsWith('.json')?'application/json':/\\.m?js$/.test(filename)?'text/javascript':filename.endsWith('.css')?'text/css':'text/html'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end()}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const host='http://127.0.0.1:'+server.address().port+base;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
const visited=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
async function go(route){
 const response=await page.goto(host+route,{waitUntil:'domcontentloaded',timeout:20000});
 assert(response?.ok(),'Page unavailable: '+route+' HTTP '+response?.status());
 await page.waitForLoadState('networkidle',{timeout:7000}).catch(()=>{});
 visited.push(route);
}
try{
 // 1. Homepage: real discovery path through the manager directory.
 await go('');
 const destinations=await page.locator('#explore-the-league a.discovery-card').count();
 assert.equal(destinations,6,'Homepage must offer six primary destinations');
 await page.locator('#explore-the-league a.discovery-card[href="managers/"]').click();
 await page.waitForURL(url=>url.pathname.endsWith('/managers/'),{timeout:12000});
 visited.push('managers/');
 await page.locator('#manager-directory-cards a.manager[href="stew/"]').click();
 await page.waitForURL(url=>url.pathname.endsWith('/managers/stew/'),{timeout:12000});
 visited.push('managers/stew/');
 // Prefer the interactive hub; the accessible static chapter link is an
 // intentional no-JS fallback. Either must lead to this manager's record book.
 const personalRecords=page.locator('.manager-home-hub-grid a[href*="record-books.html"]:visible, nav.profile-chapters a[href*="record-books.html"]:visible, header a[href*="record-books.html"]:visible').first();
 await personalRecords.waitFor({state:'visible',timeout:12000});
 await personalRecords.click();
 await page.waitForURL(url=>url.pathname.endsWith('/managers/record-books.html'),{timeout:12000});
 visited.push('managers/record-books.html');
 await page.locator('#profile .cards .card').first().waitFor({state:'visible',timeout:14000});
 assert.equal(new URL(page.url()).searchParams.get('manager'),'Stew','Manager selection not preserved');
 const sectionOrder=await page.evaluate(()=>['career-first','notable-matchups','owned-records'].map(id=>document.getElementById(id)?.getBoundingClientRect().top+scrollY));
 assert(sectionOrder.every((x,i)=>Number.isFinite(x)&&(i===0||x>sectionOrder[i-1])),'Personal book does not show career then historic games then records');
 const historic=page.locator('#notable-matchup-results a.notable-matchup-card');
 await historic.first().waitFor({state:'visible',timeout:14000});
 await historic.first().click();
 await page.waitForURL(url=>url.pathname.endsWith('/analytics/record-stories.html'),{timeout:12000});
 visited.push('analytics/record-stories.html');
 await page.locator('#ranking-body tr').first().waitFor({state:'visible',timeout:12000});
 assert(await page.locator('#ranking-body tr').count()>=10,'Historical record top-ten results missing');
 const returnLink=page.locator('#featured-links a[href*="record-books.html"]');
 assert(await returnLink.count()>0,'Record story lacks manager return navigation');
 // 2. Trade Museum deep-link filtering and the full receipt dialog.
 await go('analytics/trade-museum.html?manager=Stew');
 assert.equal(await page.locator('#q').inputValue(),'Stew','Trade Museum did not pre-filter manager');
 const trade=page.locator('#results .tm-card').first();
 await trade.waitFor({state:'visible',timeout:12000});
 await trade.click();
 await page.locator('dialog#detail').waitFor({state:'visible',timeout:9000});
 await page.locator('#close').click();
 assert.equal(await page.locator('dialog#detail').evaluate(node=>node.open),false,'Trade receipt did not close');
 // 3. Rivalry series result, shareable pairing and progressive ledger.
 await go('analytics/rivalry-war-room.html?a=Stew&b=Stilly');
 await page.waitForFunction(()=>/series/i.test(document.querySelector('#verdict strong')?.textContent||''),null,{timeout:14000});
 assert.match(await page.locator('#verdict').innerText(),/10–10/,'Verified Stew–Stilly series must remain tied at 10–10');
 assert.equal(await page.locator('#a').inputValue(),'Stew');
 assert.equal(await page.locator('#b').inputValue(),'Stilly');
 const count=Number((await page.locator('#total').innerText()).match(/\d+/)?.[0]);
 assert(count>0,'Verified rivalry has no meetings');
 await page.locator('#swap').click();
 assert.equal(await page.locator('#a').inputValue(),'Stilly');
 assert.equal(new URL(page.url()).searchParams.get('a'),'Stilly','Rivalry pairing was not shareable');
 if(count>5){
  const show=page.locator('#moreGames');
  assert(await show.isVisible(),'More historical meetings cannot be revealed');
  await show.click();
  assert(await page.locator('#games .game').count()>5,'Rivalry game list did not expand');
 }
 // 4. Mobile-first Manager Profile 3.0 across all ten franchises.
 for(const manager of ['stilly','stew','tom','mitch','jmid','scott','stover','kuhl','tony','birch']){
  await go('managers/'+manager+'/');
  const pulse=page.locator('#profile-season-pulse');
  try{
   await pulse.locator('.profile-season-pulse-stats:not([hidden]) .profile-season-pulse-stat').first().waitFor({state:'visible',timeout:15000});
  }catch(error){
   const debug=await page.evaluate(()=>({
    loaded:!!document.getElementById('profile-season-pulse'),
    status:document.querySelector('.profile-season-pulse-status')?.textContent,
    display:document.querySelector('#profile-season-pulse')?getComputedStyle(document.querySelector('#profile-season-pulse')).display:null,
    stats:document.querySelector('.profile-season-pulse-stats')?.outerHTML.slice(0,500),
    hasTabs:!!document.querySelector('.profile-tabs'),
    heroChildren:[...document.querySelector('main .hero')?.children||[]].map(el=>el.className||el.tagName).slice(0,12)
   }));
   throw new Error('Manager mobile pulse did not load for '+manager+': '+JSON.stringify(debug)+'; page errors: '+errors.slice(-4).join(' | '),{cause:error});
  }
  const status=await pulse.locator('.profile-season-pulse-status').innerText();
  assert.match(status,/Verified through Week \d+/,'Season cut-off missing for '+manager);
  assert.equal(await page.locator('main .hero .profile-schedule-luck, main .hero .fellas-luck-performance').count(),0,'Advanced analytics leaked into the hero for '+manager);
  const analytics=page.locator('#profile-advanced-analytics');
  assert(await analytics.count(),'Advanced analytics section missing for '+manager);
  assert.equal(await analytics.evaluate(node=>node.open),false,'Advanced analytics unexpectedly expanded for '+manager);
  const measurements=await page.evaluate(()=>({
   overflow:document.documentElement.scrollWidth-innerWidth,
   pulseWidth:document.querySelector('#profile-season-pulse')?.getBoundingClientRect().width,
   width:innerWidth
  }));
  assert(measurements.overflow<=3,'Horizontal mobile viewport overflow on '+manager+': '+JSON.stringify(measurements));
 }
 assert.equal(errors.length,0,'Browser runtime errors: '+errors.join(' | '));
 console.log('PASS: mobile journeys '+visited.join(' → ')+'; manager records, verified record story, filtered trade receipts and rivalry comparison');
}finally{await page.close();await browser.close();await new Promise(resolve=>server.close(resolve))}
