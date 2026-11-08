import fs from 'node:fs';
import assert from 'node:assert/strict';
import {computeDraftValue} from '../assets/fellas-draft-value-lab.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const board=read('data/fellas_2026_sleeper_draft_board_verified_v1.json');
const engine=read('data/v9_draft_engine.json');
const lab=computeDraftValue(board,engine);
assert.equal(lab.picks.length,150,'All 150 confirmed selections are needed');
assert.equal(lab.managers.length,10,'All ten manager summaries are needed');
assert.equal(lab.draftId,'1340027406018150400');
assert.equal(lab.picks.filter(p=>p.keeper).length,20,'Two 2026 keeper slots per manager');
assert.ok(lab.managers.every(m=>m.picks===15&&m.keeperPicks===2&&m.nonkeeperPicks===13));
assert.equal(new Set(lab.picks.map(p=>p.overall)).size,150);
assert.ok(lab.picks.every(p=>p.peerMedian!==null&&p.valuePoints!==null),'Unexpected insufficient-round peer coverage');
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<.011,'Expected '+expected+', got '+actual);
const pick=name=>lab.picks.find(p=>p.player===name);
const woody=pick('Woody Marks');
assert.equal(woody.manager,'Stilly');
assert.equal(woody.round,13);
assert.equal(woody.overall,128);
assert.equal(woody.keeper,false);
assert.equal(woody.starts,2);
near(woody.startedPoints,17.3);
near(woody.peerMedian,0);
near(woody.valuePoints,17.3);
const daniels=pick('Jayden Daniels');
assert.equal(daniels.manager,'Stilly');assert.equal(daniels.round,12);
assert.equal(daniels.keeper,true);
near(daniels.startedPoints,67);near(daniels.peerMedian,6.4);near(daniels.valuePoints,60.6);
const amon=pick('Amon-Ra St. Brown');
assert.equal(amon.keeper,true);assert.equal(amon.round,1);near(amon.valuePoints,-22.9);
assert.equal(pick('Jaxon Smith-Njigba').keeper,true);
for(const p of lab.picks){
 const peers=lab.picks.filter(x=>x.round===p.round&&x.overall!==p.overall&&!x.keeper);
 assert.equal(p.peerCount,peers.length,'Round cohort size '+p.overall);
 const values=peers.map(x=>x.startedPoints).sort((x,y)=>x-y);
 const median=values.length%2?values[(values.length-1)/2]:(values[values.length/2-1]+values[values.length/2])/2;
 near(p.peerMedian,median);near(p.valuePoints,Math.round((p.startedPoints-median)*100)/100);
 assert.equal(p.valueStatus,p.keeper?'keeper_slot_comparison_not_decision':'original_drafting_manager_round_surplus');
}
for(const m of lab.managers){
 const own=lab.picks.filter(p=>p.manager===m.manager),normal=own.filter(p=>!p.keeper),keeper=own.filter(p=>p.keeper);
 near(m.draftedStartedPoints,Math.round(normal.reduce((n,p)=>n+p.startedPoints,0)*100)/100);
 near(m.keeperStartedPoints,Math.round(keeper.reduce((n,p)=>n+p.startedPoints,0)*100)/100);
 near(m.totalDraftValuePoints,Math.round(normal.reduce((n,p)=>n+p.valuePoints,0)*100)/100);
 near(m.totalKeeperSlotSurplus,Math.round(keeper.reduce((n,p)=>n+p.valuePoints,0)*100)/100);
}
assert.ok(!('keeperDecisionGrade' in lab.managers[0]),'Unsupported keeper-decision grade invented');
assert.ok(lab.definitions.keeperDecision.includes('eligible alternatives'));
assert.ok(lab.definitions.caution.includes('traded'));
assert.ok(lab.definitions.scope===undefined||lab.definitions.scope.includes('2026'));
const page=fs.readFileSync('analytics/draft-value-lab.html','utf8');
assert.ok(page.includes('fellas-draft-value-lab.mjs')&&page.includes('data/fellas_2026_sleeper_draft_board_verified_v1.json'));
assert.ok(page.includes('data/v9_draft_engine.json')&&page.includes('Keeper Decision Quality is different'));
for(const p of ['analytics/drafts.html','analytics/drafts/index.html']){
 assert.ok(fs.readFileSync(p,'utf8').includes('draft-value-lab.html'),'Missing Draft Value Lab navigation '+p);
}
console.log('DRAFT VALUE LAB PASS: 150 original draft picks, 20 keeper comparisons, Woody Marks +17.30, Jayden Daniels keeper +60.60, separate manager aggregates.');
