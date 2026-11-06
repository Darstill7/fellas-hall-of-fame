// Commissioner-approved trade museum: complete three-team player receipts
// are as valid as two-team receipts; incomplete evidence stays in research.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const input=JSON.parse(fs.readFileSync('data/trade_museum_stage66.json','utf8'));
const html=fs.readFileSync('analytics/trade-museum.html','utf8');
const complete=t=>t.sides.length>=2&&new Set(t.sides.map(x=>x.manager)).size===t.sides.length&&t.sides.every(x=>x.source_status==='VERIFIED_SOURCE'&&typeof x.assets==='string'&&x.assets.trim().length>0);
const main=input.filter(complete),research=input.filter(x=>!complete(x));
assert.equal(input.length,51);
assert.equal(main.length,49,'Three-team trade must appear in main archive');
assert.equal(research.length,2,'Only the two one-sided player receipts belong in research');
const three=main.find(x=>x.id==='1294402688213057536');
assert.ok(three,'2025-11-12 Stilly/JMid/Tom trade must be included');
assert.deepEqual(three.sides.map(x=>x.manager),['Stilly','JMid','Tom']);
assert.ok(three.sides.every(x=>x.source_status==='VERIFIED_SOURCE'));
assert.ok(html.includes('const completeSides=t=>t.sides.length>=2'));
assert.ok(html.includes("const curated=trades.filter(completeSides)"));
assert.ok(html.includes('id="scope"'));
assert.ok(html.includes("value=\"research\""));
assert.ok(html.includes("const incomplete=trades.filter(t=>!completeSides(t))"));
assert.ok(html.includes('Three-team trades are valid transactions'));
assert.ok(!html.includes('t.sides.length===2&&'));
console.log('PASS: 49 main multi-manager receipts including the 2025 three-way, 2 incomplete research receipts.');
