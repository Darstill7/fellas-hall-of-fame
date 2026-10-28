// Smoke check key public data bindings without requiring a browser.
// Run: node scripts/verify-core-consumers.mjs
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const assert=(test,msg)=>{if(!test)throw Error(msg)};
const careers=JSON.parse(read('data/career_core_generated.json'));
const ledger=JSON.parse(read('data/unified_record_book_2016_2026.json'));
const league=JSON.parse(read('data/league.json'));
const legacyResumes=JSON.parse(read('data/manager_legacy_resumes.json'));
const workflow=read('.github/workflows/verify-canonical-history.yml');
const topicAudit=workflow.indexOf('      - name: Classify dossier topical overlap');
const dossierInventory=workflow.indexOf('      - name: Inventory unmatched historical dossier editorial headings');
const artifactUpload=workflow.indexOf('      - name: Upload link-audit report');
assert(dossierInventory>=0&&topicAudit>dossierInventory&&artifactUpload>topicAudit,'Dossier editorial and topic audits must run before artifact upload');
const managers={stilly:'Stilly',stew:'Stew',tom:'Thommy',stover:'Stover',birch:'Birch',tony:'Tony',mitch:'Mitch',kuhl:'Kuhl',jmid:'JMid',scott:'Scott'};
const encyclopediaRenderer=read('assets/manager-encyclopedia.js');
assert(encyclopediaRenderer.includes('waiver_award_candidates.json')&&encyclopediaRenderer.includes('v9_trade_engine.json'),'Manager encyclopedia must use source evidence');
assert(encyclopediaRenderer.includes("encyclopediaUpdated='unavailable'"),'Failed encyclopedia fetch must expose unavailable status');
assert(encyclopediaRenderer.includes('new AbortController()')&&encyclopediaRenderer.includes('controller.abort()')&&encyclopediaRenderer.includes('clearTimeout(timeout)'),'Manager encyclopedia network requests must have a bounded loading state');
assert(encyclopediaRenderer.includes("encyclopediaUpdated='loading'")&&encyclopediaRenderer.includes('Loading source-backed highlights'),'Manager encyclopedia must clear stale award figures while fetching source evidence');
assert(encyclopediaRenderer.includes('Waiver evidence unavailable')&&encyclopediaRenderer.includes('Trade evidence unavailable'),'Failed encyclopedia fetch must suppress static stale award figures');
const recordRenderer=read('assets/canonical-manager-record.js');
const h2hRenderer=read('assets/manager-h2h-explorer.js');
assert(recordRenderer.includes('data/career_core_generated.json'),'Manager headlines must read generated career core');
assert(h2hRenderer.includes('data/unified_record_book_2016_2026.json'),'Manager H2H must read canonical ledger');
assert(!h2hRenderer.includes('2026 Weeks 1–6'),'Outdated rivalry coverage claim');
assert(h2hRenderer.includes("==='Tom'?'Thommy'"),'Thommy H2H identity normalization missing');
const seasonHistoryRenderer=read('assets/manager-season-history.js');
assert(seasonHistoryRenderer.includes('data/career_core_generated.json'),'Manager annual history must source regular-season records from generated career core');
assert(!seasonHistoryRenderer.includes('record:x.regular'),'Manager annual history still uses duplicate archival record');
const seasonGenerator=read('scripts/generate-season-guide.mjs');
assert(seasonGenerator.includes('data/unified_record_book_2016_2026.json'),'Season guide must be generated from canonical game ledger');
assert(!seasonGenerator.includes('season_weekly_matchups_2016_2026_v1.json'),'Season guide still depends on duplicate weekly snapshot');
const weeklyArchivePage=read('seasons/weekly-matchup-archive.html');
assert(weeklyArchivePage.includes("fetch('../data/unified_record_book_2016_2026.json')"),'Weekly season archive must load canonical ledger');
assert(!weeklyArchivePage.includes('season_weekly_matchups_2016_2026_v1.json'),'Weekly season archive still loads duplicate matchup snapshot');
assert(weeklyArchivePage.includes('const rows=new Map()'),'Weekly season standings must be reconstructed from canonical matchups');
const legacyResumeRenderer=read('assets/legacy-resume.js');
assert(legacyResumeRenderer.includes('data/career_core_generated.json'),'Legacy resume must use generated career WLT');
assert(!legacyResumeRenderer.includes('esc(d.record)'),'Legacy resume still displays stale stored WLT');
const archiveBrowser=read('managers/record-books.html');
assert(archiveBrowser.includes("fetch('../data/career_core_generated.json')"),'Archive manager browser must fetch canonical career records');
assert(archiveBrowser.includes('Object.entries(c.h2h)'),'Archive manager browser head-to-head must be canonical');
assert(archiveBrowser.includes('Object.entries(c.annual)'),'Archive manager browser annual records must be canonical');
assert(!archiveBrowser.includes('m.regular.w+')&&!archiveBrowser.includes('m.headToHead.map(')&&!archiveBrowser.includes('m.annual.map('),'Archive manager browser still renders duplicate WLT');
const historicalRenderer=read('assets/manager-historical-records.js');
assert(historicalRenderer.includes('data/career_core_generated.json'),'Historical manager panel must fetch canonical career core');
assert(historicalRenderer.includes('Object.entries(canonical.annual)'),'Historical manager annual table must use canonical seasons');
assert(historicalRenderer.includes('Object.entries(canonical.h2h)'),'Historical manager rivalries must use canonical head-to-head');
assert(!historicalRenderer.includes('m.regular.w+')&&!historicalRenderer.includes('m.annual.map(')&&!historicalRenderer.includes('m.headToHead.map('),'Historical manager panel still renders duplicate WLT');
const weeklyRenderer=read('assets/manager-weekly-game-log.js');
assert(weeklyRenderer.includes('data/unified_record_book_2016_2026.json'),'Weekly log must use unified ledger');
assert(weeklyRenderer.includes('data/career_core_generated.json'),'Weekly log must use generated annual WLT');
assert(!weeklyRenderer.includes('season_weekly_matchups_2016_2026_v1.json'),'Weekly log still reads duplicate season snapshot');

