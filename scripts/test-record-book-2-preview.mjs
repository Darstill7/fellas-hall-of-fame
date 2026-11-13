// Independent preview-only browser smoke/visual audit (not production certification).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const base='http://127.0.0.1:8765/analytics/record-book-2-preview.html';
const data=JSON.parse(fs.readFileSync('data/record_book_2_preview.json','utf8'));
assert.equal(data.records.length,93);assert.equal(data.managers.length,14);
fs.mkdirSync('data-integrity/record-book-2-visual',{recursive:true});
const checks=[];
for(const [engine,name,width] of [[chromium,'chromium-320',320],[chromium,'chromium-390',390],
 [webkit,'webkit-390',390],[chromium,'chromium-1280',1280]]){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',err=>errors.push(String(err)));
  await page.goto(base,{waitUntil:'networkidle'});
  await page.locator('#manager-summary .summary').waitFor();
  assert.equal(await page.locator('#manager-picker option').count(),14);
  assert.equal(await page.locator('.record-card').count(),93);
  await page.locator('#manager-picker').selectOption('Birch');
  assert((await page.locator('#manager-summary').innerText()).includes('Birch'));
  assert((await page.locator('#manager-results .portfolio-record').count())>0);
  const currentURL=new URL(page.url());
  assert.equal(currentURL.searchParams.get('manager'),'Birch');
  await page.locator('button[data-pf="research"]').click();
  assert((await page.locator('#manager-results .portfolio-record').count())>0);
  await page.locator('#record-search').fill('weekly');
  assert((await page.locator('.record-card').count())>0);
  await page.locator('#record-search').fill('');
  await page.locator('#status-picker').selectOption('research');
  const provisional=await page.locator('.record-card').count();
  assert(provisional>0&&provisional<93);
  await page.locator('#status-picker').selectOption('all');
  await page.locator('#record-search').fill('unlikely-never-exists-query');
  assert.equal(await page.locator('.record-card').count(),0);
  await page.locator('#record-search').fill('');
  assert.equal(await page.locator('.record-card').count(),93);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  // No document-level horizontal scroll: category cards must wrap at mobile widths.
  assert(overflow<=1,'Horizontal page overflow: '+name+' '+overflow);
  assert.equal(errors.length,0,errors.join('\n'));
  await page.screenshot({path:'data-integrity/record-book-2-visual/'+name+'.png',fullPage:false});
  checks.push({name,width,managerCount:14,recordCount:93,provisional,overflow,pageErrors:errors.length});
 }finally{await browser.close()}
}
fs.writeFileSync('data-integrity/record-book-2-visual/summary.json',JSON.stringify(checks,null,2));
console.log('PASS Record Book 2.0 preview smoke and independent viewport checks');
console.log(checks);
