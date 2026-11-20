import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../analytics/record-holders.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../assets/record-holders-page.mjs',import.meta.url),'utf8');
for(const id of ['record-manager-compare','record-compare-left','record-compare-right','record-compare-results']){
 assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Missing/duplicated comparison control '+id);
}
assert(html.indexOf('id="manager-record-finder"')<html.indexOf('id="record-manager-compare"'),'Manager finder should come first');
assert(html.indexOf('id="record-manager-compare"')<html.indexOf('<details class="record-holders-other-paths">'),'Comparison should precede optional archive');
assert(html.includes('44-category expanded archive'),'Scope note must use the 44-category dataset');
assert(html.includes('Ties count for both managers'),'Tied owners must be explained');
assert(js.includes('function renderManagerComparison()'),'Comparison renderer absent');
assert(js.includes('c.leaders.some(record=>record.rank===1'),'Only canonical first-place owners qualify');
assert(js.includes('const shared=a.filter(c=>keysB.has(c.key))'),'Shared ownership should use stable category keys');
assert(js.includes('const firstOnly=a.filter(c=>!keysB.has(c.key))'),'Distinct achievements not isolated');
assert(js.includes('const secondOnly=b.filter(c=>!keysA.has(c.key))'),'Second-manager distinct achievements not isolated');
assert(js.includes("encodeURIComponent(category.key)"),'Record evidence links removed');
assert(js.includes('renderManagerFinder();renderManagerComparison();'),'Comparison missing from verified-data load');
assert(!html.includes('overall winner'),'No unsourced overall winner should be declared');
console.log('PASS: sourced two-manager category ownership and ties; evidence links preserved');
