// Independent research gate for the Greatest & Worst Trades study.
// No canonical matchup or trade file is rewritten.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const registry=load('data/greatest_worst_trades_research_v1.json');
const original=load('data/trade_winners_losers_research_2020_2025_v1.json');
const preview=load('data/trade_par_preview.json');
const museum=load('data/trade_museum_stage66.json');
const page=fs.readFileSync('analytics/greatest-worst-trades.html','utf8');
const hall=fs.readFileSync('hall/shame.html','utf8');
const trades=fs.readFileSync('analytics/trades.html','utf8');
assert.equal(registry.schema,'fellas-greatest-worst-trades-research-v1');
assert.equal(registry.coverage.fullyMatchedTwoManagerTrades,18);
const eligible=preview.records.filter(r=>r.complete&&r.year>=2020&&r.year<=2025&&r.sides.length===2);
assert.equal(eligible.length,18);
assert.equal(registry.coverage.incompleteOrUnmatched,preview.records.filter(r=>!r.complete).length);
assert.equal(registry.rankedObservedPARAdvantage.length,10);
const candidates=eligible.map(r=>{
 const sides=[...r.sides].sort((a,b)=>b.postTradePAR-a.postTradePAR);
 return {id:r.id,gap:Number((sides[0].postTradePAR-sides[1].postTradePAR).toFixed(2)),sides,year:r.year,date:r.date,week:r.week};
}).sort((a,b)=>b.gap-a.gap);
registry.rankedObservedPARAdvantage.forEach((row,index)=>{
 const source=candidates[index];
 assert.equal(row.rank,index+1);
 assert.equal(row.id,source.id);
 assert.equal(row.observedPARGap,source.gap);
 assert.equal(row.year,source.year);
 assert.equal(row.date,source.date);
 assert.equal(row.week,source.week);
 assert.equal(row.betterReturn.manager,source.sides[0].manager==='Tom'?'Thommy':source.sides[0].manager);
 assert.equal(row.lowerReturn.manager,source.sides[1].manager==='Tom'?'Thommy':source.sides[1].manager);
 assert.equal(row.betterReturn.assets,source.sides[0].assets);
 assert.equal(row.lowerReturn.assets,source.sides[1].assets);
 assert(museum.some(x=>x.id===row.id),'Missing archival trade '+row.id);
});
assert.equal(registry.awards[0].transactionId,candidates[0].id);
for(const value of ['738428315181928448','1023059879336013824','1144362000575840256','44.98','34.60','+131.79 PAR','No voided-pick shortcuts.'])
 assert(page.includes(value),'Page is missing published evidence '+value);
for(const fragment of ['id="view-gains"','id="view-losses"','aria-pressed','data/greatest_worst_trades_research_v1.json','not</strong> definitive all-time'])
 assert(page.includes(fragment),'Ranking UI or limitation missing '+fragment);
assert(hall.includes('../analytics/greatest-worst-trades.html'),'Hall of Shame link missing');
assert(trades.includes('href="greatest-worst-trades.html"'),'Trade history link missing');
assert(!registry.awards.some(x=>x.transactionId==='1031121022772555776'),'Voided-pick governance not an award criterion');
console.log('PASS: 18 qualifying two-manager trades; top 10 derived from receipts, playoff exceptions preserved, no voided-pick awards, both archives linked.');
