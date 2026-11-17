// Fast, source-level navigation contract for the draft design branch.
// This is deliberately not a replacement for Chromium/WebKit or canonical-data CI.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const home=read('index.html');
const profiles=read('assets/manager-profile-tabs.mjs');
const book=read('managers/record-books.html');
const slugs=['stilly','stew','tom','stover','birch','tony','mitch','kuhl','jmid','scott'];
const names=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
let assertions=0;
const check=(condition,message)=>{assert.ok(condition,message);assertions++};
const route=relative=>check(fs.existsSync(path.join(root,relative)), 'Missing route '+relative);

// First visit: clear homepage exploration and all current franchises.
check(home.includes('id="explore-the-league"'), 'Missing homepage exploration anchor');
check(home.includes('class="home-franchise-links"'), 'Missing direct franchise finder');
check((home.match(/class="[^"]*discovery-card[^"]*"/g)||[]).length===6,
 'Homepage must offer exactly six adventure routes');
for(let i=0;i<slugs.length;i++){
 const slug=slugs[i],name=names[i];
 check(home.includes('href="managers/'+slug+'/">'+name+'</a>'),
  'Homepage franchise link is missing or mislabeled: '+name);
 const file='managers/'+slug+'/index.html';
 route(file);
 const html=read(file);
 check(html.includes('src="../../assets/manager-profile-tabs.mjs"'),
  'Manager navigation module missing on '+slug);
 check(html.includes('data-expanded-records-profile="'+(slug==='tom'?'Tom':name)+'"'),
  'Embedded historical record evidence host missing for '+name);
}

// Shared profile actions: scoped records, research, and a real return path.
for(const fragment of [
 "managerRecordBookUrl(manager)",
 "href=\"#profile-features\"",
 "action:'front-office'",
 "data-feature-target=\".profile-career-resume\"",
 "title:'Career & Results'",
 "title:'Rivals & Matchups'",
 "title:'Drafts, Trades & Pickups'"
])check(profiles.includes(fragment),'Missing profile navigation feature: '+fragment);

// The topic selector must expose an identifiable, reversible reading chapter.
const chapterStyle=read('assets/manager-profile-mobile-v3.css');
for(const fragment of [
 'profile-focus-intro','profile-focus-kicker','profile-focus-title',
 'profile-focus-summary','← All chapters','returnToFeatureDirectory',
 'profile-focus-records-link','focusActions.append(focusBack,focusRecords)',
 "managerRecordBookUrl(profileName==='Tom'?'Thommy':profileName)"
])check(profiles.includes(fragment),'Missing focused chapter behavior: '+fragment);
for(const fragment of [
 'body.premium-franchise.profile-feature-focused .profile-focus-toolbar',
 '.profile-focus-intro','.profile-focus-kicker','.profile-focus-summary'
])check(chapterStyle.includes(fragment),'Missing focused chapter presentation: '+fragment);

// Season cards retain original evidence, distinguish finishes and navigate
// only to real season pages; the ESPN era uses its existing origins archive.
const seasons=read('assets/manager-season-history.js');
for(const fragment of [
 'data-season-history','career_core_generated.json',
 'manager_verified_season_endings_v1.json',
 'season-entry-record','season-entry-outcome','season-entry-archive',
 'season-finish-champion','season-finish-finalist',
 'Explore the ESPN origins archive'
])check(seasons.includes(fragment),'Missing verified annual timeline contract: '+fragment);
for(let year=2020;year<=2026;year++)route('seasons/'+year+'.html');
route('seasons/espn-origins.html');

// The matchup chapter must derive the spotlight and game log from the
// same canonical regular-season game set. No independently typed W/L numbers.
const rivalry=read('assets/manager-h2h-explorer.js');
for(const fragment of [
 'unified_record_book_2016_2026.json',
 "g.stage==='regular'",
 'h2h-spotlight',
 'data-rivalry-spotlight',
 'data-spotlight-opponent',
 "series.filter(x=>x.games>=3)",
 "card.dataset.spotlightOpponent===op.value",
 "season.value='all'",
 'h2h-game-win',
 'h2h-game-loss'
])check(rivalry.includes(fragment),'Missing manager rivalry chapter behavior: '+fragment);

// Draft/trade dossier must preserve source limits and a reversible topic flow.
const transactions=read('assets/manager-draft-trade-career-page.mjs');
for(const fragment of [
 'manager_draft_trade_profile_evidence_v1.json',
 'research_only_no_draft_or_trade_skill_grades',
 'career-transaction-lead',
 'career-transaction-scope',
 'career-research-topics-grid',
 'career-resume-trade',
 "event.complete&&event.managers.includes(manager)&&event.year<=2025",
 'career-transaction-full-archive',
 'career-research-return'
])check(transactions.includes(fragment),'Missing source-qualified transaction dossier: '+fragment);
for(const fragment of [
 '.career-transaction-lead',
 '.career-research-topics-grid',
 '.career-resume-trade',
 '.career-transaction-proof'
])check(chapterStyle.includes(fragment),'Missing mobile transaction design: '+fragment);

// Four source-backed research experiences share one mobile reading rhythm.
for(const fragment of [
 '--fellas-research-paper',
 '#season-history .season-history-guide',
 '#head-to-head [data-summary] .stats',
 '.career-resume-metrics',
 '[data-expanded-records-profile] .records-lab-grid',
 '.profile-focus-actions',
 '.profile-focus-records-link'
])check(chapterStyle.includes(fragment),'Missing shared chapter styling or record-book exit: '+fragment);

// Personal records: per-manager selection and routes back to source profiles.
for(const fragment of [
 'id="record-book-title"',
 'id="record-next-links"',
 "new URLSearchParams(location.search).get('manager')",
 "Back to '+E(m.manager)+'’s profile",
 "currentManagers.has(m.manager)",
 "window.dispatchEvent(new CustomEvent('fellas-personal-records-rendered'"
])check(book.includes(fragment),'Missing record-book navigation contract: '+fragment);
for(const file of ['managers/record-books.html','analytics/record-holders.html',
 'analytics/manager-report-cards.html','analytics/trade-museum.html','seasons/index.html'])route(file);

console.log('Redesign navigation source contracts passed: '+assertions+' checks across ten manager profiles.');
