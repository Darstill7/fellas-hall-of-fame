// Offline contract test for review-only 2026 trade delta; never changes public league data.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const dir='data-integrity/sleeper-sync-candidates';
fs.mkdirSync(dir,{recursive:true});
const candidate=dir+'/2026-trades-through-week14.json';
const output=dir+'/2026-trade-review-through-week14.json';
if(fs.existsSync(candidate)||fs.existsSync(output))throw Error('Refuse to overwrite an existing review candidate');
const museum=JSON.parse(fs.readFileSync('data/trade_museum_stage66.json','utf8'));
const existing=String(museum[0].id),newID='999999999999999991';
const fixture={
 schema:'fellas-sleeper-raw-trade-review-v1',
 status:'REVIEW_REQUIRED',year:2026,league:'1340027406009761792',through_week:14,
 trades:[
  {transaction_id:existing,week:1,roster_ids:[3,10],adds:{p1:3},drops:{p1:10},draft_picks:[],waiver_budget:[]},
  {transaction_id:newID,week:11,roster_ids:[1,7,10],adds:{p2:1,p3:7},drops:{p2:7,p3:10},draft_picks:[{round:2}],waiver_budget:[{amount:7}]}
 ]
};
try{
 fs.writeFileSync(candidate,JSON.stringify(fixture));
 const stdout=execFileSync(process.execPath,['scripts/review-staged-trades.mjs','--candidate='+candidate,'--output='+output],{encoding:'utf8'});
 const report=JSON.parse(fs.readFileSync(output,'utf8'));
 assert.equal(report.matched_museum_ids,1);
 assert.equal(report.existing_ids_with_participant_conflicts,0,'Known trade with matching roster owners must not be flagged');
 assert.equal(report.participant_conflicts.length,0);

 assert.equal(report.new_provider_ids_awaiting_review,1);
 assert.equal(report.review_queue[0].transaction_id,newID);
 assert.equal(report.review_queue[0].roster_ids.length,3);
 assert(report.review_queue[0].issues.some(x=>x.includes('FAAB')));
 assert(report.review_queue[0].issues.some(x=>x.includes('Draft-pick')));
 assert(stdout.includes('None of these raw transactions are approved for publication'));
 assert.equal(report.status,'REVIEW_REQUIRED');
 fixture.trades[0].roster_ids=[1,2];
 fs.writeFileSync(candidate,JSON.stringify(fixture));
 execFileSync(process.execPath,['scripts/review-staged-trades.mjs','--candidate='+candidate,'--output='+output],{encoding:'utf8'});
 const conflict=JSON.parse(fs.readFileSync(output,'utf8'));
 assert.equal(conflict.existing_ids_with_participant_conflicts,1,'Changed participants on existing ID must not be silently treated as verified');
 assert.equal(conflict.participant_conflicts[0].transaction_id,existing);
 assert.ok(conflict.participant_conflicts[0].issues.some(i=>i.includes('participant sides')));
 fixture.trades[0].roster_ids=[3,10];
 fixture.trades.push({...fixture.trades[1]});
 fs.writeFileSync(candidate,JSON.stringify(fixture));
 assert.throws(()=>execFileSync(process.execPath,['scripts/review-staged-trades.mjs','--candidate='+candidate],{stdio:'pipe'}),/Command failed/);
 console.log('PASS trade review: known trades, three-team pending, FAAB/picks, duplicate guard, no auto publishing');
}finally{
 fs.rmSync(candidate,{force:true});
 fs.rmSync(output,{force:true});
}
