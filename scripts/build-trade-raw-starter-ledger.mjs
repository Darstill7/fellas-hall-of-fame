// Rebuild fully sourced, season-correct RAW receiving-starter-point totals.
// Unlike inherited experimental PAR, raw starter scores permit removing 2020–21
// Week14 playoff points without unknowable positional replacement deductions.
// These are NOT trade values, quarterback-position adjusted wins, or skill grades.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const par=read('data/trade_par_preview.json').records;
const original=read('data/v9_trade_engine.json').sides;
const bracket=read('data/playoff_explorer_verified_2016_2025_v1.json').seasons;
const first=Object.fromEntries(bracket.filter(s=>s.year>=2020&&s.year<=2025).map(s=>[s.year,Math.min(...s.matches.filter(m=>m.round==='opening').map(m=>m.week))]));
const norm=s=>String(s).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const sourceBySide=new Map(original.map(s=>[String(s.trade_id)+'|'+s.manager,s]));
assert.equal(sourceBySide.size,original.length,'Historical receiving-side IDs duplicated');
const yearLedgers=new Map();
for(let y=2020;y<=2025;y++){
 const weeks=read('data/player_starts_'+y+'.json').weeks;
 const byWeek=new Map(weeks.map(w=>[w.week,new Map(w.teams.map(t=>[String(t.roster),t]))]));
 assert.equal(byWeek.size,weeks.length);
 yearLedgers.set(y,byWeek);
}
const fullyMatched=t=>t.year>=2020&&t.year<=2025&&t.complete&&t.sides.length===2&&t.sides.every(s=>s.fullyMatched);
const baseline=par.filter(fullyMatched);
assert.equal(baseline.length,18,'Original two-manager fully matched research scope changed');
const recoveryNames=['2025_ertz','2024_mostert','2024_aiyuk','2025_tuten','2024_dowdle','2024_ridley'];
const preview=[];
for(const filename of recoveryNames){
 const proof=read('data/trade_par_recovery_'+filename+'_source_v1.json');
 assert.equal(proof.status,'source_checked_pending_integration');
 assert.equal(proof.evidence.verifiedPostTradeStarts,0);
 assert.equal(proof.evidence.verifiedPostTradeStarterPoints,0);
 const trade=par.find(t=>String(t.id)===proof.tradeId);
 assert.ok(trade&&trade.sides.length===2&&!fullyMatched(trade),'Source proof cannot already be in fully matched baseline');
 const missing=trade.sides.flatMap(s=>(s.unresolved||[]).map(asset=>({manager:s.manager,asset})));
 assert.deepEqual(missing,[{manager:proof.manager,asset:proof.player.name}]);
 assert.deepEqual(proof.evidence.weeklyRosterObservations.filter(w=>w.week>trade.week).map(w=>w.week),Array.from({length:first[trade.year]-trade.week-1},(_,i)=>trade.week+i+1),'Incomplete post-trade regular-season zero-start evidence');
 preview.push(trade);
}
assert.equal(preview.length,6);
const checkedStarts=new Set();
function buildRow(t,kind){
 const firstWeek=first[t.year];
 assert.ok(firstWeek===14||firstWeek===15,'Missing seasonal playoff boundary');
 const sides=t.sides.map(s=>{
  const origin=sourceBySide.get(String(t.id)+'|'+s.manager);
  assert.ok(origin,'Source receiving roster missing: '+t.id+' '+s.manager);
  let points=0,starts=0,postseasonExcludedStarts=0,postseasonExcludedPoints=0;
  for(const asset of s.matched){
   assert.equal(asset.starts,asset.sourceWeeks.length);
   let historicalTotal=0;
   for(const week of asset.sourceWeeks){
    assert.ok(week>t.week&&week<=14,'Original researched start outside source scope');
    const roster=yearLedgers.get(t.year).get(week)?.get(String(origin.team_id));
    assert.ok(roster,'Missing original manager roster/week');
    const found=roster.players.filter(p=>norm(p[1])===norm(asset.asset));
    assert.equal(found.length,1,'Unresolved matched player ID in starter ledger '+t.id+'/'+asset.asset+'/'+week);
    const p=found[0];
    assert.ok(Number.isFinite(p[3]));
    const key=[t.year,week,origin.team_id,p[0]].join('|');
    // A player/roster/week can legitimately appear in a different analysis
    // class only if same originating trade. Prevent duplicates globally here.
    assert.ok(!checkedStarts.has(key),'Source player-start double counted in raw ledger');
    checkedStarts.add(key);
    historicalTotal+=p[3];
    if(week<firstWeek){points+=p[3];starts++}
    else{postseasonExcludedPoints+=p[3];postseasonExcludedStarts++}
   }
   assert.ok(Math.abs(historicalTotal-asset.points)<.031,'Original asset points fail source-ledger parity');
  }
  if(kind==='original_fully_matched'&&postseasonExcludedStarts===0)assert.ok(Math.abs(points-s.postTradePoints)<.031,'Inherited clean sample raw point total differs');
  return {manager:s.manager,receivedStarterPoints:+points.toFixed(2),creditedStarts:starts,playoffExcludedStarts:postseasonExcludedStarts,playoffExcludedPoints:+postseasonExcludedPoints.toFixed(2)};
 });
 return {tradeId:String(t.id),year:t.year,transactionWeek:t.week,firstPlayoffWeek:firstWeek,sourceCategory:kind,sides};
}
const rows=[...baseline.map(t=>buildRow(t,'original_fully_matched')),...preview.map(t=>buildRow(t,'source_checked_zero_start_provisional'))].sort((a,b)=>a.year-b.year||a.tradeId.localeCompare(b.tradeId));
assert.equal(rows.length,24);
assert.equal(new Set(rows.map(t=>t.tradeId)).size,24);
const affected=rows.filter(r=>r.sourceCategory==='original_fully_matched'&&r.sides.some(s=>s.playoffExcludedStarts));
assert.equal(affected.length,5,'Exactly five originally fully matched trades contain 2020–2021 playoff starts');
const totalExcluded=affected.reduce((n,r)=>n+r.sides.reduce((k,s)=>k+s.playoffExcludedStarts,0),0);
assert.equal(totalExcluded,14,'Fourteen starter-asset Week14 observations removed from five mixed-period qualified trades');
const result={
 schema:'fellas-trade-raw-starter-accounting-2020-2025-v1',
 status:'research_only_source_reconciled_raw_starter_points_not_trade_grades',
 method:'Actual receiving-manager starter fantasy scores on strictly later weeks, ending before each season-specific first winners-bracket playoff week. No position/FLEX baseline adjustment and no keeper, playoff, bench, FAAB or counterfactual value.',
 firstPlayoffWeekBySeason:first,
 baselineFullyMatchedTrades:18,
 provisionalZeroStartTrades:6,
 fullSampleTradeCount:24,
 previouslyPARContaminatedTradesRepairedForRawOnly:affected.length,
 postseasonStartsExcludedFromRaw:totalExcluded,
 rows
};
const target=path.join(root,'data/trade_raw_starter_accounting_2020_2025_v1.json');
const output=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--write')){fs.writeFileSync(target,output);console.log('Wrote '+target)}
else{
 assert.ok(fs.existsSync(target),'Raw starter-point ledger missing; rebuild with --write');
 const existing=fs.readFileSync(target,'utf8');
 assert.equal(existing,output,'Raw starter-point source ledger drifted; review and regenerate from independent lineups');
 console.log('PASS: '+baseline.length+' source-matched trades plus '+preview.length+' research-only zero-start candidates; '+affected.length+' originally PAR mixed-period trades re-scoped for raw starter points, '+totalExcluded+' playoff starts stripped. Source ledger is byte-identical to verified build.');
}
if(process.argv.includes('--github-summary')&&process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n### Independent season-correct RAW starter points\n\nAll **24** trade receipts rechecked against original per-week manager starter ledgers; **18** fully matched, **six** provisional zero-start cases. **'+affected.length+'** previously mixed-period 2020–21 trades can be corrected for RAW production by removing **'+totalExcluded+'** playoff starts. No original PAR or manager grades are changed. These raw scores cannot be used as position-adjusted trade wins.\n');
