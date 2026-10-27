// Smoke check key public data bindings without requiring a browser.
// Run: node scripts/verify-core-consumers.mjs
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const assert=(test,msg)=>{if(!test)throw Error(msg)};
const careers=JSON.parse(read('data/career_core_generated.json'));
const ledger=JSON.parse(read('data/unified_record_book_2016_2026.json'));
const league=JSON.parse(read('data/league.json'));
const managers={stilly:'Stilly',stew:'Stew',tom:'Thommy',stover:'Stover',birch:'Birch',tony:'Tony',mitch:'Mitch',kuhl:'Kuhl',jmid:'JMid',scott:'Scott'};
const recordRenderer=read('assets/canonical-manager-record.js');
const h2hRenderer=read('assets/manager-h2h-explorer.js');
assert(recordRenderer.includes('data/career_core_generated.json'),'Manager headlines must read generated career core');
assert(h2hRenderer.includes('data/unified_record_book_2016_2026.json'),'Manager H2H must read canonical ledger');
assert(!h2hRenderer.includes('2026 Weeks 1–6'),'Outdated rivalry coverage claim');
assert(h2hRenderer.includes("==='Tom'?'Thommy'"),'Thommy H2H identity normalization missing');
const resumeRenderer=read('assets/manager-rivalry-resume.js');
assert(resumeRenderer.includes('data/unified_record_book_2016_2026.json'),'Manager rivalry resumes must load canonical ledger');
assert(!resumeRenderer.includes('manager_rivalry_resumes_v1.json'),'Manager rivalry resumes still load legacy snapshots');
const analyticsRenderer=read('assets/manager-rivalry-analytics.js');
assert(analyticsRenderer.includes('data/unified_record_book_2016_2026.json'),'Manager rivalry analytics must load canonical ledger');
assert(!analyticsRenderer.includes('manager_rivalry_analytics_v1.json'),'Manager rivalry analytics still load legacy snapshot');
assert(!analyticsRenderer.includes('Week 6'),'Manager rivalry analytics retains stale coverage');
const rivalryRenderer=read('assets/rivalry-archive-v3.js');
assert(rivalryRenderer.includes("data/unified_record_book_2016_2026.json"),'Rivalry cards and pair pages must load game ledger');
assert(!rivalryRenderer.includes("data/all_rivalry_matchups_v3.json"),'Rivalry renderer still uses legacy archive');
assert(!rivalryRenderer.includes('2026 Weeks 1–6'),'Rivalry renderer uses outdated Week 6 coverage');
for(const path of ['rivalries/stilly-vs-tony.html','rivalries/stilly-vs-tony/index.html','analytics/rivalries.html']){
 assert(read(path).includes('rivalry-archive-v3.js'),'Shared rivalry renderer missing from '+path);
}
// The public rivalry grid links to each unique current-manager pair.
const rivalrySlugs=['stilly','jmid','tom','stew','scott','mitch','tony','stover','kuhl','birch'];
let rivalryRoutes=0;
for(let i=0;i<rivalrySlugs.length;i++)for(let j=i+1;j<rivalrySlugs.length;j++){
 const a=rivalrySlugs[i],b=rivalrySlugs[j];
 const page='rivalries/'+a+'-vs-'+b+'.html';
 assert(fs.existsSync(page),'Missing public rivalry destination: '+page);
 rivalryRoutes++;
}
assert(rivalryRoutes===45,'Expected 45 unique manager rivalries');
const recordsPage=read('analytics/records.html');
const warRoom=read('analytics/rivalry-war-room.html');
assert(recordsPage.includes("fetch('../data/career_core_generated.json')"),'Primary career board must use generated records');
assert(warRoom.includes("fetch('../data/unified_record_book_2016_2026.json')"),'Rivalry war room must use canonical game ledger');
assert(!warRoom.includes("fetch('../data/all_rivalry_matchups_v3.json')"),'Rivalry war room still fetches legacy archive');

for(const [slug,id] of Object.entries(managers)){
 assert(!!careers.managers[id],'Missing generated manager '+id);
 const derived=careers.managers[id];
 const legacyName=id==='Thommy'?'Tom':id;
 const displayed=derived.w+'–'+derived.l+(derived.t?'–'+derived.t:'');
 assert(league.managers[legacyName]?.record===displayed,'Shared league manager record diverges from generated career core: '+id);
 for(const path of ['managers/'+slug+'/index.html','managers/'+slug+'.html']){
  const html=read(path);
  assert(html.includes('data-canonical-manager-record="'+id+'"'),'Missing canonical career binding: '+path);
  assert(html.includes('canonical-manager-record.js'),'Missing career renderer: '+path);
  if(path.endsWith('/index.html')){
   assert(html.includes('id="full-franchise-dossier"'),'Canonical profile lacks detailed archive access: '+path);
   assert(html.includes('href="../'+slug+'.html"'),'Wrong full-dossier link: '+path);
   assert(html.includes('id="verified-history-panel"'),'Canonical profile missing historical modules: '+path);
   assert(html.includes('id="franchise-story"'),'Canonical profile missing franchise biography: '+path);
   assert(html.includes('id="front-office-archive"'),'Canonical profile missing draft and trade archive: '+path);
   for(const module of ['manager-historical-records.js','manager-verified-season-endings.js','manager-trophy-cases.js','espn-franchise-lineage.js']){
    assert(html.includes(module),'Historical profile script missing '+module+': '+path);
   }
  }
 }
}
const count=ledger.games.filter(g=>g.stage==='regular').length;
assert(careers.regularSeasonGames===count,'Generated regular season game count differs');
for(const [id,m] of Object.entries(careers.managers)){
 assert(m.w+m.l+m.t===m.games,'Invalid manager record: '+id);
 for(const [opponent,h] of Object.entries(m.h2h)){
  const reverse=careers.managers[opponent]?.h2h?.[id];
  assert(!!reverse&&h.w===reverse.l&&h.l===reverse.w&&h.t===reverse.t&&h.games===reverse.games,'Asymmetric H2H: '+id+' / '+opponent);
 }
}
for(const path of ['assets/manager-historical-records.js','assets/manager-verified-season-endings.js','assets/manager-trophy-cases.js','assets/espn-franchise-lineage.js']){
 const script=read(path);
 assert(script.includes("location.pathname.endsWith('/index.html')"),'Historical module missing profile depth support: '+path);
}
console.log('Public core consumers verified for '+Object.keys(managers).length+' active managers and '+count+' regular-season games');
