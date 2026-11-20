// Record Holders is the league-owner destination, not a duplicate front door.
// Run: node scripts/test-record-holders-focus.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../analytics/record-holders.html',import.meta.url),'utf8');
const count=pattern=>(html.match(pattern)||[]).length;
assert.equal(count(/<section id="manager-record-finder"/g),1,'Manager-first finder missing');
assert.equal(count(/id="record-manager-choices"/g),1,'Current-manager selection removed');
assert.equal(count(/id="record-former-manager"/g),1,'Historical managers removed');
assert.equal(count(/id="record-manager-results"/g),1,'Source-backed finder results removed');
assert(html.includes('href="../managers/record-books.html"'),'Personal career records destination missing');
assert(html.includes('<details class="record-holders-other-paths">'),'Secondary discovery is not collapsible');
const discovery=html.match(/<details class="record-holders-other-paths">[\s\S]*?<\/section><\/details>/)?.[0];
assert(discovery,'Secondary discovery content or closing disclosure missing');
assert(!discovery.includes(' open>'),'Secondary discovery must initially be collapsed');
assert.equal((discovery.match(/class="pathfinder-item"/g)||[]).length,6,'All six previous discovery choices must remain');
for(const route of ['#browse-all-records','#verified-streak-records','#schedule-luck-record',
 'legendary-records.html','#manager-record-finder','records.html']){
 assert(discovery.includes('href="'+route+'"'),'Preserved discovery route missing: '+route);
}
const finder=html.indexOf('<section id="manager-record-finder"');
const optional=html.indexOf('<details class="record-holders-other-paths">');
const leaders=html.indexOf('<section id="browse-all-records"');
assert(finder>0&&optional>finder&&leaders>optional,'Finder must lead the optional discovery and archive');
assert(html.includes('id="complete-record-index"'),'Expanded category archive removed');
assert(html.includes('id="record-leaders"'),'All-time record owners removed');
assert(html.includes('id="verified-streak-records"'),'Historic streak evidence removed');
assert(html.includes('Tied first-place managers share credit'),'Tie ownership method removed');
assert(html.includes('2016–2025'),'Completed-season scope removed');
console.log('PASS: manager-first record holders, six optional paths, record evidence and personal destination retained');
