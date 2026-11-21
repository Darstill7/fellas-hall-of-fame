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
   assert.equal(await page.locator('#qualified').innerText(),'13','Only 13 full matched trades avoid 2020–21 Week 14 playoff contamination');
   assert.equal(await page.locator('#benchSourceRows tr').count(),6,'Six season-specific bench-source readiness rows must render');
   assert.equal(await page.locator('#benchMissingRows tr').count(),8,'Display all eight sourced no-bench-option starter weeks');
   assert.equal(await page.locator('#benchCompetitionRows tr').count(),8,'Eight distinct manager-weeks have competition for nonreusable bench assets');
   assert.ok((await page.locator('#benchSimultaneousSummary').innerText()).includes('238 could be covered'),'Maximum simultaneous bench coverage must exclude double-counting');
   assert.ok((await page.locator('#benchSimultaneousSummary').innerText()).includes('74 with multiple acquired-player starts'),'Group analysis must show multi-acquisition manager-weeks');
   assert.ok(await page.locator('#benchCompetitionRows a[href*="trade-museum.html?trade="]').count()>=8,'Every contested bench week needs historical receipt links');

   assert.equal(await page.locator('#benchMissingRows a[href*="trade-museum.html?trade="]').count(),8,'Each missing bench observation must link to the archived original trade');
   assert.ok((await page.locator('#benchMissingRows').innerText()).includes('Jonathan Taylor'),'Critical 2022 RB bench substitution gaps must remain visible');

   assert.ok((await page.locator('#benchSourceSummary').innerText()).includes('246 of 254'),'Observed eligible bench coverage must be sourced rather than inferred');
   assert.ok((await page.locator('#benchSourceSummary').innerText()).includes('54 starts occupied a FLEX'),'Historical slot-specific FLEX audit must appear');

   assert.equal(await page.locator('#rawPointsRows tr').count(),8,'Eight managers have originally fully matched raw-point trades including five postseason-corrected transactions');
   assert.equal(await page.locator('#rawMatrixRows tr').count(),8,'Raw directional pair matrix must include all eight source-matched managers');
   assert.equal(await page.locator('#rawMatrixHeader th').count(),9,'Raw matrix must label every manager column');
   assert.ok(await page.locator('#rawMatrixRows a[href*="trade-portfolios.html?manager="]').count()>0,'Head-to-head raw scores must link to documented rivalry receipts');
   assert.ok(await page.evaluate(()=>{
     const labels=[...document.querySelectorAll('#rawMatrixHeader th')].slice(1);
     const rows=[...document.querySelectorAll('#rawMatrixRows tr')];
     if(labels.length!==rows.length)return false;
     return labels.every((_,i)=>labels.every((_,j)=>{
       const a=rows[i]?.querySelectorAll('td')[j]?.textContent.trim();
       const b=rows[j]?.querySelectorAll('td')[i]?.textContent.trim();
       if(i===j)return a==='·'&&b==='·';
       if(a==='—'||b==='—')return a===b;
       return Number.isFinite(Number(a))&&Number.isFinite(Number(b))&&Math.abs(Number(a)+Number(b))<.011;
     }));
   }),'Raw pair matrix must be directionally zero-sum on every measured manager pair');

   assert.ok((await page.locator('#rawPointsRows').innerText()).includes('+306.60'),'Historical Kuhl source-rebuilt 18-trade raw differential must reconcile');
   assert.ok((await page.locator('#rawPointsStatus').innerText()).includes('18 two-manager trades'),'Default raw points may recover five playoff-affected transactions after removing Week14 starts');

   assert.equal(await page.locator('#scopeRows .recovery-card').count(),5,'Five legacy qualified trades need re-scoring for 2020–21 playoff starts');
   assert.ok((await page.locator('#scopeSummary').innerText()).includes('5 inherited'),'Postseason contamination warning must be visible');
   assert.equal(await page.locator('#includeRecovery').isChecked(),false,'Research preview must be opt-in');
   await page.locator('#includeRecovery').check();
   assert.equal(await page.locator('#rawPointsRows tr').count(),8,'All eight managers appear when provisional research receipts are enabled');
   assert.ok((await page.locator('#rawPointsRows').innerText()).includes('+336.90'),'Kuhl raw points update from six candidate receipts');
   assert.ok((await page.locator('#rawPointsStatus').innerText()).includes('24 two-manager trades'),'Expanded raw production ledger uses 18 original and six provisional receipts');

   assert.ok((await page.locator('#previewState').innerText()).includes('19 trades'),'Opt-in clean-period preview should show 19 trades');
   assert.ok((await page.locator('#coverageRows tr').last().innerText()).includes('19'),'Coverage should show 19 in preview');
   await page.locator('#seasonFilter').selectOption('2025');
   assert.ok((await page.locator('#tradeRows .deal .preview-label').count())>=1,'Expanded sample marks research-only trade cards');
   await page.locator('#includeRecovery').uncheck();
   await page.locator('#seasonFilter').selectOption('all');
   assert.ok((await page.locator('#rawPointsRows').innerText()).includes('+306.60'),'Switching preview off restores the full 18 source-backed raw accounting trades');

   assert.ok((await page.locator('#coverageRows tr').last().innerText()).includes('13'),'Unchecking reverts 13 postseason-clean measured trades');

   assert.equal(await page.locator('#recoveryRows .recovery-card').count(),23,'Every incomplete two-manager receipt must appear in audit queue');
   await page.locator('#recoveryFilter').selectOption('one');
   assert.equal(await page.locator('#recoveryRows .recovery-card').count(),18,'One-side audit bucket must contain 18 receipts');
   await page.locator('#recoveryFilter').selectOption('none');
   assert.equal(await page.locator('#recoveryRows .recovery-card').count(),5,'Neither-side audit bucket must contain 5 receipts');
   await page.locator('#recoveryFilter').selectOption('all');   await page.locator('#recoveryFilter').selectOption('single');
   assert.equal(await page.locator('#recoveryRows .recovery-card').count(),14,'Single-asset research priority bucket should list 14 cases');
   await page.locator('#recoveryFilter').selectOption('all');
   assert.ok((await page.locator('#recoveryRows .recovery-card a[href*="trade-museum.html?trade="]').count())===23,'Each incomplete trade must link to original museum receipt');

   await page.locator('#coverageRows tr').first().waitFor();
   assert.equal(await page.locator('#coverageRows tr').count(),7,'Coverage should show six completed seasons plus total');
   assert.ok((await page.locator('#coverageRows tr').last().innerText()).includes('44'),'Qualified sample must be compared with all 2020–2025 archived receipts');

   assert.ok(await page.locator('#pairRows tr').count()>0,'Manager-pair PAR rows must render');
   assert.ok(await page.locator('#managerRows tr').count()>0,'Manager +/- totals must render');
   assert.ok(await page.locator('#tradeRows .deal').count()>0,'Underlying source receipts must render');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Trade +/- page must not overflow viewport');
   await page.locator('#managerFilter').selectOption('Stilly');
   const subsetRows=await page.locator('#pairRows tr').count();
   assert.ok(subsetRows>0,'Stilly counterpart filter should show measured trades');
   assert.equal(new URL(page.url()).searchParams.get('manager'),'Stilly','Trade +/- manager selection must be deep-linkable');
   assert.ok(await page.locator('#matrixBody tr').count()>0,'Head-to-head matrix should have manager rows');
   const clickable=page.locator('#matrixBody a[href*="partner="]').first();
   const pairHref=await clickable.getAttribute('href');
   await clickable.click();
   const direct=new URL(page.url());
   assert.ok(direct.searchParams.get('manager')&&direct.searchParams.get('partner'),'Matrix cells must link to specific trading pairs');
   await page.locator('#scoreboard:not([hidden])').waitFor();
   await page.locator('#pairRows tr').first().waitFor();
   assert.ok((await page.locator('#pairRows').innerText()).includes(' / '),'Clicked pair should show measured comparison coverage');
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
