// Descriptive 2025 position-normalized keeper starter production, not certified replacement value.
// Avoid using the draft engine's unrelated baseline/surplus/grade as keeper skill.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const all=read('data/v9_draft_engine.json').filter(p=>p.year===2025);
const keepers=all.filter(p=>p.keeper);
assert.equal(keepers.length,20);
const median=arr=>{const s=[...arr].sort((a,b)=>a-b);return s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2};
const round=n=>Math.round(n*100)/100;
const rows=keepers.map(k=>{
 const peers=all.filter(p=>!p.keeper&&p.position===k.position&&Number.isFinite(p.reg_starter_points));
 const sample=peers.length;
 const medianPoints=sample>=3?round(median(peers.map(p=>p.reg_starter_points))):null;
 return {manager:k.manager==='Tom'?'Thommy':k.manager,player:k.player,position:k.position,round:k.round,
  starts:k.reg_starts,startedPoints:k.reg_starter_points,observedNonkeeperPositionSample:sample,
  observedNonkeeperPositionMedianStartedPoints:medianPoints,
  descriptiveDifferenceFromPositionMedian:medianPoints===null?null:round(k.reg_starter_points-medianPoints),
  rosterSlotAdjustedReplacementPoints:null,exAnteKeeperDecisionValue:null,certifiedOverallKeeperValue:null};
});
const output={schema:'fellas-keeper-2025-position-peer-context-v1',status:'retrospective_drafted_player_position_context_only',
 limitations:['This is an observational median of nonkeeper drafted players at the same position, not a waiver replacement or feasible contemporaneous substitute.',
 'Actual positional starter supply and FLEX demand are not reconstructed by this cohort.',
 'Player totals reflect original drafting team starter contribution; player movement may change opportunity sets.',
 'Draft cost, injury expectations, keeper deadline alternatives, and playoff performance are not included.',
 'No Keeper Decision or Overall Keeper Value grade is authorized.'],rows};
const path='data-integrity/keeper-2025-position-peer-context-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(path),output);
else fs.writeFileSync(path,JSON.stringify(output,null,2)+'\n');
console.log('Keeper position-peer context: '+rows.length+' records, '+rows.filter(r=>r.observedNonkeeperPositionMedianStartedPoints!==null).length+' with position medians; grades unassigned');
