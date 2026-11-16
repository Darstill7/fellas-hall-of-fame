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
const all44=load('data-integrity/trade-architects-2020-2025-all44-raw-starter-reconstruction-v1.json');
assert.equal(all44.transactions.length,44);
assert.equal(all44.counts.bilateral,41);
assert.equal(all44.counts.threeManager,1);
assert.equal(all44.counts.oneAssetSide,2);
for(const trade of all44.transactions){
 const source=historical.filter(s=>s.trade_id===trade.transactionId);
 assert.equal(source.length,trade.sides.length);
 for(const side of trade.sides){
  const original=source.find(s=>String(s.team_id)===String(side.rosterId));
  assert(original,'all44 side missing source '+trade.transactionId);
  assert.deepEqual(original.assets,side.assets);
  const wk=years[trade.year].weeks.filter(w=>w.week>trade.week&&w.week<=14);
  for(const player of side.players){
    const scored=[];
    for(const row of wk){
      const team=row.teams.find(t=>String(t.roster)===String(side.rosterId));
      assert(team,'missing roster in all44');
      for(const entry of team.players.filter(p=>norm(p[1])===norm(player.asset)))scored.push({week:row.week,points:entry[3]});
    }
    assert.equal(player.points,cents(scored.reduce((sum,p)=>sum+p.points,0)));
    assert.equal(player.starts,scored.length);
    assert.deepEqual(player.weeks,scored.map(p=>p.week));
  }
  assert.equal(side.observedStartedPoints,cents(side.players.reduce((sum,p)=>sum+p.points,0)));
 }
 if(trade.shape==='two_manager'){
  assert.equal(trade.sides.length,2);
  assert.equal(trade.rawPointGap,cents(trade.sides[0].observedStartedPoints-trade.sides[1].observedStartedPoints));
 }
}
const net=all44.bilateralRawLeaderboard.reduce((sum,x)=>sum+x.sumRawPointGap,0);
assert(Math.abs(net)<0.01,'league net raw bilateral gaps must zero sum');
assert.equal(all44.bilateralRawLeaderboard.reduce((sum,x)=>sum+x.bilateralDeals,0),82,'two-manager events have two sides');

const medianResearch=load('data-integrity/trade-architects-all44-position-median-sensitivity-2026-11-16.json');
assert.equal(medianResearch.transactions.length,44);
assert.equal(medianResearch.counts.bilateral,41);
const sortedMedian=values=>{const a=[...values].sort((x,y)=>x-y);return a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2};
for(const [y,yearData] of Object.entries(years))for(const wk of yearData.weeks){
 const cohorts={};
 for(const team of wk.teams)for(const p of team.players)(cohorts[p[2]]??=[]).push(p[3]);
 const expected=Object.fromEntries(Object.entries(cohorts).map(([pos,points])=>[pos,cents(sortedMedian(points))]));
 for(const [pos,val] of Object.entries(expected))
  assert.equal(medianResearch.weeklyPositionMedians[y+'-W'+wk.week][pos].median,val,'position median mismatch '+y+' week '+wk.week+' '+pos);
}
for(const tr of medianResearch.transactions){
 const source=all44.transactions.find(t=>t.transactionId===tr.id);
 assert(source,'median source record missing');
 assert.equal(source.sides.length,tr.sides.length);
 for(const side of tr.sides){
  const original=source.sides.find(s=>s.manager===side.manager&&s.rosterId===side.rosterId);
  assert(original,'median source side missing');
  let sum=0,starts=0;
  for(const player of side.players){
    const raw=original.players.find(p=>p.asset===player.asset);
    assert(raw,'median source asset missing');
    assert.equal(raw.starts,player.observedStarts);
    assert.equal(raw.points,player.observedPoints);
    assert.equal(player.starts.length,player.observedStarts);
    for(const st of player.starts){
      const median=medianResearch.weeklyPositionMedians[tr.year+'-W'+st.week][st.position].median;
      assert.equal(st.positionMedian,median);
      assert.equal(st.surplus,cents(st.points-median));
    }
    assert.equal(player.positionMedianSurplus,cents(player.starts.reduce((sum,x)=>sum+x.surplus,0)));
    sum+=player.positionMedianSurplus;
    starts+=player.observedStarts;
  }
  assert.equal(side.positionMedianSurplus,cents(sum));
  assert.equal(side.observedStarts,starts);
 }
 if(tr.shape==='two_manager')
  assert.equal(tr.positionMedianGap,cents(tr.sides[0].positionMedianSurplus-tr.sides[1].positionMedianSurplus));
}
assert(Math.abs(medianResearch.bilateralSensitivityStandings.reduce((sum,x)=>sum+x.netPositionMedianGap,0))<0.01);


