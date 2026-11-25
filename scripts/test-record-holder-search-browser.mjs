// Short end-to-end Record Holders search test for Chromium and WebKit.
// Run after installing playwright browsers: node scripts/test-record-holder-search-browser.mjs
import {chromium,webkit} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),base='/fellas-hall-of-fame/';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
 let pathname;
 try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);res.end();return}
 if(!pathname.startsWith(base)){res.writeHead(404);res.end();return}
 let name=pathname.slice(base.length);
 if(!name||name.endsWith('/'))name+='index.html';
 const file=path.resolve(root,name);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{const bytes=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'text/plain'});res.end(bytes)}
 catch{res.writeHead(404);res.end()}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const recordsURL='http://127.0.0.1:'+server.address().port+base+'analytics/';
const url=recordsURL+'record-holders.html';
const engines=[['chromium',chromium],['webkit',webkit]];
const errors=[];
try{
 for(const [engine,launcher] of engines){
  const browser=await launcher.launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
   await page.goto(recordsURL+'records.html?app=1',{waitUntil:'domcontentloaded'});
   await page.getByRole('link',{name:'Search league records',exact:true}).click();
   await page.waitForURL('**/record-holders.html?app=1#complete-record-index');
   const linkedSearch=page.locator('#record-category-query');
   await linkedSearch.waitFor({state:'visible'});
   await page.waitForFunction(()=>document.querySelector('#record-category-results-count')?.textContent?.includes('Showing 44 of 44'));
   if(!await linkedSearch.evaluate(el=>el.getBoundingClientRect().top>=0 &&
     el.getBoundingClientRect().bottom<innerHeight))errors.push(engine+': direct link leaves search outside viewport');
   await linkedSearch.fill('closest win');
   const closest=page.locator('#expanded-record-categories .category-card').filter({hasText:'Closest regular-season victory'});
   const scope=await page.locator('#record-category-coverage').textContent();
   await closest.getByRole('link',{name:'View full ranked evidence'}).click();
   await page.waitForURL('**/expanded-records.html?*#expanded-records-explorer');
   if(await page.locator('#expanded-title').textContent()!=='Closest regular-season victory'||
      await page.locator('#expanded-category').inputValue()!=='narrowest-win'||
      await page.locator('#expanded-records-coverage').textContent()!==scope||
      !await page.locator('#expanded-rows tr').first().isVisible()||
      !await page.locator('#expanded-title').evaluate(el=>el.getBoundingClientRect().top>=0 &&
        el.getBoundingClientRect().bottom<innerHeight))
    errors.push(engine+': evidence deep link lost the selected record or coverage');

   await page.goto(recordsURL+'../managers/record-books.html?manager=Mitch#owned-records',{waitUntil:'domcontentloaded'});
   const score = page.locator('#owned-records .owned-record').filter({hasText:'Highest regular-season weekly score'});
   const scoreMark = await score.locator('strong').textContent();
   await score.getByRole('link',{name:'View evidence for Highest regular-season weekly score'}).click();
   await page.waitForURL('**/record-holders.html#established-record-weekly-score');
   const evidence = page.locator('#established-record-weekly-score');
   await evidence.locator('.established-record-evidence[open]').waitFor();
   if (await evidence.locator('.category-meta').textContent() !== scoreMark ||
       !await evidence.getByRole('link',{name:'Weekly matchup archive'}).isVisible() ||
       !(await evidence.locator('.established-record-evidence').textContent()).includes('Mitch · Week'))
    errors.push(engine+': established record evidence disagrees with the manager portfolio');

   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.locator('#complete-record-index .records-archive-disclosure>summary').click();
   const input=page.locator('#record-category-query');
   const count=page.locator('#record-category-results-count');
   await page.waitForFunction(()=>document.querySelector('#record-category-results-count')?.textContent?.includes('Showing 44 of 44'),null,{timeout:30000});
   if(await page.locator('#expanded-record-categories>.category-card').count()!==44)
    errors.push(engine+': baseline should render exactly 44 verified records');
   await input.fill('Mitch');
   await page.waitForFunction(()=>document.querySelector('#record-category-results-count')?.textContent?.includes('for “Mitch”'),null,{timeout:5000});
   const n=await page.locator('#expanded-record-categories>.category-card').count();
   if(n<1||n>=44)errors.push(engine+': manager keyword filter returned unexpected '+n);
   await input.fill('no-such-record-zzzz');
   if(!await page.locator('.record-category-empty').isVisible())
    errors.push(engine+': missing accessible no-match state');
   await page.locator('.record-category-clear').click();
   if(await input.inputValue()!==''||await page.locator('#expanded-record-categories>.category-card').count()!==44)
    errors.push(engine+': clearing search did not restore 44 records');
   await page.locator('#record-family-nav button').filter({hasText:'Single-game'}).click();
   const categoryCount=await page.locator('#expanded-record-categories>.category-card').count();
   if(!(categoryCount>0&&categoryCount<44))errors.push(engine+': family filter did not narrow 44 records');
   await input.fill('Stew');
   const filteredCount=await page.locator('#expanded-record-categories>.category-card').count();
   if(filteredCount>categoryCount)errors.push(engine+': keyword search escaped active family filter');
   // Side-by-side comparison uses the *same* 44-category owner receipts.
   const left=page.locator('#record-compare-left');
   const right=page.locator('#record-compare-right');
   await page.waitForFunction(()=>{
    const score=document.querySelector('.record-compare-scoreboard');
    return score?.querySelectorAll('.record-compare-stat').length===3;
   },null,{timeout:20000});
   await left.selectOption('Mitch');
   await right.selectOption('Stew');
   const compare=await page.evaluate(()=>{
    const stats=[...document.querySelectorAll('.record-compare-stat strong')].map(el=>Number(el.textContent));
    const sections=[...document.querySelectorAll('.record-compare-evidence>div')];
    return {stats,visible:sections.map(s=>s.querySelectorAll('a').length),
      evidence:sections.flatMap(s=>[...s.querySelectorAll('a')].map(a=>a.getAttribute('href')))};
   });
   if(compare.stats.length!==3||compare.stats.some(v=>!Number.isInteger(v)||v<0)||
      compare.visible[0]+compare.stats[1]!==compare.stats[0]||
      compare.visible[2]+compare.stats[1]!==compare.stats[2]||
      compare.visible[1]!==compare.stats[1]||
      compare.evidence.some(h=>!h?.includes('expanded-records.html?group=')))
    errors.push(engine+': comparison tally or ranked evidence link mismatch '+JSON.stringify(compare));
   await right.selectOption('Mitch');
   if(!(await page.locator('#record-compare-results').innerText()).includes('Choose two different managers'))
    errors.push(engine+': same-manager choice did not produce clear instruction');
   await right.selectOption('Stew');
   const layout=await page.evaluate(()=>({
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    inputHeight:document.querySelector('#record-category-query')?.getBoundingClientRect().height||0
   }));
   if(layout.overflow>3||layout.inputHeight<44)errors.push(engine+': mobile overflow or small input '+JSON.stringify(layout));
   await page.close();
  }finally{await browser.close()}
 }
}finally{await new Promise(resolve=>server.close(resolve))}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}
else console.log('PASS: Chromium and WebKit 390px record search entry, evidence, family composition, reset and no overflow');
