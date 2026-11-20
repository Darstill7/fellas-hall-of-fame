// Keep the scan machine-readable, deterministic, and explicit about trade coverage gaps.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const json=execFileSync(process.execPath,['scripts/scan-site-freshness.mjs','--json'],{encoding:'utf8'});
const report=JSON.parse(json);
assert.equal(report.schema,'fellas-site-freshness-report-v1');
const ledger=JSON.parse(fs.readFileSync('data/unified_record_book_2016_2026.json','utf8'));
const canonicalWeek=Math.max(...ledger.games.filter(g=>g.year===2026&&g.stage==='regular').map(g=>g.week));
assert.equal(report.canonicalVerifiedThroughWeek,canonicalWeek);
assert.equal(report.sections.length,11);
assert.equal(report.summary.blockingStale,0);
const by=Object.fromEntries(report.sections.map(x=>[x.id,x]));
for(const key of ['canonical','standings','playoff-race','schedule-luck','season-records','alltime-game','alltime-career','milestones']){
 assert.equal(by[key].status,'CURRENT',key+' must agree with the approved canonical week');
 assert.equal(by[key].verifiedThroughWeek,report.canonicalVerifiedThroughWeek);
}
const tradeLatest=JSON.parse(fs.readFileSync('data/trade_museum_stage66.json','utf8')).filter(x=>x.year===2026).sort((a,b)=>b.date.localeCompare(a.date))[0];
assert.equal(by['trade-museum'].latestEventDate,tradeLatest.date);
assert.equal(by['trade-museum'].verifiedThroughWeek,tradeLatest.week);
assert.equal(by['trade-museum'].status,'REVIEW_REQUIRED','Latest trade date never certifies complete transaction coverage');
assert.equal(by['expanded-records'].status,'ARCHIVED');
for(const row of report.sections){
 assert(fs.existsSync(row.consumer),'Broken page linked from freshness dashboard: '+row.consumer);
 assert.match(row.sha256,/^[0-9a-f]{64}$/);
 assert(row.lastGitChange?.at&&row.lastGitChange?.commit,'Missing file history '+row.id);
}
if(canonicalWeek<14){
 const staged=JSON.parse(execFileSync(process.execPath,['scripts/scan-site-freshness.mjs','--json','--staged-week='+(canonicalWeek+1)],{encoding:'utf8'}));
 assert.equal(staged.staging.candidateWeek,canonicalWeek+1);
 assert.equal(staged.staging.awaitingApproval,true);
 const stagedSummary=execFileSync(process.execPath,['scripts/scan-site-freshness.mjs','--markdown','--staged-week='+(canonicalWeek+1)],{encoding:'utf8'});
 assert.match(stagedSummary,/PENDING COMMISSIONER REVIEW/);
}
const human=execFileSync(process.execPath,['scripts/scan-site-freshness.mjs','--strict'],{encoding:'utf8'});
assert.match(human,/Trade Museum/);
assert.match(human,/Last Git file change/);
// Exercise the actual publication gate, including intentionally corrupting the
// manifest. Every test restores or removes the manifest before returning.
const snapshot='data/site_freshness_report_v1.json';
const prior=fs.existsSync(snapshot)?fs.readFileSync(snapshot):null;
try{
 execFileSync(process.execPath,['scripts/scan-site-freshness.mjs','--write'],{encoding:'utf8'});
 const pass=execFileSync(process.execPath,['scripts/scan-site-freshness.mjs','--release-gate','--expected-week='+canonicalWeek],{encoding:'utf8'});
 assert.match(pass,/FELLAS RELEASE GATE PASS/);
 if(canonicalWeek<14)assert.throws(()=>execFileSync(process.execPath,['scripts/scan-site-freshness.mjs','--release-gate','--expected-week='+(canonicalWeek+1)],{encoding:'utf8',stdio:'pipe'}),/Command failed/,'Future week must not publish');
 // Even when a source SHA256 is perfectly current with a regenerated manifest,
 // the release must fail if the playoff model is still from last week.
 const racePath='data/playoff_race_v1.json';
 const untouched=fs.readFileSync(racePath);
 try{
  const race=JSON.parse(untouched);
  race.verified_through_week=canonicalWeek-1;
  fs.writeFileSync(racePath,JSON.stringify(race,null,2)+'\n');
  execFileSync(process.execPath,['scripts/scan-site-freshness.mjs','--write'],{encoding:'utf8'});
  const staleGate=execFileSync(process.execPath,['scripts/scan-site-freshness.mjs','--json'],{encoding:'utf8'});
  const stale=JSON.parse(staleGate).sections.find(x=>x.id==='playoff-race');
  assert.equal(stale.status,'STALE');
  assert.throws(()=>execFileSync(process.execPath,['scripts/scan-site-freshness.mjs','--release-gate','--expected-week='+canonicalWeek],{encoding:'utf8',stdio:'pipe'}),/Command failed/,'Last-week playoff odds must block publication even with matching source hash');
 }finally{
  fs.writeFileSync(racePath,untouched);
  execFileSync(process.execPath,['scripts/scan-site-freshness.mjs','--write'],{encoding:'utf8'});
 }
 fs.writeFileSync(snapshot,'{"corrupt":"never publish"}\n');
 assert.throws(()=>execFileSync(process.execPath,['scripts/scan-site-freshness.mjs','--release-gate','--expected-week='+canonicalWeek],{encoding:'utf8',stdio:'pipe'}),/Command failed/,'Unverifiable source fingerprints must block publication');
}finally{
 if(prior!==null)fs.writeFileSync(snapshot,prior);
 else fs.rmSync(snapshot,{force:true});
}
console.log('PASS freshness registry: source weeks, trade-review caveats, archive scope, Git timestamps and JSON artifacts');
