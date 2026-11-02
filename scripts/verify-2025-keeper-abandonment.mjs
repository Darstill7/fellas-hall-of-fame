// Keeper abandonment evidence: explicit completed drop receipts, not trades.
// The cost of a dropped keeper is a separate decision dimension, not an automatic grade deduction.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const picks=read('data/v9_draft_engine.json').filter(x=>x.year===2025&&x.keeper);
const matches=[{manager:'Birch',player:'Brian Robinson',playerId:'8154',teamId:'10',week:3,transactionId:'1276366260652736512'},
 {manager:'Kuhl',player:'Jared Goff',playerId:'3163',teamId:'9',week:4,transactionId:'1278720074449977344'}];
const rows=matches.map(m=>{
 const k=picks.filter(p=>p.manager===m.manager&&p.player===m.player&&String(p.team_id)===m.teamId);
 assert.equal(k.length,1);
 const transactions=read('data-integrity/provider-recovered-transactions-2025-week'+m.week+'.json').transactions;
 const t=transactions.find(x=>x.transactionId===m.transactionId);
 assert.ok(t&&t.status==='complete'&&['waiver','add'].includes(t.type));
 assert.ok(t.teamIds.map(String).includes(m.teamId));
 assert.ok(t.dropped.some(x=>String(x.id)===m.playerId),'Keeper release absent: '+m.player);
 assert.ok(!t.added.some(x=>String(x.id)===m.playerId));
 return {manager:m.manager,keeper:m.player,playerId:m.playerId,originalManagerTeamId:m.teamId,
  forfeitedKeeperRound:k[0].round,transactionId:t.transactionId,providerWeek:m.week,
  providerTimestampMs:t.timestamp,utcDate:t.date,replacementAdded:t.added.map(x=>({player:x.name,position:x.position,id:String(x.id)})),
  verifiedDisposition:'completed_drop_not_trade',dropTimingEvidenceVerified:true,
  injuryOrRosterNecessityVerified:false,netOpportunityCost:null,
  suggestedPenaltyPoints:null,keeperDecisionGrade:null};
});
const report={schema:'fellas-2025-keeper-abandonment-receipts-v1',status:'completed_drops_verified_penalty_not_certified',
 policy:{name:'Keeper abandonment adjustment',application:'Separate keeper decision component; never silently subtract twice for low production.',
  principle:'Evaluate foregone keeper asset, early release and whether replacement or necessity justified it; no fixed penalty solely from a drop.',
  caps:'Any future adjustment must be bounded within the keeper decision subgrade and not directly alter legacy OVR without certification.'},
 limits:['Two independently identified keeper drops are certified, not a comprehensive enumeration of all releases.',
  'The waiver transaction completion timestamp is UTC; the member-local calendar date may differ.',
  'Player injury, alternative opportunity, and manager rationale were not recovered.'],rows};
const path='data-integrity/keeper-2025-abandonment-receipts-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(path),report);
else fs.writeFileSync(path,JSON.stringify(report,null,2)+'\n');
console.log('2025 keeper abandonment: 2 verified non-trade drops; no speculative grade penalty');
