// Produce a conservative scoring audit from final receiving-roster lineups.
// Same-week starts require explicit kickoff evidence; unresolved starts are not zero.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const raw=read('data-integrity/sleeper-sync-candidates/2026-trades-through-week11.json');
const evidence=read('data-integrity/trade-point-recalculations/2026-starter-evidence-through-week11.json');
assert.equal(raw.league,evidence.league);
assert.equal(raw.through_week,evidence.through_week);
const cutoff=evidence.through_week;
assert.deepEqual(evidence.weeks.map(w=>w.week).sort((a,b)=>a-b),Array.from({length:cutoff},(_,i)=>i+1));
const names=['','Stilly','JMid','Thommy','Stew','Scott','Mitch','Tony','Stover','Kuhl','Birch'];
const trades=[...raw.trades].sort((a,b)=>a.status_updated-b.status_updated);
const audit=[];
for(const txn of trades){
 assert(Number.isFinite(txn.status_updated));
 const sides=[];
 for(const roster of txn.roster_ids){
  const received=Object.keys(txn.adds).filter(id=>txn.adds[id]===roster);
  const starts=[],pending=[];
  for(const week of evidence.weeks){
   if(week.week<txn.week)continue;
   assert.equal(new Set(week.teams.map(t=>t.roster_id)).size,10);
   const team=week.teams.find(t=>t.roster_id===roster);
   assert(team);
   for(const p of team.starters.filter(p=>received.includes(p.player_id))){
    assert(Number.isFinite(p.points));
    const row={week:week.week,...p};
    const outgoing=trades.find(t=>t.status_updated>txn.status_updated&&t.drops[p.player_id]===roster);
    if(outgoing&&outgoing.week<week.week)continue;
    if(week.week===txn.week||outgoing?.week===week.week){
     pending.push({...row,reason:'Transaction-week or subsequent outgoing-trade-week kickoff ordering requires explicit evidence'});
    }else starts.push(row);
   }
  }
  const points=Math.round(starts.reduce((n,p)=>n+p.points,0)*100)/100;
  sides.push({roster_id:roster,manager:names[roster],received_ids:received,verified_starts:starts,verified_points:points,verified_start_count:starts.length,pending_starts:pending,complete:pending.length===0});
 }
 audit.push({id:txn.transaction_id,week:txn.week,completed_at:new Date(txn.status_updated).toISOString(),sides});
}
const output={schema:'fellas-2026-trade-timing-audit-v1',through_week:cutoff,source:'Final Sleeper lineup evidence and completed transaction timestamps',status:audit.some(t=>t.sides.some(s=>!s.complete))?'KICKOFF_EVIDENCE_REQUIRED':'COMPLETE',audits:audit};
console.log(JSON.stringify(output,null,2));
