// Audit postseason scope leakage in inherited trade PAR preview.
// Source: recovered verified winners-bracket fixture weeks, not the legacy weekly
// ledger's potentially incorrect "regular" stage labels.
// This script DOES NOT subtract unknown weekly PAR baseline contributions or
// rewrite original experimental research data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const records=read('data/trade_par_preview.json').records;
const playoff=read('data/playoff_explorer_verified_2016_2025_v1.json').seasons.filter(s=>s.year>=2020&&s.year<=2025);
const starts=new Map(playoff.map(s=>[s.year,Math.min(...s.matches.filter(m=>m.round==='opening').map(m=>m.week))]));
assert.equal(starts.size,6,'Playoff-first-week coverage must span 2020–2025');
for(const year of [2020,2021])assert.equal(starts.get(year),14,'2020–2021 opening winners bracket begins Week 14');
for(const year of [2022,2023,2024,2025])assert.equal(starts.get(year),15,'2022–2025 opening winners bracket begins Week 15');
const eligible=t=>t.year>=2020&&t.year<=2025&&t.complete===true&&t.sides.length===2&&t.sides.every(s=>s.fullyMatched===true&&Number.isFinite(s.postTradePAR));
const contaminations=records.filter(t=>t.year>=2020&&t.year<=2025).map(t=>({
 trade:t,
 affected:t.sides.flatMap(s=>(s.matched||[]).flatMap(p=>(p.sourceWeeks||[]).filter(week=>week>=starts.get(t.year)).map(week=>({manager:s.manager,player:p.asset,week}))))
})).filter(x=>x.affected.length>0);
const qualified=records.filter(eligible);
const polluted=contaminations.filter(x=>eligible(x.trade));
const clean=qualified.filter(t=>!polluted.some(x=>x.trade.id===t.id));
const yearCounts=Object.fromEntries([2020,2021,2022,2023,2024,2025].map(year=>[year,contaminations.filter(x=>x.trade.year===year).flatMap(x=>x.affected).length]));
assert.equal(qualified.length,18,'Original fully matched source scope changed');
assert.equal(polluted.length,5,'Five formerly qualified trade comparisons reference opening-round playoff weeks');
assert.equal(clean.length,13,'Only thirteen inherited fully matched trades avoid postseason starter weeks');
assert.equal(contaminations.length,12,'Total transactions touching postseason Week 14 changed');
assert.equal(yearCounts[2020],7);
assert.equal(yearCounts[2021],18);
for(const year of [2022,2023,2024,2025])assert.equal(yearCounts[year],0,'Current inherited PAR preview should stop before Week 15');
const lines=[
 '# Trade PAR season-aware regular-season cutoff audit','',
 '> CRITICAL RESEARCH LIMITATION: Historical first-round playoff starts are confirmed for Week 14 of BOTH 2020 and 2021. The inherited trade PAR preview used a one-size-fits-all Week 14 cutoff, so some reported "regular-season" PAR aggregates actually include playoff starts. Original weekly PAR deductions are not available to strip out affected playoff games reliably.',
 '',
 '| Year | First winners-bracket playoff week | Postseason starter-asset claims in inherited PAR |',
 '|---|---:|---:|',
 ...[2020,2021,2022,2023,2024,2025].map(y=>'| '+y+' | '+starts.get(y)+' | '+yearCounts[y]+' |'),
 '',
 '- **'+qualified.length+'** original fully matched two-manager comparisons; **'+polluted.length+'** contain at least one postseason Week 14 player start and must not be marketed as regular-season-only.',
 '- **'+clean.length+'** original fully matched comparisons have no playoff-week starts and can form a conservative period-clean subset (the weekly replacement formula remains unverified).',
 '- In all, '+contaminations.length+' trade receipts contain '+Object.values(yearCounts).reduce((a,b)=>a+b,0)+' starter-asset claims from 2020–2021 playoff Week 14.',
 '',
 '## Full-source contaminated comparison receipts','',
 '| Season | Trade receipt | Receiving managers | Postseason matched player starts |',
 '|---|---|---|---|',
 ...polluted.map(x=>'| '+x.trade.year+' | ['+x.trade.id+'](../analytics/trade-museum.html?trade='+x.trade.id+') | '+x.trade.sides.map(s=>s.manager).join(' / ')+' | '+x.affected.map(z=>z.player+' ('+z.manager+', Week '+z.week+')').join('; ')+' |'),
 '',
 'Next source action: establish exact playoff-stage status from verified brackets for each season, then recompute the inherited PAR with correct season-specific period boundaries *and sourced weekly replacement baselines*. Do not subtract raw Week 14 fantasy points alone from season-aggregate PAR; that would fail to subtract the corresponding weekly replacement deduction.',
 ''
].join('\n');
console.log(lines);
if(process.argv.includes('--github-summary')&&process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines);
