// Verify historical receiving ownership and replacement-input readiness for the
// conservative 13-trade, period-clean sample. A valid roster/bench snapshot is
// NOT a source-approved weekly replacement, legal FLEX substitute, or PAR grade.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const par=read('data/trade_par_preview.json').records;
const engine=read('data/v9_trade_engine.json').sides;
const playoff=read('data/playoff_explorer_verified_2016_2025_v1.json').seasons;
const firstWeek=new Map(playoff.filter(s=>s.year>=2020&&s.year<=2025).map(s=>[s.year,Math.min(...s.matches.filter(m=>m.round==='opening').map(m=>m.week))]));
assert.equal(firstWeek.size,6);
const name=s=>String(s).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const expectedOwner={Stilly:'Darstill',Tom:'thommy',Stew:'Dsylvester9',Tony:'tsteg',Birch:'birchhh',Kuhl:'ckuhl5',Mitch:'huppdawg80',Stover:'yogurtslinger15',JMid:'JMidd'};
const fullyMatched=t=>t.year>=2020&&t.year<=2025&&t.sides.length===2&&t.complete===true&&t.sides.every(s=>s.fullyMatched===true&&Number.isFinite(s.postTradePAR));
const selected=par.filter(t=>fullyMatched(t)&&t.sides.every(s=>s.matched.every(p=>p.sourceWeeks.every(w=>w<firstWeek.get(t.year)))));
assert.equal(selected.length,13,'Conservative period-clean sample has changed');
const sides=new Map(engine.map(s=>[String(s.trade_id)+'|'+s.manager,s]));
assert.equal(sides.size,engine.length,'Original trade side not unique');
const cache=new Map(),byYear=new Map();
const getSnapshot=(year,week)=>{
 const key=year+'|'+week;
 if(cache.has(key))return cache.get(key);
 const candidates=['data/sleeper_roster_snapshots_'+year+'_week'+week+'.json','data/war_rosters_'+year+'_week'+week+'.json'];
 const p=candidates.find(f=>fs.existsSync(path.join(root,f)));
 assert.ok(p,'No full weekly source for regular-season trade start '+key);
 const obj=read(p);
 const rosters=Array.isArray(obj)?obj:obj.rosters;
 assert.ok(Array.isArray(rosters),'Unusable roster source '+p);
 const out={file:p,type:p.includes('war_rosters_')?'WAR reconstruction':'Original weekly Sleeper snapshot',rosters:new Map(rosters.map(r=>[String(r.teamId??r.id),r]))};
 assert.equal(out.rosters.size,rosters.length,'Duplicate receiving roster in historical source');
 cache.set(key,out);return out;
};
const verified=new Set();
let starts=0,withFullBench=0,original=0,reconstructed=0,benchRows=0;
const byPosition=new Map(),perSeason=new Map();
for(const t of selected)for(const side of t.sides){
 const source=sides.get(String(t.id)+'|'+side.manager);
 assert.ok(source,'Original trade receiving side missing: '+t.id+'/'+side.manager);
 const wantedOwner=expectedOwner[side.manager];
 assert.ok(wantedOwner,'Unknown receiving manager ownership '+side.manager);
 for(const asset of side.matched){
  const idByAsset=new Set();
  for(const week of asset.sourceWeeks){
   assert.ok(week>t.week&&week<firstWeek.get(t.year),'Trade starter outside actual receiving regular season');
   const snap=getSnapshot(t.year,week),team=snap.rosters.get(String(source.team_id));
   assert.ok(team,'Receiving roster not in historical full snapshot');
   assert.equal(team.owner,wantedOwner,'Player starter attributed to wrong actual owner on original roster');
   const found=(team.starters||[]).filter(p=>name(p.name)===name(asset.asset));
   assert.equal(found.length,1,'Received player not uniquely found as starter');
   const p=found[0];
   assert.ok(p.id!=null&&String(p.id)!=='0'&&Number.isFinite(p.points),'Missing player identity/score');
   idByAsset.add(String(p.id));
   assert.ok(['QB','RB','WR','TE'].includes(p.position),'Unexpected scored trade asset position');
   assert.ok(Array.isArray(team.bench),'Missing bench roster from source');
   const startId=[t.year,week,source.team_id,p.id].join('|');
   assert.ok(!verified.has(startId),'A player start was claimed by multiple trades');
   verified.add(startId);
   const score=perSeason.get(t.year)||{trades:new Set(),starts:0,original:0,reconstructed:0,fullBench:0};
   score.trades.add(String(t.id));score.starts++;score.fullBench++;
   if(snap.type==='WAR reconstruction'){score.reconstructed++;reconstructed++}else{score.original++;original++}
   perSeason.set(t.year,score);
   byPosition.set(p.position,(byPosition.get(p.position)||0)+1);
   starts++;withFullBench++;benchRows+=team.bench.length;
  }
  assert.equal(idByAsset.size,1,'Received asset does not resolve to stable historical provider player ID');
 }
}
assert.equal(starts,verified.size);
assert.equal(starts,original+reconstructed);
assert.equal(starts,withFullBench,'Each period-clean matched starter needs its corresponding roster bench');
assert.ok(starts>0&&starts<611,'Period-clean subset count invalid');
const rows=[
 '# Trade PAR — period-clean replacement-source readiness','',
 '> These results establish source ownership and the presence of a same-roster historical bench. They DO NOT establish who was legally FLEX/position eligible at lock, the waiver/free-agent pool, or how replacement points should be chosen. They are not alternative or official PAR scores.','',
 '### 13-period-clean-trade starter validation','',
 '| Season | Fully matched clean trades | Starter records | Standard historical roster weeks | Reconstructed roster weeks | Full bench present |',
 '|---|---:|---:|---:|---:|---:|',
 ...[2020,2021,2022,2023,2024,2025].map(y=>{
  const r=perSeason.get(y);return '| '+y+' | '+(r?.trades.size||0)+' | '+(r?.starts||0)+' | '+(r?.original||0)+' | '+(r?.reconstructed||0)+' | '+(r?.fullBench||0)+' |';
 }),
 '| **Total** | **'+selected.length+'** | **'+starts+'** | **'+original+'** | **'+reconstructed+'** | **'+withFullBench+'** |','',
 'Starter positions '+[...byPosition].sort((a,b)=>a[0].localeCompare(b[0])).map(([p,n])=>p+': '+n).join('; ')+'.',
 'Bench players seen in all included roster observations: '+benchRows+' (repeated week/team appearances, not unique alternatives).',
 'All checked starts match the recorded receiving manager, stable player provider ID, post-trade week, and a historical full roster/bench snapshot.',
 '',
 'To produce a valid new PAR model: confirm exact lineup slot identity (including FLEX), same-time roster legality, replacement definition and no bench reuse, scoring rules, and 2020/2021 season-specific first playoff week. Existing aggregate source PAR cannot be reverse-engineered by this audit.'
].join('\n');
console.log(rows);
if(process.argv.includes('--github-summary')&&process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,rows);
