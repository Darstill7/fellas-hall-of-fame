// Independently inspect the actual starter use of assets acquired in two keeper releases.
// Acquisition does not imply that the added asset was started or even present in the same weekly snapshot.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const drops=read('data-integrity/keeper-2025-abandonment-receipts-v1.json').rows;
const round=n=>Math.round(n*100)/100;
const rows=drops.map(d=>{
 const replacement=d.replacementAdded;
 assert.equal(replacement.length,1,'Expected one identified direct transaction acquisition');
 const player=replacement[0];
 const observations=[];
 for(let week=d.providerWeek;week<=14;week++){
  const path=week===7?'data/war_rosters_2025_week7.json':'data/sleeper_roster_snapshots_2025_week'+week+'.json';
  const raw=read(path);const team=(Array.isArray(raw)?raw:raw.rosters).find(r=>String(r.teamId??r.id)===String(d.originalManagerTeamId));
  assert.ok(team,'Missing drop-manager roster '+d.manager+' week '+week);
  const starters=(team.starters??[]).filter(p=>String(p.id)===player.id);
  const bench=(team.bench??[]).filter(p=>String(p.id)===player.id);
  assert.ok(starters.length+bench.length<=1);
  observations.push({week,started:starters.length===1,benched:bench.length===1,
   observedPoints:starters.length?starters[0].points:null,source:path});
 }
 return {manager:d.manager,droppedKeeper:d.keeper,directReplacement:player,
  providerDropWeek:d.providerWeek,observedReplacementStarterWeeks:observations.filter(o=>o.started).length,
  observedReplacementStartedPoints:round(observations.reduce((n,o)=>n+(o.started?o.observedPoints:0),0)),
  observations,injuryNecessityCertified:false,decisionTimeOpportunityCost:null,abandonmentPenalty:null};
});
const output={schema:'fellas-2025-keeper-abandonment-direct-replacements-v1',
 status:'verified_direct_replacement_starter_usage_not_causal_substitution',
 caveats:['Only the player acquired in the same completed transaction is studied; later substitutions or roster-space utility are not captured.',
 'Week-of-transaction snapshots can predate the transaction and are not evidence of immediate presence or absence.',
 'DEF points are not comparable to QB or RB points as positional replacement estimates.',
 'This audit does not authorize a keeper abandonment deduction or alter manager OVR.'],rows};
const target='data-integrity/keeper-2025-abandonment-direct-replacements-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),output);
else fs.writeFileSync(target,JSON.stringify(output,null,2)+'\n');
console.log('Keeper abandonment direct replacement audit PASS: '+rows.map(r=>r.manager+' '+r.observedReplacementStartedPoints+' pts').join(', '));
