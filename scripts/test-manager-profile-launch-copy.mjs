import {findOwnedRecords} from '../assets/manager-record-ownership.mjs';
import fs from 'node:fs';
const managers=['stilly','jmid','tom','stew','scott','mitch','tony','stover','kuhl','birch'];
const obsolete=/The Fellas OS v5|static-first pre-publish build|Franchise encyclopedia · v9\.15|Players, Waivers & Trade Receipts/;
for(const slug of managers){
 const path='managers/'+slug+'.html';
 const html=fs.readFileSync(path,'utf8');
 if(obsolete.test(html))throw Error('Outdated public build label remains on '+path);
 if(!html.includes('Career records and player histories are drawn from documented league results. Coverage varies by season.'))throw Error('Manager history disclaimer missing on '+path);
 if(!html.includes('href="../managers/index.html"'))throw Error('Manager directory return link missing on '+path);
}
const guide=JSON.parse(fs.readFileSync('data/season_guide.json','utf8'));
const names={stilly:'Stilly',jmid:'JMid',tom:'Thommy',stew:'Stew',scott:'Scott',mitch:'Mitch',tony:'Tony',stover:'Stover',kuhl:'Kuhl',birch:'Birch'};
for(const slug of managers){
 const page='managers/'+slug+'/index.html';
 const html=fs.readFileSync(page,'utf8');
 const years=Object.entries(guide).filter(([year,season])=>Number(year)<=2025&&season.champion===names[slug]).map(([year])=>Number(year)).sort((a,b)=>a-b);
 if(!html.includes('data-verified-championships="'+(years.join(',')||'none')+'"'))throw Error('Profile championship summary disagrees with season guide: '+slug);
 if(!html.includes('href="../../analytics/power-ratings.html"'))throw Error('Profile does not link to current all-time rankings: '+slug);
 if(html.includes('legacy.html?manager='))throw Error('Profile still links to superseded Legacy prototype: '+slug);
 if(/Source-backed highlight|Source-backed historical evidence loads|Franchise encyclopedia · source-backed/.test(html))throw Error('Developer-facing research placeholders still visible: '+slug);
 if(!html.includes('data-encyclopedia-waiver')||!html.includes('data-encyclopedia-trade'))throw Error('Profile evidence cards disconnected: '+slug);
 const headline=html.match(/<div class="stat"><strong>(\d+)<\/strong><small>Verified championships?<\/small><\/div>/);
 if(!headline||Number(headline[1])!==years.length)throw Error('Profile championship headline disagrees with season guide: '+slug);
}
// The shared feature menu links each profile to its own filterable record book.
const featureMenu=fs.readFileSync('assets/manager-profile-tabs.mjs','utf8');
if(!featureMenu.includes("import {findOwnedRecords} from './manager-record-ownership.mjs'")||
   !featureMenu.includes("snapshot.append(link)")||
   !featureMenu.includes("link.href='../record-books.html?manager='")||
   !featureMenu.includes("No league leads in 5 tracked categories"))
 throw Error('Every manager must expose a source-backed record ownership preview and honest zero state');

const recordBook=fs.readFileSync('managers/record-books.html','utf8');
if(!featureMenu.includes("label:'Records you own'")||!featureMenu.includes("href:'../record-books.html?manager='+encodeURIComponent(manager)+'#owned-records'"))
 throw Error('Manager feature menu lost its personal record book deep link');
if(!featureMenu.includes("items:[0,1,12]"))
 throw Error('Record books are no longer in the Career & Results feature group');
if(!recordBook.includes("new URLSearchParams(location.search).get('manager')"))
 throw Error('Record book does not restore manager selection from its URL');
if(!recordBook.includes('id="owned-records"')||!recordBook.includes('manager-record-ownership.mjs'))
 throw Error('Record book has no live league ownership panel');
if(!recordBook.includes("history.replaceState(null,'',u)"))
 throw Error('Record book selection is not shareable');
const book=JSON.parse(fs.readFileSync('data/manager_record_books_2016_2026.json','utf8'));
const holderMap=new Map(book.managers.map(m=>[m.manager,findOwnedRecords(book,guide,m.manager)]));
const expectedKinds=[
 'Highest regular-season weekly score','Largest regular-season victory',
 'Most career regular-season wins','Most wins in a completed regular season','Most championships'
];
for(const kind of expectedKinds){
 const holders=[...holderMap].filter(([,records])=>records.some(r=>r.label===kind));
 if(!holders.length)throw Error('No verified record holder for '+kind);
 const scores=holders.flatMap(([,records])=>records.filter(r=>r.label===kind).map(r=>r.value));
 if(new Set(scores).size!==1)throw Error('Record holders disagree on league-leading value: '+kind);
}
if(holderMap.get('Thommy').find(r=>r.label==='Most championships')?.value!==4)
 throw Error('Four verified Thommy titles not recognized as record');
if(holderMap.get('Mitch').find(r=>r.label==='Highest regular-season weekly score')?.value!==180.86)
 throw Error('Verified single-week scoring leader changed; review records before launch');
console.log('All ten manager profiles have launch-ready copy, consistent championship records, and current rankings links.');
