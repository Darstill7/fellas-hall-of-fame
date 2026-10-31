// FAAB acquisition outcome observatory. Research-only: not causal WAR or manager skill.
// Run: node scripts/analyze-faab-acquisition-value.mjs [--check]
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const has=p=>fs.existsSync(p);
const years=[2020,2021,2022,2023,2024,2025,2026];
const observations=[],coverage=[];
const rosterId=r=>r.teamId??r.id;
const observedKeys=new Set();
for(const year of years){
 const provider=read('data-integrity/faab-provider-receipts-'+year+'.json');
 const archive=read('data/acquisitions_'+year+'.json');
 const archivedById=new Map(archive.weeks.flatMap(x=>x.tx).map(tx=>[String(tx.id),tx]));
 const maxWeek=year===2026?7:(year===2020?13:14);
 const weeks=new Map();
 for(let week=1;week<=maxWeek;week++){
  const fallback='data/sleeper_roster_snapshots_'+year+'_week'+week+'.json';
  const alternate='data/war_rosters_'+year+'_week'+week+'.json';
  const path=year===2025&&(week===1||week===7)&&has(alternate)?alternate:fallback;
  if(!has(path))continue;
  const j=read(path);const rosters=Array.isArray(j)?j:j.rosters;
  if(!Array.isArray(rosters))continue;
  const teams=new Set();
  for(const roster of rosters){
   const id=rosterId(roster);
   assert.ok(id!==undefined&&id!==null,'Roster missing season-local identifier '+year+' week '+week);
   assert.ok(!teams.has(String(id)),'Duplicate roster team '+year+' week '+week+' '+id);
   teams.add(String(id));
  }
  weeks.set(week,rosters);
 }
 let completed=0,eligible=0,withAnyObservation=0;
 for(const claim of provider.receipts){
  if(claim.type!=='waiver'||claim.status!=='complete')continue;
  completed++;
  const archived=archivedById.get(String(claim.id));
  // Only archived receipts contain player metadata. Provider-only receipts
  // remain unscored; do not guess player, manager, add/drop chronology or points.
  if(!archived||!claim.rosterMatch||!claim.playerMatch)continue;
  if(claim.rosterIds.length!==1)continue; // multi-team ambiguity
  const teamId=String(claim.rosterIds[0]);
  for(const player of archived.players??[]){
   const playerId=String(player.id);
   const startWeek=claim.week+1; // avoids counting points from acquisition's processing week
   // Distinguish observed performance from season-long ownership.
   const rows=[];
   const observedOwnerHandles=new Set();
   for(let week=startWeek;week<=maxWeek;week++){
    const roster=weeks.get(week)?.find(x=>String(rosterId(x))===teamId);
    if(!roster)continue;
    const starters=Array.isArray(roster.starters)?roster.starters:[];
    const bench=Array.isArray(roster.bench)?roster.bench:[];
    const matchStart=starters.find(x=>String(x.id)===playerId);
    const matchBench=bench.find(x=>String(x.id)===playerId);
    const match=matchStart??matchBench;
    if(!match||!Number.isFinite(match.points))continue;
    if(typeof roster.owner==='string'&&roster.owner.trim())observedOwnerHandles.add(roster.owner.trim());
    const rowKey=year+'|'+claim.id+'|'+teamId+'|'+playerId+'|'+week;
    assert.ok(!observedKeys.has(rowKey),'Duplicate acquisition observation '+rowKey);
    observedKeys.add(rowKey);
    rows.push({week,points:+match.points.toFixed(2),started:!!matchStart});
   }
   eligible++;
   if(rows.length)withAnyObservation++;
   const startRows=rows.filter(x=>x.started);
   observations.push({
    year,transactionId:String(claim.id),claimWeek:claim.week,teamId,
    playerId,playerName:player.name??null,position:player.position??null,
    bid:claim.bid,scope:'post_claim_week_conservative',
    observedOwnerHandle:observedOwnerHandles.size===1?[...observedOwnerHandles][0]:null,
    ownerIdentityStatus:observedOwnerHandles.size===1?'single_observed_roster_owner_handle':observedOwnerHandles.size>1?'conflicting_owner_handles':'unobserved',
    outcomeStatus:rows.length?'observed_rostered_production':'unobserved_or_not_held',
    observedWeeks:rows.length,startedWeeks:startRows.length,
    rosteredPoints:+rows.reduce((n,x)=>n+x.points,0).toFixed(2),
    startedPoints:+startRows.reduce((n,x)=>n+x.points,0).toFixed(2),
    weeks:rows
   });
  }
 }
 coverage.push({year,completedClaims:completed,playerClaimsWithArchiveMetadata:eligible,playerClaimsWithObservedWeeks:withAnyObservation,weeklyRosterWeeksAvailable:weeks.size,regularSeasonWeekLimit:maxWeek});
}
const output={
 schema:'fellas-faab-observed-acquisition-outcomes-v1',
 status:'research_only_not_causal_or_skill_grade',
 generatedFrom:'archived completed Sleeper waiver receipts and recovered weekly roster snapshots',
 guardrails:[
  'Only player acquisitions with archived metadata and single roster ID can be joined',
  'Begin in the week after provider claim week to avoid processing-week score leakage',
  'Only count player points while visible on that winning team roster',
  'A missing player-week is unknown, not a zero; a player may have been traded, cut, or absent',
  'Weekly points are observed player production, not value above replacement or incremental wins',
  'Incomplete season evidence and unavailable postseason roster snapshots are excluded',
  'Defense positions, roster ownership, player identity, and eligibility require future validation',
  'No FAAB manager skill rating is authorized from this dataset alone'
 ],coverage,observations
};
const target='data-integrity/faab-observed-acquisition-outcomes-v1.json';
if(process.argv.includes('--check')){
 assert.ok(has(target),'Generated FAAB outcome research missing');
 assert.deepEqual(read(target),output,'FAAB acquisition outcome research is stale');
}else{
 fs.writeFileSync(target,JSON.stringify(output,null,2)+'\n');
}
console.log('FAAB observed acquisitions:',observations.length,'player-claims;',observations.filter(x=>x.observedWeeks).length,'with rostered points; mode',process.argv.includes('--check')?'check':'generate');
console.log(JSON.stringify(coverage));
