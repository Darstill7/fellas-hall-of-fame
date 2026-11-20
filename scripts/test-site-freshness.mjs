// Keep the scan machine-readable, deterministic, and explicit about trade coverage gaps.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const json=execFileSync(process.execPath,['scripts/scan-site-freshness.mjs','--json'],{encoding:'utf8'});
const report=JSON.parse(json);
assert.equal(report.schema,'fellas-site-freshness-report-v1');
assert.equal(report.canonicalVerifiedThroughWeek,9);
assert.equal(report.sections.length,11);
assert.equal(report.summary.blockingStale,0);
const by=Object.fromEntries(report.sections.map(x=>[x.id,x]));
for(const key of ['canonical','standings','playoff-race','schedule-luck','season-records','alltime-game','alltime-career','milestones']){
 assert.equal(by[key].status,'CURRENT',key+' must agree with the approved canonical week');
 assert.equal(by[key].verifiedThroughWeek,report.canonicalVerifiedThroughWeek);
}
assert.equal(by['trade-museum'].status,'REVIEW_REQUIRED');
assert.equal(by['trade-museum'].latestEventDate,'2026-10-09');
assert.equal(by['trade-museum'].verifiedThroughWeek,5);
assert.equal(by['expanded-records'].status,'ARCHIVED');
for(const row of report.sections){
 assert.match(row.sha256,/^[0-9a-f]{64}$/);
 assert(row.lastGitChange?.at&&row.lastGitChange?.commit,'Missing file history '+row.id);
}
const human=execFileSync(process.execPath,['scripts/scan-site-freshness.mjs','--strict'],{encoding:'utf8'});
assert.match(human,/Trade Museum/);
assert.match(human,/Last Git file change/);
console.log('PASS freshness registry: source weeks, trade-review caveats, archive scope, Git timestamps and JSON artifacts');
