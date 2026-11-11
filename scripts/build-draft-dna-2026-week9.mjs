// Draft DNA, source-verified 2026 through Week 9: every original pick, keeper,
// starter point and historical pilot discrepancy. Research-only; no rankings promoted.
// Run: node scripts/build-draft-dna-2026-week9.mjs > /tmp/draft-dna-2026-w9.json
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const board=read('data/fellas_2026_sleeper_draft_board_verified_v1.json');
const starts=read('data/player_starts_2026.json');
const pilot=read('data/draft_keeper_value_pilot_2025_2026w8_v1.json');
const engine=read('data/v9_draft_engine.json').filter(p=>p.year===2026);
const normal=x=>x==='Tom'?'Thommy':x;
const cents=x=>Math.round(Number(x)*100),points=x=>Math.round(x)/100;
const sourcePaths=['data/fellas_2026_sleeper_draft_board_verified_v1.json',
 'data/player_starts_2026.json','data/draft_keeper_value_pilot_2025_2026w8_v1.json',
 'data/v9_draft_engine.json'];
assert.equal(board.picks.length,150);
assert.equal(engine.length,150);
assert.equal(starts.weeks.length,9);
assert.deepEqual(starts.weeks.map(x=>x.week),[1,2,3,4,5,6,7,8,9]);
const engineByOverall=new Map(engine.map(x=>[x.overall,x]));
const pilots=pilot.draftPicks.filter(x=>x.year===2026);
assert.equal(pilots.length,130);
const originalByPlayer=new Map(board.picks.map(p=>[String(p.playerId),p]));
assert.equal(originalByPlayer.size,150,'Unique drafted player IDs required');
const rosterByOwner=new Map(Object.entries(board.managerByRosterId).map(([roster,manager])=>[String(roster),normal(manager)]));
const lineupRows=[];
for(const w of starts.weeks){
 assert.equal(w.teams.length,10,'Missing scored team-week '+w.week);
 const seenRoster=new Set();
 for(const t of w.teams){
  const roster=String(t.roster),manager=rosterByOwner.get(roster);
  assert(manager,'Unknown roster '+roster);
  assert(!seenRoster.has(roster),'Duplicate scored roster '+w.week+'/'+roster);
  seenRoster.add(roster);
  for(const [playerId,player,position,score] of t.players){
   assert(Number.isFinite(score),'Invalid score '+w.week+'/'+player);
   lineupRows.push({week:w.week,rosterId:roster,manager,playerId:String(playerId),
    player,position,scoredPoints:score,pointsCents:cents(score)});
  }
 }
}
const lineupByDraftPlayer=new Map();
for(const row of lineupRows){
 const pick=originalByPlayer.get(row.playerId);
 if(!pick||String(pick.rosterId)!==row.rosterId)continue;
 if(!lineupByDraftPlayer.has(row.playerId))lineupByDraftPlayer.set(row.playerId,[]);
 lineupByDraftPlayer.get(row.playerId).push(row);
}
const full=[];
for(const p of board.picks){
 const old=engineByOverall.get(p.overall);
 assert(old,'Missing source draft-engine slot '+p.overall);
 assert.equal(old.player,p.player,'Player mismatch at draft slot '+p.overall);
 assert.equal(normal(old.manager),normal(p.manager),'Manager mismatch '+p.overall);
 assert.equal(old.round,p.round);
 assert.equal(Boolean(old.keeper),Boolean(p.keeper));
 const playerId=String(p.playerId),observed=lineupByDraftPlayer.get(playerId)||[];
 const all=observed.sort((a,b)=>a.week-b.week);
 const oldWeeks=all.filter(x=>x.week<=8);
 const current=all.filter(x=>x.week===9);
 const sum=rows=>rows.reduce((n,r)=>n+r.pointsCents,0);
 const pilotPick=pilots.find(x=>x.manager===p.manager&&x.player===p.player&&x.round===p.round);
 if(!p.keeper)assert(pilotPick,'Nonkeeper absent from pilot: '+p.overall);
 else assert(!pilotPick,'Keeper wrongly graded as new nonkeeper: '+p.overall);
 full.push({year:2026,overall:p.overall,round:p.round,manager:normal(p.manager),player:p.player,
  playerId,position:p.position,keeper:!!p.keeper,rosterId:String(p.rosterId),
  currentStatus:'through-week-9-not-final',
  observedOriginalManagerStarts:all.length,observedOriginalManagerStarterPoints:points(sum(all)),
  throughWeek8Starts:oldWeeks.length,throughWeek8Points:points(sum(oldWeeks)),
  week9Starts:current.length,week9Points:points(sum(current)),
  starterReceipts:all.map(x=>({week:x.week,playerId:x.playerId,position:x.position,
   rosterId:x.rosterId,manager:x.manager,points:x.scoredPoints})),
  pilotThroughWeek8:pilotPick?{starts:pilotPick.starts,points:pilotPick.startedPoints,
   peerSurplus:pilotPick.pointsAbovePeerMedian,peerCount:pilotPick.peerCount}:null,
  sourceConfidence:'exact-original-draft-player-ID-and-matched-starting-roster',
  exclusions:'Bench, other roster after trade, unverified unplayed weeks and waiver additions never credited'});
}
const divergences=full.filter(x=>x.pilotThroughWeek8&&
 (x.pilotThroughWeek8.starts!==x.throughWeek8Starts||
  Math.abs(cents(x.pilotThroughWeek8.points)-cents(x.throughWeek8Points))>1))
 .map(x=>({year:2026,overall:x.overall,round:x.round,manager:x.manager,player:x.player,
  playerId:x.playerId,pilot:x.pilotThroughWeek8,
  reconstructed:{starts:x.throughWeek8Starts,points:x.throughWeek8Points},
  deltaPoints:points(cents(x.throughWeek8Points)-cents(x.pilotThroughWeek8.points)),
  weekReceipts:x.starterReceipts.filter(r=>r.week<=8),
  classification:'source-conflict-requires-manual-adjudication'}));
