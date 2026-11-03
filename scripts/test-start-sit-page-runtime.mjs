// Execute the real Start/Sit client script with a minimal DOM/fetch harness.
// Unlike static text assertions, this tests actual loading, sorting, URLs,
// selected-manager detail and season progression against archived records.
// Run: node scripts/test-start-sit-page-runtime.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const code=fs.readFileSync('assets/manager-lineup-research-page.mjs','utf8');
const completedWeek=JSON.parse(fs.readFileSync('data/keeper_2026_website_research_v1.json','utf8')).throughWeek;
assert.ok(Number.isInteger(completedWeek)&&completedWeek>=8&&completedWeek<=14);

function element(){
 const x={value:'',textContent:'',innerHTML:'',onchange:null,options:[],
  append(node){this.options.push(node);},
  replaceChildren(){this.options=[];},
  addEventListener(name,fn){this['on'+name]=fn;},
  querySelector(selector){return selector==='option[value="2026"]'?this.options.find(o=>o.value==='2026'):null;}
 };
 return x;
}
async function runQuery(query){
 const nodes=new Map();
 for(const id of ['season','status','results','current-coverage','detail-manager','detail-summary','weekly-results','career-results','career-summary'])
  nodes.set(id,element());
 const season=nodes.get('season');
 season.value='2026';
 season.options=[
  Object.assign(element(),{value:'career',textContent:'Career progression (2020–2026)'}),
  Object.assign(element(),{value:'all',textContent:'All completed seasons'}),
  Object.assign(element(),{value:'2026',textContent:'2026 (Weeks 1–8)'}),
  ...[2025,2024,2023,2022,2021,2020].map(y=>Object.assign(element(),{value:String(y),textContent:String(y)}))
 ];
 const document={getElementById:id=>{assert.ok(nodes.has(id),'Unknown DOM element: '+id);return nodes.get(id);},
 createElement:tag=>{assert.equal(tag,'option');return element();}};
 const calls=[];
 async function fetchMock(url){
  calls.push(url);
  const normalized=url.startsWith('../')?url.slice(3):url;
  if(completedWeek===8)assert.ok(!normalized.includes('sleeper_roster_snapshots_2026_week9.json'),
   'Premature 2026 Week 9 scoring fetch');
  if(!fs.existsSync(normalized))return {ok:false,status:404};
  const data=JSON.parse(fs.readFileSync(normalized,'utf8'));
  return {ok:true,status:200,json:async()=>data};
 }
 const requested=new URL('https://fellas.invalid/analytics/manager-lineup-research.html'+query);
 const context={document,fetch:fetchMock,location:{search:requested.search},
   URLSearchParams,Date,Number,Map,Set,Array,String,Math,console:{error(e){throw e;}}};
 // Capture the actual async page-load promise rather than relying on
 // a fixed count of event-loop turns (which can make CI flaky).
 const startup="$('season').addEventListener('change',load);load();";
 assert.ok(code.includes(startup),'Start/Sit page startup hook changed');
 const testableCode=code.replace(startup,
  "$('season').addEventListener('change',load);globalThis.__runtimeDone=load();");
 vm.runInNewContext(testableCode,context,{filename:'manager-lineup-research-page.mjs',timeout:2000});
 assert.ok(context.__runtimeDone&&typeof context.__runtimeDone.then==='function',
  'Start/Sit page did not expose an asynchronous load');
 await context.__runtimeDone;
 const status=nodes.get('status').textContent;
 assert.ok(status&&!status.includes('Source or model error'),status);
 return {nodes,calls,status};
}
{
 const {nodes,calls,status}=await runQuery('?season=2026&manager=Stilly');
 assert.equal(nodes.get('season').value,'2026');
 assert.equal(nodes.get('current-coverage').textContent,'through completed Week '+completedWeek);
 assert.equal(nodes.get('detail-manager').value,'2026|Stilly');
 assert.ok(nodes.get('detail-summary').textContent.includes('Stilly'));
 if(completedWeek===8)assert.ok(nodes.get('detail-summary').textContent.includes('92.4%'));
 else assert.ok(nodes.get('detail-summary').textContent.includes('%'));
 assert.equal((nodes.get('weekly-results').innerHTML.match(/<tr class=/g)??[]).length,completedWeek);
 const summary=nodes.get('results').innerHTML;
 assert.equal((summary.match(/<tr>/g)??[]).length,10);
 assert.ok(summary.indexOf('Stilly')<summary.indexOf('Kuhl'),'Leaderboard sorting reversed');
 if(completedWeek===8)assert.ok(summary.includes('92.4%')&&summary.includes('83.1%'));
 else assert.ok(summary.includes('Stilly')&&summary.includes('Kuhl'));
 assert.equal(calls.filter(x=>x.includes('sleeper_roster_snapshots_2026_week')).length,completedWeek);
 assert.ok(status.includes((completedWeek*10)+' archived team-weeks'),status);
 nodes.get('detail-manager').value='2026|Kuhl';
 nodes.get('detail-manager').onchange();
 assert.ok(nodes.get('detail-summary').textContent.includes('Kuhl'));
 if(completedWeek===8)assert.ok(nodes.get('detail-summary').textContent.includes('83.1%'));
 else assert.ok(nodes.get('detail-summary').textContent.includes('%'));
 assert.ok(nodes.get('career-summary').textContent.includes('Kuhl'),
  'Manager selection did not refresh career progression');

}
{
 const {nodes,status}=await runQuery('?season=career&manager=Stilly');
 assert.equal(nodes.get('season').value,'career');
 assert.equal(nodes.get('detail-manager').value,'Stilly');
 assert.ok(nodes.get('career-summary').textContent.includes('recency-weighted observed efficiency'));
 assert.ok(nodes.get('career-results').innerHTML.includes('2026 (ongoing)'));
 assert.ok(nodes.get('career-results').innerHTML.includes('2020'));
 assert.ok(status.includes('2020–2026'),status);
}
{
 const {nodes}=await runQuery('?season=2026&manager=Kuhl');
 assert.equal(nodes.get('detail-manager').value,'2026|Kuhl');
 if(completedWeek===8)assert.ok(nodes.get('detail-summary').textContent.includes('83.1%'));
 else assert.ok(nodes.get('detail-summary').textContent.includes('%'));
}
// Historical vacancies are actual missing starter slots, not 0-point players.
// Preserve those team-weeks as explicitly excluded and leave other weeks usable.
for(const [year,manager,week] of [[2022,'Thommy',3],[2022,'Evans',13],[2023,'Thommy',9],
 [2024,'Tony',3],[2024,'Stover',11]]){
 const {nodes,status}=await runQuery('?season='+year+'&manager='+manager);
 const rows=nodes.get('weekly-results').innerHTML;
 assert.ok(rows.includes('Week '+week+'</th>')&&rows.includes('Vacant starting slot'),
  'Missing historical empty starter exclusion: '+year+'/'+week+'/'+manager);
 assert.ok(status.includes('Vacant starting slot'),
  'Missing source-exclusion accounting '+year+'/'+week);
}
console.log('Start/Sit runtime integration PASS: 2026 leaderboard, 8-week scoring lock, career view, manager deep links');
