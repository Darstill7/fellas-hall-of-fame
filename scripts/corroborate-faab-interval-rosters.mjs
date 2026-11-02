// Compare event-bounded acquisition intervals with scored weekly roster observations.
// A weekly lineup is evidence for that week, not confirmation of possession between weeks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildObservedIntervals} from './faab-observed-intervals.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const rows=[],coverage=[];
for(let year=2020;year<=2026;year++){
 const transactions=[];
 for(let week=1;week<=(year===2026?8:18);week++)
  transactions.push(...read('data-integrity/provider-recovered-transactions-'+year+'-week'+week+'.json').transactions);
 const intervals=buildObservedIntervals(transactions,year);
 const snapshots=new Map();
 for(let week=1;week<=(year===2020?13:year===2026?7:14);week++){
  let path='data/sleeper_roster_snapshots_'+year+'_week'+week+'.json';
  const alt='data/war_rosters_'+year+'_week'+week+'.json';
  if(year===2025&&(week===1||week===7)&&fs.existsSync(alt))path=alt;
  if(!fs.existsSync(path))continue;
  const raw=read(path),rosters=Array.isArray(raw)?raw:raw.rosters;
  if(!Array.isArray(rosters))continue;
  const owner=new Map();
  for(const roster of rosters){
   const team=String(roster.teamId??roster.id);
   for(const player of [...(roster.starters??[]),...(roster.bench??[])]){
    if(player.id==null||String(player.id)==='0')continue;
    const id=String(player.id);
    assert.ok(!owner.has(id),'Conflicting snapshot owner '+year+'/'+week+'/'+id);
    owner.set(id,{team,started:(roster.starters??[]).some(p=>String(p.id)===id)});
   }
  }
  snapshots.set(week,owner);
 }
 let supported=0,contradicted=0,unobserved=0;
 for(const interval of intervals){
  const observations=[];
  // The transaction week may have been scored before claim processing; exclude it.
  for(const [week,owners] of snapshots){
   if(week<=interval.startWeek)continue;
   // Never use the week of a known ending transaction as proof of prior ownership.
   const endWeek=interval.endTimestamp===null?null:transactions.find(t=>
    t.status==='complete'&&interval.endTransactionIds.includes(String(t.transactionId)))?.week;
   if(endWeek!=null&&week>=endWeek)continue;
   const found=owners.get(interval.playerId);
   const status=found?(found.team===interval.teamId?'observed_on_acquiring_team':'observed_on_another_team'):'not_observed_on_scored_rosters';
   if(status==='observed_on_acquiring_team')supported++;
   else if(status==='observed_on_another_team')contradicted++;
   else unobserved++;
   observations.push({week,status,observedTeamId:found?.team??null,started:found?.started??null});
  }
  rows.push({year,playerId:interval.playerId,teamId:interval.teamId,
   startTransactionId:interval.startTransactionId,startWeek:interval.startWeek,
   endTimestamp:interval.endTimestamp,endReason:interval.endReason,
   observationStatus:observations.some(o=>o.status==='observed_on_another_team')?'conflicting_snapshot_owner':
    observations.some(o=>o.status==='observed_on_acquiring_team')?'some_weekly_support':'no_observed_support',
   observations,continuousOwnershipCertified:false,freeAgentAvailabilityCertified:false});
 }
 coverage.push({year,intervals:intervals.length,rosterWeeks:snapshots.size,
  observedAcquiringTeamPlayerWeeks: supported,observedOtherTeamPlayerWeeks:contradicted,
  playerWeeksWithoutRosterObservation:unobserved,certifiedContinuousIntervals:0});
}
const report={schema:'fellas-interval-roster-corroboration-v1',
 status:'research_only_weekly_observations_not_continuous_ownership',
 limitations:['Only weeks after acquisition and before the next observed player action are compared.',
 'A scored weekly roster is not a pre-claim roster or a verified instant-in-time availability snapshot.',
 'Not observed means unknown; other-team observations signal a chronology conflict requiring investigation.',
 'No continuous ownership or free-agent availability is certified.'],
 coverage,rows};
const dest='data-integrity/faab-interval-roster-corroboration-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(dest),report,'Interval corroboration stale');
else fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
console.log('Ownership interval roster crosscheck',rows.length,'intervals;',coverage.reduce((n,r)=>n+r.observedAcquiringTeamPlayerWeeks,0),'supported player-weeks,',coverage.reduce((n,r)=>n+r.observedOtherTeamPlayerWeeks,0),'conflicting player-weeks');