const managerRows=[...new Set(full.map(x=>x.manager))].sort().map(manager=>{
 const selected=full.filter(x=>x.manager===manager);
 return {manager,originalPicks:selected.length,keepers:selected.filter(x=>x.keeper).length,
  newlySelectedNonkeepers:selected.filter(x=>!x.keeper).length,
  originalManagerStarts:selected.reduce((n,x)=>n+x.observedOriginalManagerStarts,0),
  originalManagerStarterPoints:points(selected.reduce((n,x)=>n+cents(x.observedOriginalManagerStarterPoints),0)),
  week9StarterPoints:points(selected.reduce((n,x)=>n+cents(x.week9Points),0)),
  pilotDiscrepancies:divergences.filter(d=>d.manager===manager).length,
  byRound:[...new Set(selected.map(x=>x.round))].sort((a,b)=>a-b).map(round=>{
   const picks=selected.filter(x=>x.round===round);
   return {round,points:points(picks.reduce((n,x)=>n+cents(x.observedOriginalManagerStarterPoints),0)),
    originals:picks.length,keepers:picks.filter(x=>x.keeper).length};
  })};
});
const topByStartedPoints=full.filter(x=>!x.keeper)
 .sort((a,b)=>b.observedOriginalManagerStarterPoints-a.observedOriginalManagerStarterPoints||
 a.overall-b.overall).slice(0,20)
 .map(x=>({overall:x.overall,round:x.round,manager:x.manager,player:x.player,
  startedPoints:x.observedOriginalManagerStarterPoints,starts:x.observedOriginalManagerStarts}));
const result={schema:'fellas-draft-dna-2026-week9-original-manager-starter-receipts-v1',
 status:'provisional-source-matched-not-published',asOf:'2026-11-11',sourcePaths,
 coverage:{picks:full.length,nonKeeperPicks:full.filter(x=>!x.keeper).length,
  keeperPicks:full.filter(x=>x.keeper).length,playedWeeks:starts.weeks.length,
  scoredTeamWeeks:starts.weeks.reduce((n,w)=>n+w.teams.length,0),
  totalRecordedStarterSlots:lineupRows.length,
  matchedOriginalDraftStarterSlots:full.reduce((n,x)=>n+x.observedOriginalManagerStarts,0),
  pilotDivergences:divergences.length},
 rules:['Original draft manager gets credit only when the same stable player ID appears as a scored starter on that original manager roster',
  'Draft selection is not proof of subsequent roster ownership; this ledger only observes original-manager starts',
  'Keepers retain all observed starter receipts but are excluded from new-draft value rankings',
  '2026 Week 9 is a current partial-season cutoff; no final manager grade or annual draft score',
  'Do not overwrite the Week 8 pilot where its score conflicts until adjudication of scored lineup receipts',
  '2020–2024 legacy surplus is not cross-model comparable with 2025/2026 peer-medians',
  'ESPN 2018 overall selection order remains unverified'],managerRows,topByStartedPoints,
 pilotConflicts:divergences,picks:full};
assert.equal(result.coverage.picks,150);
assert.equal(result.coverage.keeperPicks,20);
assert.equal(result.coverage.nonKeeperPicks,130);
assert.equal(result.coverage.scoredTeamWeeks,90);
assert.equal(result.coverage.pilotDivergences,6);
console.log(JSON.stringify(result,null,2));
