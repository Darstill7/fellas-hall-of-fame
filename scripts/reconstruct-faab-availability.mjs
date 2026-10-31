// Reconstruct historical waiver availability evidence without inventing free-agent snapshots.
// A completed Sleeper waiver is provider evidence of a successful claim, not evidence
// that some *other* player was freely acquirable at the same timestamp.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const seasons=[2020,2021,2022,2023,2024,2025,2026];
const rosterId=r=>r.teamId??r.id;
const rows=[],coverage=[];
for(const year of seasons){
 const provider=read('data-integrity/faab-provider-receipts-'+year+'.json');
 const archive=read('data/acquisitions_'+year+'.json');
 const txById=new Map(archive.weeks.flatMap(w=>w.tx).map(t=>[String(t.id),t]));
 const regularEnd=year===2026?7:year===2020?13:14;
 const snapshots=new Map();
 for(let week=1;week<=regularEnd;week++){
  const alt='data/war_rosters_'+year+'_week'+week+'.json';
  const primary='data/sleeper_roster_snapshots_'+year+'_week'+week+'.json';
  const file=year===2025&&(week===1||week===7)&&fs.existsSync(alt)?alt:primary;
  if(!fs.existsSync(file))continue;
  const data=read(file),rosters=Array.isArray(data)?data:data.rosters;
  if(!Array.isArray(rosters))continue;
  const owners=new Map(),seen=new Set();
  for(const r of rosters){
   const team=rosterId(r);assert.ok(team!=null,'Missing roster ID '+year+'/'+week);
   assert.ok(!owners.has(String(team)),'Duplicate team '+year+'/'+week+'/'+team);
   owners.set(String(team),r);
   for(const p of [...(r.starters??[]),...(r.bench??[])]){
    if(p.id==null)continue;
    const id=String(p.id);
    // A player on two teams in one snapshot makes ownership ambiguous.
    if(seen.has(id))throw Error('Duplicate cross-roster player '+year+'/'+week+'/'+id);
    seen.add(id);
   }
  }
  snapshots.set(week,rosters);
 }
 let total=0,matched=0,priorRostered=0,priorUnseen=0,unknown=0;
 for(const claim of provider.receipts){
  if(claim.type!=='waiver'||claim.status!=='complete')continue;
  total++;
  const archived=txById.get(String(claim.id));
  // Provider receipts without an archived winning add lack reliable player identity.
  if(!archived||!claim.playerMatch||!claim.rosterMatch){unknown++;continue;}
  matched++;
  for(const player of archived.players??[]){
   const playerId=String(player.id);
   // Same-week snapshots are NOT timestamps and cannot prove pre-claim ownership.
   const prior=claim.week-1;
   const rosterSet=snapshots.get(prior);
   let status='no_preclaim_snapshot';
   let priorTeamId=null;
   if(rosterSet){
    const holding=rosterSet.filter(r=>[...(r.starters??[]),...(r.bench??[])].some(p=>String(p.id)===playerId));
    assert.ok(holding.length<=1,'Ambiguous prior owner '+year+'/'+prior+'/'+playerId);
    if(holding.length){
     status='observed_on_roster_previous_week';
     priorTeamId=String(rosterId(holding[0]));priorRostered++;
    }else{status='not_observed_on_previous_week_rosters';priorUnseen++;}
   }
   rows.push({year,week:claim.week,transactionId:String(claim.id),playerId,
    acquiringRosterIds:claim.rosterIds,providerStatus:'complete',winningBid:claim.bid,
    precedingSnapshotWeek:rosterSet?prior:null,precedingRosterObservation:status,
    precedingTeamId:priorTeamId,
    exactPreclaimFreeAgentStatus:'not_reconstructed',
    claimAcceptanceEvidence:'provider_completed_waiver'});
  }
 }
 coverage.push({year,successfulClaimTransactions:total,transactionsWithArchivePlayerEvidence:matched,
  transactionsWithoutArchivePlayerEvidence:unknown,priorRostered,priorUnseen,
  snapshotsAvailable:snapshots.size,expectedRegularWeeks:regularEnd});
}
const report={schema:'fellas-faab-waiver-availability-evidence-v1',
 status:'historical_snapshot_context_only_no_verified_alternative_free_agents',
 notes:[
  'Completed waiver confirms acceptance of this acquired player, not who else was available.',
  'Previous-week snapshot only shows roster membership at that snapshot, NOT transaction-time availability.',
  'Not observed on previous-week roster does NOT mean a player was a free agent at claim time.',
  'Unknown is not zero; same-week snapshots are excluded to avoid temporal leakage.',
  'This file cannot produce a valid free-agent replacement baseline or manager skill ratings.'
 ],coverage,rows};
const target='data-integrity/faab-waiver-availability-evidence-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),report,'Availability evidence report stale');
else fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
console.log('FAAB availability evidence:',rows.length,'acquired player records; exact pre-claim alternatives unknown');
