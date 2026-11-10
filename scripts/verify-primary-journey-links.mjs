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
console.log('PASS: Playoff Race and Trade Museum use canonical journey destinations and keyboard skip links');