assert(!weeklyRenderer.includes("&quot;':'&quot;"),'Weekly log contains invalid quote escaping syntax');
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
const legacyPage=read('analytics/legacy.html');
const legacyBlock=legacyPage.match(/<script[^>]*id="legacyData"[^>]*>([\s\S]*?)<\/script>/);
assert(!!legacyBlock,'All-Time Legacy embedded fallback model missing');
const legacyModel=JSON.parse(legacyBlock[1]);
assert(Object.values(legacyModel.weights).reduce((sum,n)=>sum+n,0)===100,'Legacy weights must total 100');
assert(legacyModel.status.includes('No 100-point scores'),'Legacy must disclose withheld full rankings');
for(const entry of legacyModel.managers){
 const expected=30*Math.sqrt(entry.titles/4);
 assert(Math.abs(entry.championship_component-expected)<0.00001,'Legacy championship weighting differs: '+entry.manager);
 const games=entry.career_wins+entry.career_losses+(entry.career_ties||0);
 assert(games>0&&Math.abs(entry.career_win_pct-((entry.career_wins+(entry.career_ties||0)/2)/games))<0.00001,'Legacy win percentage inconsistent: '+entry.manager);
}
for(const entry of legacyModel.managers){
 const id=entry.manager==='Tom'?'Thommy':entry.manager;
 const m=careers.managers[id];
 assert(!!m&&entry.career_wins===m.w&&entry.career_losses===m.l&&(entry.career_ties||0)===m.t,'Legacy page has stale career fallback: '+entry.manager);
}
const recordsPage=read('analytics/records.html');
const recordsArchive=read('analytics/records-archive.html');
assert(recordsArchive.includes("fetch('../data/career_core_generated.json')"),'Archived Records career table must read generated core');
assert(recordsArchive.includes('R.career_records=[];'),'Archived Records must withhold stale career fallbacks until canonical fetch succeeds');
assert(!recordsArchive.includes('showing saved fallback values'),'Archived Records must not misrepresent stale fallback data');
assert(!recordsArchive.includes("fetch('../data/manager_record_books_2016_2026.json')"),'Archived Records still fetches duplicated career source');
const warRoom=read('analytics/rivalry-war-room.html');
assert(recordsPage.includes("fetch('../data/career_core_generated.json')"),'Primary career board must use generated records');
assert(recordsPage.includes("fetch('../data/unified_record_book_2016_2026.json')"),'Records board weekly extremes must use canonical ledger');
assert(!recordsPage.includes("fetch('../data/season_weekly_matchups_2016_2026_v1.json')"),'Records board still fetches duplicated weekly archive');
assert(warRoom.includes("fetch('../data/unified_record_book_2016_2026.json')"),'Rivalry war room must use canonical game ledger');
assert(!warRoom.includes("fetch('../data/all_rivalry_matchups_v3.json')"),'Rivalry war room still fetches legacy archive');

for(const [slug,id] of Object.entries(managers)){
 assert(!!careers.managers[id],'Missing generated manager '+id);
 const derived=careers.managers[id];
 const legacyName=id==='Thommy'?'Tom':id;
 const displayed=derived.w+'–'+derived.l+(derived.t?'–'+derived.t:'');
 assert(league.managers[legacyName]?.record===displayed,'Shared league manager record diverges from generated career core: '+id);
 assert(legacyResumes[legacyName]?.record===displayed,'Legacy résumé fallback WLT differs from canonical career: '+id);
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
