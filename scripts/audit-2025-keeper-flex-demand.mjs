// Position/FLEX-aware descriptive league starter supply for completed 2025 regular season.
// Hindsight observed starting lineups are NOT waiver availability, and rankings are not keeper grades.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const rows=[];
// Sleeper's recovered position label for dual-role Travis Hunter is DB in weeks 1–2.
// Normalize only this exact player ID for offensive FLEX-count accounting.
const slotPosition=p=>String(p.id)==='12530'&&p.position==='DB'?'WR':p.position;
for(let week=1;week<=14;week++){
 const path=week===1||week===7?'data/war_rosters_2025_week'+week+'.json':'data/sleeper_roster_snapshots_2025_week'+week+'.json';
 const raw=read(path),rosters=Array.isArray(raw)?raw:raw.rosters;
 assert.equal(rosters.length,10,'Expected ten teams in week '+week);
 const used=new Set(),weekly={QB:0,RB:0,WR:0,TE:0,DEF:0},flex=[];
 for(const r of rosters){
  const starters=r.starters??[];assert.equal(starters.length,9,'Expected 9 starters for team '+(r.teamId??r.id)+' week '+week);
  const counts={QB:0,RB:0,WR:0,TE:0,DEF:0};
  for(const p of starters){
   assert.ok(p.id!=null&&Number.isFinite(p.points));
   assert.ok(!used.has(String(p.id)),'Duplicate league starter '+p.id+' week '+week);
   used.add(String(p.id));
   const position=slotPosition(p);
   assert.ok(position in counts,'Unmapped starting position '+p.position+' for '+p.id);
   counts[position]++;weekly[position]++;
  }
  assert.equal(counts.QB,1);assert.equal(counts.DEF,1);
  assert.ok(counts.RB>=2&&counts.WR>=2&&counts.TE>=1);
  assert.equal(counts.RB+counts.WR+counts.TE,7);
  flex.push({teamId:String(r.teamId??r.id),extraRB:counts.RB-2,extraWR:counts.WR-2,extraTE:counts.TE-1});
 }
 assert.equal(weekly.QB,10);assert.equal(weekly.DEF,10);
 assert.equal(weekly.RB+weekly.WR+weekly.TE,70);
 rows.push({week,source:path,startedByPosition:weekly,flexSlotsObserved:20,
  flexDistribution:{RB:flex.reduce((a,x)=>a+x.extraRB,0),WR:flex.reduce((a,x)=>a+x.extraWR,0),TE:flex.reduce((a,x)=>a+x.extraTE,0)}});
}
const output={schema:'fellas-2025-flex-starter-demand-v1',status:'observed_starter_slot_supply_not_replacement_value',
 lineupAssumption:'1 QB, 2 RB, 2 WR, 1 TE, 2 RB/WR/TE FLEX, 1 DEF; 10 teams',
 knownPositionNormalization:{playerId:'12530',sourcePosition:'DB',countedOffensivePosition:'WR',rationale:'Dual-role Travis Hunter recovered with defensive position label despite occupied offensive FLEX slot'},
 warnings:['Derived from archived weekly starting lineups, not original league-setting API configuration.',
 'Observing who started does not establish the best available free agents or rational replacement options.',
 'A retrospective starter cutoff is not an ex ante positional replacement baseline.',
 'No keeper decision or value grades are calculated.'],rows};
const out='data-integrity/keeper-2025-flex-starter-demand-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(out),output);
else fs.writeFileSync(out,JSON.stringify(output,null,2)+'\n');
console.log('2025 keeper FLEX demand verified: 14 weeks, 10 teams, 20 FLEX slots weekly');
