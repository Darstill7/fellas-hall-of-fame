// Original-manager starter receipts for all 900 Sleeper draft selections (2020–2025).
// Distinguishes true league regular-season windows, 3 source-name aliases and
// 2025 keeper slots. Research-only, no mixed surplus-scale all-time grades.
// node scripts/build-draft-dna-2020-2025-starter-receipts.mjs > /tmp/fellas-starts.json
import fs from 'node:fs';
import assert from 'node:assert/strict';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const draft=load('data/v9_draft_engine.json').filter(p=>p.year>=2020&&p.year<=2025);
const norm=m=>m==='Tom'?'Thommy':m==='EvansBrandon'?'Evans':m;
const normalizeName=s=>s.replace(/\b(?:jr\.?|sr\.?|ii|iii|iv|v)\b/gi,'')
 .replace(/\./g,'').replace(/\s+/g,' ').trim().toLowerCase();
const knownAlias={
 '2020|Will Fuller V':{sourceName:'William Fuller',playerId:'3157'},
 '2021|Robby Anderson':{sourceName:'Robbie Chosen',playerId:'3423'},
 '2021|Washington Football Team':{sourceName:'Washington Commanders',playerId:'WAS'}
};
const cents=n=>Math.round(Number(n)*100),toPoints=n=>n/100;
const all=[],yearly=[];
for(let year=2020;year<=2025;year++){
 const file='data/player_starts_'+year+'.json',weekData=load(file);
 const picks=draft.filter(p=>p.year===year);
 assert.equal(picks.length,150);
 const finalRegularWeek=year<=2021?13:14;
 assert.equal(weekData.weeks.at(-1).week,14);
 const lineup=weekData.weeks.filter(w=>w.week<=finalRegularWeek);
 const rowIndex=new Map();
 for(const w of lineup){
  assert.equal(w.teams.length,10,'Missing scored rosters '+year+'/'+w.week);
  for(const team of w.teams){
   const rosterId=String(team.roster);
   for(const [playerId,playerName,position,score] of team.players){
    const key=rosterId+'|'+normalizeName(playerName);
    if(!rowIndex.has(key))rowIndex.set(key,[]);
    rowIndex.get(key).push({year,week:w.week,rosterId,playerId:String(playerId),
     playerName,position,scoredPoints:score,scoredCents:cents(score)});
   }
  }
 }
 let verified=0,aliasCount=0,totalStarts=0,totalPoints=0;
 for(const p of picks){
  const alias=knownAlias[year+'|'+p.player]||null;
  const target=alias?.sourceName||p.player;
  const key=String(p.team_id)+'|'+normalizeName(target);
  const receipts=(rowIndex.get(key)||[]).sort((a,b)=>a.week-b.week);
  const originalPoints=receipts.reduce((a,x)=>a+x.scoredCents,0);
  assert.equal(receipts.length,p.reg_starts,
   'Archived original manager start count mismatch '+year+'/'+p.manager+'/'+p.player);
  assert.equal(toPoints(originalPoints),Number(Number(p.reg_starter_points).toFixed(2)),
   'Archived scoring mismatch '+year+'/'+p.manager+'/'+p.player);
  if(alias){
   aliasCount++;
   assert(receipts.length>0,'Uncorroborated alias '+year+'/'+p.player);
   assert(receipts.every(x=>x.playerId===alias.playerId),
    'Historical alias mapped to multiple player IDs '+year+'/'+p.player);
  }
  assert(new Set(receipts.map(x=>x.playerId)).size<=1,
   'Ambiguous scored player ID '+year+'/'+p.player);
  verified++;totalStarts+=receipts.length;totalPoints+=originalPoints;
  all.push({year,originalOverall:p.overall,round:p.round,
   manager:norm(p.manager),sourceManager:p.manager,originalRosterId:String(p.team_id),
   player:p.player,position:p.position,keeper:!!p.keeper,
   playerId:receipts[0]?.playerId??null,
   playerIdConfidence:receipts.length?'verified-scored-starter-ID':'no-scored-start-ID',
   aliasSource:alias?{draftName:p.player,scoredLineupName:alias.sourceName,verifiedId:alias.playerId}:null,
   observedStarts:receipts.length,observedOriginalManagerStarterPoints:toPoints(originalPoints),
   regularSeasonThroughWeek:finalRegularWeek,
   starterReceipts:receipts.map(x=>({week:x.week,rosterId:x.rosterId,
    playerId:x.playerId,position:x.position,scoredPoints:x.scoredPoints})),
   legacySurplus:p.surplus,
   originalManagerOnly:true,
   sourceProof:'roster-ID + confirmed player name/alias + historical regular-season score parity'});
 }
 yearly.push({year,picks:picks.length,matchedArchivedPicks:verified,
  documentedAliases:aliasCount,
  regularSeasonThroughWeek:finalRegularWeek,scoredTeamWeeks:lineup.length*10,
  originalDraftedPlayerStarts:totalStarts,
  originalDraftedPlayerStartedPoints:toPoints(totalPoints)});
}
const result={schema:'fellas-draft-dna-2020-2025-original-manager-starters-v1',
 status:'source-reconciled-research-not-official-draft-grades',
 asOf:'2026-11-11',
 sourcePaths:['data/v9_draft_engine.json',...[2020,2021,2022,2023,2024,2025].map(y=>'data/player_starts_'+y+'.json')],
 coverage:{seasons:6,picks:all.length,exactScoredPointParityPicks:all.length,
  totalOriginalManagerStarts:all.reduce((a,x)=>a+x.observedStarts,0),
  documentedNameAliases:Object.keys(knownAlias).length,
  playedRegularSeasonTeamWeeks:yearly.reduce((a,x)=>a+x.scoredTeamWeeks,0)},
 rules:['The 2020 and 2021 regular-season draft credit window is Weeks 1–13, NOT Week 14; those archived weeks are not counted for original draft returns',
 '2022–2025 regular-season draft credit window is Weeks 1–14',
 'The historical draft selection manager is normalized by season; current Sleeper roster username can reflect later account ownership changes',
 'Three manual name aliases require exact roster-scored-player-ID and aggregate points parity; no fuzzy matching or name-only unrelated player substitutions',
 'An original selection with zero observed starts has no directly recovered scored player ID; null is unknown, not zero player identity',
 '2025 keepers remain in original-slot inventory but are not freshly drafted discoveries',
 '2020–2024 archived legacy surplus and 2025 position-round peer-median grades use different baselines and must not be pooled',
 'All archived totals and each individual pick require exact starter count and cent-rounded point parity',
 'This dataset does not account for post-trade starts on other manager rosters'],yearly,picks:all};
assert.equal(result.coverage.picks,900);
assert.equal(result.coverage.exactScoredPointParityPicks,900);
assert.equal(result.coverage.documentedNameAliases,3);
console.log(JSON.stringify(result,null,2));
