// Record Book 2.0 front-door contract. Run: node scripts/test-record-book-entryway.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../analytics/records.html',import.meta.url),'utf8');
const match=(re,message)=>{const m=html.match(re);assert(m,message);return m[0]};
const count=re=>(html.match(re)||[]).length;
assert.equal(count(/<section class="records-pathfinder"/g),1,'Only one primary discovery area');
assert.equal(count(/<nav class="records-entry-paths"/g),0,'No competing hero menu');
assert.equal(count(/<a class="record-book-discover-link"/g),1,'One primary hero destination');
assert(html.includes('href="#records-discover-title"'),'Hero CTA leads to discovery section');
assert(html.includes('<a href="records.html" aria-current="page">Records</a>'),'Current-page Records nav must link to the canonical entrance');
const discovery=match(/<section class="records-pathfinder"[\s\S]*?<\/section>/,'Discovery section absent');
assert.equal((discovery.match(/class="pathfinder-item"/g)||[]).length,6,'Six curated category paths');
for(const href of ['#highest-scoring-matchups','#hall-of-heartbreak','#postseason-records',
 '#expanded-records','regular-season-close-calls.html','record-holders.html']){
 assert(discovery.includes('href="'+href+'"'),'Category path missing: '+href);
}
assert(html.includes('<details class="record-shortcut-disclosure">'),'Full index remains accessible on demand');
const shortcuts=match(/<details class="record-shortcut-disclosure">[\s\S]*?<\/details>/,'Full index missing');
assert(shortcuts.includes('class="record-category-shortcuts"'),'Original full index lost');
assert.equal((shortcuts.match(/<a href=/g)||[]).length,12,'Keep all twelve specialist shortcuts');
assert(!shortcuts.includes(' open>'),'Full index should initially be closed');
const order=['<section class="hero record-cover">','<section class="records-pathfinder"',
 '<div class="record-story-entry">','<details class="record-shortcut-disclosure">',
 '<section class="section" id="record-core-intro"'];
let last=-1;
for(const term of order){const next=html.indexOf(term);assert(next>last,'Incorrect top-level flow: '+term);last=next}
for(const id of ['highest-scoring-matchups','lowest-scoring-matchups','hall-of-heartbreak','hall-of-fortune',
 'brutal-wins-losses','expanded-records','postseason-records','original-records']){
 assert(html.includes('id="'+id+'"'),'Deep-link anchor removed: '+id);
}
for(const source of ['highest_scoring_matchups_2016_2026w9_v1.json','lowest_scoring_matchups_2016_2026w9_v1.json',
 'unified_record_book_2016_2026.json']){
 assert(html.includes(source),'Historical source reference missing: '+source);
}
assert(html.includes('record-stories.html?record=highest')&&html.includes('championship-comebacks.html'),
 'Featured stories must remain accessible');
console.log('PASS: record-book entrance, six paths, twelve specialty links and historical anchors retained');
