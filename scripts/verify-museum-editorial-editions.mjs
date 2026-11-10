import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
const cssPath='assets/museum-editorial-editions.css';
const css=fs.readFileSync(cssPath,'utf8');
for(const selector of ['.museum-skip:focus','.museum-chapter','.top h1','.shame-feature','.nav a:focus-visible','@media(max-width:700px)'])
  assert(css.includes(selector), 'Shared museum CSS missing '+selector);
const pages=[
  {path:'hall/players.html',title:'PLAYER HALL',legacy:'Ja’Marr Chase',other:'shame.html',unique:'id="player-collection"'},
  {path:'hall/shame.html',title:'HALL OF SHAME',legacy:'Shitter of the Year',other:'players.html',unique:'id="shame-trades"'}
];
for(const item of pages){
 const src=fs.readFileSync(item.path,'utf8');
 for(const label of [item.title,item.legacy,item.unique,'href="#museum-main"','id="museum-main"','museum-editorial-editions.css','museum-chapter','museum-evidence','aria-label="Main site navigation"','href="'+item.other+'"']){
  assert(src.includes(label),item.path+' missing '+label);
 }
 assert.equal((src.match(/<h1\b/g)||[]).length,1,item.path+' must have one title');
 const nav=src.match(/<nav class="nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
 assert(nav,item.path+' primary nav missing');
 for(const dest of ['../index.html','../managers/','./','../analytics/record-holders.html','../seasons/2026.html']){
  assert(nav.includes('href="'+dest+'"'),item.path+' lacks nav '+dest);
  const resolved=path.resolve(path.dirname(item.path),dest);
  assert(fs.existsSync(resolved),item.path+' has broken nav '+dest);
 }
 assert(!src.includes('2026 · Week 7 snapshot'),item.path+' incorrectly shows obsolete current-week badge');
 assert(src.includes('not automatically refreshed with new weekly scores'),item.path+' must disclose frozen editorial scope');
 if(item.path.endsWith('shame.html')){
  for(const id of ['shame-trades','shame-lineups','shame-scores','shame-faab']){
   assert(src.includes('id="'+id+'"'), 'Shame category removed: '+id);
  }
 }
}
const hall=fs.readFileSync('hall/index.html','utf8');
for (const destination of ['href="players.html"','href="shame.html"']) assert(hall.includes(destination),'Hall directory must feature '+destination);
assert(hall.includes('Eight ways into the league history'),'Hall exhibit directory count must describe eight destinations');
console.log('PASS: premium museum player/shame pages, five-link navigation, preserved exhibits, archive scope, keyboard skip and shared CSS.');
