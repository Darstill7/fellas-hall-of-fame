// Investigate whether the *inherited* aggregate trade PAR deductions identify
// a unique replacement baseline by (season, week, position). They do not.
// This is a diagnostic under a simplified shared-position/week hypothesis,
// NOT a reconstruction of the missing original PAR methodology.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=process.cwd();
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const par=read('data/trade_par_preview.json').records;
const engine=read('data/v9_trade_engine.json').sides;
const norm=s=>String(s??'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const originalSides=new Map();
for(const side of engine){
 const key=String(side.trade_id)+'|'+side.manager;
 assert.ok(!originalSides.has(key),'Original trade side duplicated: '+key);
 originalSides.set(key,side);
}
const yearRows=new Map();
for(let year=2020;year<=2025;year++){
 const ledger=read('data/player_starts_'+year+'.json');
 const weeks=new Map();
 for(const w of ledger.weeks){
  assert.ok(!weeks.has(w.week),'Repeated starter-ledger week');
  const teams=new Map();
  for(const team of w.teams)teams.set(String(team.roster),team);
  weeks.set(w.week,teams);
 }
 yearRows.set(year,weeks);
}
const byYearPosition=new Map();
for(const trade of par.filter(t=>t.year>=2020&&t.year<=2025)){
 for(const side of trade.sides){
  const original=originalSides.get(String(trade.id)+'|'+side.manager);
  assert.ok(original,'PAR side absent from archived original trade');
  for(const asset of side.matched||[]){
   assert.ok(asset.sourceWeeks.length>0);
   const source=yearRows.get(trade.year).get(asset.sourceWeeks[0])?.get(String(original.team_id));
   assert.ok(source,'Matched asset first started week absent in source ledger');
   const candidates=source.players.filter(row=>norm(row[1])===norm(asset.asset));
   assert.equal(candidates.length,1,'Player name match not unique on first source week');
   const pos=candidates[0][2];
   assert.ok(['QB','RB','WR','TE'].includes(pos),'Unexpected player position in PAR research');
   const key=trade.year+'|'+pos;
   const rows=byYearPosition.get(key)||[];
   rows.push({id:String(trade.id),manager:side.manager,asset:asset.asset,weeks:[...asset.sourceWeeks],deduction:asset.points-asset.par});
   byYearPosition.set(key,rows);
  }
 }
}
// Standard elimination over real numbers, for the hypothetical equation
//   sum(B[season,week,position] for each matched starting week)
//      = matched asset fantasy points - inherited reported asset PAR.
// A slot-specific, roster-specific, or transaction-specific baseline would
// have MORE unknowns; this is the most charitable coarse position-week model.
function analyze(rows){
 const weeks=[...new Set(rows.flatMap(r=>r.weeks))].sort((a,b)=>a-b);
 const indices=new Map(weeks.map((week,i)=>[week,i]));
 const pivots=new Map();
 const dependent=[];
 const tolerance=1e-9;
 for(const row of rows){
  const v=Array(weeks.length).fill(0);
  for(const week of row.weeks)v[indices.get(week)]+=1;
  let deduction=row.deduction;
  for(const [p,b] of [...pivots.entries()].sort((a,b)=>a[0]-b[0])){
   const scale=v[p];
   if(Math.abs(scale)<tolerance)continue;
   for(let i=0;i<v.length;i++)v[i]-=scale*b.v[i];
   deduction-=scale*b.deduction;
  }
  const pivot=v.findIndex(x=>Math.abs(x)>tolerance);
  if(pivot<0)dependent.push({asset:row.asset,residual:deduction});
  else{
   const divisor=v[pivot];
   pivots.set(pivot,{v:v.map(x=>x/divisor),deduction:deduction/divisor});
  }
 }
 // Rounding and dependent equations can be internally compatible even though
 // weekly benchmark values remain severely underidentified.
 const maximumDependentResidual=dependent.reduce((max,r)=>Math.max(max,Math.abs(r.residual)),0);
 return {equations:rows.length,observedPositionWeeks:weeks.length,rank:pivots.size,unconstrained:weeks.length-pivots.size,dependentEquations:dependent.length,maximumDependentResidual};
}
const entries=[...byYearPosition.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([key,rows])=>({year:+key.split('|')[0],position:key.split('|')[1],...analyze(rows)}));
const totals=entries.reduce((out,e)=>{
 out.equations+=e.equations;out.observedPositionWeeks+=e.observedPositionWeeks;
 out.rank+=e.rank;out.unconstrained+=e.unconstrained;out.dependentEquations+=e.dependentEquations;
 out.maximumDependentResidual=Math.max(out.maximumDependentResidual,e.maximumDependentResidual);
 return out;
},{equations:0,observedPositionWeeks:0,rank:0,unconstrained:0,dependentEquations:0,maximumDependentResidual:0});
assert.equal(totals.equations,110,'Matched asset population changed; re-audit identifiability');
assert.equal(totals.observedPositionWeeks,205,'Source position-week population changed');
assert.equal(totals.rank,102,'Constraint rank changed, revisit inherited PAR methodology');
assert.equal(totals.unconstrained,103,'Number of unknown weekly baselines changed');
assert.equal(totals.dependentEquations,8,'Shared-position-week linear dependencies changed');
assert.ok(totals.maximumDependentResidual<.05,'Identical baseline constraints no longer agree within fantasy-score rounding');
assert.ok(totals.unconstrained>0,'Unique weekly baseline cannot be claimed while underidentified');

const wr2025=byYearPosition.get('2025|WR');
assert.ok(wr2025,'2025 WR aggregate constraints missing');
const wrRank=analyze(wr2025).rank;
const targetWeeks=[7,12,13].map(week=>{
 const tested=analyze([...wr2025,{weeks:[week],deduction:0,asset:'hypothetical week target'}]);
 return {week,identifiedUnderHypothesis:tested.rank===wrRank};
});
assert.deepEqual(targetWeeks.map(x=>x.identifiedUnderHypothesis),[false,true,false],
 '2025 WR target identifiability changed, recheck Mike Evans and Diggs research');
const identifiableW12=wr2025.find(x=>x.weeks.length===1&&x.weeks[0]===12);
assert.ok(identifiableW12&&Math.abs(identifiableW12.deduction-3.88)<.01,
 'Week 12 single-start deduction no longer supports the illustrative 3.88 constraint');
const report=[
 '# Trade PAR replacement-baseline identifiability audit','',
 '> This does NOT recover or certify a weekly replacement baseline. It tests the deliberately simplified assumption that one common replacement point value existed for each season × week × position. Real FLEX/lineup/owner-specific models would require even more inputs.','',
 '| Year | Position | Asset equations | Referenced weekly baselines | Independent equations | Unconstrained weekly values |',
 '|---|---|---:|---:|---:|---:|',
 ...entries.map(e=>'| '+e.year+' | '+e.position+' | '+e.equations+' | '+e.observedPositionWeeks+' | '+e.rank+' | '+e.unconstrained+' |'),
 '| **Total** | | **'+totals.equations+'** | **'+totals.observedPositionWeeks+'** | **'+totals.rank+'** | **'+totals.unconstrained+'** |',
 '',
 '### Interpretation',
 '',
 '- 110 matched asset aggregate PAR rows supply only **102 independent constraints** on **205** position-week values that appear in the research. **103 degrees of freedom remain unidentified**, even if all matched positions shared a league-wide week baseline.',
 '- '+totals.dependentEquations+' dependent equations are internally consistent within rounding; this consistency does **not** prove that the position-week model was the actual original replacement rule.',
 '- A numerical fit can produce infinitely many different weekly WR/RB/QB/TE baselines consistent with published PAR aggregates. None can be chosen as the source-verified baseline without external definition and weekly replacement receipts.',
 '- Mike Evans (2025 W7, starting-slot 0.0) and Stefon Diggs (2025 W12–13, 3.0 and 4.1 starting points) therefore remain ungraded until a versioned position/slot and week-specific methodology is verified.',
 '- Specific 2025 WR tests under this HYPOTHETICAL shared-week model: Week 7 is unidentifiable, Week 12 is mathematically constrained to 3.88 by an existing one-start asset row, and Week 13 is unidentifiable. The 3.88 is a conditional implied aggregate deduction, **not** a verified historical replacement baseline and must not be applied to Diggs automatically.',
 '- This analysis is not a calculation of trade skill, trading decision quality, keeper cost or causal value.',
 ''
].join('\n');
console.log(report);
if(process.argv.includes('--github-summary')&&process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,report);
