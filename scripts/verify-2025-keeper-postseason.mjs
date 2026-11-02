// Verify original Sleeper 2025 postseason keeper starting receipts against draft archive.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const source=read('data-integrity/keeper-2025-playoff-started-receipts-v1.json');
const draft=read('data/v9_draft_engine.json').filter(x=>x.year===2025&&x.keeper);
assert.equal(source.rows.length,20);assert.equal(draft.length,20);
let totalStarts=0,totalPoints=0;
const rows=source.rows.map(r=>{
 const match=draft.filter(x=>(x.manager==='Tom'?'Thommy':x.manager)===r.manager&&x.player===r.player);
 assert.equal(match.length,1,'Unmatched keeper '+r.manager+'/'+r.player);
 const seen=new Set();let points=0;
 for(const receipt of r.starts){
  assert.ok([15,16,17].includes(receipt.week));
  assert.ok(!seen.has(receipt.week),'Duplicate keeper week '+r.player);
  seen.add(receipt.week);assert.ok(Number.isFinite(receipt.points));
  assert.ok(r.playerId,'Started keeper missing provider ID '+r.player);
  points+=receipt.points;
 }
 points=Math.round(points*100)/100;
 assert.ok(Math.abs(points-match[0].playoff_starter_points)<.011,
   'Postseason starter points differ for '+r.manager+'/'+r.player);
 assert.equal(r.starts.length,match[0].playoff_starts,
   'Postseason start count differs for '+r.manager+'/'+r.player);
 totalStarts+=r.starts.length;totalPoints+=points;
 return {manager:r.manager,player:r.player,playerId:r.playerId,verifiedStarts:r.starts.length,
  verifiedPoints:points,sourceWeeks:r.starts.map(x=>x.week),archivedPoints:match[0].playoff_starter_points,
  grade:null};
});
const result={schema:'fellas-2025-keeper-postseason-verification-v1',
 status:'20_of_20_archived_playoff_keeper_totals_match_original_sleeper_starters',
 scope:'2025 Sleeper weeks 15–17, original draft team roster starter records',
 totalKeeperStarts:totalStarts,totalKeeperStartedPoints:Math.round(totalPoints*100)/100,
 limitations:['Source is a compact excerpt of connected Sleeper historical rosters, not a signed raw provider response.',
 'This validates player starts/points only; it does not establish causal wins, replacement values, or keeper-deadline options.',
 'Keeper Decision and Overall Keeper Value remain null.'],rows};
const target='data-integrity/keeper-2025-postseason-verification-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),result);
else fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');
console.log('2025 keeper postseason receipts PASS: 20 keeper totals, '+totalStarts+' starts, '+result.totalKeeperStartedPoints+' pts');
