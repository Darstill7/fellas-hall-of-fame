// Research only: transaction graph, not causal allocation of bundled assets.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const years=[2020,2021,2022,2023,2024,2025];
const round=x=>Math.round(x*100)/100;
const seasons=[],allReceipts=new Set();
for(const year of years){
 const report=JSON.parse(fs.readFileSync(dir+'/'+year+'-ownership-review.json','utf8'));
 assert.equal(report.season,year);
 assert.equal(report.regular_lineup_source_differences.length,0);
 const trades=new Map(report.trade_results.map(t=>[t.id,t]));
 assert.equal(trades.size,report.source_completed_trades);
 const nodes=[],edges=[],externalExits=[],boundary=[];
 for(const t of trades.values()){
  const received=t.sides.flatMap(s=>s.players.map(p=>({manager:s.manager,roster:s.roster,...p})));
  nodes.push({id:t.id,week:t.week,participants:t.sides.map(s=>s.manager),assets:received.map(p=>({manager:p.manager,player_id:p.player_id,name:p.observed_player_name})),nonplayer_assets:t.nonplayer_assets});
  for(const p of received){
   for(const r of p.receipts){
    const key=[year,r.week,p.roster,p.player_id].join(':');
    assert(!allReceipts.has(key),'Double-counted starter receipt '+key);
    allReceipts.add(key);
   }
   for(const r of p.boundary)boundary.push({transaction:t.id,manager:p.manager,player_id:p.player_id,...r});
   if(!p.exit_transaction)continue;
   const next=trades.get(p.exit_transaction);
   const base={from:t.id,to:p.exit_transaction,player_id:p.player_id,name:p.observed_player_name,departing_manager:p.manager,exit_week:p.exit_week,pre_exit_regular_pf:round(p.receipts.filter(r=>r.week<=report.regular_season_end).reduce((n,r)=>n+r.points,0)),pre_exit_postseason_pf:round(p.receipts.filter(r=>r.week>report.regular_season_end).reduce((n,r)=>n+r.points,0))};
   if(!next){externalExits.push({...base,reason:'NONTRADE_OR_OUTSIDE_SCANNED_TRANSACTION_GRAPH'});continue;}
   const recipients=next.sides.filter(s=>s.players.some(q=>q.player_id===p.player_id));
   assert.equal(recipients.length,1,'Expected unique next trade recipient '+p.player_id);
   const q=recipients[0].players.find(q=>q.player_id===p.player_id);
   assert(Number(q.acquired_status_updated)>Number(p.acquired_status_updated),'Nonchronological trade edge');
   assert.notEqual(recipients[0].manager,p.manager);
   edges.push({...base,receiving_manager:recipients[0].manager});
  }
 }
 // Connected components of the transaction DAG are descriptive trade networks.
 const adj=new Map(nodes.map(n=>[n.id,new Set()]));
 for(const e of edges){adj.get(e.from).add(e.to);adj.get(e.to).add(e.from);}
 const seen=new Set(),components=[];
 for(const n of nodes){
  if(seen.has(n.id))continue;
  const stack=[n.id],ids=[];
  while(stack.length){const k=stack.pop();if(seen.has(k))continue;seen.add(k);ids.push(k);for(const x of adj.get(k))stack.push(x);}
  if(ids.length<2)continue;
  const set=new Set(ids);
  components.push({transaction_ids:ids,edges:edges.filter(e=>set.has(e.from)&&set.has(e.to)),note:'Linked transactions, not exclusive asset-for-asset causal returns'});
 }
 seasons.push({year,nodes,edges,external_exits:externalExits,boundary_candidates:boundary,components});
}
const coverage={transactions:seasons.reduce((n,s)=>n+s.nodes.length,0),onward_trade_edges:seasons.reduce((n,s)=>n+s.edges.length,0),linked_components:seasons.reduce((n,s)=>n+s.components.length,0),external_exits:seasons.reduce((n,s)=>n+s.external_exits.length,0),unique_credited_starts:allReceipts.size};
const output={status:'RESEARCH_ONLY_TRANSACTION_GRAPH_NOT_CAUSAL_TRADE_VALUE',coverage,seasons,limitations:['Same-season direct onward trades only; no unsupported cross-season keeper continuity','No allocation of bundled incoming players to individual outgoing assets','Boundary starts excluded from credited production','Connected components are descriptive networks, not additive trade grades']};
fs.writeFileSync(dir+'/trade-tree-research.json',JSON.stringify(output,null,2)+'\n');
console.log('TRADE TREE COVERAGE '+JSON.stringify(coverage));
for(const s of seasons)console.log('TRADE TREE EDGES '+s.year+' '+JSON.stringify(s.edges));
