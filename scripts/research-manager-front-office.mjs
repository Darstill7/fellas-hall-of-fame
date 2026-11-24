// Research-only manager profile contract. No official overall GM grade.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const read=name=>JSON.parse(fs.readFileSync(dir+'/'+name+'.json','utf8'));
const draft=read('career-draft-return-research'), trade=read('career-trade-return-research'), sensitivity=read('trade-model-sensitivity-research'), boundary=read('boundary-adjusted-trade-returns-research'), tree=read('trade-tree-research');
assert.equal(draft.verified_draft_picks,900);
assert.equal(trade.coverage.transactions,48);
assert.equal(sensitivity.coverage.trades,41);
assert.equal(boundary.coverage.conflicts,0);
assert.equal(tree.coverage.transactions,48);
const round=n=>Math.round(n*100)/100;
const profiles=draft.rankings.by_surplus_per_pick.map((d,i)=>{
 const t=trade.manager_summary.find(x=>x.manager===d.manager);
 const s=sensitivity.managers.find(x=>x.manager===d.manager);
 const b=boundary.managers.find(x=>x.manager===d.manager);
 const relationships=sensitivity.pairs.filter(p=>p.a===d.manager||p.b===d.manager).map(p=>{
 const orientation=p.a===d.manager?1:-1;
 const deltas=Object.fromEntries(['raw_delta','p25_delta','median_delta'].map(k=>[k,round(orientation*p[k])]));
 return {opponent:orientation===1?p.b:p.a,trades:p.trades,...deltas,model_direction:p.direction==='model_sensitive'?'model_sensitive':deltas.raw_delta>0?'positive':deltas.raw_delta<0?'negative':'neutral',sample_note:p.sample_note,transaction_ids:p.receipts};
 }).sort((a,b)=>b.p25_delta-a.p25_delta);
 const tradeSeasons=d.season_receipts.map(r=>{
 const tx=trade.transaction_ledger.filter(t=>t.year===r.season&&t.sides.some(x=>x.manager===d.manager));
 const sc=sensitivity.trades.filter(t=>t.year===r.season&&(t.a===d.manager||t.b===d.manager));
 const sum=k=>round(sc.reduce((n,t)=>n+(t.a===d.manager?1:-1)*t[k],0));
 return {season:r.season,transactions:tx.length,comparable_trades:sc.length,raw_delta:sc.length?sum('raw_delta'):null,p25_delta:sc.length?sum('p25_delta'):null,median_delta:sc.length?sum('median_delta'):null};
 });
 const onward=tree.seasons.flatMap(y=>y.edges.filter(e=>e.departing_manager===d.manager).map(e=>({season:y.year,...e})));
 if(s){assert(t&&b);assert.equal(s.trades,t.pair_eligible);assert(Math.abs(b.scenario_delta-s.raw_delta)<.011);}
 return {manager:d.manager,scope:{years:d.season_receipts.map(x=>x.season),provider:'Sleeper',identity_status:'ARCHIVE_MAPPING_NOT_INDEPENDENTLY_CERTIFIED'},
 draft:{...d,efficiency_rank:i+1},
 trading:{status:s?'RESEARCH_OBSERVED_RETURNS':'NO_COMPARABLE_TRADES',transactions:t?.transactions??0,player_transactions:t?.player_transactions??0,strict_received_regular_pf:t?.regular_pf??0,timing_supported_received_regular_pf:round((t?.regular_pf??0)+(b?.additional_regular??0)),models:s??null,relationships,season_receipts:tradeSeasons,onward_trade_edges:onward},
 withheld:{championship_impact:'Historical owner identity not independently certified',waivers:'No verified historical replacement availability model',overall_grade:'No validated composite method',keeper_value:'Not included in draft comparison'}};
});
assert.equal(profiles.length,12);
assert.equal(new Set(profiles.map(x=>x.manager)).size,12);
assert.equal(profiles.reduce((n,p)=>n+p.draft.nonkeeper_picks,0),880);
assert.equal(profiles.reduce((n,p)=>n+(p.trading.models?.trades??0),0),82);
const report={status:'RESEARCH_ONLY_NOT_FOR_PUBLICATION',scope:'Completed Sleeper seasons 2020–2025 only',profiles,limitations:['Draft and trade measures intentionally separate','Timing evidence uses scheduled kickoff proxy','No independently certified manager identity or championship attribution','No valuation of nonplayer assets or true waiver replacement','No composite GM grade']};
fs.writeFileSync(dir+'/manager-front-office-research.json',JSON.stringify(report,null,2)+'\n');
console.log('FRONT OFFICE PROFILE COVERAGE '+JSON.stringify({profiles:profiles.length,draft_picks:880,comparable_trade_sides:82,no_comparable_trade_profiles:profiles.filter(x=>!x.trading.models).map(x=>x.manager)}));
