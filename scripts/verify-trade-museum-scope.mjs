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
const story=JSON.parse(fs.readFileSync('data/featured_trade_storylines_v1.json','utf8')).stories[0];
assert.equal(story.manager,'Stilly');
const [first,keeper,last]=story.milestones;
assert.equal(first.tradeId,'1294402688213057536');
assert.equal(last.tradeId,'1413584172332654592');
assert.ok(main.some(x=>x.id===first.tradeId));
assert.ok(main.some(x=>x.id===last.tradeId));
const receipts=new Map(input.map(x=>[x.id,x]));
for(const milestone of [first,last]){
 const t=receipts.get(milestone.tradeId);
 assert.ok(t);
 assert.equal(t.date,milestone.date);
 assert.deepEqual(t.sides.map(x=>x.manager),milestone.participants);
 for(const participant of milestone.participants){
  const side=t.sides.find(x=>x.manager===participant);
  assert.deepEqual(side.assets.split(' + '),milestone.recordedReceiving[participant]);
 }
}
const keepers=JSON.parse(fs.readFileSync('data/keeper_2026_website_research_v1.json','utf8'));
const selected=keepers.selections.find(x=>x.manager==='Stilly'&&x.player==='Amon-Ra St. Brown');
assert.ok(selected);
assert.equal(selected.round,keeper.draftRound);
assert.equal(selected.verifiedOriginalManagerStarts,keeper.startsThroughWeek8);
assert.equal(selected.verifiedOriginalManagerStartedPoints,keeper.starterPointsThroughWeek8);
const profile=fs.readFileSync('managers/stilly/index.html','utf8');
assert.ok(profile.includes('id="stilly-three-team-story-title"'));
for(const id of [first.tradeId,last.tradeId]){
 assert.ok(profile.includes('trade-museum.html?trade='+id));
 assert.ok(html.includes('href="?trade='+id));
}
assert.ok(profile.includes('keeper-decision-research.html'));
assert.ok(html.includes("new URLSearchParams(window.location.search).get('trade')"));
assert.ok(html.includes("if(t)openTrade(t.id)"));
console.log('PASS: 49 main multi-manager receipts including the 2025 three-way, 2 incomplete research receipts.');
