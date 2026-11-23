// Research only: model sensitivity, no composite grade or causal trade value.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const positional=JSON.parse(fs.readFileSync(dir+'/trade-positional-surplus-research.json','utf8'));
const boundary=JSON.parse(fs.readFileSync(dir+'/boundary-adjusted-trade-returns-research.json','utf8'));
assert.equal(positional.coverage.unresolved,0);
assert.equal(boundary.coverage.conflicts,0);
const round=n=>Math.round(n*100)/100;
const keys=['raw_delta','p25_delta','median_delta'];
const source=positional.manager_summary;
const rankings=Object.fromEntries(keys.map(k=>[k,[...source].sort((a,b)=>b[k]-a[k])]));
const rank=(k,m)=>1+rankings[k].filter(r=>r[k]>m[k]).length;
const sign=x=>Math.abs(x)<.005?'neutral':x>0?'positive':'negative';
const managers=source.map(m=>{
 const ranks=keys.map(k=>rank(k,m)), signs=keys.map(k=>sign(m[k]));
 const b=boundary.managers.find(r=>r.manager===m.manager);
 assert(b&&Math.abs(b.scenario_delta-m.raw_delta)<.011);
 return {...m,ranks:Object.fromEntries(keys.map((k,i)=>[k,ranks[i]])),rank_range:[Math.min(...ranks),Math.max(...ranks)],rank_spread:Math.max(...ranks)-Math.min(...ranks),direction:new Set(signs).size===1?signs[0]:'model_sensitive',per_trade:Object.fromEntries(keys.map(k=>[k,round(m[k]/m.trades)])),sample_note:m.trades<3?'LIMITED_SAMPLE':'AT_LEAST_THREE_TRADES'};
});
const pairs=new Map();
const tradeRows=[];
for(const t of positional.transactions){
 if(t.kind!=='TWO_TEAM_PLAYER_EXCHANGE'||t.sides.some(s=>s.unresolved))continue;
 const [a,b]=[...t.sides].sort((x,y)=>x.manager.localeCompare(y.manager));
 const deltas={raw_delta:round(a.pf-b.pf),p25_delta:round(a.surplus_p25-b.surplus_p25),median_delta:round(a.surplus_median-b.surplus_median)};
 const directions=keys.map(k=>sign(deltas[k]));
 tradeRows.push({year:t.year,id:t.id,a:a.manager,b:b.manager,...deltas,direction:new Set(directions).size===1?directions[0]:'model_sensitive'});
 const k=JSON.stringify([a.manager,b.manager]);
 if(!pairs.has(k))pairs.set(k,{a:a.manager,b:b.manager,trades:0,raw_delta:0,p25_delta:0,median_delta:0,receipts:[]});
 const p=pairs.get(k);p.trades++;for(const metric of keys)p[metric]+=deltas[metric];p.receipts.push(t.id);
}
const pairRows=[...pairs.values()].map(p=>{
 const result={...p};for(const k of keys)result[k]=round(p[k]);
 const signs=keys.map(k=>sign(result[k]));
 return {...result,direction:new Set(signs).size===1?signs[0]:'model_sensitive',sample_note:p.trades<3?'LIMITED_SAMPLE':'AT_LEAST_THREE_TRADES'};
});
assert.equal(tradeRows.length,positional.coverage.eligible_two_team_trades);
const coverage={trades:tradeRows.length,pairs:pairRows.length,managers:managers.length,consistent_trade_directions:tradeRows.filter(t=>t.direction!=='model_sensitive').length,model_sensitive_trades:tradeRows.filter(t=>t.direction==='model_sensitive').length,consistent_pairs:pairRows.filter(t=>t.direction!=='model_sensitive').length,model_sensitive_pairs:pairRows.filter(t=>t.direction==='model_sensitive').length};
const output={status:'RESEARCH_ONLY_SENSITIVITY_NOT_OFFICIAL_GRADES',coverage,managers,pairs:pairRows,trades:tradeRows,limitations:['All models describe observed production, not counterfactual wins or negotiation skill','No valuation of FAAB, draft picks or keepers','Boundary starts are schedule-supported rather than actual-lock certified','No composite grade; small samples flagged']};
fs.writeFileSync(dir+'/trade-model-sensitivity-research.json',JSON.stringify(output,null,2)+'\n');
console.log('MODEL SENSITIVITY COVERAGE '+JSON.stringify(coverage));
console.log('MODEL SENSITIVITY MANAGERS '+JSON.stringify(managers));
console.log('MODEL SENSITIVITY PAIRS '+JSON.stringify(pairRows));
