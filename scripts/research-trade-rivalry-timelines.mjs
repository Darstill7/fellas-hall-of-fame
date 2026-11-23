// Research-only chronological trade rivalry receipts; chronology is not weekly realized PF.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const read=n=>JSON.parse(fs.readFileSync(dir+'/'+n+'.json','utf8'));
const matrix=read('manager-trade-matrix-research');
const metrics=matrix.metrics;
const round=n=>Math.round(n*100)/100||0;
const source=new Map();
for(const year of [2020,2021,2022,2023,2024,2025]){
 const report=read(year+'-ownership-review');
 for(const t of report.trade_results){
 const times=[...new Set(t.sides.flatMap(s=>s.players.map(p=>Number(p.acquired_status_updated))))];
 if(!times.length)continue;
 assert.equal(times.length,1);
 assert(Number.isFinite(times[0])&&times[0]>0);
 assert(!source.has(t.id));
 source.set(t.id,{year,week:t.week,completed_ms:times[0],assets:t.sides.map(s=>({manager:s.manager,players:s.players.map(p=>({id:p.player_id,name:p.observed_player_name})),nonplayer_assets:t.nonplayer_assets}))});
 }
}
const timelines=matrix.rivalries.map(r=>{
 const [a,b]=r.managers;
 const events=r.receipts.map(t=>{
 const s=source.get(t.id);assert(s&&s.year===t.year);
 return {...t,...s};
 }).sort((x,y)=>x.completed_ms-y.completed_ms||x.id.localeCompare(y.id));
 const cumulative=Object.fromEntries(metrics.map(k=>[k,0]));
 const streak=Object.fromEntries(metrics.map(k=>[k,{current:0,best_a:0,best_b:0,lead_changes:0,last_nonzero_leader:0}]));
 const points=events.map((e,i)=>{
 const before={...cumulative};
 for(const k of metrics){
 const v=e.values[k],s=streak[k],direction=Math.sign(v);
 s.current=direction===0?0:Math.sign(s.current)===direction?s.current+direction:direction;
 s.best_a=Math.max(s.best_a,s.current);s.best_b=Math.max(s.best_b,-s.current);
 cumulative[k]=round(cumulative[k]+v);
 const leader=Math.sign(cumulative[k]);
 if(leader&&s.last_nonzero_leader&&leader!==s.last_nonzero_leader)s.lead_changes++;
 if(leader)s.last_nonzero_leader=leader;
 }
 return {...e,sequence:i+1,before,cumulative:{...cumulative}};
 });
 for(const k of metrics)assert(Math.abs(cumulative[k]-r.values[k])<.011);
 return {managers:r.managers,trades:r.trades,events:points,streaks:streak,final_values:cumulative,stable_direction:r.stable_direction,limited_sample:r.limited_sample};
});
assert.equal(timelines.length,23);
assert.equal(timelines.reduce((n,t)=>n+t.events.length,0),41);
const managers=matrix.managers.map(manager=>{
 const ties=timelines.filter(t=>t.managers.includes(manager)).map(t=>({opponent:t.managers.find(n=>n!==manager),trades:t.trades}));
 const max=Math.max(0,...ties.map(t=>t.trades));
 return {manager,most_frequent_comparable_partners:ties.filter(t=>t.trades===max),comparable_trades:ties.reduce((n,t)=>n+t.trades,0)};
});
const output={status:'RESEARCH_ONLY_NOT_FOR_PUBLICATION',scope:matrix.scope,timelines,managers,limitations:['Cumulative timeline adds each deal’s eventual season return at its transaction date; not a chart of points realized on that date','Streaks are consecutive comparable deals within a pair, not all league transactions','Ties reset streaks','Nonplayer and multi-team deals excluded','Scheduled kickoff proxy and historical identity limitations apply']};
fs.writeFileSync(dir+'/trade-rivalry-timelines-research.json',JSON.stringify(output,null,2)+'\n');
console.log('RIVALRY TIMELINE COVERAGE '+JSON.stringify({relationships:timelines.length,trades:41,managers:managers.length}));
console.log('RIVALRY TIMELINE SAMPLE '+JSON.stringify(timelines.filter(t=>t.managers.includes('Stilly')&&t.managers.includes('Tom'))));
