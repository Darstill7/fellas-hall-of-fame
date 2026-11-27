import {chromium,webkit} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {buildRecordWatchFeed} from '../assets/certified-record-watch-feed.mjs';
const root=process.cwd(),prefix='/fellas-hall-of-fame/',out='data-integrity/certified-watch-browser';
await fs.mkdir(out,{recursive:true});
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer(async(req,res)=>{try{let rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(!rel.startsWith(prefix))throw Error('outside');rel=rel.slice(prefix.length);if(!rel||rel.endsWith('/'))rel+='index.html';const f=path.resolve(root,rel);if(!f.startsWith(root+path.sep))throw Error('outside');res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(await fs.readFile(f));}catch{if(!res.headersSent)res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+prefix;
const ledger=JSON.parse(await fs.readFile('data/unified_record_book_2016_2026.json','utf8'));
const year=2026,week=Math.max(...ledger.games.filter(g=>g.year===year&&g.stage==='regular').map(g=>g.week));
const fixture=(id,type,eventId,extra={})=>({year,week,id,type,eventId,status:'certified',manager:'Stilly',value:12,scope:'Synthetic browser fixture — not a league result',...extra});
const feed=buildRecordWatchFeed({year,week,items:[fixture('weekly-highest-score','broken','high',{value:190}),fixture('career-regular-winning-streak','tied','tie'),fixture('single-season-regular-losing-streak','approaching','near',{manager:'Birch'}),fixture('rivalry-meetings-milestone','milestone-achieved','shared',{manager:null,participants:['Stilly','Birch'],value:10}),fixture('championship-title','milestone-achieved','title')]});
const empty={...feed,status:'no-certified-items',items:[]},stale={...feed,throughWeek:week-1};
const report=[],failures=[];
try{
 for(const [engine,runner] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await runner.launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,390,430,1280]){
    const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    const page=await ctx.newPage();let current=feed,requests=0;
    await page.route('**/data/certified-record-watch-feed-v1.json*',route=>{requests++;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(current)});});
    for(const [surface,url,selector,count] of [['home','index.html','#conditional-record-watch',3],['recordBook','analytics/records.html','#certified-record-watch',5],['playoff','analytics/playoff-race.html','#certified-record-watch',1],['manager','managers/stilly/','#gm452-achievements section',4]]){
     for(const [mode,data] of [['populated',feed],['empty',empty],['stale',stale]]){
      const meta={engine,width,surface,mode};try{
       current=data;const before=requests;
       await page.goto(base+url,{waitUntil:'domcontentloaded'});
       if(surface==='manager'){const summary=page.locator('#gm47-achievements > summary');await summary.waitFor({timeout:25000});await summary.click();}
       const host=page.locator(selector);await host.waitFor({state:'attached',timeout:25000});
       await page.waitForFunction(()=>document.readyState==='complete');
       await page.waitForLoadState('networkidle');
       assert(requests>before,'Consumer did not request the certified feed');
       if(mode==='populated'){
        await host.locator('.record-watch-row').first().waitFor({timeout:15000});
        assert.equal(await host.locator('.record-watch-row').count(),count);
        assert(await host.isVisible());
        const text=await host.innerText();
        if(surface==='manager')assert(!text.includes('Birch · single season'));
        if(surface==='home')assert(!text.includes('rivalry meetings milestone'));
        if(surface==='playoff')assert(text.includes('championship title'));
        assert(await host.evaluate(e=>e.scrollWidth<=e.clientWidth+2),'Record Watch container overflow');
        if(width===390||width===1280)await host.screenshot({path:out+'/'+engine+'-'+width+'-'+surface+'.png'});
       }else{
        assert(await host.isHidden(),'Empty or stale feed must stay hidden');
        assert.equal(await host.locator('.record-watch-row').count(),0);
       }
       report.push(meta);
      }catch(e){failures.push({...meta,error:String(e)});}
     }
    }
    await ctx.close();
   }
  }finally{await browser.close();}
 }
}finally{server.close();await fs.writeFile(out+'/report.json',JSON.stringify({report,failures},null,2));}
assert.equal(failures.length,0,JSON.stringify(failures));
assert.equal(report.length,96);
console.log('PASS: 96 Record Watch browser scenarios; four surfaces, three feed states, four widths, two engines');
