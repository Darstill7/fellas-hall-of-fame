// Snapshot corroboration only: weekly scored rosters are not exact transaction-time rosters.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const evidence=read('data-integrity/faab-observed-ownership-events-v1.json');
assert.equal(evidence.status,'partial_event_ledger_not_certified_availability');
const results=[],coverage=[];
for(const year of [2020,2021,2022,2023,2024,2025,2026]){
 let found=0,missing=0,conflicts=0,notObserved=0;
 const end=year===2026?8:year===2020?13:14;
 for(let week=1;week<=end;week++){
  const alt='data/war_rosters_'+year+'_week'+week+'.json';
  const normal='data/sleeper_roster_snapshots_'+year+'_week'+week+'.json';
  const path=year===2025&&(week===1||week===7)&&fs.existsSync(alt)?alt:normal;
  if(!fs.existsSync(path)){missing++;continue;}
  const raw=read(path),rosters=Array.isArray(raw)?raw:raw.rosters;
  if(!Array.isArray(rosters)){missing++;continue;}
  const rosterOwners=new Map();
  for(const r of rosters){
   const id=String(r.teamId??r.id);
   for(const p of [...(r.starters??[]),...(r.bench??[])]){
    const pid=String(p.id);
    assert.ok(!rosterOwners.has(pid),'Duplicate roster ownership '+year+'/'+week+'/'+pid);
    rosterOwners.set(pid,id);
   }
  }
  // Only compare latest completed adds before the snapshot week.
  const actions=evidence.rows.filter(e=>e.year===year&&e.week<week&&e.action==='add');
  const latest=new Map();
  for(const e of actions)if(!latest.has(e.playerId)||e.timestamp>latest.get(e.playerId).timestamp)latest.set(e.playerId,e);
  for(const e of latest.values()){
   const observed=rosterOwners.get(e.playerId)??null;
   let state='not_observed_on_scored_roster';
   if(observed===e.teamId&&e.teamId!==null){state='observed_same_team';found++;}
   else if(observed!==null&&observed!==e.teamId){state='different_team_observed';conflicts++;}
   else notObserved++;
   results.push({year,week,playerId:e.playerId,lastAddTransactionId:e.transactionId,claimedTeamId:e.teamId,rosterTeamId:observed,observation:state,ownershipCertified:false});
  }
 }
 coverage.push({year,availableScoredWeeks:end-missing,missingScoredWeeks:missing,matchingObservations:found,differentTeamObservations:conflicts,notObserved});
}
const out={schema:'fellas-ownership-weekly-corroboration-v1',status:'research_only_no_transaction_time_certification',
 caveat:'Latest prior add is NOT necessarily current owner: drops, trades, keeper carryover, snapshot time and same-timestamp events can intervene. Mismatches are investigation flags, not source errors.',coverage,observations:results};
fs.writeFileSync('data-integrity/faab-ownership-weekly-corroboration-v1.json',JSON.stringify(out,null,2)+'\n');
console.log('Weekly ownership corroboration',coverage);
