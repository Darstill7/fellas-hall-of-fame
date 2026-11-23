// Research-only symmetric matrix: null means no comparable trade, never zero.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const profiles=JSON.parse(fs.readFileSync(dir+'/manager-front-office-research.json','utf8'));
const sensitivity=JSON.parse(fs.readFileSync(dir+'/trade-model-sensitivity-research.json','utf8'));
const names=profiles.profiles.map(p=>p.manager).sort((a,b)=>a.localeCompare(b));
const metrics=['raw_delta','p25_delta','median_delta'];
const cells=names.map(a=>names.map(b=>{
 if(a===b)return {status:'SELF',trades:0,values:null};
 const p=sensitivity.pairs.find(p=>(p.a===a&&p.b===b)||(p.a===b&&p.b===a));
 if(!p)return {status:'NO_COMPARABLE_TRADES',trades:0,values:null};
 const sign=p.a===a?1:-1;
 const values=Object.fromEntries(metrics.map(k=>[k,Math.round(sign*p[k]*100)/100||0]));
 const tradeReceipts=sensitivity.trades.filter(t=>p.receipts.includes(t.id)).map(t=>({year:t.year,id:t.id,values:Object.fromEntries(metrics.map(k=>[k,Math.round((t.a===a?1:-1)*t[k]*100)/100||0]))}));
 assert.equal(tradeReceipts.length,p.trades);
 for(const k of metrics)assert(Math.abs(tradeReceipts.reduce((n,t)=>n+t.values[k],0)-values[k])<.011);
 return {status:'COMPARABLE',trades:p.trades,values,direction:p.direction==='model_sensitive'?'MODEL_SENSITIVE':values.raw_delta>0?'POSITIVE':values.raw_delta<0?'NEGATIVE':'NEUTRAL',sample:p.sample_note,receipts:tradeReceipts};
}));
for(let i=0;i<names.length;i++)for(let j=0;j<names.length;j++){
 const a=cells[i][j],b=cells[j][i];assert.equal(a.trades,b.trades);assert.equal(a.status,b.status);
 if(a.values)for(const k of metrics)assert(Math.abs(a.values[k]+b.values[k])<.001);
}
const comparable=cells.flat().filter(c=>c.status==='COMPARABLE');
assert.equal(comparable.length,46);
assert.equal(comparable.reduce((n,c)=>n+c.trades,0),82);
const output={status:'RESEARCH_ONLY_NOT_FOR_PUBLICATION',scope:'2020–2025 completed Sleeper seasons',managers:names,metrics,cells,coverage:{managers:names.length,relationships:comparable.length/2,comparable_trades:comparable.reduce((n,c)=>n+c.trades,0)/2},limitations:['Row perspective; symmetric signed differentials','No composite trade value','Nonplayer-only and multi-team trades excluded','Scheduled-kickoff-supported timing scenario','Historical manager identity not independently certified']};
fs.writeFileSync(dir+'/manager-trade-matrix-research.json',JSON.stringify(output,null,2)+'\n');
console.log('TRADE MATRIX COVERAGE '+JSON.stringify(output.coverage));
