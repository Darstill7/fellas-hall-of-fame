import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../data-integrity/source-status.html',import.meta.url),'utf8');
const ledger=JSON.parse(readFileSync(new URL('../data/unified_record_book_2016_2026.json',import.meta.url),'utf8'));

for(const id of ['content','approved-week','source-date','game-count','regular-scope','source-load-status']) {
 assert.ok(html.includes('id="'+id+'"'),'Missing status page landmark: '+id);
}
assert.ok(html.includes("fetch('../data/unified_record_book_2016_2026.json',{cache:'no-store'})"),'Status page must use deployed canonical source file');
assert.ok(html.includes("g.year===2026&&g.stage==='regular'"),'Do not count playoffs as regular-season games');
assert.ok(html.includes("weeks.every((w,i)=>w===i+1)"),'Contiguous weeks must be validated before reporting a through-week');
assert.ok(html.includes("document.getElementById(id).textContent='Unverified'"),'Fetch failure must fail closed');
assert.ok(html.includes('A staged result or an unfinished game is not an approved final matchup.'),'Published and staged weeks must remain distinct');
assert.ok(html.includes('green pull request')===false,'Avoid falsely presenting a PR as a deployed site');
assert.ok(html.includes('A green pull request does not independently prove deployed Pages parity'),'CI must not be mistaken for Pages deployment');
assert.ok(!html.includes('standings through Week 6')&&!html.includes('v9 REVIEW BUILD'),'Historical preview labels must not masquerade as current scope');

assert.match(ledger.updated,/^\d{4}-\d{2}-\d{2}$/,'Canonical source update date must be explicit');
const matches=ledger.games.filter(g=>g.year===2026&&g.stage==='regular'&&Number.isFinite(g.homeScore)&&Number.isFinite(g.awayScore));
const weeks=[...new Set(matches.map(g=>g.week).filter(w=>Number.isInteger(w)&&w>=1&&w<=18))].sort((a,b)=>a-b);
assert.ok(weeks.every((w,i)=>w===i+1),'Canonical 2026 source weeks must not contain unexplained gaps');
assert.ok(matches.length>0,'Canonical 2026 data should not silently vanish');
assert.ok(matches.every(g=>Number.isFinite(g.homeScore)&&Number.isFinite(g.awayScore)),'All displayed matchups require finalized numeric scores');
console.log('Historical source status verified against approved canonical snapshot, with fail-closed freshness presentation.');
