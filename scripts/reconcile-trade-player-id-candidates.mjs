// Match historical trade-side player names to player IDs observed in season roster snapshots.
// A name match is a research candidate, NOT provider-certified ownership or trade destination.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const norm=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,'').replace(/\b(jr|sr|ii|iii|iv)\.?\b/gi,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
const yearWeeks=y=>y===2020?13:y===2026?8:14;
const trade=read('data/v9_trade_engine.json');
const records=[],coverage=[];
assert.ok(Array.isArray(trade.sides));
for(let year=2020;year<=2026;year++){
 const byName=new Map();
 let rosterWeeks=0;
 for(let week=1;week<=yearWeeks(year);week++){
  let path='data/sleeper_roster_snapshots_'+year+'_week'+week+'.json';
  if(year===2025&&(week===1||week===7)&&fs.existsSync('data/war_rosters_'+year+'_week'+week+'.json'))path='data/war_rosters_'+year+'_week'+week+'.json';
  if(!fs.existsSync(path))continue;
  const data=read(path),rosters=Array.isArray(data)?data:data.rosters;
  if(!Array.isArray(rosters))continue;
  rosterWeeks++;
  for(const roster of rosters){
   for(const p of [...(roster.starters??[]),...(roster.bench??[])]){
    if(!p?.name||p.id==null||String(p.id)==='0')continue;
    const key=norm(p.name);
    if(!key)continue;
    if(!byName.has(key))byName.set(key,new Map());
    const pool=byName.get(key),id=String(p.id);
    if(!pool.has(id))pool.set(id,{playerId:id,names:new Set(),observedWeeks:new Set()});
    pool.get(id).names.add(p.name);pool.get(id).observedWeeks.add(week);
   }
  }
 }
 let exact=0,unmatched=0,ambiguous=0;
 for(const side of trade.sides.filter(s=>s.year===year)){
  for(const asset of side.assets??[]){
   const found=[...(byName.get(norm(asset))?.values()??[])];
   let status=found.length===1?'unique_name_to_id_candidate':found.length===0?'unmatched_name':'multiple_player_ids_for_name';
   if(found.length===1)exact++;else if(!found.length)unmatched++;else ambiguous++;
   records.push({year,tradeId:String(side.trade_id),tradeWeek:side.week,tradeDate:side.date??null,
    receivingManager:side.manager??null,receivingTeamId:side.team_id==null?null:String(side.team_id),
    assetName:asset,matchStatus:status,candidates:found.map(f=>({playerId:f.playerId,observedNames:[...f.names].sort(),observedWeeks:[...f.observedWeeks].sort((a,b)=>a-b)})),
    providerTradeSideVerified:false,ownershipTransferCertified:false});
  }
 }
 coverage.push({year,rosterWeeks,tradeAssets:exact+unmatched+ambiguous,uniqueNameCandidates:exact,unmatched,ambiguous,certifiedTransfers:0});
}
const output={schema:'fellas-trade-player-id-candidates-v1',status:'research_only_name_matches_not_certified_trade_transfers',
 caveats:['Unique same-season names can nominate a player ID but cannot certify a trade transfer.',
 'Trade receiving manager/team comes from editorial trade sides, not original player-specific provider transfer data.',
 'Names, suffixes and punctuation can collide; no fuzzy matching or inferred ownership changes are allowed.',
 'Weekly roster membership cannot confirm possession at the trade timestamp.',
 'No candidate in this report may update the free-agent pool, official ownership ledger, or manager skill rating.'],
 coverage,records};
const path='data-integrity/trade-player-id-candidates-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(path),output,'Trade ID candidate report stale');
else fs.writeFileSync(path,JSON.stringify(output,null,2)+'\n');
console.log('Trade player ID candidate research:',records.length,'assets;',coverage.reduce((n,r)=>n+r.uniqueNameCandidates,0),'unique same-season name matches; zero certified transfers');
