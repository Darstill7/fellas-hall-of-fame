// Transaction ledger follows keeper player IDs with original-manager dispositions separated.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const keepers=read('data/v9_draft_engine.json').filter(p=>p.keeper&&[2025,2026].includes(p.year));
const weekly=read('data-integrity/keeper-weekly-ownership-ledger-v1.json');
const overrides={'2025:Brian Robinson':'8154','2025:Brian Thomas':'11631'};
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
 const transactions=new Map();
 for(let week=1;week<=(year===2025?18:latestPublished2026Week);week++){
  const data=read('data-integrity/provider-recovered-transactions-'+year+'-week'+week+'.json');
  for(const t of data.transactions.filter(x=>x.status==='complete'&&['trade','waiver','add','drop'].includes(x.type))){
   if(!transactions.has(String(t.transactionId)))transactions.set(String(t.transactionId),{...t,archiveWeek:week});
  }
 }
 for(const p of keepers.filter(k=>k.year===year)){
  const obs=weekly.rows.find(x=>x.year===year&&x.manager===(p.manager==='Tom'?'Thommy':p.manager)&&x.player===p.player);
  assert.ok(obs);
  const ids=[...new Set(obs.observations.filter(x=>x.playerId).map(x=>String(x.playerId)))];
  const override=overrides[year+':'+p.player];
  const playerId=override??ids[0]??null;
  if(ids.length>1)assert.deepEqual(ids,[playerId],'Conflicting identity '+p.player);
  const events=playerId?[...transactions.values()].filter(t=>[...(t.added??[]),...(t.dropped??[])].some(x=>String(x.id)===playerId)).sort((a,b)=>a.timestamp-b.timestamp).map(t=>({
   transactionId:String(t.transactionId),week:t.archiveWeek,date:t.date,type:t.type,
   participatingTeamIds:t.teamIds.map(String),originalManagerParticipated:t.teamIds.map(String).includes(String(p.team_id)),
   originalManagerReleased:(t.dropped??[]).some(x=>String(x.id)===playerId)&&t.teamIds.length===1&&String(t.teamIds[0])===String(p.team_id),
   dispositionForOriginalManager:t.type==='trade'&&t.teamIds.map(String).includes(String(p.team_id))?'original_manager_trade':((t.dropped??[]).some(x=>String(x.id)===playerId)&&t.teamIds.length===1&&String(t.teamIds[0])===String(p.team_id)?'original_manager_drop':'other_or_ambiguous'),
  })): [];
  rows.push({year,manager:obs.manager,player:p.player,providerPlayerId:playerId,originalTeamId:String(p.team_id),
   observedOriginalTeamStarts:obs.verifiedOriginalStarts,observedOtherTeamStarts:obs.observedOtherTeamStarts,
   completedPlayerTransactions:events,originalManagerOutrightDrop:events.some(e=>e.originalManagerReleased),
   originalManagerTrade:events.some(e=>e.dispositionForOriginalManager==='original_manager_trade'),
   transactionCutoffCertified:false,keeperDecisionGrade:null});
 }
}
assert.equal(rows.length,40);
const output={schema:'fellas-keeper-transaction-ownership-boundaries-v1',
 status:'completed_events_and_weekly_roster_observations_not_intraday_lineup_continuity',
 caveats:['Trade participant lists do not identify outgoing and incoming player direction without roster corroboration.',
 'Original-manager outright drop requires a single-team completed drop event, not a subsequent manager transfer.',
 'A missing transaction is not proof that no transfer happened outside recovered transaction coverage.',
 'Weekly roster observations are independent of exact transaction timestamps. Keeper penalties remain null.'],rows};
const target='data-integrity/keeper-transaction-ownership-boundaries-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),output);
else fs.writeFileSync(target,JSON.stringify(output,null,2)+'\n');
const dropped=rows.filter(x=>x.originalManagerOutrightDrop).map(x=>x.year+':'+x.manager+':'+x.player);
console.log('Keeper transaction boundaries PASS:',rows.length,'picks; original outright drops:',dropped.join('; '));
