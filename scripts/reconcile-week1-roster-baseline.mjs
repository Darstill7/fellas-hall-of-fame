// Reconcile Week 1 observed rosters against pre/through-Week-1 provider transactions.
// A Week 1 scored roster is NOT a draft-night snapshot and never certifies opening ownership.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const rows=[],coverage=[];
for(let year=2020;year<=2026;year++){
 const weekPath='data/sleeper_roster_snapshots_'+year+'_week1.json';
 const alternative='data/war_rosters_'+year+'_week1.json';
 const path=fs.existsSync(weekPath)?weekPath:alternative;
 if(!fs.existsSync(path)){coverage.push({year,snapshotPresent:false});continue;}
 const raw=read(path),rosters=Array.isArray(raw)?raw:raw.rosters;
 assert.ok(Array.isArray(rosters),'Missing Week 1 rosters '+year);
 const source=read('data-integrity/provider-recovered-transactions-'+year+'-week1.json');
 const changed=new Map(),timestamped=new Set(),ids=new Set(),teams=new Set();
 for(const tx of source.transactions){
  if(tx.status!=='complete')continue;
  for(const p of [...(tx.added??[]),...(tx.dropped??[])]){
   const id=String(p.id);
   if(!changed.has(id))changed.set(id,[]);
   changed.get(id).push({transactionId:String(tx.transactionId),type:tx.type,timestamp:tx.timestamp});
   timestamped.add(id);
  }
 }
 let observed=0,transactionTouched=0,unaffected=0;
 for(const roster of rosters){
  const team=String(roster.teamId??roster.id);
  assert.ok(team && team!=='undefined','Unidentified Week 1 team '+year);
  assert.ok(!teams.has(team),'Duplicate team in Week 1 '+year+'/'+team);teams.add(team);
  const within=new Set();
  for(const player of [...(roster.starters??[]),...(roster.bench??[])]){
   if(player.id==null || (player.empty===true&&String(player.id)==='0'))continue;
   const id=String(player.id);
   assert.ok(id!=='0','Invalid real player ID '+year);
   assert.ok(!within.has(id),'Duplicate on roster '+year+'/'+team+'/'+id);within.add(id);
   assert.ok(!ids.has(id),'Player appears on different teams '+year+'/'+id);ids.add(id);
   const actions=changed.get(id)??[];
   const classification=actions.length?'week1_transaction_touched':'week1_observed_no_recovered_week1_change';
   if(actions.length)transactionTouched++;else unaffected++;
   rows.push({year,week:1,teamId:team,playerId:id,playerName:player.name??null,
    position:player.position??null,classification,relatedWeek1Transactions:actions,
    draftNightOwnerVerified:false,preclaimAvailabilityVerified:false});
   observed++;
  }
 }
 coverage.push({year,snapshotPresent:true,teamCount:teams.size,observedUniquePlayerIds:observed,
   week1TransactionTouchedPlayers:transactionTouched,withoutRecoveredWeek1Change:unaffected,
   providerWeek1CoverageStatus:source.coverageStatus??'unknown',
   draftNightOwnershipCertified:false});
}
const report={schema:'fellas-week1-roster-baseline-research-v1',status:'week1_scored_roster_observations_not_opening_draft_ownership',
 caveats:['Week 1 scored snapshots are not dated draft-night ownership records.',
 'A player without a recovered Week 1 transaction can still have changed teams before the snapshot.',
 'Missing players do not establish free-agent availability.',
 'Transaction week grouping does not establish before/after the Week 1 lineup lock.',
 'No rows are eligible to seed exact-time ownership or certified FAAB alternatives.'],coverage,rows};
const target='data-integrity/week1-roster-baseline-research-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),report,'Week 1 baseline research is stale');
else fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
console.log('Week 1 observed baseline',rows.length,'player-team observations; opening ownership unverified');
