// Offline release-health scenarios; fixtures never call GitHub and never publish.
import assert from 'node:assert/strict';
import {derive,toMarkdown} from './build-release-health-report.mjs';
const sha='a'.repeat(40),other='b'.repeat(40);
const names=['Validate canonical Fellas records','Rehearse approved weekly data release (synthetic; never publish)','Scan website freshness registry','Visual first-screen quality gate','Full mobile visitor journey audit'];
const goodRuns=names.map((name,i)=>({name,status:'completed',conclusion:'success',head_sha:sha,id:i+1,created_at:'2026-11-20T21:00:00Z'}));
const base={
 schema:'fellas-release-health-input-v1',mainSha:sha,mainCanonicalWeek:9,observedAt:'2026-11-20T21:00:00Z',
 staging:{candidateWeek:10,status:'REVIEW_CANDIDATE'},
 freshness:{canonicalVerifiedThroughWeek:9,sections:[
  {id:'canonical',title:'Canonical matchup ledger',severity:'block',status:'CURRENT'},
  {id:'playoff-race',title:'Playoff Race',severity:'block',status:'CURRENT'},
  {id:'trade-museum',title:'Trade Museum',severity:'review',status:'REVIEW_REQUIRED',latestEventDate:'2026-10-09'}
 ]},
 mainRuns:[
  {name:'pages build and deployment',head_sha:sha,status:'completed',conclusion:'success',created_at:'2026-11-20T21:00:00Z'},
  {name:'Verify deployed GitHub Pages parity',head_sha:sha,status:'completed',conclusion:'success',created_at:'2026-11-20T21:00:01Z'}
 ],
 prs:[{number:271,title:'Tuesday automation',state:'open',draft:true,merged:false,head_sha:sha,base:'main',runs:goodRuns}]
};
const clone=x=>JSON.parse(JSON.stringify(x));
let r=derive(base);
assert.equal(r.overall,'ACTION_REQUIRED');
assert.equal(r.stagedNewer,true);
assert.equal(r.deployment.verified,true);
assert(r.blockers.some(x=>x.includes('Week 10 is staged')));
assert(r.blockers.some(x=>x.includes('Trade Museum')));
assert(r.blockers.some(x=>x.includes('still draft')));
assert.match(toMarkdown(r),/Release health/);
assert.match(toMarkdown(r),/NOT VERIFIED|YES/);
const fail=clone(base);
fail.prs[0].runs[0].conclusion='failure';
r=derive(fail);
assert.equal(r.prs[0].stage,'CHECK_FAILURE');
assert(r.blockers.some(x=>x.includes('failing: Canonical validation')));
const missing=clone(base);
missing.prs[0].runs=goodRuns.slice(1,2);
r=derive(missing);
assert.equal(r.prs[0].checks.find(x=>x.key==='canonical').state,'NOT_REPORTED');
assert.equal(r.prs[0].checks.find(x=>x.key==='freshness').state,'NOT_APPLICABLE');
assert.equal(r.prs[0].stage,'CHECKS_PENDING');
const differentMain=clone(base);
differentMain.mainCanonicalWeek=10;
differentMain.staging={candidateWeek:10,status:'REVIEW_CANDIDATE'};
r=derive(differentMain);
assert.equal(r.canonicalWeek,10);
assert.equal(r.developmentWeek,9);
assert.equal(r.stagedNewer,false);
assert(r.blockers.some(x=>x.includes('Development branch data covers Week 9')));
const notApplicable=clone(base);
notApplicable.prs[0].runs=goodRuns.filter(x=>!['Scan website freshness registry','Full mobile visitor journey audit'].includes(x.name));
r=derive(notApplicable);
assert.equal(r.prs[0].checks.find(x=>x.key==='freshness').state,'NOT_APPLICABLE');
assert.equal(r.prs[0].checks.find(x=>x.key==='mobile').state,'NOT_APPLICABLE');
assert.equal(r.prs[0].stage,'DRAFT_APPROVAL_REQUIRED');
const wrongSha=clone(base);
wrongSha.mainRuns[1].head_sha=other;
r=derive(wrongSha);
assert.equal(r.deployment.verified,false);
assert(r.blockers.some(x=>x.includes('Live Pages')));
const oldModel=clone(base);
oldModel.freshness.sections.find(x=>x.id==='playoff-race').status='STALE';
r=derive(oldModel);
assert.equal(r.freshness.criticalIssues,1);
assert(r.blockers.some(x=>x.includes('Playoff Race')));
const unverified=clone(base);
unverified.staging={candidateWeek:null,status:'SOURCE_UNAVAILABLE'};
r=derive(unverified);
assert.equal(r.stagedNewer,false);
assert(r.blockers.some(x=>x.includes('Sleeper staging source')));
const final=clone(base);
final.staging={candidateWeek:9,status:'REVIEW_CANDIDATE'};
final.freshness.sections.find(x=>x.id==='trade-museum').status='EVENT_AUDITED';
final.prs=[{...final.prs[0],state:'closed',merged:true,draft:false}];
r=derive(final);
assert.equal(r.overall,'VERIFIED_NO_OUTSTANDING_GATES');
console.log('PASS release health: staged pending, drafts, exact-SHA parity, failing/missing checks, stale sources, unknown staging and clear-state');
