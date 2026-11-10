// Manager Profile 2.0 static route/structure checks.
// Run: node scripts/verify-manager-profile-v2.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const names=['stilly','stew','tom','stover','birch','tony','mitch','kuhl','jmid','scott'];
const canonical=n=>n==='tom'?'Thommy':n==='jmid'?'JMid':n[0].toUpperCase()+n.slice(1);
const interactive=readFileSync(new URL('../assets/manager-profile-tabs.mjs',import.meta.url),'utf8');
const latestCss=readFileSync(new URL('../assets/manager-profile-editorial-v3.css',import.meta.url),'utf8');
assert(interactive.includes('const managerRecordBookUrl='),'Interactive profile routes must use the manager-first Record Book');
assert(!interactive.includes('expanded-records.html?manager='),'Primary profile record links must not revert to the old research archive');
assert(latestCss.includes('@media(max-width:700px)'),'Responsive editorial layout missing');
for(const name of names){
 const html=readFileSync(new URL('../managers/'+name+'/index.html',import.meta.url),'utf8');
 const manager=canonical(name);
 const href='../../analytics/record-holders.html?manager='+encodeURIComponent(manager)+'#manager-record-finder';
 assert(html.includes('manager-profile-editorial-v2.css'),name+' missing shared design system');
 assert(html.includes('manager-profile-editorial-v3.css'),name+' missing shared editorial finish');
 assert(html.includes('manager-records-spotlight'),name+' missing record feature');
 assert(html.includes(href),name+' missing manager-specific record deep link');
 assert(html.includes('manager-records-spotlight'),name+' missing personal record feature');
 for(const target of ['../../index.html','../../managers/','../../hall/','../../seasons/2026.html'])
  assert(html.includes('href="'+target+'"'),name+' missing primary navigation: '+target);
 assert(html.includes('id="franchise-story"'),name+' missing franchise story');
 assert(html.includes('id="season-history"'),name+' missing season history');
 assert(html.includes('data-expanded-records-profile='),name+' missing verified signature module');
 assert(!html.includes('All-time regular-season W–L · 2016–2026 W8'),name+' has stale Week 8 record label');
 assert(!html.includes('All-time regular-season W–L · 2024–2026 W8'),name+' has stale Scott coverage');
 assert(html.includes('data-season-history=')&&html.includes('data-h2h-explorer='),name+' lost season/rivalry research');
 assert.equal((html.match(/<style\b/g)||[]).length,(html.match(/<\/style>/g)||[]).length,name+' style mismatch');
}
console.log('PASS: all ten manager pages have records, navigation, history sections and shared mobile editorial styling');
