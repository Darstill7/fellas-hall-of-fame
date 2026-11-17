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
