// Reconstruct retrospective 2024 final-week keeper candidate inventories, not legal
// keeper-deadline choice sets. Stable provider IDs expose conflicts and roster moves.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const prior=read('data-integrity/fellas-2024-week17-roster-player-ids-v1.json');
const draft=read('data-integrity/fellas-2025-provider-draft-pick-ids-v1.json');
const local=read('data/v9_draft_engine.json').filter(x=>x.year===2025);
assert.equal(prior.teams.length,10);
assert.equal(draft.picks.length,150);
assert.equal(local.length,150);
const pickById=new Map();
for(const p of draft.picks){
 assert.ok(!pickById.has(p.playerId),'Duplicate provider draft player identity '+p.playerId);
 pickById.set(p.playerId,p);
 const a=local.find(x=>x.overall===p.overall);
 assert.ok(a,'Missing draft slot '+p.overall);
 assert.equal(a.round,p.round);
 assert.equal(String(a.team_id),p.teamId);
 assert.equal(a.keeper,p.isKeeper);
}
const priorIdTeams=new Map();
for(const team of prior.teams)for(const p of team.players){
 const t=priorIdTeams.get(p.id)??[];
 t.push(team.teamId);
 priorIdTeams.set(p.id,t);
}
const conflicts=[...priorIdTeams.entries()].filter(([,teams])=>teams.length>1)
 .map(([playerId,teams])=>({playerId,name:prior.teams.flatMap(t=>t.players).find(p=>p.id===playerId).name,observedTeamIds:teams}));
const rows=prior.teams.map(t=>{
 const ownDraftKeepers=draft.picks.filter(x=>x.isKeeper&&x.teamId===t.teamId);
 assert.equal(ownDraftKeepers.length,2,'Expected exactly two keepers for team '+t.teamId);
 const ownKeeperIds=new Set(ownDraftKeepers.map(x=>x.playerId));
 const uniqueRosterIds=new Set(t.players.map(x=>x.id));
 assert.equal(uniqueRosterIds.size,t.players.length,'Duplicate player ID within historical team '+t.teamId);
 for(const p of ownDraftKeepers)assert.ok(uniqueRosterIds.has(p.playerId),
  '2025 keeper not present in 2024 final roster '+t.teamId+'/'+p.playerName);
 const candidates=t.players.map(p=>{
  const drafted=pickById.get(p.id);
  const conflict=priorIdTeams.get(p.id).length>1;
  return {playerId:p.id,playerName:p.name,position:p.position,
   finalWeekTeamIdentityAmbiguous:conflict,
   retainedByThisManager:ownKeeperIds.has(p.id),
   appearedInCompleted2025Draft:!!drafted,
   observed2025DraftSlot:drafted?.overall??null,
   observed2025DraftRound:drafted?.round??null,
   observed2025DraftingTeamId:drafted?.teamId??null,
   observed2025KeeperFlag:drafted?.isKeeper??null,
   keeperDeadlineLegalEligibility:null,contemporaneousKeeperAlternativeValue:null};
 });
 const otherCandidates=candidates.filter(x=>!x.retainedByThisManager);
 return {teamId:t.teamId,originalKeeperPlayerIds:[...ownKeeperIds],
  observed2024Week17RosterCount:candidates.length,observedUnretainedPlayers:otherCandidates.length,
  crossTeamIdentityConflicts:otherCandidates.filter(x=>x.finalWeekTeamIdentityAmbiguous).length,
  unretainedDraftedIn2025:otherCandidates.filter(x=>x.appearedInCompleted2025Draft).length,
  candidates,certifiedDeadlineChoiceSet:false};
});
assert.equal(rows.length,10);
assert.equal(rows.reduce((n,r)=>n+r.candidates.filter(c=>c.retainedByThisManager).length,0),20);
const output={schema:'fellas-2025-retrospective-keeper-candidate-inventory-v1',
 status:'historical_candidate_provenance_not_verified_keeper_deadline_alternatives',
 sources:[prior.source,draft.source],
 coverage:{managerRosters:rows.length,keepersMatched:20,totalPriorRosterEntries:rows.reduce((n,r)=>n+r.observed2024Week17RosterCount,0),
  duplicatePlayerIdentitiesAcrossTeams:conflicts.length,duplicateIdentityRecords:conflicts},
 limitations:['This is a 2024 Week 17 snapshot, NOT the 2025 keeper deadline roster. No legal keeper option or grade may be inferred.',
 'A player observed in both historical rosters is ambiguous; do not count as an exclusively owned keeper choice.',
 'Observed 2025 draft round is hindsight and may reflect an intervening trade, offseason acquisition, or release.',
 'A nonkeeper appearing later in the 2025 draft does not prove the original manager could have kept that player.',
 'No independent contemporary valuation, exact keeper deadline eligibility, or actual counterfactual draft replacement is established.'],
 rows,keeperDecisionGrade:null,managerOvrChangeAuthorized:false};
const path='data-integrity/keeper-2025-retrospective-candidate-inventory-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(path),output);
else fs.writeFileSync(path,JSON.stringify(output,null,2)+'\n');
console.log('2025 retrospective keeper candidates PASS: 10 teams, 20 verified keepers, '+conflicts.length+' cross-team identity conflicts; official grade null');
