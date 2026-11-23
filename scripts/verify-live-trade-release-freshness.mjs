// Fail-closed READ-ONLY live-source publication gate.
// This gate does not score games or certify a trade. It prevents a previously
// approved snapshot from being published after Sleeper advances.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const league='1340027406009761792';
const cutoff=10;
const expectedArchived=51;
const tradeSource='data-integrity/trade-recovery/2026-weeks1-12-provider-review-20261123.json';
const normalized=JSON.parse(fs.readFileSync(tradeSource,'utf8'));
const scores=JSON.parse(fs.readFileSync('data-integrity/trade-point-recalculations/2026-through-week10.json','utf8'));
const museum=JSON.parse(fs.readFileSync('data/trade_museum_stage66.json','utf8'));
assert.equal(normalized.status,'RESEARCH_ONLY_NOT_CERTIFIED');
assert.equal(normalized.league_id,league);
assert.equal(scores.scoring_through_week,cutoff);
assert.equal(museum.length,expectedArchived);
assert(museum.filter(t=>t.year===2026).every(t=>t.scoring_through_week===cutoff));
const get=async(url)=>{
 const r=await fetch(url,{signal:AbortSignal.timeout(25000)});
 if(!r.ok)throw Error('Source unavailable HTTP '+r.status+' '+url);
 return r.json();
};
const state=await get('https://api.sleeper.app/v1/state/nfl');
if(!state||String(state.season)!=='2026'||!Number.isInteger(Number(state.week)))
 throw Error('NFL weekly state invalid or has advanced to another season: re-audit before release');
const stateWeek=Number(state.week);
// This intentionally blocks when the league advances even if a future week has
// no reported matchup outcomes yet. Manual source review can re-open the gate.
if(stateWeek!==cutoff+1)throw Error('Scoring snapshot stale or schedule ambiguous: NFL state week '+stateWeek+', latest verified score week '+cutoff+'. Re-check completed games and regenerate.');
const rawTradeIds=[];
for(let week=0;week<=stateWeek;week++){
 const response=await get('https://api.sleeper.app/v1/league/'+league+'/transactions/'+week);
 if(!Array.isArray(response))throw Error('Raw Sleeper Week '+week+' is not an array');
 for(const t of response){
  if(t.type==='trade'&&t.status==='complete'){
   const id=String(t.transaction_id);
   assert.match(id,/^\d+$/);
   rawTradeIds.push(id);
  }
 }
}
const unique=new Set(rawTradeIds);
assert.equal(unique.size,rawTradeIds.length,'Duplicated provider trade transaction');
const prior=new Set(normalized.trades.map(t=>String(t.id)));
assert.equal(prior.size,13,'Expected source research snapshot changed; re-review before release');
const missing=rawTradeIds.filter(id=>!prior.has(id));
const erased=[...prior].filter(id=>!unique.has(id));
if(missing.length||erased.length)throw Error('Trade evidence changed: new IDs '+missing.join(',')+'; missing prior IDs '+erased.join(',')+'. Regenerate source and seek approval.');
const report={
 check:'live_prepublication_source_freshness',
 status:'FRESH_AT_CHECK_TIME_NOT_CERTIFIED',
 checked_at:new Date().toISOString(),
 league_id:league,
 score_cutoff_week:cutoff,
 sleeper_nfl_current_week:stateWeek,
 completed_trade_ids:rawTradeIds.length,
 normalized_baseline_ids:prior.size,
 caveats:[
  'NFL week state is a conservative freshness guard, not a proof that each matchup is final.',
  'The approved Week 10 per-start attribution and 6 pending trade certificates remain separate review gates.',
  'A passing result expires as Sleeper advances or new completed trades appear. Recheck just before publication.'
 ]
};
console.log(JSON.stringify(report,null,2));
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
 '## Live Trade Museum release freshness\n- NFL state week: **'+stateWeek+'**\n- Approved scored-through week: **'+cutoff+'**\n- Original trades compared: **'+prior.size+'**\n- Newly discovered completed trade IDs: **0**\n- **PASS AT CHECK TIME ONLY**. Commissioner certification is still required.\n');
