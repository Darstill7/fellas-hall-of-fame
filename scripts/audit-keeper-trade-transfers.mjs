// Verify flagged keeper transfers against completed provider trades, without assigning post-transfer production.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const norm=s=>String(s).toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\b/g,'').replace(/[^a-z0-9]/g,'');
const keeper=read('data/v9_draft_engine.json').filter(p=>[2025,2026].includes(p.year)&&p.keeper);
const rows=[];
for(const year of [2025,2026]){
 const transactions=[];
 for(let week=1;week<=(year===2025?18:8);week++){
  const raw=read('data-integrity/provider-recovered-transactions-'+year+'-week'+week+'.json');
  for(const t of raw.transactions)if(t.type==='trade'&&t.status==='complete')transactions.push({...t,sourceWeek:week});
 }
 const unique=new Map(transactions.map(t=>[String(t.transactionId),t]));
 for(const k of keeper.filter(p=>p.year===year)){
  const trades=[...unique.values()].filter(t=>(t.added??[]).some(p=>norm(p.name)===norm(k.player)))
   .sort((a,b)=>a.timestamp-b.timestamp);
  if(k.traded_same_season)assert.ok(trades.length,'Keeper marked traded lacks completed provider trade: '+year+'/'+k.player);
  else assert.equal(trades.length,0,'Unflagged keeper appears in a trade: '+year+'/'+k.player);
  rows.push({year,manager:k.manager==='Tom'?'Thommy':k.manager,player:k.player,originalTeamId:String(k.team_id),
   markedTraded:k.traded_same_season,observedCompletedTrades:trades.map(t=>({
    transactionId:String(t.transactionId),week:t.sourceWeek,date:t.date,
    teamIds:t.teamIds.map(String),playerId:String(t.added.find(p=>norm(p.name)===norm(k.player)).id)
   })),postTradeKeeperPointsCertified:false});
 }
}
assert.equal(rows.length,40);
const report={schema:'fellas-keeper-trade-transfer-inventory-v1',
 status:'completed_provider_trade_inventory_not_ownership_continuity_certification',
 warnings:['A trade receipt verifies a transfer involving the keeper but does not by itself identify the receiving team from the flat added/dropped list.',
 'Multiple trades are preserved; do not impose a single permanent cutoff if a keeper returns.',
 'Draft-engine original-team starter points may be used as original manager contribution only after per-week team-roster identity validation.',
 '2026 is a partial season with only archived weeks 1–8 here.'],rows};
const path='data-integrity/keeper-trade-transfer-inventory-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(path),report);
else fs.writeFileSync(path,JSON.stringify(report,null,2)+'\n');
console.log('Keeper transfers PASS: '+rows.length+' picks, '+rows.filter(r=>r.markedTraded).length+' traded keeper picks');
