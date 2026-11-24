// Research-only symmetric matrix: null means no comparable trade, never zero.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const profiles=JSON.parse(fs.readFileSync(dir+'/manager-front-office-research.json','utf8'));
const sensitivity=JSON.parse(fs.readFileSync(dir+'/trade-model-sensitivity-research.json','utf8'));
const names=profiles.profiles.map(p=>p.manager).sort((a,b)=>a.localeCompare(b));
const metrics=['raw_delta','p25_delta','median_delta'];
const round=n=>Math.round(n*100)/100||0;
const cells=names.map(a=>names.map(b=>{
 if(a===b)return {status:'SELF',trades:0,values:null};
 const p=sensitivity.pairs.find(p=>(p.a===a&&p.b===b)||(p.a===b&&p.b===a));
 if(!p)return {status:'NO_COMPARABLE_TRADES',trades:0,values:null};
 const sign=p.a===a?1:-1;
 const values=Object.fromEntries(metrics.map(k=>[k,Math.round(sign*p[k]*100)/100||0]));
 const tradeReceipts=sensitivity.trades.filter(t=>p.receipts.includes(t.id)).map(t=>({year:t.year,id:t.id,values:Object.fromEntries(metrics.map(k=>[k,Math.round((t.a===a?1:-1)*t[k]*100)/100||0]))}));
 assert.equal(tradeReceipts.length,p.trades);
 for(const k of metrics)assert(Math.abs(tradeReceipts.reduce((n,t)=>n+t.values[k],0)-values[k])<.011);
 return {status:'COMPARABLE',trades:p.trades,values,average_per_trade:Object.fromEntries(metrics.map(k=>[k,round(values[k]/p.trades)])),direction:p.direction==='model_sensitive'?'MODEL_SENSITIVE':values.raw_delta>0?'POSITIVE':values.raw_delta<0?'NEGATIVE':'NEUTRAL',sample:p.sample_note,receipts:tradeReceipts};
}));
for(let i=0;i<names.length;i++)for(let j=0;j<names.length;j++){
 const a=cells[i][j],b=cells[j][i];assert.equal(a.trades,b.trades);assert.equal(a.status,b.status);
 if(a.values)for(const k of metrics)assert(Math.abs(a.values[k]+b.values[k])<.001);
}
const comparable=cells.flat().filter(c=>c.status==='COMPARABLE');
assert.equal(comparable.length,46);
assert.equal(comparable.reduce((n,c)=>n+c.trades,0),82);
const summarize=(a,b,year)=>{
 if(a===b)return {status:'SELF',trades:0,values:null};
 const rows=sensitivity.trades.filter(t=>t.year===year&&((t.a===a&&t.b===b)||(t.a===b&&t.b===a)));
 if(!rows.length)return {status:'NO_COMPARABLE_TRADES',trades:0,values:null};
 const receipts=rows.map(t=>({year,id:t.id,values:Object.fromEntries(metrics.map(k=>[k,round((t.a===a?1:-1)*t[k])]))}));
 const values=Object.fromEntries(metrics.map(k=>[k,round(receipts.reduce((n,t)=>n+t.values[k],0))]));
 const signs=metrics.map(k=>Math.sign(values[k]));
 return {status:'COMPARABLE',trades:rows.length,values,average_per_trade:Object.fromEntries(metrics.map(k=>[k,round(values[k]/rows.length)])),direction:new Set(signs).size>1?'MODEL_SENSITIVE':signs[0]>0?'POSITIVE':signs[0]<0?'NEGATIVE':'NEUTRAL',sample:rows.length<3?'LIMITED_SAMPLE':'AT_LEAST_THREE_TRADES',receipts};
};
const season_views=[2020,2021,2022,2023,2024,2025].map(year=>({year,cells:names.map(a=>names.map(b=>summarize(a,b,year)))}));
for(let i=0;i<names.length;i++)for(let j=0;j<names.length;j++){
 const all=cells[i][j],seasonCells=season_views.map(s=>s.cells[i][j]);
 assert.equal(seasonCells.reduce((n,c)=>n+c.trades,0),all.trades);
 if(all.values)for(const k of metrics)assert(Math.abs(seasonCells.reduce((n,c)=>n+(c.values?.[k]??0),0)-all.values[k])<.011);
 for(const s of season_views){
 const a=s.cells[i][j],b=s.cells[j][i];assert.equal(a.trades,b.trades);
 if(a.values)for(const k of metrics)assert(Math.abs(a.values[k]+b.values[k])<.001);
 }
}
const rivalries=[];
for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++){
 const c=cells[i][j];if(c.status!=='COMPARABLE')continue;
 const signs=metrics.map(k=>Math.sign(c.values[k]));
 const leader=new Set(signs).size===1&&signs[0]!==0?(signs[0]>0?names[i]:names[j]):null;
 rivalries.push({managers:[names[i],names[j]],trades:c.trades,leader,stable_direction:leader!==null,limited_sample:c.trades<3,values:c.values,average_per_trade:c.average_per_trade,season_count:new Set(c.receipts.map(r=>r.year)).size,receipts:c.receipts});
}
rivalries.sort((a,b)=>b.trades-a.trades||Math.abs(b.values.p25_delta)-Math.abs(a.values.p25_delta));
const output={status:'RESEARCH_ONLY_NOT_FOR_PUBLICATION',scope:'2020–2025 completed Sleeper seasons',managers:names,metrics,cells,season_views,rivalries,coverage:{managers:names.length,relationships:comparable.length/2,comparable_trades:comparable.reduce((n,c)=>n+c.trades,0)/2},limitations:['Row perspective; symmetric signed differentials','No composite trade value','Nonplayer-only and multi-team trades excluded','Scheduled-kickoff-supported timing scenario','Historical manager identity not independently certified']};
fs.writeFileSync(dir+'/manager-trade-matrix-research.json',JSON.stringify(output,null,2)+'\n');
console.log('TRADE MATRIX COVERAGE '+JSON.stringify(output.coverage));
console.log('TRADE MATRIX SEASON COVERAGE '+JSON.stringify(season_views.map(s=>({year:s.year,trades:s.cells.flat().reduce((n,c)=>n+c.trades,0)/2}))));
console.log('TRADE MATRIX STABLE RIVALRIES '+JSON.stringify(rivalries.filter(r=>r.stable_direction&&!r.limited_sample)));
