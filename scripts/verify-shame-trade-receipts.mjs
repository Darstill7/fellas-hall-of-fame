import fs from 'node:fs';
import assert from 'node:assert/strict';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const html=fs.readFileSync('hall/shame.html','utf8');
const research=load('data/trade_winners_losers_research_2020_2025_v1.json');
const preview=load('data/trade_par_preview.json');
const museum=load('data/trade_museum_stage66.json');
const stories=load('data/championship_season_stories_2016_2025_v1.json');
const eligible=preview.records.filter(r=>r.complete&&r.year>=2020&&r.year<=2025&&r.sides.length===2);
assert.equal(research.qualifiedTradeCount,eligible.length,'Qualified denominator must cover only two-sided, fully matched completed-year trades');
assert.equal(research.status,'research_only_no_official_trade_winner_grades');
const expected=eligible.map(r=>{
  const sides=[...r.sides].sort((a,b)=>b.postTradePAR-a.postTradePAR);
  return {id:r.id,year:r.year,date:r.date,high:sides[0],low:sides[1],gap:Math.round((sides[0].postTradePAR-sides[1].postTradePAR)*100)/100};
}).sort((a,b)=>b.gap-a.gap);
for(let index=0;index<10;index++){
 const x=expected[index],actual=research.ranked[index],receipt=museum.find(t=>t.id===x.id);
 assert(actual,'Missing ranked trade '+index);
 assert(receipt,'Original transaction not present '+x.id);
 assert.equal(actual.tradeId,x.id);
 assert.equal(actual.year,x.year);
 assert.equal(actual.date,x.date);
 assert.equal(actual.parAdvantage,x.gap);
 assert.equal(actual.higherObservedValue.manager,x.high.manager);
 assert.equal(actual.lowerObservedValue.manager,x.low.manager);
 assert.equal(actual.higherObservedValue.received,x.high.assets);
 assert.equal(actual.lowerObservedValue.received,x.low.assets);
 assert.equal(receipt.year,x.year);
 assert.equal(receipt.date,x.date);
 for(const side of [x.high,x.low])
   assert(receipt.sides.some(s=>s.manager===side.manager&&s.assets===side.assets),'Original trade asset/owner mismatch '+x.id);
}
const cards=[...html.matchAll(/data-trade-outcome="([0-9]+)"/g)].map(x=>x[1]);
assert.deepEqual(cards,expected.slice(0,2).map(x=>x.id),'Feature the largest measured outcome and championship swing');
for(const outcome of expected.slice(0,2))for(const side of [outcome.high,outcome.low])assert(html.includes(Number(side.postTradePAR).toFixed(2)+' PAR'),'Featured side must display its observed PAR '+outcome.id+' '+side.manager);
const rows=[...html.matchAll(/data-outcome-rank="([0-9]+)" data-trade-id="([0-9]+)"/g)];
assert.equal(rows.length,5,'Five researched deals must be discoverable');
rows.forEach((row,i)=>{
 assert.equal(Number(row[1]),i+1,'Ranking label mismatch');
 assert.equal(row[2],expected[i].id,'Ranking transaction mismatch');
 assert(html.includes('+'+expected[i].gap.toFixed(2)),'PAR gap missing '+expected[i].id);
});
assert(!html.includes('The Jefferson–Jacobs liquidation')&&!html.includes('The Chase exit'),'Superseded voided-pick plaques must not be featured');
for(const fragment of ['Draft-pick rule changes and voided picks are not criteria','18 fully matched two-manager transactions'])
 assert(html.includes(fragment),'Essential evidence limitation missing: '+fragment);
assert(/not<\/strong> a definitive ranking of every deal since 2016/.test(html), 'Source coverage disclaimer must remain visible, regardless of semantic bold markup');
const champion2023=stories.seasons.find(x=>x.year===2023);
const champion2024=stories.seasons.find(x=>x.year===2024);
assert(champion2023.sections.some(x=>x.text.includes('44.98')&&x.text.includes('Tony')),'2023 title semifinal trade-impact story missing');
assert(champion2024.sections.some(x=>x.text.includes('34.60')&&x.text.includes('Higgins')),'2024 title-game trade counterexample missing');
assert(html.includes('34.60')&&html.includes('2024')&&html.includes('44.98'),'Playoff context missing');
assert.equal((html.match(/class="card shame-card"/g)||[]).length,11,'All eleven original Hall of Shame plaques must remain');
const css=fs.readFileSync('assets/museum-editorial-editions.css','utf8');
for(const style of ['.shame-trade-ledger','.shame-trade-scroll','.shame-trade-duel','@media(max-width:700px)'])assert(css.includes(style),'Trade scoreboard CSS missing '+style);
console.log('PASS: top 10 audited trade ranking computed from all '+eligible.length+' complete same-era receipts, paired Hall of Shame features, source scope, 2023 and 2024 championship caveats and 11 original Shame plaques.');
