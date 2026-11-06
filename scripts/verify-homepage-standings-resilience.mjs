// Production homepage acceptance: standings must load even when rating inputs fail.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync('assets/home-manager-cards.mjs','utf8')
 .replace(/^import .*?;\s*$/gm,'')
 .replace('void renderSeasonSnapshot();','await renderSeasonSnapshot();');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const launch=new AsyncFunction('document','fetch','managerPersonas','maddenOvr','makeRatings','managerCardTier','earnedArchetypes',source);
const guide={'2026':{standings:Array.from({length:10},(_,i)=>({name:'Team '+i,w:8-i,l:i,t:0,games:8,pf:900-i*10}))}};
for(const guideWorks of [true,false]){
 const snapshot={innerHTML:'Loading…'};
 const status={textContent:'Loading…'};
 const document={getElementById:id=>id==='home-season-snapshot'?snapshot:id==='home-manager-status'?status:null};
 const fetch=async url=>{
  if(url==='data/season_guide.json'&&guideWorks)return {ok:true,json:async()=>guide};
  throw Error('Simulated missing rating input or season guide');
 };
 await launch(document,fetch,{},x=>x,()=>[],()=>({}),()=>[]);
 if(guideWorks){
  assert.ok(snapshot.innerHTML.includes('Canonical results through Week 8'),
    'Current standings disappeared when unrelated rating data failed');
  assert.ok(snapshot.innerHTML.includes('Team 0'));
 }else{
  assert.ok(snapshot.innerHTML.includes('standings are temporarily unavailable'),
    'Season guide failures need an actionable, non-loading message');
 }
 assert.ok(status.textContent.includes('Manager ratings are temporarily unavailable'),
   'Rating failure must be explained independently');
 assert.ok(!snapshot.innerHTML.includes('Loading'));
}
console.log('Homepage resilience PASS: standings and manager ratings fail independently with visible fallback.');
