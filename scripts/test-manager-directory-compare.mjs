import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {directoryMetrics,orderedSlugs,managerIdentity} from '../assets/manager-directory-compare.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const ledger=read('data/unified_record_book_2016_2026.json');
const summary=read('data/manager_profile_career_summary_v2.json');
const metrics=directoryMetrics(ledger,summary);
const original=['stilly','jmid','tom','stew','scott','mitch','tony','stover','kuhl','birch'];
assert.equal(Object.keys(metrics).length,10);
assert.equal(new Set(Object.values(managerIdentity)).size,10,'All ten real managers must be unique');
for(const slug of original){
 const m=metrics[slug],name=managerIdentity[slug];
 assert.equal(m.name,name,'Directory alias must map correctly');
 const games=ledger.games.filter(g=>g.stage==='regular'&&(g.home===name||g.away===name));
 assert.equal(m.games,games.length);
 assert.equal(m.w+m.l+m.t,games.length);
 assert.equal(m.titles,summary.managers[name].titles.length,'Title counts must come from verified championship ledger');
 assert.equal(m.pct,(m.w+m.t/2)/m.games,'Career winning percentage must use ties as half a win');
 assert.equal(m.week,Math.max(...ledger.games.filter(g=>g.year===2026&&g.stage==='regular').map(g=>g.week)));
}
assert.equal(metrics.tom.name,'Thommy','Tom route must map to verified Thommy identity');
assert.equal(metrics.jmid.titles,0);
assert.deepEqual(orderedSlugs(metrics,'original',original),original);
for(const key of ['championships','winpct','games']){
 const order=orderedSlugs(metrics,key,original);
 assert.equal(order.length,10);
 assert.equal(new Set(order).size,10);
 const field={championships:'titles',winpct:'pct',games:'games'}[key];
 assert.ok(order.every((slug,i)=>i===0||metrics[order[i-1]][field]>=metrics[slug][field]),key+' sort must descend');
}
assert.throws(()=>orderedSlugs(metrics,'unsupported',original),/Unknown directory sort/);
assert.throws(()=>directoryMetrics({},summary),/sources unavailable/);
assert.throws(()=>directoryMetrics(ledger,{managers:{}}),/Missing manager championship source/);
const incomplete=structuredClone(ledger);
incomplete.games=incomplete.games.filter(g=>!(g.year===2026&&g.week===metrics.stilly.week&&g.home=== 'Mitch'));
assert.throws(()=>directoryMetrics(incomplete,summary),/Incomplete current week/);
const changed=structuredClone(summary);changed.managers.Stilly.titles.push({year:2026});
assert.throws(()=>directoryMetrics(ledger,changed),/Invalid verified title year/);
const html=readFileSync(new URL('../managers/index.html',import.meta.url),'utf8');
for(const slug of original)assert.ok(html.includes('href="'+slug+'/">'),slug+' card missing');
assert.ok(html.includes('id="manager-sort"'));
assert.ok(html.includes('manager-directory-compare.mjs'));
assert.ok(html.includes('id="manager-name-search"'),'Existing search must remain');
console.log('MANAGER DIRECTORY PASS: 10 identities, canonical record math, verified titles, sorting and source-error guards.');
