// Quantify the recovered ownership evidence and block fictional transaction-time joins.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const chronology=read('data-integrity/faab-acquisition-chronology-v1.json');
const trades=read('data/v9_trade_engine.json');
assert.equal(chronology.status,'date_level_only_no_free_agent_certification');
const seasons=[2020,2021,2022,2023,2024,2025,2026];
const rows=[];
for(const year of seasons){
 const events=chronology.events.filter(x=>x.year===year);
 const tradeSides=trades.sides.filter(x=>x.year===year);
 const txIds=new Set(tradeSides.map(x=>String(x.trade_id)));
 const missingDates=events.filter(x=>!x.date).length;
 const multiEventDays=new Set(events.filter(x=>x.sameDayEventCount>1).map(x=>x.date)).size;
 const missingTradePlayerIds=tradeSides.filter(x=>!Array.isArray(x.asset_player_ids)||!x.asset_player_ids.length).length;
 rows.push({year,archivedAdds:events.filter(x=>x.eventType==='add').length,
  archivedWaivers:events.filter(x=>x.eventType==='waiver').length,
  transactionDaysWithMultipleEvents:multiEventDays,acquisitionsMissingDay:missingDates,
  tradeTransactionsRepresented:txIds.size,tradeSides:tradeSides.length,
  tradeSidesWithoutExplicitPlayerIds:missingTradePlayerIds,
  completeDropEvents:0,completeTradeTimelineCertified:false,
  exactAvailabilityCertified:false});
}
const report={schema:'fellas-ownership-evidence-gaps-v1',status:'coverage_inventory_not_ownership_ledger',
 caveats:[
  'Trade engine provides valuation-oriented sides, not certified transaction-time ownership deltas.',
  'A missing asset_player_ids field is not evidence that a trade did not occur.',
  'No certified full-season drop-event stream is incorporated here; zero means incorporated, not necessarily nonexistent.',
  'Same-day acquisition chronology does not prove sequence or player availability.',
  'No season can produce a complete historical free-agent pool from these files alone.'
 ],rows};
const target='data-integrity/faab-ownership-evidence-gaps-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),report,'Ownership coverage inventory stale');
else fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
console.log('Ownership evidence gaps inventoried:',rows.length,'seasons');
