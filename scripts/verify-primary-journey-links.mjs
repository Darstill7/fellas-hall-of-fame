import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
const pages=[
 {source:'analytics/playoff-race.html',nav:'League navigation',skip:'race-title'},
 {source:'analytics/trade-museum.html',nav:'Main navigation',skip:'trade-museum-title'}
];
const required=[
 ['Home','../index.html'],['Managers','../managers/'],['Records','record-holders.html'],['2026 Season','../seasons/2026.html']
];
for(const {source,nav,skip} of pages){
 const content=readFileSync(source,'utf8');
 const start=content.indexOf('aria-label="'+nav+'"');
 assert(start>=0,'Missing primary navigation in '+source);
 const close=content.indexOf('</nav>',start);
 assert(close>start,'Primary nav malformed in '+source);
 const links=content.slice(start,close);
 for(const [label,href] of required){
  assert(links.includes('href="'+href+'">'+label+'</a>'),'Wrong '+label+' destination in '+source);
  const resolved=path.resolve(path.dirname(source),href);
  assert(existsSync(resolved)||existsSync(path.join(resolved,'index.html')),'Missing destination '+href+' in '+source);
 }
 assert(content.includes('class="audit-skip" href="#'+skip+'"'),'Keyboard skip route missing on '+source);
 assert(content.includes('id="'+skip+'"'),'Keyboard skip target missing on '+source);
 assert(content.includes('.audit-skip:focus{top:10px}'),'Skip navigation not focus visible in '+source);
 assert.equal((content.match(/<h1\b/g)||[]).length,1,'Each page needs one heading: '+source);
}
const tradesHtml=readFileSync('analytics/trade-museum.html','utf8');
const archiveStart='<script id="archive-data" type="application/json">';
const archiveIndex=tradesHtml.indexOf(archiveStart);
const archiveEnd=tradesHtml.indexOf('</script>',archiveIndex);
assert(archiveIndex>=0&&archiveEnd>archiveIndex,'Embedded trade evidence must remain intact');
const archive=JSON.parse(tradesHtml.slice(archiveIndex+archiveStart.length,archiveEnd));
const managers=new Set(archive.flatMap(t=>t.sides.map(s=>s.manager)));
for(const manager of ['EvansBrandon','Koble'])assert(managers.has(manager),'Historical participant source must be audited: '+manager);
assert(tradesHtml.includes("key==='evansbrandon'?'Evans':name"),'EvansBrandon must resolve to the canonical Evans record book');
assert(tradesHtml.includes("return '../managers/record-books.html?manager='+encodeURIComponent(historical)"),'Former managers need permanent historical record books');
assert(tradesHtml.includes('href="${managerPortfolioUrl(s.manager)}"'),'Individual trade cards must use the profile resolver');
assert(existsSync('managers/record-books.html'),'Verified historical manager records must be available');
console.log('PASS: Playoff Race and Trade Museum use canonical journey destinations and keyboard skip links');
