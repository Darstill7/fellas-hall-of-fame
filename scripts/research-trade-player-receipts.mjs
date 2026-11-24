// Research-only player-level trade score explanation, derived from scored starter receipts.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const read=n=>JSON.parse(fs.readFileSync(dir+'/'+n+'.json','utf8'));
const positional=read('trade-positional-surplus-research');
const round=n=>Math.round(n*100)/100||0;
assert.equal(positional.coverage.unresolved,0);
const output=[];
for(const year of [2020,2021,2022,2023,2024,2025]){
 const own=read(year+'-ownership-review');
 for(const t of own.trade_results){
 const source=positional.transactions.find(x=>x.id===t.id&&x.year===year);assert(source);
 const sides=t.sides.map(s=>{
 const expected=source.sides.find(x=>x.manager===s.manager);assert(expected);
 const players=s.players.map(p=>{
 const rows=positional.receipts.filter(r=>r.year===year&&r.trade===t.id&&r.manager===s.manager&&r.player===p.player_id).sort((a,b)=>a.week-b.week);
 const sum=k=>round(rows.reduce((n,r)=>n+r[k],0));
 return {player_id:p.player_id,name:p.observed_player_name||rows[0]?.name||null,starts:rows.length,pf:sum('points'),surplus_p25:sum('surplus_p25'),surplus_median:sum('surplus_median'),weeks:rows.map(r=>({week:r.week,position:r.position,pf:r.points,peer_count:r.peer_count,p25:r.p25,median:r.median,surplus_p25:r.surplus_p25,surplus_median:r.surplus_median,timing_supported_boundary:r.boundary}))};
 });
 const totals={starts:players.reduce((n,p)=>n+p.starts,0)};
 for(const k of ['pf','surplus_p25','surplus_median']){totals[k]=round(players.reduce((n,p)=>n+p[k],0));assert(Math.abs(totals[k]-expected[k])<.011,'Player total mismatch '+t.id+' '+k);}
 assert.equal(totals.starts,expected.starts);
 return {manager:s.manager,players,totals};
 });
 output.push({year,id:t.id,week:t.week,kind:source.kind,sides,nonplayer_assets:t.nonplayer_assets});
 }
}
assert.equal(output.length,48);
const count=output.flatMap(t=>t.sides).flatMap(s=>s.players).reduce((n,p)=>n+p.starts,0);
assert.equal(count,778);
fs.writeFileSync(dir+'/trade-player-receipts-research.json',JSON.stringify({status:'RESEARCH_ONLY_NOT_FOR_PUBLICATION',coverage:{transactions:output.length,starter_receipts:count},transactions:output,limitations:['Regular season only','Zero credited starts does not imply zero player value','Positional starter benchmarks are not actual waiver alternatives','Timing-supported boundary starts not actual-lock certified','Nonplayer assets not valued']},null,2)+'\n');
console.log('TRADE PLAYER RECEIPTS PASS '+JSON.stringify({transactions:output.length,starts:count}));
