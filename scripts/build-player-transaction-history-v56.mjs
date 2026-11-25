// Player histories: exact provider IDs for transactions and 2026 draft; historical draft name matches are labeled separately.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const index=read('data-integrity/player-hall-of-fame-v56.json');
const draft=read('data/v9_draft_engine.json');
const board=read('data/fellas_2026_sleeper_draft_board_verified_v1.json');
const canonical=read('data/unified_record_book_2016_2026.json');
const through2026=Math.max(...canonical.games.filter(game=>game.year===2026&&game.stage==='regular').map(game=>game.week));
const providerFile=(year,week)=>'data-integrity/provider-recovered-transactions-'+year+'-week'+week+'.json';
const players=new Map(index.players.map(p=>[String(p.id),{id:String(p.id),name:p.name,position:p.position,draft:[],transactions:[]}]));
const aliases=new Map();
for(const p of index.players)for(const alias of p.aliases)for(const pos of p.positions){
 const k=alias.trim().toLowerCase()+'|'+pos;
 if(!aliases.has(k))aliases.set(k,new Set());aliases.get(k).add(String(p.id));
}
const norm=(n,y)=>y===2023&&n==='JMid'?'Evans':n==='Tom'?'Thommy':n==='EvansBrandon'?'Evans':n;
const ownerMap={darstill:'Stilly',birchhh:'Birch',evansbrandonm:'Evans',yogurtslinger15:'Stover',dillionpanthers15:'Stover',thommy:'Thommy',ckuhl5:'Kuhl',dsylvester9:'Stew',huppdawg80:'Mitch',koble2323:'Koble',tsteg:'Tony',jmidd:'JMid',sheffla:'Scott'};
const unresolvedDraft=[],draftSeen=new Set();
for(const r of draft.filter(r=>r.year<2026)){
 const key=r.year+':'+r.overall;assert.ok(!draftSeen.has(key));draftSeen.add(key);
 const matches=aliases.get(r.player.trim().toLowerCase()+'|'+r.position);
 const entry={year:r.year,overall:r.overall,round:r.round,manager:norm(r.manager,r.year),keeper:!!r.keeper,player:r.player,position:r.position,identityEvidence:'unique_exact_name_position_match_not_provider_id'};
 if(matches?.size===1)players.get([...matches][0]).draft.push(entry);else unresolvedDraft.push({...entry,reason:matches?.size?'ambiguous_name_position':'no_index_match'});
}
assert.equal(draftSeen.size,900);assert.equal(board.picks.length,150);
for(const p of board.picks){
 const key='2026:'+p.overall;assert.ok(!draftSeen.has(key));draftSeen.add(key);
 const id=String(p.playerId),entry={year:2026,overall:p.overall,round:p.round,manager:p.manager,keeper:!!p.keeper,player:p.player,position:p.position,identityEvidence:'provider_player_id'};
 if(players.has(id))players.get(id).draft.push(entry);else unresolvedDraft.push({...entry,playerId:id,reason:'no_reconciled_starter_history'});
}
const seen=new Map(),coverage=[],unknownPlayerIds=new Set();
for(let year=2020;year<=2026;year++){
 const roster=new Map();
 for(const w of read('data/player_starts_'+year+'.json').weeks)for(const t of w.teams){
  const manager=norm(ownerMap[String(t.owner).toLowerCase()],year),id=String(t.roster);
  assert.ok(manager);if(roster.has(id))assert.equal(roster.get(id),manager);else roster.set(id,manager);
 }
 let windows=18;
 if(year===2026){
  windows=0;
  while(windows<through2026&&fs.existsSync(providerFile(year,windows+1)))windows++;
 }
 let complete=0;
 for(let week=1;week<=windows;week++){
  const d=read(providerFile(year,week));
  assert.equal(d.year,year);assert.equal(d.week,week);assert.equal(d.normalizedRows,d.transactions.length);
  for(const t of d.transactions){
   if(t.status!=='complete'||!['waiver','add','free_agent','trade'].includes(t.type))continue;
   const key=year+':'+t.transactionId;
   const signature=JSON.stringify([t.type,t.teamIds,t.added,t.dropped,t.faabBid]);
   if(seen.has(key)){assert.equal(seen.get(key),signature,'Conflicting duplicate transaction '+key);continue;}seen.set(key,signature);complete++;
   const managers=[...new Set(t.teamIds.map(id=>roster.get(String(id))))];assert.ok(managers.every(Boolean));
   // The normalized trade archive does not identify the receiving side per player.
   // Preserve participants and player membership; never guess the recipient.
   const affected=new Map();
   for(const [action,list] of [['added',t.added??[]],['dropped',t.dropped??[]]])for(const p of list){
    const id=String(p.id);if(!affected.has(id))affected.set(id,new Set());affected.get(id).add(action);
   }
   for(const [id,actions] of affected){
    if(!players.has(id)){unknownPlayerIds.add(id);continue;}
    players.get(id).transactions.push({year,week,date:t.date,transactionId:String(t.transactionId),type:t.type,actions:[...actions],participants:managers,manager:t.type!=='trade'&&managers.length===1?managers[0]:null,attribution:t.type==='trade'?'participant_only_no_receiving_side':'single_manager_receipt',faabBid:t.type==='waiver'&&affected.size===1?t.faabBid:null});
   }
  }
 }
 coverage.push({year,windows,completeTransactions:complete,coverageStatus:'recovered_numbered_windows_not_certified_exhaustive'});
}
const records=[],all=[...players.values()];
const add=(id,label,rows,field,unit,qualification)=>{
 const value=Math.max(...rows.map(x=>x[field]));assert.ok(Number.isFinite(value)&&value>0);
 records.push({id,label,ownerType:'player',value,unit,scope:'Recovered Sleeper transactions 2020–2025 numbered weeks 1–18; indexed players only',qualification,holders:rows.filter(x=>x[field]===value).map(x=>({playerId:x.id,name:x.name,evidence:[x]}))});
};
const summary=all.map(p=>{const t=p.transactions.filter(t=>t.year<=2025);return {id:p.id,name:p.name,trades:t.filter(t=>t.type==='trade').length,waiverAdds:t.filter(t=>t.type==='waiver'&&t.actions.includes('added')).length,nonTradeAdds:t.filter(t=>t.type!=='trade'&&t.actions.includes('added')).length,nonTradeDrops:t.filter(t=>t.type!=='trade'&&t.actions.includes('dropped')).length};});
for(const [field,label] of [['trades','Most documented trade appearances'],['waiverAdds','Most documented successful waiver additions'],['nonTradeAdds','Most documented nontrade additions'],['nonTradeDrops','Most documented nontrade drops']])add('player-transaction-'+field,label,summary,field,'transactions','Unique completed provider transaction IDs; no inferred trade recipient; archive not exhaustive');
assert.equal(all.length,index.playerCount);
fs.writeFileSync('data-integrity/player-transaction-history-v56.json',JSON.stringify({schemaVersion:1,status:'research-only-scoped-identity-links',coverage,categoryCount:records.length,records,unresolvedDraft,unknownTransactionPlayerIds:[...unknownPlayerIds],players:all},null,2)+'\n');
console.log('Player transaction history: '+all.length+' indexed players; '+all.reduce((s,p)=>s+p.draft.length,0)+' linked draft selections; '+unresolvedDraft.length+' unresolved draft selections; '+all.reduce((s,p)=>s+p.transactions.length,0)+' player-transaction links; '+records.length+' candidates.');
