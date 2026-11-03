// Verify flagged keeper transfers against completed provider trades, without assigning post-transfer production.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const norm=s=>String(s).toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\b/g,'').replace(/[^a-z0-9]/g,'');
const keeper=read('data/v9_draft_engine.json').filter(p=>[2025,2026].includes(p.year)&&p.keeper);
const recovered2026Weeks=fs.readdirSync('data-integrity')
 .map(name=>/^provider-recovered-transactions-2026-week([0-9]+)[.]json$/.exec(name)?.[1])
 .filter(Boolean).map(Number).sort((a,b)=>a-b);
assert.ok(recovered2026Weeks.length>=8&&recovered2026Weeks.length<=18,'Incomplete or unexpected 2026 transaction archive coverage');
for(let i=0;i<recovered2026Weeks.length;i++)
 assert.equal(recovered2026Weeks[i],i+1,'Noncontiguous 2026 transaction archive: missing Week '+(i+1));
const latestRecovered2026Week=recovered2026Weeks.at(-1);
const roster2026Weeks=fs.readdirSync('data')
 .map(name=>/^sleeper_roster_snapshots_2026_week([0-9]+)[.]json$/.exec(name)?.[1])
 .filter(Boolean).map(Number);
assert.ok(roster2026Weeks.length>0,'Missing 2026 keeper roster archive');
const latestPublished2026Week=Math.max(...roster2026Weeks);
assert.ok(latestRecovered2026Week>=latestPublished2026Week,
 '2026 keeper transaction archive is behind the latest scored roster; recover missing transaction weeks before auditing ownership');
const rows=[];
for(const year of [2025,2026]){
 const transactions=[];
 for(let week=1;week<=(year===2025?18:latestPublished2026Week);week++){
  const raw=read('data-integrity/provider-recovered-transactions-'+year+'-week'+week+'.json');
  for(const t of raw.transactions)if(t.type==='trade'&&t.status==='complete')transactions.push({...t,sourceWeek:week});
 }
 const unique=new Map(transactions.map(t=>[String(t.transactionId),t]));
 for(const k of keeper.filter(p=>p.year===year)){
  const trades=[...unique.values()].filter(t=>(t.added??[]).some(p=>norm(p.name)===norm(k.player)))
   .sort((a,b)=>a.timestamp-b.timestamp);
  const originalManagerParticipated=trades.some(t=>t.teamIds.map(String).includes(String(k.team_id)));
  if(k.traded_same_season)assert.ok(originalManagerParticipated,'Keeper marked traded lacks original-manager completed trade: '+year+'/'+k.player);
  // A previously unflagged completed trade is a discovered archive discrepancy, not a reason to discard the audit.
  // Preserve it in the research output for reconciliation rather than assuming the draft flag is infallible.
  rows.push({year,manager:k.manager==='Tom'?'Thommy':k.manager,player:k.player,originalTeamId:String(k.team_id),
   markedTraded:k.traded_same_season,flagConsistentWithReceipts:k.traded_same_season===originalManagerParticipated,
   originalManagerParticipatedInTrade:originalManagerParticipated,observedCompletedTrades:trades.map(t=>({
    transactionId:String(t.transactionId),week:t.sourceWeek,date:t.date,
    teamIds:t.teamIds.map(String),playerId:String(t.added.find(p=>norm(p.name)===norm(k.player)).id)
   })),postTradeKeeperPointsCertified:false});
 }
}
assert.equal(rows.length,40);
const report={schema:'fellas-keeper-trade-transfer-inventory-v1',
 status:'completed_provider_trade_inventory_not_ownership_continuity_certification',
 discrepancies:rows.filter(x=>!x.flagConsistentWithReceipts).map(x=>({year:x.year,manager:x.manager,player:x.player,markedTraded:x.markedTraded,observedTradeCount:x.observedCompletedTrades.length})),
 warnings:['A trade receipt verifies a transfer involving the keeper but does not by itself identify the receiving team from the flat added/dropped list.',
 'Multiple trades are preserved; do not impose a single permanent cutoff if a keeper returns.',
 'A keeper traded by a later owner does not imply the original keeper manager traded that player.',
 'Draft-engine original-team starter points may be used as original manager contribution only after per-week team-roster identity validation.',
 '2026 is a partial season; recovered transactions through the latest scored roster Week '+latestPublished2026Week+' are inventoried, not pending waiver-week activity or certified transfer direction.'],rows};
const path='data-integrity/keeper-trade-transfer-inventory-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(path),report);
else fs.writeFileSync(path,JSON.stringify(report,null,2)+'\n');
console.log('Keeper transfers PASS: '+rows.length+' picks, '+rows.filter(r=>r.markedTraded).length+' traded keeper picks');
