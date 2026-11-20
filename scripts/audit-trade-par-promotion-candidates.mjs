// Read-only preflight: estimate qualified two-side PAR if zero-start source proofs pass final review.
// Does not mutate trade_par_preview.json, Trade Museum, or any displayed leaderboard.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const data=path.join(process.cwd(),'data');
const preview=JSON.parse(fs.readFileSync(path.join(data,'trade_par_preview.json'),'utf8')).records;
const files=fs.readdirSync(data).filter(x=>/^trade_par_recovery_\d{4}_[a-z0-9_-]+_source_v1\.json$/.test(x)).sort();
const rows=[];
for(const file of files){
 const proof=JSON.parse(fs.readFileSync(path.join(data,file),'utf8'));
 assert.equal(proof.status,'source_checked_pending_integration');
 assert.equal(proof.evidence.verifiedPostTradeStarts,0);
 const trade=preview.find(t=>String(t.id)===proof.tradeId);
 assert.ok(trade&&!trade.complete&&trade.sides.length===2,'Candidate must remain ungraded two-manager trade');
 const missing=trade.sides.flatMap(s=>(s.unresolved||[]).map(name=>({manager:s.manager,name})));
 assert.deepEqual(missing,[{manager:proof.manager,name:proof.player.name}],'Candidate must resolve exactly one unmatched asset; others require separate audit');
 const side=trade.sides.find(s=>s.manager===proof.manager);
 assert.ok(side,'Source receiving side not found');
 for(const s of trade.sides){
  assert.ok(s.matched.every(p=>p.sourceWeeks.every(w=>w>trade.week&&w<=14)),'PAR preview has out-of-window starter weeks');
  assert.ok(Math.abs(s.matched.reduce((sum,p)=>sum+p.par,0)-s.postTradePAR)<0.02,'PAR side total does not reconcile with published matched asset pieces');
 }
 const [a,b]=trade.sides;
 const provisionalGap=+(a.postTradePAR-b.postTradePAR).toFixed(2);
 rows.push({tradeId:String(trade.id),year:trade.year,first:a.manager,second:b.manager,firstPAR:a.postTradePAR,secondPAR:b.postTradePAR,provisionalGap,zeroStartPlayer:proof.player.name,proofFile:file});
}
assert.equal(rows.length,4,'Candidate set changed; re-verify historical source proofs and research scope');
const report=[
 '# PAR zero-start candidate promotion preflight','',
 '> **NOT PUBLISHED OR PROMOTED:** This is a preflight of four two-manager trades using source-backed zero post-trade starter observations for one unresolved asset, plus the existing separately audited matched assets. The review must confirm scoring/roster provenance, baseline and complete side accounting before any +/- leaderboard change. Historical trade value, keeper rights and playoffs are not covered.','',
 '| Year | Trade | First receiving manager | Second receiving manager | First measured PAR | Second measured PAR | First − second candidate PAR | Verified zero-start asset |',
 '|---|---|---|---|---:|---:|---:|---|',
 ...rows.map(r=>'| '+r.year+' | ['+r.tradeId+'](../analytics/trade-museum.html?trade='+r.tradeId+') | '+r.first+' | '+r.second+' | '+r.firstPAR.toFixed(2)+' | '+r.secondPAR.toFixed(2)+' | '+(r.provisionalGap>=0?'+':'')+r.provisionalGap.toFixed(2)+' | '+r.zeroStartPlayer+' |'),
 '',
 'Current qualified leaderboard remains 18 trades. These four candidates are not counted there. All underlying verified roster source proofs are staged as source_checked_pending_integration.',
 ''
].join('\n');
console.log(report);
if(process.argv.includes('--github-summary')&&process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,report);
