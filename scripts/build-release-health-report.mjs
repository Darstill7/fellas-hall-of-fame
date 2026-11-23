// Turn collected GitHub API facts and a source-backed freshness scan into one read-only release-health report.
// All build decisions refer to exact commit SHAs. Never infer missing checks passed.
import fs from 'node:fs';
const REQUIRED = [
 {key:'canonical',label:'Canonical validation',terms:['Validate canonical Fellas records']},
 {key:'rehearsal',label:'Approved-release rehearsal',terms:['Rehearse approved weekly data release (synthetic; never publish)']},
 {key:'freshness',label:'Freshness registry',terms:['Scan website freshness registry']},
 {key:'visual',label:'Visual first-screen gate',terms:['Visual first-screen quality gate']},
 {key:'mobile',label:'Mobile visitor journey',terms:['Full mobile visitor journey audit']},
 {key:'tradePin',label:'Trade source approval pin',terms:['Verify Trade Museum certification approval pin']},
 {key:'integration',label:'Weekly + Trade Museum approval integration',terms:['Verify Tuesday approval and release-health integration']}
];
const REQUIRED_BY_PR={
 268:['canonical','visual'],
 271:['canonical','rehearsal','visual','tradePin'],
 272:['canonical','rehearsal'],
 273:['canonical','rehearsal','freshness','mobile'],
 274:['canonical'],
 280:['canonical','rehearsal','tradePin','integration']
};
const esc=s=>String(s??'').replace(/[|\r\n]/g,' ').slice(0,200);
const iso=x=>x||'Unknown';
const status=run=>{
 if(!run)return 'NOT_REPORTED';
 if(run.status!=='completed')return 'PENDING';
 return run.conclusion==='success'?'PASS':run.conclusion==='skipped'?'SKIPPED':'FAIL';
};
function requiredChecks(runs,number,expectedSha){
 const sorted=[...(runs||[])].sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
 const required=new Set(REQUIRED_BY_PR[number]||['canonical']);
 return REQUIRED.map(req=>{
  const run=sorted.find(r=>req.terms.includes(r.name)&&(!r.head_sha||r.head_sha===expectedSha));
  const isRequired=required.has(req.key);
  return {key:req.key,label:req.label,required:isRequired,state:!run&&!isRequired?'NOT_APPLICABLE':status(run),runId:run?.id??null,url:run?.html_url??null};
 });
}
function recent(runs,name){
 return [...(runs||[])].filter(r=>r.name===name).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')))[0]||null;
}
export function derive(input){
 if(input.schema!=='fellas-release-health-input-v1'||!input.mainSha||!input.freshness||!Array.isArray(input.prs))
  throw Error('Missing release health provenance and source coverage');
 const developmentWeek=input.freshness.canonicalVerifiedThroughWeek;
 const canonicalWeek=input.mainCanonicalWeek;
 if(!Number.isInteger(developmentWeek)||developmentWeek<1||developmentWeek>14)throw Error('Unsupported development snapshot week');
 if(!Number.isInteger(canonicalWeek)||canonicalWeek<1||canonicalWeek>14)throw Error('Unsupported current canonical week');
 const stagedWeek=input.staging?.candidateWeek??null;
 const stagedNewer=Number.isInteger(stagedWeek)&&stagedWeek>canonicalWeek;
 const stagingStatus=input.staging?.status||'SOURCE_UNAVAILABLE';
 const deployments=input.mainRuns||[];
 const pages=recent(deployments,'pages build and deployment');
 const parity=recent(deployments,'Verify deployed GitHub Pages parity');
 const deployment={
   mainSha:input.mainSha,
   pagesSha:pages?.head_sha??null,
   paritySha:parity?.head_sha??null,
   pagesStatus:status(pages),
   parityStatus:status(parity),
   verified:!!pages&&!!parity&&pages.head_sha===input.mainSha&&parity.head_sha===input.mainSha&&status(pages)==='PASS'&&status(parity)==='PASS'
 };
 const prs=input.prs.map(p=>{
  const checks=requiredChecks(p.runs,p.number,p.head_sha);
  const failures=checks.filter(c=>c.required&&c.state==='FAIL');
  const outstanding=checks.filter(c=>c.required&&c.state!=='PASS'&&c.state!=='FAIL');
  let stage;
  if(p.state!=='open')stage=p.merged?'MERGED':'CLOSED_UNMERGED';
  else if(failures.length)stage='CHECK_FAILURE';
  else if(outstanding.length)stage='CHECKS_PENDING';
  else if(p.draft)stage='DRAFT_APPROVAL_REQUIRED';
  else stage='READY_FOR_HUMAN_REVIEW';
  return {number:p.number,title:p.title||'Pull request',url:p.url||null,base:p.base||null,
   headSha:p.head_sha||null,state:p.state,draft:!!p.draft,merged:!!p.merged,stage,
   checks,failed:failures.map(x=>x.label),pending:outstanding.map(x=>x.label)};
 });
 const blockingFreshness=(input.freshness.sections||[]).filter(x=>x.severity==='block'&&x.status!=='CURRENT');
 const trade=(input.freshness.sections||[]).find(x=>x.id==='trade-museum');
 const upstream=prs.find(p=>p.number===271);
 const blockers=[];
 if(blockingFreshness.length)blockers.push('Data source coverage mismatch: '+blockingFreshness.map(x=>x.title||x.id).join(', '));
 if(developmentWeek!==canonicalWeek)blockers.push('Development branch data covers Week '+developmentWeek+' while deployed main contains approved Week '+canonicalWeek+'; reconcile before calling either current');
 if(upstream&&!upstream.merged)blockers.push('Base weekly automation PR #271 not merged');
 if(stagedNewer)blockers.push('Week '+stagedWeek+' is staged but not approved in the published canonical ledger (Week '+canonicalWeek+')');
 if(stagingStatus==='SOURCE_UNAVAILABLE'||stagingStatus==='UNKNOWN')blockers.push('Sleeper staging source could not be verified; no assertion that all weeks are collected');
 if(trade?.status==='REVIEW_REQUIRED')blockers.push('Trade Museum transaction coverage needs separate commissioner evidence review');
 for(const p of prs.filter(p=>p.state==='open')){
  if(p.draft)blockers.push('PR #'+p.number+' is still draft; explicit human approval required');
  if(p.failed.length)blockers.push('PR #'+p.number+' failing: '+p.failed.join(', '));
  else if(p.pending.length)blockers.push('PR #'+p.number+' pending or missing: '+p.pending.join(', '));
 }
 if(!deployment.verified)blockers.push('Live Pages and parity not both verified for exact current main commit');
 const report={
  schema:'fellas-release-health-v1',observedAt:input.observedAt??null,mainSha:input.mainSha,
  canonicalWeek,developmentWeek,stagedWeek,stagedNewer,stagingStatus,
  freshness:{criticalIssues:blockingFreshness.length,tradeMuseum:trade?.status??'NOT_SCANNED',tradeMuseumLatestEvent:trade?.latestEventDate??null},
  deployment,prs,blockers,
  overall:blockers.length?'ACTION_REQUIRED':'VERIFIED_NO_OUTSTANDING_GATES',
  note:'Green tests are valid only for their exact head SHA. A successful Pages build and parity check do not mean a later staged week is published. This read-only report never approves, merges or deploys.'
 };
 return report;
}
export function toMarkdown(report){
 const d=report.deployment;
 const rows=[
 '# The Fellas — Release health',
 'Checked: '+iso(report.observedAt)+' · main `'+esc(report.mainSha.slice(0,12))+'`',
 '**Production main approved Week '+report.canonicalWeek+'** · Development branch source Week '+report.developmentWeek+(report.stagedNewer?' · **Week '+report.stagedWeek+' staged, awaiting approval**':' · No newer verified-shape staging candidate reported'),
 '**Overall: '+report.overall+'**','',
 '## Production deployment',
 '| Pages build | Exact-main parity | Deployed main SHA confirmed |',
 '| --- | --- | --- |',
 '| '+d.pagesStatus+' ('+esc(d.pagesSha?.slice(0,12)||'none')+') | '+d.parityStatus+' ('+esc(d.paritySha?.slice(0,12)||'none')+') | '+(d.verified?'YES':'NOT VERIFIED')+' |','',
 '## Approval and GitHub checks',
 '| PR | Stage | Canonical | Rehearsal | Freshness | Visual | Mobile | Trade pin | Combined integration |',
 '| --- | --- | --- | --- | --- | --- | --- | --- | --- |'
 ];
 for(const p of report.prs){
  const cs=Object.fromEntries(p.checks.map(c=>[c.key,c.state]));
  rows.push('| #'+p.number+' '+esc(p.title)+' | '+p.stage+' | '+cs.canonical+' | '+cs.rehearsal+' | '+cs.freshness+' | '+cs.visual+' | '+cs.mobile+' | '+cs.tradePin+' | '+cs.integration+' |');
 }
 rows.push('','## What needs attention');
 rows.push(...(report.blockers.length?report.blockers.map((x,i)=>(i+1)+'. '+esc(x)):['No outstanding gates in this snapshot. Commissioner approval is still required before any merge.']));
 rows.push('','**Trade Museum:** '+report.freshness.tradeMuseum+(report.freshness.tradeMuseumLatestEvent?' · latest documented transaction '+report.freshness.tradeMuseumLatestEvent:'')+'. Event date alone does not certify missing transactions.');
 rows.push('','This report is read-only. If a required workflow does not appear on the latest PR head, it is **NOT_REPORTED**, not green.','');
 return rows.join('\n');
}
if(process.argv[1]?.endsWith('build-release-health-report.mjs')&&process.argv[2]){
 const file=process.argv[2];
 const report=derive(JSON.parse(fs.readFileSync(file,'utf8')));
 const json=JSON.stringify(report,null,2)+'\n';
 const md=toMarkdown(report);
 if(process.argv[3])fs.writeFileSync(process.argv[3],json);
 if(process.argv[4])fs.writeFileSync(process.argv[4],md+'\n');
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,md+'\n');
 console.log(md);
}
