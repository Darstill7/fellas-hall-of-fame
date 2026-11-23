// Research-only trading records; all rankings retain model and sample context.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const read=n=>JSON.parse(fs.readFileSync(dir+'/'+n+'.json','utf8'));
const timeline=read('trade-rivalry-timelines-research'), sensitivity=read('trade-model-sensitivity-research'),career=read('career-trade-return-research'),tree=read('trade-tree-research');
const metrics=['raw_delta','p25_delta','median_delta'],round=n=>Math.round(n*100)/100||0;
const records={};
for(const k of metrics){
 const individual=timeline.timelines.flatMap(t=>t.events.map(e=>({year:e.year,week:e.week,id:e.id,leader:e.values[k]>0?t.managers[0]:e.values[k]<0?t.managers[1]:null,opponent:e.values[k]>0?t.managers[1]:e.values[k]<0?t.managers[0]:null,margin:Math.abs(e.values[k]),values:e.values,assets:e.assets}))).filter(r=>r.leader).sort((a,b)=>b.margin-a.margin);
 const rivalry=timeline.timelines.filter(t=>t.trades>=3).map(t=>({leader:t.final_values[k]>0?t.managers[0]:t.final_values[k]<0?t.managers[1]:null,opponent:t.final_values[k]>0?t.managers[1]:t.managers[0],margin:Math.abs(t.final_values[k]),trades:t.trades,stable_direction:t.stable_direction,ids:t.events.map(e=>e.id)})).filter(r=>r.leader).sort((a,b)=>b.margin-a.margin);
 const efficiency=sensitivity.managers.filter(m=>m.trades>=3).map(m=>({manager:m.manager,trades:m.trades,total:m[k],per_trade:round(m[k]/m.trades),direction:m.direction})).sort((a,b)=>b.per_trade-a.per_trade);
 const streaks=timeline.timelines.flatMap(t=>t.managers.map((manager,i)=>({manager,opponent:t.managers[1-i],length:t.streaks[k][i===0?'best_a':'best_b'],trades:t.trades}))).filter(r=>r.length>=2).sort((a,b)=>b.length-a.length);
 const comebacks=[];
 for(const t of timeline.timelines)for(let i=0;i<2;i++){
 const sign=i===0?1:-1;let low=0,lowEvent=null,best=null;
 for(const e of t.events){
 const v=round(sign*e.cumulative[k]);
 if(v<low){low=v;lowEvent=e.id;}
 if(low<0&&v>=0){const gain=round(v-low);if(!best||gain>best.recovery)best={manager:t.managers[i],opponent:t.managers[1-i],deficit:low,recovered_to:v,recovery:gain,from_transaction:lowEvent,to_transaction:e.id};}
 }
 if(best)comebacks.push(best);
 }
 comebacks.sort((a,b)=>b.recovery-a.recovery);
 records[k]={individual_advantages:individual,rivalry_advantages_min_three:rivalry,efficiency_min_three:efficiency,streaks,comebacks};
 assert.equal(individual.length,41-timeline.timelines.flatMap(t=>t.events).filter(e=>e.values[k]===0).length);
}
const activity=career.manager_summary.map(m=>({manager:m.manager,transactions:m.transactions,player_transactions:m.player_transactions,comparable_trades:m.pair_eligible})).sort((a,b)=>b.transactions-a.transactions);
const networks=tree.seasons.flatMap(s=>s.components.map(c=>({year:s.year,transactions:c.transaction_ids.length,edges:c.edges.length,ids:c.transaction_ids}))).sort((a,b)=>b.transactions-a.transactions||b.edges-a.edges);
const output={status:'RESEARCH_ONLY_NOT_FOR_PUBLICATION',scope:timeline.scope,records,activity,networks,limitations:['Observed retrospective returns, not negotiation skill or causal trade value','Minimum three comparable trades for rivalry and efficiency rankings','Streaks are within a trading relationship','Comebacks require a prior negative cumulative differential and a return to zero or better','Nonplayer assets and keeper economics not valued','Identity and lineup-lock caveats apply']};
fs.writeFileSync(dir+'/trading-records-research.json',JSON.stringify(output,null,2)+'\n');
console.log('TRADING RECORDS COVERAGE '+JSON.stringify({metrics:metrics.length,transactions:41,relationships:23,networks:networks.length}));
console.log('TRADING RECORDS LEADERS '+JSON.stringify(Object.fromEntries(metrics.map(k=>[k,Object.fromEntries(Object.entries(records[k]).map(([n,v])=>[n,v.slice(0,3)]))]))));
