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
const mobileCss=readFileSync(new URL('../assets/manager-profile-mobile-v3.css',import.meta.url),'utf8');
assert(mobileCss.includes('profile-season-pulse-stats')&&mobileCss.includes('grid-template-columns:repeat(2,minmax(0,1fr))'),'Manager 3.0 mobile season summary and two-column career highlights missing');
assert(interactive.includes('mountManagerSeasonPulse()')&&interactive.includes('mountOptionalManagerAnalysis()'),'Mobile-first current-season and deferred analytics mounts missing');
assert(interactive.includes("firstScreenSeason.dataset.profileFirstscreenSeason=''"),'Verified 2026 first-screen cue missing');
assert(interactive.includes("firstScreenSeason.textContent='2026 · '+verifiedRecord"),'First-screen record must derive from the canonical 2026 standings');
assert(interactive.includes("firstScreenSeason.textContent='2026 results unavailable"),'Missing seasonal data must show an honest fallback');
assert(mobileCss.includes('Phase 2 · Franchise first screen v4')&&mobileCss.includes('.profile-firstscreen-season'),'New responsive identity treatment missing');
const scoreboardInset=mobileCss.match(/body\.premium-franchise main>\.hero \.profile-career-snapshot\s*\{([^}]+)\}/);
assert(scoreboardInset&&/padding:\s*(?:1[2-9]|[2-9]\d)px/.test(scoreboardInset[1]),
 'Condensed career scoreboard must retain at least 12px panel inset at desktop widths');
assert(!interactive.includes('mountManagerScheduleLuck(profileName,profileHero);')&&!interactive.includes('mountManagerLuckPerformance(profileName,profileHero);'),'Advanced opponent-draw panels must not mount directly in the hero');
assert(interactive.includes("source.className='hof-career-source-note'"),'Biography source note missing');
assert(interactive.includes('see the latest verified 2026 scores and standings'),'Live 2026 crosslink missing');
for(const name of names){
 const html=readFileSync(new URL('../managers/'+name+'/index.html',import.meta.url),'utf8');
 const manager=canonical(name);
 const href='../../managers/record-books.html?manager='+encodeURIComponent(manager)+'#career-first';
 assert(html.includes('manager-profile-editorial-v2.css'),name+' missing shared design system');
 assert(html.includes('manager-profile-editorial-v3.css'),name+' missing shared editorial finish');
 assert(html.includes('manager-profile-mobile-v3.css'),name+' missing shared mobile-first system');
 assert(html.includes('property="og:title"')&&html.includes('property="og:description"'),name+' missing social title/description');
 assert(html.includes('property="og:url" content="https://darstill7.github.io/fellas-hall-of-fame/managers/'+name+'/"'),name+' missing direct profile share URL');
 assert(html.includes(href),name+' missing canonical manager-specific personal record book');
 assert(html.includes('class="profile-chapters"')&&
  html.includes('href="#franchise-story"')&&
  html.includes('href="#season-history"')&&
  html.includes('href="#head-to-head"'),
  name+' missing clearly ordered career, seasons and rivalry navigation');
 assert(html.includes('class="franchise-deep-preview"'),
  name+' must preserve advanced records without duplicating them in the opening hero');
 assert(!html.includes('manager-records-spotlight'),
  name+' still contains redundant old record spotlight');
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
