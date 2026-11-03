// Execute the real Start/Sit client script with a minimal DOM/fetch harness.
// Unlike static text assertions, this tests actual loading, sorting, URLs,
// selected-manager detail and season progression against archived records.
// Run: node scripts/test-start-sit-page-runtime.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const code=fs.readFileSync('assets/manager-lineup-research-page.mjs','utf8');
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
  assert.ok(!normalized.includes('week9.json'),'Premature Week 9 fetch');
  if(!fs.existsSync(normalized))return {ok:false,status:404};
  const data=JSON.parse(fs.readFileSync(normalized,'utf8'));
  return {ok:true,status:200,json:async()=>data};
 }
 const requested=new URL('https://fellas.invalid/analytics/manager-lineup-research.html'+query);
 const context={document,fetch:fetchMock,location:{search:requested.search},
   URLSearchParams,Date,Number,Map,Set,Array,String,Math,console:{error(e){throw e;}}};
 vm.runInNewContext(code,context,{filename:'manager-lineup-research-page.mjs',timeout:2000});
 // The script calls load() asynchronously. Poll only microtasks / completed
 // filesystem-backed fetch promises, never wait for timers.
 for(let i=0;i<30;i++)await Promise.resolve();
 const status=nodes.get('status').textContent;
 assert.ok(status&&!status.includes('Source or model error'),status);
 return {nodes,calls,status};
}
{
 const {nodes,calls,status}=await runQuery('?season=2026&manager=Stilly');
 assert.equal(nodes.get('season').value,'2026');
 assert.equal(nodes.get('current-coverage').textContent,'through completed Week 8');
 assert.equal(nodes.get('detail-manager').value,'2026|Stilly');
 assert.ok(nodes.get('detail-summary').textContent.includes('Stilly'));
 assert.ok(nodes.get('detail-summary').textContent.includes('92.4%'));
 assert.equal((nodes.get('weekly-results').innerHTML.match(/<tr class=/g)??[]).length,8);
 const summary=nodes.get('results').innerHTML;
 assert.equal((summary.match(/<tr>/g)??[]).length,10);
 assert.ok(summary.indexOf('Stilly')<summary.indexOf('Kuhl'),'Leaderboard sorting reversed');
 assert.ok(summary.includes('92.4%')&&summary.includes('83.1%'));
 assert.ok(calls.filter(x=>x.includes('sleeper_roster_snapshots_2026_week')).length===8);
 assert.ok(status.includes('80 archived team-weeks'),status);
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
 assert.ok(nodes.get('detail-summary').textContent.includes('83.1%'));
}
console.log('Start/Sit runtime integration PASS: 2026 leaderboard, 8-week scoring lock, career view, manager deep links');
