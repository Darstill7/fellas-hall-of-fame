// Verify both search collections remain source-backed and accessible.
// Run: node scripts/test-record-holder-search.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../analytics/record-holders.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../assets/record-holders-page.mjs',import.meta.url),'utf8');
const count=(s,re)=>(s.match(re)||[]).length;
assert.equal(count(html,/id="record-category-query"/g),1,'One search input is required');
assert.equal(count(html,/id="record-category-results-count"/g),1,'Search result count is required');
assert(html.includes('<label for="record-category-query">'),'Search needs a visible label');
assert(html.includes('type="search"'),'Search must use native search input');
assert(html.includes('aria-controls="established-record-results expanded-record-categories"'),'Search must link both result collections');
assert(html.includes('id="established-record-results"'),'Established record results missing');
assert(html.includes('role="status" aria-live="polite"'),'Announce counts without refocusing');
assert(html.includes('id="record-family-nav"'),'Existing family navigation must remain');
assert(html.includes('id="expanded-record-categories"'),'Existing 44-category results must remain');
assert(js.includes("expanded.categoryCount!==44"),'44 verified category validation removed');
assert(js.includes("category.leaders.filter(r=>r.rank===1)"),'Verified record ownership filtering removed');
assert(js.includes("const searchableCategory=c=>"),'Search index must be built from source categories');
assert(js.includes("selectedFamily==='All'||c.group===selectedFamily"),'Search must compose with group filtering');
assert(js.includes("parts.every(part=>searchableCategory(c).includes(part))"),'Keyword filtering missing');
assert(js.includes("const establishedMatches=drawEstablished(parts)"),'Established records must use the keyword query');
assert(js.includes("link.href='#'+record.anchor"),'Established results must open the exact evidence');
assert(js.includes("queryInput.addEventListener('input',drawExpanded)"),'Search input not wired');
assert(js.includes("button.dataset.family=group"),'Family-state reset cannot work');
assert(js.includes("record-category-empty"),'No-results state missing');
assert(js.includes("clear.addEventListener('click'"),'Search reset action missing');
assert(js.includes("exact.href='expanded-records.html?group='"),'Full ranked evidence link missing');
assert(js.includes("const winners=category.leaders.filter(r=>r.rank===1)"),'Tied first-place holders omitted');
assert(js.includes("for(const name of new Set(winners.map(r=>expandedName(r.manager))))"),
 'All tied record-owner links must remain');
assert(html.includes('44 expanded regular-season'),'Archive source-scope explanation removed');
console.log('PASS: Record Holders source-backed search, family filters, ties and evidence links preserved');
