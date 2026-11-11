// Reconstruct all ORIGINAL Fellas draft selections without inventing ESPN 2018 order.
// Node: node scripts/build-draft-dna-selection-vault.mjs > /tmp/fellas-draft-selections.json
import fs from 'node:fs';
import assert from 'node:assert/strict';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const espn=load('data/espn_draft_boards_named_2016_2019.json');
const sleeper=load('data/v9_draft_engine.json');
const board2026=load('data/fellas_2026_sleeper_draft_board_verified_v1.json');
const norm=m=>m==='Tom'?'Thommy':m==='EvansBrandon'?'Evans':m;
const rows=[];
for(const [y,season] of Object.entries(espn.seasons)){
 const year=Number(y),ordered=year!==2018;
 for(const p of season.playerPicks){
  if(ordered)assert(p.pickOrderVerified&&Number.isInteger(p.overall)&&Number.isInteger(p.round));
  else assert(!p.pickOrderVerified&&p.overall===null&&p.round===null,
   '2018 position-sorted source cannot imply draft order');
  rows.push({year,source:'verified-ESPN-draft-name-reconciliation',
   manager:norm(p.manager),sourceManager:p.manager,player:p.player,position:p.position,
   playerId:String(p.espnPlayerId),originalOverall:p.overall??null,round:p.round??null,
   keeper:false,keeperStatus:'not-used-for-era',
   orderConfidence:ordered?'independently-verified':'unverified-position-sorted-source',
   identityStatus:p.identityStatus,sourceRow:ordered?null:p.sourceRow,
   historicalManagerAttribution:'verified-original-selection',starterValueStatus:'not-yet-certified'});
 }
}
const canon2026=new Map(board2026.picks.map(p=>[p.overall,p]));
for(const pick of sleeper){
 const year=pick.year;assert(year>=2020&&year<=2026);
 const original=year===2026?canon2026.get(pick.overall):null;
 if(original){
  assert.equal(original.player,pick.player);
  assert.equal(norm(original.manager),norm(pick.manager));
  assert.equal(original.round,pick.round);
  assert.equal(Boolean(original.keeper),Boolean(pick.keeper));
 }
 rows.push({year,source:year===2026?'verified-2026-Sleeper-draft-board':'recovered-Sleeper-v9-draft-engine',
  manager:norm(pick.manager),sourceManager:pick.manager,player:pick.player,position:pick.position,
  playerId:original?String(original.playerId):null,originalOverall:pick.overall,round:pick.round,
  keeper:Boolean(pick.keeper),keeperStatus:year>=2025?'explicitly-classified':'source-flag-observed',
  orderConfidence:'verified-recovered-overall-draft-slot',
  identityStatus:original?'verified-stable-Sleeper-ID':'verified-original-selection-name',
  sourceRow:null,historicalManagerAttribution:'recovered-original-selection',
  starterValueStatus:year===2026?'can-rebuild-through-week-9':'requires-per-week-original-manager-proof',
  legacyObservedDraftPoints:pick.reg_starter_points,
  legacyObservedDraftStarts:pick.reg_starts,
  legacyPeerSurplus:pick.surplus});
}
rows.sort((a,b)=>a.year-b.year||(a.originalOverall??9999)-(b.originalOverall??9999)||
 (a.sourceRow??0)-(b.sourceRow??0));
const perYear=[];
for(let year=2016;year<=2026;year++){
 const picks=rows.filter(r=>r.year===year);
 const expected=year===2016?128:year===2017||year===2018?160:150;
 assert.equal(picks.length,expected,'Missing draft pick year '+year);
 const ordered=picks.filter(x=>Number.isInteger(x.originalOverall));
 assert.equal(new Set(ordered.map(x=>x.originalOverall)).size,ordered.length,
  'Duplicate overall selection '+year);
 if(year===2018)assert(!ordered.length,'2018 pick-order fabricated');
 else assert.equal(ordered.length,expected);
 perYear.push({year,picks:picks.length,orderedPicks:ordered.length,
  unverifiedOrderPicks:picks.length-ordered.length,keeperSelections:picks.filter(x=>x.keeper).length,
  uniqueDraftingManagers:new Set(picks.map(x=>x.manager)).size,
  playerNamesKnown:picks.filter(x=>x.player).length,
  stableIdsKnown:picks.filter(x=>x.playerId).length,
  sourceFamily:year<=2019?'ESPN':'Sleeper'});
}
const summary={
 schema:'fellas-original-draft-selection-vault-v1',
 status:'research-only-canonical-source-reconstruction',
 asOf:'2026-11-11',sourcePaths:['data/espn_draft_boards_named_2016_2019.json',
  'data/v9_draft_engine.json','data/fellas_2026_sleeper_draft_board_verified_v1.json'],
 coverage:{years:perYear.length,totalOriginalSelections:rows.length,
  orderedSelections:rows.filter(x=>x.originalOverall!==null).length,
  unverifiedOrderSelections:rows.filter(x=>x.originalOverall===null).length,
  knownPlayerNames:rows.filter(x=>x.player).length,
  espnSelections:rows.filter(x=>x.year<=2019).length,
  sleeperSelections:rows.filter(x=>x.year>=2020).length,
  completedSeasonSelections:rows.filter(x=>x.year<=2025).length,
  currentSeasonSelections:rows.filter(x=>x.year===2026).length},
 rules:['2018 160 ESPN picks are verified player/manager identifications only; no round or overall draft order is inferred',
  'The same player selected in different years is a new independent annual selection, not a duplicate record',
  'Historical EvansBrandon belongs to Evans; current Tom display alias is Thommy, and Schermerhorn is distinct',
  'Keeper flag indicates a player assigned a retained draft slot and must not be counted as a new player discovery',
  'Legacy 2020–2024 surplus cannot be pooled into 2025/2026 peer-median model without recalibration',
  'Legacy scored starts are not independently revalidated here; additional source-based per-week ledger required'],perYear,picks:rows};
assert.equal(summary.coverage.totalOriginalSelections,1648);
assert.equal(summary.coverage.orderedSelections,1488);
assert.equal(summary.coverage.unverifiedOrderSelections,160);
assert.equal(summary.coverage.espnSelections,598);
assert.equal(summary.coverage.sleeperSelections,1050);
console.log(JSON.stringify(summary,null,2));
