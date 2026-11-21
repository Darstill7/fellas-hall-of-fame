// Trade PAR research: strictly SOURCE-OBSERVED, same-roster, same-slot BENCH
// substitute eligibility and data coverage. This is NOT adjusted trade value,
// an optimized lineup, an ex-ante replacement expectation, or a PAR score.
// Individual bench points are only observable in hindsight; zero starts do not
// imply zero player/keeper value; waiver free agents are NOT included.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const research=read('data/trade_par_preview.json').records;
const sides=read('data/v9_trade_engine.json').sides;
const brackets=read('data/playoff_explorer_verified_2016_2025_v1.json').seasons;
const settings=read('data/trade_par_era_lineup_settings_2020_2025_v1.json').seasons;
const starts=new Map(brackets.filter(x=>x.year>=2020&&x.year<=2025).map(x=>[x.year,Math.min(...x.matches.filter(m=>m.round==='opening').map(m=>m.week))]));
const settingsByYear=new Map(settings.map(s=>[s.year,s]));
const sideMap=new Map(sides.map(s=>[String(s.trade_id)+'|'+s.manager,s]));
const expectedOwner={Stilly:'Darstill',Tom:'thommy',Stew:'Dsylvester9',Tony:'tsteg',Birch:'birchhh',Kuhl:'ckuhl5',Mitch:'huppdawg80',Stover:'yogurtslinger15',JMid:'JMidd'};
const normalize=s=>String(s).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const slots=['QB','RB','RB','WR','WR','TE','FLEX','FLEX','DEF'];
const allowed={QB:['QB'],RB:['RB'],WR:['WR'],TE:['TE'],FLEX:['RB','WR','TE'],DEF:['DEF']};
const selected=research.filter(t=>t.year>=2020&&t.year<=2025&&t.complete===true&&t.sides.length===2&&t.sides.every(s=>s.fullyMatched)&&t.sides.every(s=>s.matched.every(a=>a.sourceWeeks.every(w=>w<starts.get(t.year)))));
assert.equal(selected.length,13,'The source-reconciled period-clean sample changed');
const weeklyCache=new Map();
function weekly(year,week){
 const key=year+'|'+week;
 if(weeklyCache.has(key))return weeklyCache.get(key);
 const candidates=['data/sleeper_roster_snapshots_'+year+'_week'+week+'.json','data/war_rosters_'+year+'_week'+week+'.json'];
 const filename=candidates.find(p=>fs.existsSync(path.join(root,p)));
 assert.ok(filename,'Missing original weekly roster data '+key);
 const source=read(filename);
 const rosters=Array.isArray(source)?source:source.rosters;
 assert.ok(Array.isArray(rosters)&&rosters.length>=1,'Invalid weekly roster data '+key);
 const teams=new Map(rosters.map(r=>[String(r.teamId??r.id),r]));
 assert.equal(teams.size,rosters.length,'Duplicate roster in weekly source');
 const out={teams,sourceType:filename.includes('/war_rosters_')?'WAR reconstructed snapshot':'Historical Sleeper snapshot'};
 weeklyCache.set(key,out);
 return out;
}
const positionCounts=new Map(),slotCounts=new Map(),yearCounts=new Map();
const observations=[],seenStarts=new Set();
for(const t of selected)for(const s of t.sides){
 const origin=sideMap.get(String(t.id)+'|'+s.manager);
 assert.ok(origin,'Historical receiving side not found: '+t.id+'/'+s.manager);
 const season=settingsByYear.get(t.year);
 assert.ok(season&&season.firstWinnersBracketWeek===starts.get(t.year),'Season settings differ from verified playoffs');
 assert.deepEqual(season.startingSlots,slots,'Historical FLEX format changed');
 for(const asset of s.matched)for(const week of asset.sourceWeeks){
  assert.ok(week>t.week&&week<starts.get(t.year),'Only strictly later regular-season weeks qualify');
  const block=weekly(t.year,week),team=block.teams.get(String(origin.team_id));
  assert.ok(team,'Historical receiving manager team not found');
  assert.equal(team.owner,expectedOwner[s.manager],'Wrong original receiving owner');
  assert.ok(Array.isArray(team.starters)&&team.starters.length===slots.length,'Cannot identify a nine-slot lineup');
  assert.ok(Array.isArray(team.bench),'Bench list missing for source week');
  for(let index=0;index<slots.length;index++){
   const item=team.starters[index];
   assert.ok(item&&allowed[slots[index]].includes(item.position),'Historical starter order or slot eligibility invalid at '+t.year+'/'+week+'/'+origin.team_id+' slot '+index);
  }
  const indices=team.starters.flatMap((p,index)=>normalize(p.name)===normalize(asset.asset)?[index]:[]);
  assert.equal(indices.length,1,'Acquired asset did not uniquely occupy a starting slot');
  const i=indices[0],starter=team.starters[i],slot=slots[i];
  assert.ok(starter.id!=null&&Number.isFinite(starter.points),'Malformed original started player');
  const unique=[t.year,week,origin.team_id,starter.id].join('|');
  assert.ok(!seenStarts.has(unique),'Double-counted received asset starter');
  seenStarts.add(unique);
  const eligibleBench=team.bench.filter(p=>p&&p.id!=null&&String(p.id)!==String(starter.id)&&allowed[slot].includes(p.position)&&Number.isFinite(p.points));
  const count=eligibleBench.length,highest=count?Math.max(...eligibleBench.map(p=>p.points)):null;
  // Maximum already-scored bench player is retrospective upper-bound candidate
  // among observed same-roster substitutions, never a forecast available at lock.
  observations.push({year:t.year,week,tradeId:String(t.id),manager:s.manager,asset:asset.asset,providerId:String(starter.id),slot,position:starter.position,source: block.sourceType,starterPoints:starter.points,benchCandidateCount:count,highestObservedBenchPoints:highest,retrospectiveCeilingGap:highest===null?null:+(starter.points-highest).toFixed(2)});
  slotCounts.set(slot,(slotCounts.get(slot)||0)+1);
  positionCounts.set(starter.position,(positionCounts.get(starter.position)||0)+1);
  const yearRow=yearCounts.get(t.year)||{starts:0,hasCandidate:0,noCandidate:0,flex:0,reconstructed:0};
  yearRow.starts++;if(count)yearRow.hasCandidate++;else yearRow.noCandidate++;
  if(slot==='FLEX')yearRow.flex++;
  if(block.sourceType==='WAR reconstructed snapshot')yearRow.reconstructed++;
  yearCounts.set(t.year,yearRow);
 }
}
assert.equal(observations.length,254,'Originally audited period-clean received starter observations changed');
assert.equal(seenStarts.size,254);
assert.equal([...yearCounts.values()].reduce((a,r)=>a+r.starts,0),254);
assert.equal([...yearCounts.values()].reduce((a,r)=>a+r.hasCandidate+r.noCandidate,0),254);
assert.equal([...positionCounts.values()].reduce((a,n)=>a+n,0),254);
const withCandidates=observations.filter(x=>x.benchCandidateCount>0);
const without=observations.filter(x=>x.benchCandidateCount===0);
assert.equal(withCandidates.length,246,'Recorded eligible bench observations changed; review full historical source');
assert.equal(without.length,8,'No recorded eligible same-roster bench option count changed');
assert.equal(slotCounts.get('FLEX'),54,'Dual-FLEX observed starter evidence changed');
const rosterSources=new Set(observations.map(x=>x.source));
const summary={
 schema:'fellas-trade-slot-feasibility-source-2020-2025-v1',
 status:'research_input_coverage_not_replacement_baseline_or_trade_grade',
 originalPeriodCleanTrades:selected.length,
 creditedAcquiredPlayerStarts:observations.length,
 withObservedEligibleBench:withCandidates.length,
 withoutObservedEligibleBench:without.length,
 flexSlotStarts:slotCounts.get('FLEX')||0,
 reconstructedRosterStarts:observations.filter(x=>x.source==='WAR reconstructed snapshot').length,
 seasons:[2020,2021,2022,2023,2024,2025].map(year=>{
  const v=yearCounts.get(year)||{starts:0,hasCandidate:0,noCandidate:0,flex:0,reconstructed:0};
  return {year,starts:v.starts,withObservedEligibleBench:v.hasCandidate,withoutObservedEligibleBench:v.noCandidate,flexSlotStarts:v.flex,reconstructedRosterStarts:v.reconstructed};
 }),
 missingBenchCases:without.map(x=>({year:x.year,week:x.week,manager:x.manager,asset:x.asset,slot:x.slot,tradeId:x.tradeId})).sort((a,b)=>a.year-b.year||a.week-b.week||a.manager.localeCompare(b.manager)),
 limitations:[
  'Bench player eligible by recorded position for the same starting slot is not proof of active status or availability at lineup lock.',
  'Scores are known after games and cannot be used as unbiased advance replacement projections.',
  'Bench roster snapshots omit any unrostered waiver or free-agent player options.',
  'Does not solve simultaneous substitutions or prevent one bench candidate from being reused across multiple proposed replacements.',
  'Does not establish an independently reproducible replacement-level PAR or WAR benchmark.'
 ]
};
const summaryFile=path.join(root,'data/trade_par_slot_feasibility_2020_2025_v1.json');
const serialized=JSON.stringify(summary,null,2)+'\n';
if(process.argv.includes('--write')){fs.writeFileSync(summaryFile,serialized);console.log('Wrote source-generated slot feasibility summary');}
else{
 assert.ok(fs.existsSync(summaryFile),'Slot feasibility summary must exist for site display');
 assert.equal(fs.readFileSync(summaryFile,'utf8'),serialized,'Site slot-feasibility summary out of sync with historical starter and roster evidence');
}
const report=[
 '# Period-clean trade starter slot and bench feasibility audit','',
 '> **RESEARCH INPUTS, NOT A REPLACEMENT BASELINE.** This reports whether each credited acquired-player start had a historical same-roster bench option eligible for its exact starting slot (including RB/WR/TE FLEX). It does NOT prove game-time active status, transaction-time availability, a realistic projected replacement, or equal strategic value across positions. The best already-scored bench player is a hindsight diagnostic, not an ex-ante expectation. It does not simulate multiple simultaneous substitutions or reallocate existing starters.','',
 '| Season | Credited original period-clean starts | With eligible same-roster bench candidate | No observed eligible candidate | Started in FLEX | Reconstructed roster-source starts |',
 '|---|---:|---:|---:|---:|---:|',
 ...[2020,2021,2022,2023,2024,2025].map(y=>{
  const r=yearCounts.get(y)||{starts:0,hasCandidate:0,noCandidate:0,flex:0,reconstructed:0};
  return '| '+y+' | '+r.starts+' | '+r.hasCandidate+' | '+r.noCandidate+' | '+r.flex+' | '+r.reconstructed+' |';
 }),
 '| **Total** | **'+observations.length+'** | **'+withCandidates.length+'** | **'+without.length+'** | **'+(slotCounts.get('FLEX')||0)+'** | **'+observations.filter(x=>x.source==='WAR reconstructed snapshot').length+'** |',
 '',
 'Source observed player positions: '+[...positionCounts].sort().map(([position,n])=>position+' '+n).join(' · ')+'.',
 'Starting-slot assignments from ordered historical arrays: '+[...slotCounts].sort().map(([slot,n])=>slot+' '+n).join(' · ')+'.',
 'No eligible bench option for '+without.length+' starts means **unavailable in the recorded bench snapshot**, not absence of a possible waiver pickup or trade-value floor.',
 '',
 '## Specific starter weeks without a recorded slot-eligible bench player','',
 '| Season | Week | Receiving manager | Acquired starter | Actual starting slot |',
 '|---|---:|---|---|---|',
 ...without.map(x=>'| '+x.year+' | '+x.week+' | '+x.manager+' | '+x.asset+' | '+x.slot+' |'),
 'All starter slots, original owner IDs, lineup player IDs, and 2020–2025 postseason cutoffs are checked against season-specific verified source files.',
 '',
 '## Required next evidence for a value model','',
 '1. Confirm whether source lineup order is guaranteed across Sleeper provider schemas and reconstructed rosters (currently all 254 examined records conform).',
 '2. Confirm eligible substitutes were genuinely lineup-eligible and game-time active, with non-hindsight expected points available at lineup lock.',
 '3. Handle two FLEX positions and simultaneous substitutions without using one bench player twice.',
 '4. Define independent waiver/FA replacement availability at transaction time if measuring value beyond observed current-roster bench.',
 '5. Independently validate counterfactual scoring and keeper/postseason treatment; do not relabel this exploratory feasibility check as PAR or WAR.',
 ''
].join('\n');
console.log(report);
if(process.argv.includes('--github-summary')&&process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,report);
