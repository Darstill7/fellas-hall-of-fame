// Scope whether complete historical bench/roster evidence exists for each
// of 611 already-matched post-trade starter-week claims. This does NOT create
// or certify any replacement baseline (waiver, bench, FLEX or otherwise).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const data=path.join(process.cwd(),'data');
const read=file=>JSON.parse(fs.readFileSync(path.join(data,file),'utf8'));
const par=read('trade_par_preview.json').records;
const sides=read('v9_trade_engine.json').sides;
const bySide=new Map(sides.map(s=>[String(s.trade_id)+'|'+s.manager,s]));
assert.equal(bySide.size,sides.length,'Historical source side duplicates');
const norm=s=>String(s).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const cache=new Map();
const load=(year,week)=>{
 const normal='sleeper_roster_snapshots_'+year+'_week'+week+'.json';
 const alternative='war_rosters_'+year+'_week'+week+'.json';
 const file=fs.existsSync(path.join(data,normal))?normal:fs.existsSync(path.join(data,alternative))?alternative:null;
 const type=file===null?'missing':file===normal?'sleeper_roster_snapshot':'war_roster_reconstruction';
 const key=year+'|'+week;
 if(!cache.has(key)){
  const payload=file?read(file):null;
  const rosters=payload===null?null:Array.isArray(payload)?payload:payload.rosters;
  assert.ok(!rosters||Array.isArray(rosters),'Unparseable historical roster snapshot '+file);
  const byTeam=new Map();
  for(const roster of rosters||[]){
   const team=String(roster.teamId??roster.id);
   assert.ok(!byTeam.has(team),'Duplicate team in historical weekly snapshot '+file);
   byTeam.set(team,roster);
  }
  cache.set(key,{type,file,byTeam});
 }
 return cache.get(key);
};
const counts={sleeper_roster_snapshot:0,war_roster_reconstruction:0,missing:0};
const perSeason=new Map(),unmatched=[],pointDifferences=[],identityDifferences=[];
let total=0,withBench=0,benchEligibleOptions=0;
for(const trade of par.filter(t=>t.year>=2020&&t.year<=2025)){
 for(const side of trade.sides){
  const origin=bySide.get(String(trade.id)+'|'+side.manager);
  assert.ok(origin,'Original trade owner source missing for '+trade.id);
  for(const player of side.matched||[]){
   for(const week of player.sourceWeeks){
    total++;
    const source=load(trade.year,week);
    counts[source.type]++;
    const season=perSeason.get(trade.year)||{year:trade.year,matchedStarts:0,sleeper:0,war:0,unavailable:0,withOwnedRoster:0,withBench:0};
    season.matchedStarts++;
    if(source.type==='missing'){season.unavailable++;perSeason.set(trade.year,season);continue}
    if(source.type==='war_roster_reconstruction')season.war++;else season.sleeper++;
    const roster=source.byTeam.get(String(origin.team_id));
    if(!roster){unmatched.push({trade:trade.id,player:player.asset,week,reason:'receiving roster missing from weekly source'});perSeason.set(trade.year,season);continue}
    season.withOwnedRoster++;
    const starts=(roster.starters||[]).filter(p=>norm(p.name)===norm(player.asset));
    if(starts.length!==1){unmatched.push({trade:trade.id,player:player.asset,week,reason:'incoming asset missing or ambiguous in historical starter snapshot'});perSeason.set(trade.year,season);continue}
    const start=starts[0];
    if(!Number.isFinite(start.points)||!['QB','RB','WR','TE'].includes(start.position))identityDifferences.push({trade:trade.id,week,player:player.asset,reason:'starter invalid score or position'});
    const rosterBench=roster.bench;
    if(Array.isArray(rosterBench)){
     withBench++;season.withBench++;
     // A roster bench is an input, not an eligible substitute: FLEX/positions
     // and transaction legality are intentionally NOT inferred here.
     benchEligibleOptions+=rosterBench.filter(p=>Number.isFinite(p.points)).length;
    }
    perSeason.set(trade.year,season);
   }
  }
 }
}
assert.equal(total,611,'Trade source week count changed: audit benchmark readiness');
assert.equal(counts.sleeper_roster_snapshot,598,'Snapshot archive population changed');
assert.equal(counts.war_roster_reconstruction,6,'War fallback population changed');
assert.equal(counts.missing,7,'2020 Week 14 missing snapshot scope changed');
const missingWeek=[...cache.entries()].filter(([,v])=>v.type==='missing').map(([k])=>k);
assert.deepEqual(missingWeek,['2020|14'],'Unexpected source gap: inspect missing roster weeks');
const report=[
 '# Trade PAR same-roster bench-source readiness','',
 '> A matching snapshot does NOT establish a valid replacement baseline. These are source-coverage and observed starter/bench-input checks only. In particular, a manager bench is not the waiver wire, and the highest hindsight bench scorer is not automatically lineup-eligible or available at lock.','',
 '| Season | Matched starter weeks | Standard weekly snapshots | WAR reconstructed snapshot | No full roster snapshot | Owned source roster found | Full bench list present |',
 '|---|---:|---:|---:|---:|---:|---:|',
 ...[2020,2021,2022,2023,2024,2025].map(y=>{
  const r=perSeason.get(y)||{};
  return '| '+y+' | '+(r.matchedStarts||0)+' | '+(r.sleeper||0)+' | '+(r.war||0)+' | '+(r.unavailable||0)+' | '+(r.withOwnedRoster||0)+' | '+(r.withBench||0)+' |';
 }),
 '| **Total** | **'+total+'** | **'+counts.sleeper_roster_snapshot+'** | **'+counts.war_roster_reconstruction+'** | **'+counts.missing+'** | | **'+withBench+'** |',
 '',
 '- Snapshot evidence missing for **seven 2020 Week 14 starter claims**; those fantasy points remain verified separately against the starter-only ledger, but the same-week manager bench is not locally archived.',
 '- **Six 2025 Week 7 claims** use the separately documented WAR roster reconstruction as a source, not the ordinary snapshot feed.',
 '- Across all recovered snapshots, '+withBench+' source starter claims have an associated roster bench array (not proof of any legal alternative). '+benchEligibleOptions+' numeric bench-player scores were present across those repeated roster observations, without deduplication.',
 '- '+unmatched.length+' of the available snapshots could not uniquely find their claimed received-asset starter by normalized name; '+identityDifferences.length+' showed malformed score/position fields. Both require review before any alternative PAR model is used.',
 '- A defensible independent baseline would require the precise eligible FLEX/QB/RB/WR/TE slot for each start, observed/eligible substitutes, source-time availability and substitution exclusivity, and a documented replacement selection rule. The existing aggregate PAR cannot provide those inputs.',
 ''
].join('\n');
console.log(report);
if(process.argv.includes('--github-summary')&&process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,report);
