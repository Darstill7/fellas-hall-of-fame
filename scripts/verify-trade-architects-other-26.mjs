// Deterministic source parity gate for the 26-trade historical expansion.
// This is a research-only audit: it does NOT certify positional PAR, keeper value or winners.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const load=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const main=load('data-integrity/trade-architects-unqualified-26-research-2026-11-16.json');
const engine=load('data/v9_trade_engine.json');
const preview=load('data/trade_par_preview.json');
const norm=name=>name.toLowerCase().replace(/[^a-z0-9]/g,'').replace(/ii$/,'');
const cents=n=>Math.round((n+Number.EPSILON)*100)/100;
const qualified=new Set(preview.records.filter(r=>r.year<=2025&&r.complete&&r.sides.length===2).map(r=>r.id));
const historical=engine.sides.filter(r=>r.year<=2025);
const all=new Set(historical.map(r=>r.trade_id));
assert.equal(all.size,44);
assert.equal(qualified.size,18);
assert.equal(main.transactions.length,26);
assert.equal(new Set(main.transactions.map(x=>x.transactionId)).size,26);
for(const id of all)assert.equal(qualified.has(id)||main.transactions.some(r=>r.transactionId===id),true,'unaccounted trade '+id);
assert.equal(main.summary.bilateral,23);
assert.equal(main.summary.threeManager,1);
assert.equal(main.summary.oneSided,2);
const years=Object.fromEntries([2020,2021,2022,2023,2024,2025].map(y=>[y,load('data/player_starts_'+y+'.json')]));
for(const trade of main.transactions){
  const src=historical.filter(s=>s.trade_id===trade.transactionId);
  assert.equal(src.length,trade.sides.length);
  assert.equal(trade.year,src[0].year);
  assert.equal(trade.week,src[0].week);
  const weeks=years[trade.year].weeks.filter(w=>w.week>trade.week&&w.week<=14);
  for(const side of trade.sides){
    const orig=src.find(s=>s.team_id===side.teamId);
    assert(orig,'original team missing: '+trade.transactionId+'/'+side.manager);
    assert.deepEqual(side.tradeAssets,orig.assets);
    assert.equal(side.originalEngineStartedPoints,orig.starter_points);
    const totals=[];
    for(const p of side.players){
      assert(side.tradeAssets.includes(p.tradeAsset));
      const match=[];
      for(const w of weeks){
        const team=w.teams.find(t=>String(t.roster)===String(side.teamId));
        assert(team,'team absent at '+trade.year+' week '+w.week);
        for(const item of team.players.filter(item=>norm(item[1])===norm(p.tradeAsset)))
          match.push({week:w.week,id:String(item[0]),points:item[3]});
      }
      assert.equal(p.postTradeStarts,match.length);
      assert.equal(p.postTradeStartedPoints,cents(match.reduce((a,x)=>a+x.points,0)));
      assert.deepEqual(p.postTradeStartedWeeks,match.map(x=>x.week));
      assert.deepEqual(p.postTradeStarterPlayerIds,[...new Set(match.map(x=>x.id))]);
      totals.push(p.postTradeStartedPoints);
    }
    assert.equal(side.strictRegularSeasonPostTradeStartedPoints,cents(totals.reduce((a,b)=>a+b,0)));
    assert.equal(side.strictRegularSeasonPostTradeStarts,side.players.reduce((a,b)=>a+b.postTradeStarts,0));
    assert.equal(side.differenceFromOlderEngine,cents(side.strictRegularSeasonPostTradeStartedPoints-side.originalEngineStartedPoints));
  }
  if(trade.shape==='two_manager'){
    assert.equal(trade.sides.length,2);
    assert.equal(trade.strictRegularSeasonGap,cents(trade.sides[0].strictRegularSeasonPostTradeStartedPoints-trade.sides[1].strictRegularSeasonPostTradeStartedPoints));
  }else assert.equal(trade.strictRegularSeasonGap,null);
}
const doc=fs.readFileSync('docs/greatest-trade-architects-other-26-audit-2026-11-16.md','utf8');
for(const trade of main.transactions)if(trade.shape==='two_manager'){
 assert(doc.includes(trade.sides[0].tradeAssets.join(' + ')),'appendix missing received assets '+trade.transactionId);
}
console.log('Trade architects: all 26 previously excluded transactions reconciled to source ids, weeks and started scores. PAR NOT CERTIFIED.');
