// Targeted independent browser release gate for the Trade Museum score refresh.
// Fails closed on missing 2026 cutoffs, inaccurate receipt text, or browser errors.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),prefix='/fellas-hall-of-fame/';
const museum=JSON.parse(readFileSync('data/trade_museum_stage66.json','utf8'));
const audit=JSON.parse(readFileSync('data-integrity/trade-point-recalculations/2026-through-week10.json','utf8'));
assert.equal(audit.scoring_through_week,10);
const current=museum.filter(t=>t.year===2026);
assert.equal(current.length,7);
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(!pathname.startsWith(prefix)){res.writeHead(404);res.end();return}
  const relative=decodeURIComponent(pathname.slice(prefix.length));
  const target=resolve(root,relative.endsWith('/')?relative+'index.html':relative);
  if(!target.startsWith(root+sep)){res.writeHead(403);res.end();return}
  const bytes=await readFile(target);
  res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream'});res.end(bytes);
 }catch{res.writeHead(404);res.end()}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port+prefix;
try{
 for(const [label,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(label==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [390,1280]){
    const context=await browser.newContext({viewport:{width,height:844},isMobile:width===390,hasTouch:width===390,reducedMotion:'reduce'});
    try{
     const page=await context.newPage();
     const errors=[];
     page.on('pageerror',e=>errors.push(e.message));
     const response=await page.goto(origin+'analytics/trade-museum.html',{waitUntil:'domcontentloaded',timeout:30000});
     assert.equal(response.status(),200);
     await page.locator('#results .tm-card').first().waitFor({timeout:15000});
     const cutoff=await page.locator('#tm-audit-cutoff').innerText();
     assert.match(cutoff,/Week 5/,'Transaction archive cutoff must remain distinguishable');
     assert.match(cutoff,/completed Week 10/,'Audited scoring cutoff must be visible');
     assert.equal(await page.locator('#results .tm-card').count(),12,'Default result page size');
     await page.locator('#year').selectOption('2026');
     await page.locator('#results .tm-card').first().waitFor({timeout:10000});
     assert.equal(await page.locator('#results .tm-card').count(),7,'Only seven approved 2026 trades may be rendered');
     const list=await page.locator('#results').innerText();
     assert.match(list,/starter pts verified through W10/);
     for(const trade of current){
      await page.locator('#q').fill(String(trade.id));
      assert.equal(await page.locator('#results .tm-card').count(),1,'Unique trade search '+trade.id);
      const text=await page.locator('#results .tm-card').first().innerText();
      for(const side of trade.sides){
       assert(text.includes(side.manager),'Receiving manager missing '+trade.id+'/'+side.manager);
       assert(text.includes(Number(side.raw_starter_points).toFixed(1)+' starter pts verified through W10'),
        'Updated starter points not shown '+trade.id+'/'+side.manager);
      }
      await page.locator('#results .tm-card').first().click();
      const dialog=page.locator('#detail');
      assert.equal(await dialog.evaluate(el=>el.open),true);
      const detail=await dialog.innerText();
      assert.match(detail,/Week 10|W10/,'Trade detail must show score cutoff');
      for(const side of trade.sides)
       assert(detail.includes(Number(side.raw_starter_points).toFixed(2)),'Full-precision side score missing '+trade.id+'/'+side.manager);
      await page.locator('#close').click();
     }
     await page.locator('#q').fill('');
     const limits=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
     assert(limits.scroll<=limits.client+5,label+' '+width+'px horizontal overflow '+JSON.stringify(limits));
     assert.deepEqual(errors,[],'JS failures: '+errors.join('; '));
     console.log(label+' '+width+'px Trade Museum PASS: seven current receipts and explicit Week 10 score cutoff');
    }finally{await context.close()}
   }
  }finally{await browser.close()}
 }
}finally{await new Promise(done=>server.close(done))}
