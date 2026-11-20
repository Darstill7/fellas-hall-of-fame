// Focused, source-preserving Trade Museum browser journey tests.
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, webkit } from 'playwright';

const root=process.cwd();
const prefix='/fellas-hall-of-fame/';
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(!url.pathname.startsWith(prefix)){res.writeHead(404).end();return}
  const relative=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html';
  const file=path.resolve(root,relative);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  const bytes=await fs.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(bytes);
 }catch{res.writeHead(404).end()}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+prefix+'analytics/trade-museum.html';
const testCases=[{engine:'Chromium',browserType:chromium,width:320},{engine:'Chromium',browserType:chromium,width:390},{engine:'Chromium',browserType:chromium,width:430},{engine:'WebKit',browserType:webkit,width:390}];
try{
 for(const testCase of testCases){
  const browser=await testCase.browserType.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:testCase.width,height:840}});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto(base,{waitUntil:'load'});
   await page.locator('#results button[data-id]').first().waitFor();
   assert.equal(await page.locator('.tm-entry a').count(),3,'Three distinct entry routes');
   assert.ok(await page.locator('#tm-gallery-items .tm-gallery-item').count()>0,'Source-backed gallery should show documented three-manager exchange');
   assert.equal(await page.locator('#results button[data-id]').count(),12,'Initial archive results should paginate at 12');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
   assert.equal(overflow,false,testCase.engine+' '+testCase.width+'px horizontal overflow');
   await page.locator('#format').selectOption('multi');
   assert.equal(await page.locator('#results button[data-id]').count(),1,'Multi-team format filter must work');
   await page.locator('#clearFilters').click();
   assert.equal(await page.locator('#format').inputValue(),'all','Clear filters restores full archive');
   await page.locator('#results button[data-id]').first().click();
   assert.ok(await page.locator('#detail').evaluate(element=>element.open),'Trade details open');
   const shareUrl=await page.locator('#tradeShareUrl').inputValue();
   assert.ok(shareUrl.includes('?trade='),'Receipt sharing must use stable trade ID');
   await page.locator('#close').click();
   await page.goto(base+'?manager=thommy',{waitUntil:'load'});
   await page.locator('#results button[data-id]').first().waitFor();
   assert.equal((await page.locator('#manager').inputValue()).toLowerCase(),'tom','Thommy deep link maps to Tom');
   await page.goto(base+'?trade=1294402688213057536',{waitUntil:'load'});
   assert.ok(await page.locator('#detail').evaluate(element=>element.open),'Historical three-team deep link opens exact receipt');
   const portfolioUrl=base.replace('trade-museum.html','trade-portfolios.html');
   await page.goto(portfolioUrl+'?manager=stilly',{waitUntil:'load'});
   await page.locator('#portfolio:not([hidden])').waitFor();
   assert.equal(await page.locator('#manager').inputValue(),'Stilly','Portfolio deep link must select Stilly');
   assert.ok(Number(await page.locator('#total').innerText())>0,'Portfolio reads archived source receipts');
   assert.ok(await page.locator('#timeline .receipt').count()>0,'Portfolio displays transaction chronology');
   assert.ok((await page.locator('#timeline .receipt a[href*="trade-museum.html?trade="]').count())>0,'Portfolio receipt deep links resolve to museum');
   const portfolioOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
   assert.equal(portfolioOverflow,false,testCase.engine+' '+testCase.width+'px portfolio horizontal overflow');
   await page.locator('#impactStatus').waitFor();
   assert.ok((await page.locator('#impactStatus').innerText()).includes('verified playoff game/trade matches'),'Stilly championship impact must be evidenced');
   assert.ok(await page.locator('#impactGrid .impact-case').count()>0,'Verified championship-run impact panels visible');
   assert.ok(await page.locator('#keeperStory').isVisible(),'Verified keeper-era story should show for Stilly');
   await page.locator('#tradePartner').selectOption('Tom');
   assert.ok(Number(await page.locator('#sharedTrades').innerText())>0,'Stilly and Tom have documented shared receipts');
   assert.ok((await page.locator('#rivalryLedger .receipt').count())>0,'Shared exchange receipts are visible');
   assert.ok((await page.locator('#rivalryLedger .receipt a[href*="trade-museum.html?trade="]').count())>0,'Rivalry receipts link to sources');
   assert.equal(new URL(page.url()).searchParams.get('partner'),'Tom','Partner selection is linkable');
   await page.goto(portfolioUrl+'?manager=stilly&partner=Tom',{waitUntil:'load'});
   await page.locator('#portfolio:not([hidden])').waitFor();
   assert.equal(await page.locator('#tradePartner').inputValue(),'Tom','Shared-pair deep links restore selection');
   assert.ok(await page.locator('#rivalryStats').isVisible(),'Shared pair summary is visible');
   await page.goto(portfolioUrl+'?manager=thommy',{waitUntil:'load'});
   await page.locator('#portfolio:not([hidden])').waitFor();
   assert.equal((await page.locator('#manager').inputValue()).toLowerCase(),'tom','Historical Thommy alias must map to Tom portfolio');
   assert.ok(await page.locator('#impactGrid .impact-case').count()>0,'Tom/Thommy championship research mapped correctly');
   assert.equal(await page.locator('#keeperStory').isVisible(),false,'Keeper story should not be credited to Thommy');
   await page.goto(portfolioUrl+'?manager=kuhl',{waitUntil:'load'});
   await page.locator('#portfolio:not([hidden])').waitFor();
   assert.equal(await page.locator('#impactGrid .impact-case').count(),0,'Unproven impact must not be invented');
   assert.ok((await page.locator('#impactStatus').innerText()).includes('No qualifying acquired-player'),'Missing data should have a scope explanation');

   const plusUrl=base.replace('trade-museum.html','trade-plus-minus.html');
   await page.goto(plusUrl,{waitUntil:'load'});
   await page.locator('#scoreboard:not([hidden])').waitFor();
   assert.equal(await page.locator('#qualified').innerText(),'18','Only 18 verified complete two-manager trades qualify');
   assert.ok(await page.locator('#pairRows tr').count()>0,'Manager-pair PAR rows must render');
   assert.ok(await page.locator('#managerRows tr').count()>0,'Manager +/- totals must render');
   assert.ok(await page.locator('#tradeRows .deal').count()>0,'Underlying source receipts must render');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Trade +/- page must not overflow viewport');
   await page.locator('#managerFilter').selectOption('Stilly');
   const subsetRows=await page.locator('#pairRows tr').count();
   assert.ok(subsetRows>0,'Stilly counterpart filter should show measured trades');
   assert.equal(new URL(page.url()).searchParams.get('manager'),'Stilly','Trade +/- manager selection must be deep-linkable');
   await page.goto(plusUrl+'?manager=Tom&season=2024',{waitUntil:'load'});
   await page.locator('#scoreboard:not([hidden])').waitFor();
   assert.equal(await page.locator('#managerFilter').inputValue(),'Tom','Comparison manager deep link must restore');
   assert.equal(await page.locator('#seasonFilter').inputValue(),'2024','Comparison season deep link must restore');
   assert.equal(errors.length,0,'Unexpected page JS errors: '+errors.join('; '));
   await page.close();
   console.log(testCase.engine+' '+testCase.width+'px: museum journey passed');
  }finally{await browser.close()}
 }
}finally{await new Promise(resolve=>server.close(resolve))}
