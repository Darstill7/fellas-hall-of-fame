// Independent Week 8 FAAB outcome supplement, not a modification of the
// established through-Week-7 research baseline and NOT a manager skill grade.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const base=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
const roster=read('data/sleeper_roster_snapshots_2026_week8.json');
const claims=base.observations.filter(r=>r.year===2026&&r.claimWeek<=7);
assert.equal(base.status,'research_only_not_causal_or_skill_grade');
assert.equal(base.coverage.find(x=>x.year===2026).regularSeasonWeekLimit,7);
assert.equal(roster.season,2026);assert.equal(roster.week,8);
assert.equal(roster.rosters.length,10);
const t=read('data-integrity/provider-recovered-transactions-2026-week8.json');
assert.equal(t.week,8);
assert.equal(t.year,2026);
assert.equal(t.coverageStatus,'provider_week_sample_not_crosschecked_for_completeness',
 'Reassess FAAB continuity certification when Week 8 transaction coverage changes');
const events=t.transactions.filter(e=>e.status==='complete');
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const rows=[],seen=new Set();
for(const c of claims){
 const key=[c.transactionId,c.teamId,c.playerId].join('|');
 assert.ok(!seen.has(key),'Duplicate original FAAB claim '+key);seen.add(key);
 assert.ok(c.claimWeek<=7,'Week 8 claims have no completed next-week production yet');
 // Any completed Week 8 ownership event involving the player makes an
 // end-of-week observation insufficient to establish uninterrupted ownership.
 const laterEvent=events.filter(e=>[...(e.added??[]),...(e.dropped??[])].some(p=>String(p.id)===String(c.playerId)));
 const ownershipEvidence=roster.rosters.flatMap(team=>[
  ...team.starters.map(p=>({...p,started:true})),
  ...team.bench.map(p=>({...p,started:false}))
 ].filter(p=>String(p.id)===String(c.playerId)).map(p=>({...p,rosterTeamId:String(team.teamId)})));
 assert.ok(ownershipEvidence.length<=1,'Player appears on multiple Week 8 teams '+c.playerId);
 const observed=ownershipEvidence[0];
 const sameTeam=observed?.rosterTeamId===String(c.teamId);
 const previouslyCensored=c.firstSubsequentOwnershipEventWeek!==null&&c.firstSubsequentOwnershipEventWeek<=8;
 const safe=!!observed&&sameTeam&&!previouslyCensored&&laterEvent.length===0&&Number.isFinite(observed.points);
 rows.push({transactionId:c.transactionId,claimWeek:c.claimWeek,teamId:c.teamId,playerId:c.playerId,
  playerName:c.playerName,week:8,source:'data/sleeper_roster_snapshots_2026_week8.json',
  status:safe?'observed_same_team_week8_without_recorded_intervening_event':
   laterEvent.length?'censored_week8_transaction':
   previouslyCensored?'censored_prior_transaction':
   !observed?'not_observed_week8':!sameTeam?'different_team_week8':'insufficient_points_evidence',
  started:safe?observed.started:null,observedPoints:safe?round(observed.points):null,
  completedWeek8OwnershipEvents:laterEvent.length,
  transactionSourceCoverage:t.coverageStatus,continuousOwnershipCertified:false,
  certifiedIncrementalValue:null,managerSkillGrade:null});
}
assert.equal(rows.length,claims.length);
const credited=rows.filter(r=>r.observedPoints!==null);
const report={schema:'fellas-faab-2026-week8-supplement-v1',season:2026,week:8,
 status:'research_only_week8_observation_no_skill_grade',sourceScope:'previously archived eligible claim cohort only',
 week8TransactionCoverage:t.coverageStatus,ownershipContinuityCertified:false,
 limitations:['The recovered Week 8 transaction data is a provider sample, not independently checked for completeness; no ownership continuity is certified',
  'Week 8 claims are not evaluated until an eligible later completed scoring week',
  'Prior complete transactions censor claims; same-team membership alone cannot establish complete ownership continuity',
  'Player points are not points above an actual available replacement and do not establish FAAB decision skill',
  'Week 9 waivers and scoring are excluded; the established FAAB Week 1-7 pipeline remains unchanged'],
 coverage:{priorClaimRows:claims.length,week8ObservedWithoutInterveningTransaction:credited.length,
  week8ScoredStartedObservations:credited.filter(r=>r.started).length,
  week8ObservedStartedPoints:round(credited.filter(r=>r.started).reduce((n,r)=>n+r.observedPoints,0)),
  certifiedAttributableWeek8Points:null},
 rows};
const target='data-integrity/faab-2026-week8-supplement-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),report);
else fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
console.log('Week 8 FAAB supplement PASS: '+credited.length+'/'+claims.length+' prior claim observations, no grade');
