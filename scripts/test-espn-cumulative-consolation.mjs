// Distinguish actual scoring weeks from cumulative consolation results.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const archive=read('data/espn_history_2016_2019.json');
const s=archive.seasons.find(s=>s.year===2019);
const names=new Map(s.teams.map(t=>[t.id,t.manager]));
const games=s.games.filter(g=>g.stage==='LOSERS_CONSOLATION_LADDER').sort((a,b)=>a.period-b.period);
const cents=x=>Math.round(x*100);
let checks=0;
const eq=(a,b)=>{checks++;assert.deepEqual(a,b)};
const totals={},receipts=[],seen=new Set();
for(const g of games){
 const row={period:g.period,stage:g.stage,teams:[]};
 for(const [id,score,weeks,adjustment] of [[g.home,g.hs,g.homeWeeks,g.homeAdjustment],[g.away,g.as,g.awayWeeks,g.awayAdjustment]]){
  const manager=names.get(id);assert(manager);
  eq(Object.keys(weeks),[String(g.period)]);
  const weekly=cents(weeks[g.period]),carry=cents(adjustment),official=cents(score);
  eq(weekly+carry,official);
  const key=manager+':'+g.period;eq(seen.has(key),false);seen.add(key);
  // ESPN rounds historical carryover to tenths. Preserve the official result
  // and separately verify carryover against the prior official score within 5 cents.
  if(g.period>14){assert(Math.abs(carry-totals[manager])<=5,manager+' carryover mismatch');checks++;}
  else eq(carry,0);
  totals[manager]=official;
  row.teams.push({manager,weekly_cents:weekly,carryover_cents:carry,official_cumulative_cents:official});
 }
 receipts.push(row);
}
eq(games.length,6);eq(seen.size,12);
const actual={};for(const r of receipts)for(const t of r.teams)actual[t.manager]=(actual[t.manager]||0)+t.weekly_cents;
for(const m of Object.keys(actual)){assert(Math.abs(actual[m]-totals[m])<=10,m+' final cumulative discrepancy');checks++;}
const report={status:'RESEARCH_ONLY',year:2019,definition:'Official cumulative result preserved separately; scoring records use only original weekly points. Carryover precision can differ from prior official total.',receipts,actual_weekly_totals_cents:actual,official_final_totals_cents:totals};
const root='data-integrity/historical-trade-draft-audits';fs.mkdirSync(root,{recursive:true});fs.writeFileSync(root+'/espn-2019-cumulative-consolation-receipts.json',JSON.stringify(report,null,2)+'\n');
console.log('ESPN CUMULATIVE CONSOLATION PASS '+JSON.stringify({checks,matchups:games.length,weekly_team_scores:seen.size,actual,official:totals}));
