import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildProductionPreview} from '../assets/trade-production-preview-v1.mjs';
import {buildTradeReport,weights,MODEL_VERSION} from '../assets/trade-report-card-v1.mjs';
const html=fs.readFileSync('analytics/trade-museum.html','utf8');
const raw=JSON.parse(html.match(/<script[^>]*id="archive-data"[^>]*>([\s\S]*?)<\/script>/)[1]);
const preview=buildProductionPreview(raw),final=buildTradeReport(raw);
assert.equal(preview.trades.length,raw.length);
assert.equal(final.trades.length,raw.length);
assert(final.trades.every(t=>t.sides.every(s=>s.grade===null)));
assert.equal(Object.values(weights).reduce((a,b)=>a+b,0),1);
for(const t of preview.trades)for(const a of t.sides){
 const m=preview.managers[a.manager].trades.find(x=>x.id===t.id);
 assert.equal(m.grade,a.grade);assert.equal(m.rating,a.rating);
 for(const b of t.sides){if(a===b)continue;
 const r=preview.rivalries[a.manager][b.manager].trades.find(x=>x.id===t.id);
 const reverse=preview.rivalries[b.manager][a.manager].trades.find(x=>x.id===t.id);
 assert.equal(r.grade,a.grade);assert.equal(r.opponentGrade,b.grade);
 assert.equal(r.grade,reverse.opponentGrade);assert.equal(r.rating,reverse.opponentRating);
 }
}
for(const [a,group] of Object.entries(preview.rivalries))for(const [b,r] of Object.entries(group)){
 const rev=preview.rivalries[b][a];assert.equal(r.wins,rev.losses);assert.equal(r.draws,rev.draws);assert.equal(r.rating,rev.opponentRating);
}
const fixture={id:'fixture',year:2025,week:1,sides:[{manager:'Stilly',assets:'A',raw_starter_points:100,source_status:'VERIFIED_SOURCE'},{manager:'Tom',assets:'B',raw_starter_points:50,source_status:'VERIFIED_SOURCE'}]};
const approval={id:'fixture',year:2025,week:1,scoringThroughWeek:null,modelVersion:MODEL_VERSION,status:'approved',evidenceRef:'synthetic-test-only',sides:fixture.sides.map((s,i)=>({manager:s.manager,assets:s.assets,rawStarterPoints:s.raw_starter_points,components:{positionAdjustedProduction:i?70:95,lineupImpact:i?70:95,keeperValue:80,otherAssets:80}}))};
const tested=buildTradeReport([fixture],[approval]);assert.equal(tested.managers.Stilly.rating,93.5);assert.equal(tested.managers.Thommy.rating,71);assert.equal(tested.rivalries.Stilly.Thommy.grade,'A');assert.equal(tested.rivalries.Thommy.Stilly.opponentGrade,'A');
assert.throws(()=>buildTradeReport([fixture],[{...approval,scoringThroughWeek:9}]));
assert.throws(()=>buildTradeReport([fixture,fixture]));
assert.equal(buildProductionPreview([{...fixture,sides:fixture.sides.map(s=>({...s,raw_starter_points:0}))}]).trades[0].sides[0].grade,null);
console.log(JSON.stringify({status:preview.status,transactions:raw.length,graded:preview.trades.filter(t=>t.status==='raw-production-preview').length,managers:Object.keys(preview.managers).length,stillyVsThommy:preview.rivalries.Stilly.Thommy},null,2));