const current=load('data-integrity/trade-architects-2026-week10-current-manager-receipts.json');
assert.equal(current.transactions.length,9);
assert.equal(new Set(current.transactions.map(t=>t.id)).size,9);
assert.equal(current.week10Status??current.status,'research_only_week10_in_progress');
const identity=load('data/manager_identity_map_v1.json');
assert.equal(identity.additionalVerifiedManagers.find(x=>x.canonical==='Mitch').sleeper,'huppdawg80');
assert(identity.verifiedSleeperHistoricalHandleAliases.some(x=>x.handle==='Sheffla'&&x.manager==='Scott'));
assert(identity.managers.Stover.aliases.includes('Gurt'));
assert.equal(current.managerByRosterId['6'],'Mitch','Hupp is a handle for Mitch');
assert.equal(current.managerByRosterId['5'],'Scott','Sheffla is a handle for Scott');
assert.equal(current.managerByRosterId['8'],'Stover','Gurt is Stover');
assert.deepEqual(Object.values(current.managerByRosterId).sort(),['Birch','JMid','Kuhl','Mitch','Scott','Stew','Stilly','Stover','Thommy','Tony'].sort());
const next={};
for(const trade of current.transactions){
 assert.equal(trade.sides.length,2);
 assert.equal(trade.rawStarterPointsGap,cents(trade.sides[0].startedPoints-trade.sides[1].startedPoints));
 for(const side of trade.sides){
  assert.equal(side.manager,current.managerByRosterId[side.rosterId]);
  assert.equal(side.startedPoints,cents(side.players.reduce((sum,p)=>sum+p.startedPoints,0)));
  const x=next[side.manager]??={count:0,total:0,net:0};
  x.count++;x.total+=side.startedPoints;
  x.net+=cents(side.startedPoints-trade.sides.find(s=>s!==side).startedPoints);
 }
}
for(const [manager,v] of Object.entries(next)){
 const snap=current.activeManagerSummary[manager];
 assert.equal(snap.completedTrades,v.count);
 assert.equal(snap.receivedStartedPoints,cents(v.total));
 assert.equal(snap.netRawSideGap,cents(v.net));
}
assert.equal(current.activeManagerSummary.Tony.completedTrades,0,'Tony has no confirmed 2026 trades');
assert.equal(current.activeManagerSummary.Stew.netRawSideGap,-38.22);
assert.equal(current.activeManagerSummary.Kuhl.netRawSideGap,-88.38);
assert.equal(current.activeManagerSummary.JMid.netRawSideGap,76.3);
assert.equal(current.transactions.find(t=>t.id==='1427488044335788032').localDate,'11/14/2026','Maye trade occurred Saturday local time');
const activeDoc=fs.readFileSync('docs/greatest-trade-architects-current-managers-2026-11-16.md','utf8');
assert(activeDoc.includes('**Mitch (Sleeper handle huppdawg80 / “Hupp”)'));
assert(activeDoc.includes('**Scott (Sleeper handle Sheffla)'));
assert(activeDoc.includes('data-integrity/trade-architects-2026-week10-current-manager-receipts.json')||activeDoc.includes('2026 connected Sleeper'),'missing current season source note');
for(const m of Object.keys(current.activeManagerSummary))
 assert(activeDoc.includes('| '+m+' ')||activeDoc.includes('| '+m+' |')||activeDoc.includes('| '+m+' ('),'manager omitted from active-focused summary: '+m);

console.log('Trade architects: all 26 previously excluded transactions reconciled to source ids, weeks and started scores. PAR NOT CERTIFIED.');
