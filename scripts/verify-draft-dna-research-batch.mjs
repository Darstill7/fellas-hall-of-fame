// Reproducible no-browser checks for the selection vault and 2026 scored starters.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const run=path=>JSON.parse(execFileSync(process.execPath,[path],{encoding:'utf8',maxBuffer:32*1024*1024}));
const all=run('scripts/build-draft-dna-selection-vault.mjs');
const w9=run('scripts/build-draft-dna-2026-week9.mjs');
assert.equal(all.schema,'fellas-original-draft-selection-vault-v1');
assert.equal(all.coverage.totalOriginalSelections,1648);
assert.equal(all.coverage.espnSelections,598);
assert.equal(all.coverage.sleeperSelections,1050);
assert.equal(all.coverage.orderedSelections,1488);
assert.equal(all.coverage.unverifiedOrderSelections,160);
assert.equal(all.coverage.completedSeasonSelections,1498);
assert.equal(all.coverage.currentSeasonSelections,150);
assert.equal(all.perYear.length,11);
assert.deepEqual(all.perYear.map(x=>x.picks),[128,160,160,150,150,150,150,150,150,150,150]);
const uncertain=all.picks.filter(x=>x.year===2018);
assert.equal(uncertain.length,160);
assert(uncertain.every(x=>x.originalOverall===null&&x.round===null&&
 x.orderConfidence==='unverified-position-sorted-source'));
assert(all.picks.every(x=>typeof x.player==='string'&&x.player.length>0));
assert(all.picks.filter(x=>x.year===2023).some(x=>x.manager==='Evans'));
assert(!all.picks.some(x=>x.manager==='EvansBrandon'||x.manager==='Tom'));
assert(all.picks.some(x=>x.manager==='Schermerhorn'));
assert.equal(w9.coverage.picks,150);
assert.equal(w9.coverage.keeperPicks,20);
assert.equal(w9.coverage.nonKeeperPicks,130);
assert.equal(w9.coverage.playedWeeks,9);
assert.equal(w9.coverage.scoredTeamWeeks,90);
assert.equal(w9.coverage.pilotDivergences,6);
assert.equal(w9.managerRows.length,10);
assert.deepEqual(w9.picks.map(x=>x.overall),Array.from({length:150},(_,i)=>i+1));
assert.equal(new Set(w9.picks.map(x=>x.playerId)).size,150);
const discrepancyNames=new Set(['James Cook','Kenneth Walker','Luther Burden',
 'Harold Fannin','Chris Godwin','Aaron Jones']);
assert.deepEqual(new Set(w9.pilotConflicts.map(x=>x.player)),discrepancyNames);
assert(w9.pilotConflicts.every(x=>x.classification==='source-conflict-requires-manual-adjudication'));
for(const p of w9.picks){
 assert.equal(p.week9Starts,p.starterReceipts.filter(r=>r.week===9).length);
 assert.equal(p.observedOriginalManagerStarts,p.starterReceipts.length);
 assert(Math.abs(p.observedOriginalManagerStarterPoints-
  (p.throughWeek8Points+p.week9Points))<=.011,'Weekly score reconciliation '+p.player);
 assert(p.starterReceipts.every(r=>r.manager===p.manager&&r.playerId===p.playerId&&r.rosterId===p.rosterId));
 if(p.keeper)assert.equal(p.pilotThroughWeek8,null);
 else assert(p.pilotThroughWeek8,'Original nonkeeper missing pilot: '+p.overall);
}
const rawTotals=w9.picks.reduce((sum,p)=>sum+p.observedOriginalManagerStarts,0);
assert.equal(rawTotals,w9.coverage.matchedOriginalDraftStarterSlots);
const Woody=w9.picks.find(x=>x.player==='Woody Marks'&&x.manager==='Stilly');
assert(Woody);
assert.equal(Woody.round,13);
assert.equal(Woody.overall,128);
assert.equal(Woody.observedOriginalManagerStarts,4);
assert.equal(Woody.observedOriginalManagerStarterPoints,33.8);
const keeperByManager=w9.managerRows.map(x=>x.keepers);
assert(keeperByManager.every(n=>n===2));
console.log('PASS Draft DNA: 1648 identifiable original selections, 2018 unsequenced, 150 Week 9 picks, 90 team-weeks, six preserved pilot conflicts.');
